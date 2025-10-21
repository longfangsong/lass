import type { Lexeme, Word } from "@/types";
import { shuffle } from "remeda";
import { lexemeTable } from "../infrastructure/repository";

/**
 * Attempts to fetch English translation for a Swedish example sentence.
 * Updates the lexeme in local database if translation is successful.
 */
async function polyfillExampleMeaning(lexeme: Lexeme): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/lexemes/${lexeme.id}?fill_example_meaning=1`,
      {
        method: "PATCH",
      }
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch translation for lexeme ${lexeme.id}:`,
        response.status
      );
      return null;
    }

    const data = await response.json();
    const updatedLexeme = data.lexeme as Lexeme;

    // Save the updated lexeme with translation to local database
    if (updatedLexeme.example_meaning) {
      await lexemeTable.put(updatedLexeme);
      return updatedLexeme.example_meaning;
    }

    return null;
  } catch (error) {
    console.error("Error fetching translation:", error);
    return null;
  }
}

export async function createSentenceProblem(
  word: Word,
): Promise<{ sentence: string; scrambledWords: string[]; meaning: string } | null> {
  let lexemesWithExamples = word.lexemes.filter(
    (lexeme) => lexeme.example && lexeme.example_meaning,
  );

  if (lexemesWithExamples.length === 0) {
    lexemesWithExamples = word.lexemes.filter((lexeme) => lexeme.example);
  }

  if (lexemesWithExamples.length === 0) {
    return null;
  }

  const randomLexeme =
    lexemesWithExamples[Math.floor(Math.random() * lexemesWithExamples.length)];

  // We've filtered for examples, so it's safe to assert non-null.
  const sentence = randomLexeme.example!;
  
  // Polyfill example_meaning if not available
  let meaning = randomLexeme.example_meaning;
  if (!meaning) {
    meaning = await polyfillExampleMeaning(randomLexeme);
  }
  // Fallback to Swedish sentence if translation unavailable
  meaning = meaning || sentence;

  // Split the sentence into words. This regex handles multiple spaces and filters empty strings.
  const words = sentence.split(/\s+/).filter((word) => word.length > 0);

  // A sentence with one word cannot be scrambled.
  if (words.length <= 1) {
    return null;
  }

  const scrambledWords = shuffle(words);

  return {
    sentence,
    scrambledWords,
    meaning,
  };
}
