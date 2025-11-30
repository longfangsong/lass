import Database from "better-sqlite3";
import * as cheerio from 'cheerio';
import * as fs from 'fs';

interface Word {
    id: string;
    lemma: string;
    part_of_speech: string | null;
    phonetic: string | null;
    phonetic_url: string | null;
    update_time: number;
    frequency: number | null;
}

async function crawlWord(word: Word): Promise<cheerio.CheerioAPI | null> {
    const url = `https://svenska.se/saol/?sok=${encodeURIComponent(word.lemma.replace(/\|/g, ""))}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status}`);
            return null;
        }
        const html = await response.text();
        let $ = cheerio.load(html);

        // Find the first search result link that has span.wordclass with "adj." inside
        const searchResults = $("a.debug_seachfn_544");

        if (searchResults.length > 0) {
            // Multiple results - find the adj. one and follow the link
            let targetLink: string | null = null;

            searchResults.each((_, el) => {
                const wordclass = $(el).find("span.wordclass").text().trim();
                if (wordclass === "adj." && !targetLink) {
                    targetLink = $(el).attr("href") || null;
                }
            });

            if (targetLink) {
                // Follow the link to get the actual word page
                const fullUrl = new URL(targetLink, "https://svenska.se").href;
                const detailResponse = await fetch(fullUrl);
                if (detailResponse.ok) {
                    const detailHtml = await detailResponse.text();
                    $ = cheerio.load(detailHtml);
                } else {
                    console.log(`  Failed to fetch detail page: ${fullUrl}`);
                    return null;
                }
            } else {
                console.log(`  No adj. entry found for ${word.lemma}`);
                return null;
            }
        }

        return $;
    } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        return null;
    }
}

interface ComparativeFormsResult {
    komparativForms: string[];
    superlativForms: string[];
}

function extractComparativeForms(
    $: cheerio.CheerioAPI,
): ComparativeFormsResult {
    const komparativForms: string[] = [];
    const superlativForms: string[] = [];
    let currentSection: "none" | "komparativ" | "superlativ" = "none";

    // Find the first .lemma where child .ordklass has text "adjektiv"
    let $lemma_: cheerio.Cheerio<unknown> | null = null;
    $(".lemma").each((_, el) => {
        const ordklass = $(el).find(".ordklass").text().trim();
        if (ordklass === "adjektiv" && !$lemma_) {
            $lemma_ = $(el);
        }
    });

    if (!$lemma_) {
        return { komparativForms, superlativForms };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $lemma = $lemma_ as unknown as any;
    const table = $lemma.find("table").first();
    if (table.length === 0) {
        return { komparativForms, superlativForms };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table.find("tr").each((_: number, tr: any) => {
        const $tr = $(tr);
        const th = $tr.find("th");
        const td = $tr.find("td");

        // Check if this row contains only a th (section header)
        if (th.length === 1 && td.length === 0) {
            const headerText = th.text().trim();
            if (headerText === "Komparativ") {
                currentSection = "komparativ";
            } else if (headerText === "Superlativ") {
                currentSection = "superlativ";
            } else {
                // Some other section, stop collecting
                currentSection = "none";
            }
        } else if (td.length > 0 && currentSection !== "none") {
            // This row contains data - extract the form from td
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            td.each((_: number, tdEl: any) => {
                const form = $(tdEl).find("b>.bform").text().trim();
                const textContent = $(tdEl).text().toLowerCase();
                if (textContent.includes("maskulint")) {
                    // this form is actually deprecated
                    return;
                }
                if (form) {
                    if (currentSection === "komparativ") {
                        komparativForms.push(form);
                    } else if (currentSection === "superlativ") {
                        superlativForms.push(form);
                    }
                }
            });
        }
    });

    return { komparativForms, superlativForms };
}

async function main() {
    // Connect to the SQLite database
    const dbPath = process.argv[2];
    if (!dbPath) {
        throw new Error("Please provide the database path as the first argument.");
    }
    const db = new Database(dbPath);

    // Query all Words where part_of_speech is "adj."
    const stmt = db.prepare(`SELECT * FROM Word WHERE part_of_speech = ?`);
    const adjectives = stmt.all("adj.") as Word[];

    console.log(`Found ${adjectives.length} adjectives:`);

    const sqlStatements: string[] = [];

    for (const word of adjectives) {
        const $ = await crawlWord(word);
        if ($) {
            const { komparativForms, superlativForms } = extractComparativeForms($);
            if (komparativForms.length === 1 && superlativForms.length === 2) {
                sqlStatements.push(`-- ${word.lemma}`);
                const komparativ = komparativForms[0];
                const superlativ = superlativForms[0];
                const superlativBestaemd = superlativForms[1];
                const updateTime = Date.now();

                // Check and generate SQL for komparativ form
                const komparativCheckStmt = db.prepare(`SELECT id FROM WordIndex WHERE word_id = ? AND spell = ?`);
                const komparativExists = komparativCheckStmt.get(word.id, komparativ) as { id: string } | undefined;
                const komparativId = komparativExists?.id || crypto.randomUUID();
                if (komparativExists) {
                    sqlStatements.push(`UPDATE WordIndex SET form = 'komparativ', update_time = ${updateTime} WHERE id = '${komparativId}';`);
                } else {
                    sqlStatements.push(`INSERT INTO WordIndex (id, word_id, spell, form, update_time) VALUES ('${komparativId}', '${word.id}', '${komparativ}', 'komparativ', ${updateTime});`);
                }

                // Check and generate SQL for superlativ form
                const superlativCheckStmt = db.prepare(`SELECT id FROM WordIndex WHERE word_id = ? AND spell = ?`);
                const superlativExists = superlativCheckStmt.get(word.id, superlativ) as { id: string } | undefined;
                const superlativId = superlativExists?.id || crypto.randomUUID();
                if (superlativExists) {
                    sqlStatements.push(`UPDATE WordIndex SET form = 'superlativ', update_time = ${updateTime} WHERE id = '${superlativId}';`);
                } else {
                    sqlStatements.push(`INSERT INTO WordIndex (id, word_id, spell, form, update_time) VALUES ('${superlativId}', '${word.id}', '${superlativ}', 'superlativ', ${updateTime});`);
                }

                // Check and generate SQL for superlativ bestämd form
                const superlativBestaemdCheckStmt = db.prepare(`SELECT id FROM WordIndex WHERE word_id = ? AND spell = ?`);
                const superlativBestaemdExists = superlativBestaemdCheckStmt.get(word.id, superlativBestaemd) as { id: string } | undefined;
                const superlativBestaemdId = superlativBestaemdExists?.id || crypto.randomUUID();
                if (superlativBestaemdExists) {
                    sqlStatements.push(`UPDATE WordIndex SET form = 'superlativ_b', update_time = ${updateTime} WHERE id = '${superlativBestaemdId}';`);
                } else {
                    sqlStatements.push(`INSERT INTO WordIndex (id, word_id, spell, form, update_time) VALUES ('${superlativBestaemdId}', '${word.id}', '${superlativBestaemd}', 'superlativ_b', ${updateTime});`);
                }
            } else if (komparativForms.length !== 0 || superlativForms.length !== 0) {
                console.log(`  ${word.lemma}: komparativ=[${komparativForms.join(", ")}], superlativ=[${superlativForms.join(", ")}]`);
            }
        }
    }

    // Write all SQL statements to a file
    fs.writeFileSync('polyfill_komparativ_superlativ.sql', sqlStatements.join('\n'));
    console.log(`\nWrote ${sqlStatements.length} SQL statements to polyfill_komparativ_superlativ.sql`);

    db.close();
}

main();