import * as fs from "fs";
import fetch from "node-fetch";
import { pipeline } from "stream/promises";
import { load } from "cheerio";

interface Lexeme {
  definition: string;
  example: string | null;
  example_meaning: string | null;
  source: string;
}

async function fetchFile(filePath: string, url: string) {
  if (!fs.existsSync(filePath)) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await pipeline(response.body!, fs.createWriteStream(filePath));
      console.log(`File fetched and saved as ${filePath}`);
    } catch (error) {
      console.error("Error fetching file:", error);
    }
  } else {
    console.log(`File already exists: ${filePath}`);
  }
}

function formatNullableString(value: string | null) {
  if (value !== null) {
    return `'${value.replace("'", "''")}'`;
  }
  return "NULL";
}

function extractLemmaInfo(
  $: cheerio.Root,
  element: cheerio.Element,
  polyfill: PolyfillData,
) {
  const phonetic = $(element).children("Phonetic");
  let phoneticFile = phonetic.attr("File");
  if (phoneticFile && !phoneticFile.startsWith("v2")) {
    phoneticFile = phoneticFile
      .replace(/ö/g, "0366")
      .replace(/å/g, "0345")
      .replace(/ä/g, "0344");
  }
  const lemmaInfo = {
    lemma: $(element).attr("Value")!,
    part_of_speech: $(element).attr("Type")!,
    phonetic: phonetic.children().remove().end().text().trim(),
    phoneticUrl: phonetic.attr("File")
      ? `https://lexin.nada.kth.se/sound/${phoneticFile}`
      : null,
    indexes: [] as Array<string>,
    inflections: [] as Array<{ form: string; value: string }>,
    lexemes: [] as Array<Lexeme>,
  };
  $(element)
    .find("Inflection")
    .each((_, inflectionElement) => {
      if (
        $(inflectionElement).attr("Form") !== undefined &&
        $(inflectionElement).text() !== "–"
      ) {
        lemmaInfo.inflections.push({
          form: $(inflectionElement).attr("Form")!,
          value: $(inflectionElement).text(),
        });
      }
    });
  if (lemmaInfo.part_of_speech === "pron.") {
    const forms = polyfill.pron_inflection.find(
      (it) => it.nform === lemmaInfo.lemma,
    );
    if (forms !== undefined) {
      lemmaInfo.inflections.push({
        form: "nform",
        value: forms.nform,
      });
      lemmaInfo.inflections.push({
        form: "tform",
        value: forms?.tform,
      });
      lemmaInfo.inflections.push({
        form: "aform",
        value: forms?.aform,
      });
    }
  }

  $(element)
    .find("Index")
    .each((_, indexElement) => {
      lemmaInfo.indexes.push($(indexElement).attr("Value")!);
    });

  $(element)
    .find("Lexeme")
    .each((_, lexemeElement) => {
      lemmaInfo.lexemes.push({
        definition:
          $(lexemeElement).children("Definition").text() ||
          $(lexemeElement).children("Comment[Type='Def']").text() ||
          $(lexemeElement).children("Gramcom").text() ||
          $(lexemeElement).children("Comment").text() ||
          ($(lexemeElement).find("Idiom").length > 0
            ? `idiom: ${$(lexemeElement).find("Idiom").text()}` +
              " | meaning: " +
              $(lexemeElement).find("Idiom > Definition").text()
            : ""),
        example: $(lexemeElement).find("Example").first().text() || null,
        example_meaning: null,
        source: "lexin-swe",
      });
    });

  const wholeFrom = lemmaInfo.lemma.replace(/\|/g, "");
  switch (lemmaInfo.part_of_speech) {
    case "subst.":
      lemmaInfo.inflections.push({
        form: "obest.f.sing.",
        value: wholeFrom,
      });
      break;
    case "verb":
      lemmaInfo.inflections.push({ form: "presens", value: wholeFrom });
      break;
    case "adj.":
      lemmaInfo.inflections.push({ form: "nform", value: wholeFrom });
      break;
  }
  if (lemmaInfo.indexes.length === 0) {
    lemmaInfo.indexes.push(wholeFrom);
  }
  lemmaInfo.indexes = [...new Set(lemmaInfo.indexes)];
  return lemmaInfo;
}

