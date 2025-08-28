import type { Word } from "@/types";
import { shuffle } from "remeda";

export function createSentenceProblem(
  word: Word,
): { sentence: string; scrambledWords: string[] } | null {
  const lexemesWithExamples = word.lexemes.filter((l) => l.example);

  if (lexemesWithExamples.length === 0) {
    return null;
  }

  const randomLexeme =
    lexemesWithExamples[Math.floor(Math.random() * lexemesWithExamples.length)];

  // We've filtered for examples, so it's safe to assert non-null.
  const sentence = randomLexeme.example!;

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
  };
}
