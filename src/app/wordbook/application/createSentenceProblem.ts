import type { Word } from "@/types";
import { shuffle } from "remeda";

export function createSentenceProblem(
  word: Word,
): { sentence: string; scrambledWords: string[]; meaning: string } | null {
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
  // todo: polyfill example_meaning
  const meaning = randomLexeme.example_meaning || sentence;

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