const SV_EN_TYPE_MAP = {
  "adv.": ["ab"],
  "förk.": ["abbrev"],
  "obestämd artikel": ["article"],
  "pron.": ["hp", "pn"],
  infinitivmärke: ["ie"],
  interj: ["in"],
  "adj.": ["jj"],
  "konj.": ["kn"],
  "subst.": ["nn"],
  "noun.": ["nn"],
  namn: ["pm", "pn"],
  "prep.": ["pp"],
  förled: ["prefix"],
  // "": "ps",
  "räkn.": ["rg"],
  // "": "sn",
  // "": "suffix",
  verb: ["vb"],
};
function collectEnglishLexemes(
  $: cheerio.Root,
  enType: Array<string> | null,
  englishWords: cheerio.Cheerio,
): Array<Lexeme> {
  const lexemes: Array<Lexeme> = [];
  englishWords.each((_, englishWord) => {
    const englishClass = $(englishWord).attr("class");
    const correctEnglishType =
      enType?.find((it) => it === englishClass) !== undefined;
    const englishDefinition =
      $(englishWord).find("definition").children("translation").length > 0
        ? $(englishWord)
            .find("definition")
            .children("translation")
            .map((_, translation) => $(translation).attr("value"))
            .get()
            .join(", ")
        : $(englishWord)
            .children("translation")
            .map((_, translation) => $(translation).attr("value"))
            .get()
            .join(", ");
    if (correctEnglishType && englishDefinition) {
      const englishExample = $(englishWord).find("example");
      const example = englishExample.attr("value") || null;
      const exampleTranslation =
        englishExample.children("translation").attr("value") || null;
      lexemes.push({
        definition: englishDefinition,
        example: example,
        example_meaning: exampleTranslation,
        source: "folkets-lexikon",
      });
    }
  });
  return lexemes;
}
function extractEnglishLexemes(
  $: cheerio.Root,
  inflectionMap: Map<string, cheerio.Element[]>,
  lemma: string,
  type: keyof typeof SV_EN_TYPE_MAP | null | undefined,
): Array<Lexeme> {
  const enType = type ? SV_EN_TYPE_MAP[type] : null;
  const safeLemmaName = lemma.replace("'", "&amp;#39;");
  let englishWords = $("word[value='" + safeLemmaName + "']");
  let lexemes = collectEnglishLexemes($, enType, englishWords);
  if (lexemes.length === 0) {
    englishWords = $(inflectionMap.get(safeLemmaName) || []);
    lexemes = collectEnglishLexemes($, enType, englishWords);
  }
  return lexemes;
}

function buildInflectionMap($: cheerio.Root) {
  const inflectionMap = new Map<string, cheerio.Element[]>();
  $("word").each((_, word) => {
    const found = new Set<string>();
    $(word)
      .find("inflection")
      .each((_, infl) => {
        const inflValue = $(infl).attr("value");
        if (inflValue && !found.has(inflValue)) {
          found.add(inflValue);
          if (!inflectionMap.has(inflValue)) {
            inflectionMap.set(inflValue, []);
          }
          inflectionMap.get(inflValue)!.push(word);
        }
      });
  });
  return inflectionMap;
}

function writeBatch(
  initSqlFile: fs.WriteStream,
  wordBuffer: string,
  wordIndexBuffer: string,
  lexemeBuffer: string,
) {
  if (wordBuffer.endsWith(", ")) {
    wordBuffer = wordBuffer.slice(0, -2);
  }
  if (wordIndexBuffer.endsWith(", ")) {
    wordIndexBuffer = wordIndexBuffer.slice(0, -2);
  }
  if (lexemeBuffer.endsWith(", ")) {
    lexemeBuffer = lexemeBuffer.slice(0, -2);
  }
  if (wordBuffer) {
    initSqlFile.write(
      `INSERT INTO Word (id, lemma, part_of_speech, phonetic, phonetic_voice, phonetic_url) VALUES ${wordBuffer};\n`,
    );
  }
  if (wordIndexBuffer) {
    initSqlFile.write(
      `INSERT INTO WordIndex (id, word_id, spell, form) VALUES ${wordIndexBuffer};\n`,
    );
  }
  if (lexemeBuffer) {
    initSqlFile.write(
      `INSERT INTO Lexeme (id, word_id, definition, example, example_meaning, source) VALUES ${lexemeBuffer};\n`,
    );
  }
}
type PolyfillData = {
  pron_inflection: Array<{
    nform: string;
    tform: string;
    aform: string;
  }>;
};

