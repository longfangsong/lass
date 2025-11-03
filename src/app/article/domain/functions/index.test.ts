import { expect, test, describe } from "vitest";
import { toWordsAndPunctuations } from "./index";

describe("toWordsAndPunctuations", () => {
  test("handles simple sentence with period", () => {
    const input = "Hello world.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["Hello", "world", "."]]);
  });

  test("handles sentence with comma", () => {
    const input = "Hello, world.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["Hello", ",", "world", "."]]);
  });

  test("handles sentence with semicolon", () => {
    const input = "First part; second part.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["First", "part", ";", "second", "part", "."]]);
  });

  test("handles sentence with question mark", () => {
    const input = "How are you?";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["How", "are", "you", "?"]]);
  });

  test("handles sentence with exclamation mark", () => {
    const input = "What a day!";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["What", "a", "day", "!"]]);
  });

  test("handles multiple sentences", () => {
    const input = "First sentence. Second sentence!";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["First", "sentence", "."],
      ["Second", "sentence", "!"],
    ]);
  });

  test("handles sentences with ellipsis", () => {
    const input = "Wait... I think so.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["Wait", "..."],
      ["I", "think", "so", "."],
    ]);
  });

  test("handles word ending with ellipsis", () => {
    const input = "Something... else.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["Something", "..."],
      ["else", "."],
    ]);
  });

  test("handles quoted text starting with quote", () => {
    const input = '"Hello there" he said.';
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ['"', "Hello", "there", '"'],
      ["he", "said", "."],
    ]);
  });

  test("handles text starting with dash", () => {
    const input = "-Yes, that's right.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["-", "Yes", ",", "that's", "right", "."]]);
  });

  test("handles text starting with dash in middle", () => {
    const input = "He said -Yes, that's right.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["He", "said"],
      ["-", "Yes", ",", "that's", "right", "."],
    ]);
  });

  test("handles complex sentence with multiple punctuation", () => {
    const input = 'She said, "Hello, world!" And then... silence.';
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["She", "said", ",", '"', "Hello", ",", "world", "!", '"'],
      ["And", "then", "..."],
      ["silence", "."],
    ]);
  });

  test("handles empty string", () => {
    const input = "";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([]);
  });

  test("handles string with only whitespace", () => {
    const input = "   \n  \t  ";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([]);
  });

  test("handles single word", () => {
    const input = "word";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["word"]]);
  });

  test("handles single punctuation", () => {
    const input = ".";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["."]]);
  });

  test("handles multiple spaces between words", () => {
    const input = "word1    word2.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["word1", "word2", "."]]);
  });

  test("handles sentences with only punctuation marks", () => {
    const input = "... ! ?";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([["..."], ["!"], ["?"]]);
  });

  test("handles consecutive punctuation", () => {
    const input = "What?! Really.";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["What", "?!"],
      ["Really", "."],
    ]);
  });

  test("handles text with tabs and newlines", () => {
    const input = "First\tword.\nSecond sentence!";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["First", "word", "."],
      ["Second", "sentence", "!"],
    ]);
  });

  test("handles dialogue with multiple quotes", () => {
    const input = '"First quote." "Second quote!"';
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ['"', "First", "quote", ".", '"'],
      ['"', "Second", "quote", "!", '"'],
    ]);
  });

  test("handles mixed case with contractions", () => {
    const input = "It's a beautiful day, isn't it?";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["It's", "a", "beautiful", "day", ",", "isn't", "it", "?"],
    ]);
  });

  test('treats "5,5" as a single word', () => {
    const input = "A 5,5 million";
    const result = toWordsAndPunctuations(input);
    expect(result).toEqual([
      ["A", "5,5", "million"]
    ]);
  });
});
