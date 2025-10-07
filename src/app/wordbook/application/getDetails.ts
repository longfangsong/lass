import type { WordBookEntry, Lexeme } from "@/types";
import type { WordBookEntryWithDetails } from "@/app/types";
import {
  wordIndexTable,
  wordTable,
  lexemeTable,
} from "../infrastructure/repository";
import { logger } from "@/utils/log";

/**
 * Call the translation API to translate a lexeme's example
 */
async function translateLexemeExample(lexemeId: string): Promise<Lexeme | null> {
  try {
    logger.request(`Translating example for lexeme ${lexemeId}`);
    const response = await fetch(`/api/lexemes/${lexemeId}?fill_example_meaning=1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      return result.lexeme;
    } else {
      console.warn(`Translation failed for lexeme ${lexemeId}:`, response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error calling translation API:', error);
    return null;
  }
}

/**
 * Check if all lexemes have examples but no example meanings, 
 * and if so, randomly select one to translate
 */
async function handleMissingTranslations(lexemes: Lexeme[]): Promise<Lexeme[]> {
  // Find lexemes with examples but no example meanings
  const needsTranslation = lexemes.filter(
    lexeme => lexeme.example && !lexeme.example_meaning
  );

  // Only proceed if ALL lexemes need translation (as per requirement)
  if (needsTranslation.length === 0 || needsTranslation.length !== lexemes.length) {
    return lexemes;
  }

  // Randomly select one lexeme to translate
  const randomIndex = Math.floor(Math.random() * needsTranslation.length);
  const selectedLexeme = needsTranslation[randomIndex];

  // Call the translation API
  const translatedLexeme = await translateLexemeExample(selectedLexeme.id);

  if (translatedLexeme) {
    // Update the local database
    try {
      await lexemeTable.update(selectedLexeme.id, {
        example_meaning: translatedLexeme.example_meaning,
        update_time: translatedLexeme.update_time
      });
    } catch (error) {
      console.error('Failed to update local database:', error);
    }

    // Return updated lexemes array
    return lexemes.map(lexeme =>
      lexeme.id === selectedLexeme.id ? translatedLexeme : lexeme
    );
  }

  return lexemes;
}

export async function getWordBookEntryDetail(
  entry: WordBookEntry,
): Promise<WordBookEntryWithDetails> {
  const [word, indexes, lexemes] = await Promise.all([
    wordTable.get(entry.word_id),
    wordIndexTable.where("word_id").equals(entry.word_id).toArray(),
    lexemeTable.where("word_id").equals(entry.word_id).toArray(),
  ]);

  // Handle translation if needed
  const processedLexemes = await handleMissingTranslations(lexemes);

  const { id: _, ...wordWithoutId } = word!;
  return {
    ...entry,
    ...wordWithoutId,
    indexes,
    lexemes: processedLexemes,
  };
}
