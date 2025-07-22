import type { Word } from "@/types";
import { GoogleGenAI, Type } from "@google/genai";

export type PartOfSpeech =
  | "adv." // adverb
  | "pron." // pronoun
  | "adj." // adjective
  | "konj." // conjunction
  | "subst." // substantive/noun
  | "prep." // preposition
  | "verb"; // verb

interface AIResponse {
  spell: string;
  pronunciation: string;
  part_of_speech: PartOfSpeech;
  meaning: string;
  example_sentence: string;
  example_sentence_meaning: string;
}

async function getWordDefinitionFromAI(
  spell: string,
  apiToken: string,
): Promise<AIResponse | undefined> {
  const model = "gemini-2.0-flash";

  const ai = new GoogleGenAI({ apiKey: apiToken });
  const systemInstruction = `You are an expert Swedish-English dictionary API. Your task is to process a given Swedish word and return its details in a strict JSON format.

  First, you must find the word's **base form (prototype)** based on these rules:
  - **Noun**: indefinite singular form (e.g., "husen" -> "hus").
  - **Verb**: infinitive form (e.g., "skrev" -> "skriva").
  - **Adjective**: positive, n-form/common form (e.g., "stora" -> "stor").

  Then, provide the details for the base form. The output must be a JSON object with the given schema.

  Here are some examples:

  **Input:** \`bilar\`
  **Output:**
  \`\`\`json
  {
    "spell": "bil",
    "pronunciation": "/biːl/",
    "part_of_speech": "subst.",
    "meaning": "car",
    "example_sentence": "Jag har en röd bil.",
    "example_sentence_meaning": "I have a red car."
}\`\`\``;
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      spell: { type: Type.STRING },
      pronunciation: { type: Type.STRING },
      part_of_speech: {
        type: Type.STRING,
        format: "enum",
        enum: ["adv.", "pron.", "adj.", "konj.", "subst.", "prep.", "verb"],
      },
      meaning: { type: Type.STRING },
      example_sentence: { type: Type.STRING },
      example_sentence_meaning: { type: Type.STRING },
    },
    required: ["spell", "pronunciation", "part_of_speech", "meaning"],
  };
  const response = await ai.models.generateContent({
    model,
    contents: spell,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      systemInstruction,
    },
  });
  return response.text && JSON.parse(response.text);
}

async function generateAudioPronunciation(
  spell: string,
): Promise<ArrayBuffer | null> {
  const url = `https://ttsmp3.com/makemp3_new.php`;
  const headers = new Headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded");
  const urlencoded = new URLSearchParams();
  urlencoded.append("msg", spell);
  urlencoded.append("lang", "Astrid");
  urlencoded.append("source", "ttsmp3");
  const requestOptions = {
    method: "POST",
    headers: headers,
    body: urlencoded,
    signal: AbortSignal.timeout(5000),
  };
  try {
    const response = await fetch(url, requestOptions);
    const response_json: { URL: string } = await response.json();
    const pronunciation_url = response_json["URL"];
    const pronunciation_response = await fetch(pronunciation_url!);
    return await pronunciation_response.arrayBuffer();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(error);
    } else {
      console.warn(error);
    }
    return null;
  }
}

export async function createWordWithAI(
  spell: string,
  apiToken: string,
): Promise<Word | undefined> {
  const aiResponse = await getWordDefinitionFromAI(spell, apiToken);
  if (!aiResponse) return undefined;
  const wordId = crypto.randomUUID();
  const dbWord: Word = {
    id: wordId,
    lemma: aiResponse.spell,
    part_of_speech: aiResponse.part_of_speech,
    phonetic: aiResponse.pronunciation,
    phonetic_url: null,
    // phonetic_voice should be filled later
    phonetic_voice: null,
    update_time: new Date().getTime(),
    indexes: [
      {
        id: crypto.randomUUID(),
        word_id: wordId,
        spell: aiResponse.spell,
        form: null,
        update_time: new Date().getTime(),
      },
    ],
    lexemes: [
      {
        id: crypto.randomUUID(),
        word_id: wordId,
        definition: aiResponse.meaning,
        example: aiResponse.example_sentence,
        example_meaning: aiResponse.example_sentence_meaning,
        source: "gemini",
        update_time: new Date().getTime(),
      },
    ],
    frequency: null,
  };
  if (dbWord.lemma !== spell) {
    dbWord.indexes.push({
      id: crypto.randomUUID(),
      word_id: wordId,
      spell: spell,
      form: null,
      update_time: new Date().getTime(),
    });
  }
  const phonetic_voice = await generateAudioPronunciation(dbWord.lemma);
  if (phonetic_voice) {
    dbWord.phonetic_voice = Array.from(new Uint8Array(phonetic_voice));
  }
  return dbWord;
}