function loadPolyfill(polyfillJsonPath: string): PolyfillData {
  const polyfillJson = fs.readFileSync(polyfillJsonPath, "utf-8");
  const polyfillData = JSON.parse(polyfillJson);
  console.log("Polyfill data loaded successfully");
  return polyfillData;
}

async function main() {
  let wordBuffer = "";
  let wordIndexBuffer = "";
  let lexemeBuffer = "";
  const sweUrl = "https://sprakresurser.isof.se/lexin/svenska/swe_swe.xml";
  const sweFilePath = "swe_swe.xml";
  const enUrl =
    "http://folkets-lexikon.csc.kth.se/folkets/folkets_sv_en_public.xml";
  const enFilePath = "swe_en.xml";
  await Promise.all([
    fetchFile(sweFilePath, sweUrl),
    fetchFile(enFilePath, enUrl),
  ]);
  const sweXml = fs.readFileSync(sweFilePath, "utf-8");
  const $swe = load(sweXml, {
    xmlMode: true,
  });
  const enXml = fs.readFileSync(enFilePath, "utf-8");
  const $en = load(enXml, {
    xmlMode: true,
  });
  const polyfillJsonPath = "polyfill.json";
  const polyfill = loadPolyfill(polyfillJsonPath);

  const inflectionMap = buildInflectionMap($en);
  const initSqlFile = fs.createWriteStream(`dictionary.sql`, {
    flags: "w",
  });
  $swe("Lemma").each((index, element) => {
    if ($swe(element).find("Reference[Type='see']").length > 0) {
      return;
    }
    const lemmaInfo = extractLemmaInfo($swe, element, polyfill);
    const englishLexemes = extractEnglishLexemes(
      $en,
      inflectionMap,
      lemmaInfo.lemma,
      $swe(element).attr("Type") as
        | keyof typeof SV_EN_TYPE_MAP
        | null
        | undefined,
    );
    lemmaInfo.lexemes.push(...englishLexemes);
    const wordId = crypto.randomUUID();
    wordBuffer += `('${wordId}', '${lemmaInfo.lemma.replace("'", "''")}', '${
      lemmaInfo.part_of_speech
    }', '${lemmaInfo.phonetic.replace(
      "'",
      "''",
    )}', NULL, ${formatNullableString(lemmaInfo.phoneticUrl)}), `;
    for (const index of lemmaInfo.indexes) {
      const forms = lemmaInfo.inflections
        .filter((inflection) => inflection.value === index)
        .map((it) => it.form);
      if (forms.length === 0) {
        const indexId = crypto.randomUUID();
        wordIndexBuffer += `('${indexId}', '${wordId}', '${index.replace(
          "'",
          "''",
        )}', NULL), `;
      } else {
        for (const form of forms) {
          const indexId = crypto.randomUUID();
          wordIndexBuffer += `('${indexId}', '${wordId}', '${index.replace(
            "'",
            "''",
          )}', ${formatNullableString(form)}), `;
        }
      }
    }

    for (const lexeme of lemmaInfo.lexemes) {
      const lexemeId = crypto.randomUUID();
      const example = lexeme.example || null;
      lexemeBuffer += `('${lexemeId}', '${wordId}', '${lexeme.definition.replace(
        "'",
        "''",
      )}', ${formatNullableString(example)}, ${formatNullableString(
        lexeme.example_meaning,
      )}, '${lexeme.source}'), `;
    }
    writeBatch(initSqlFile, wordBuffer, wordIndexBuffer, lexemeBuffer);
    wordBuffer = "";
    wordIndexBuffer = "";
    lexemeBuffer = "";
    if (index % 500 === 499) {
      console.log(lemmaInfo.lemma);
    }
  });
  writeBatch(initSqlFile, wordBuffer, wordIndexBuffer, lexemeBuffer);
  initSqlFile.end();
}

main();
