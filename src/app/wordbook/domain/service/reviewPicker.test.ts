import { expect, test } from "vitest";
import { mostFrequent } from "./reviewPicker";
import { createEntry } from "../model";
import type { Word } from "@app/types";

test("Most frequent Policy", async () => {
  const entries = await Promise.all([
    createEntry("w0"),
    createEntry("w1"),
    createEntry("w2"),
  ]);
  const words: Record<string, Word> = {
    w0: {
      id: "w0",
      lemma: "w0",
      part_of_speech: "",
      phonetic: null,
      phonetic_url: null,
      phonetic_voice: null,
      update_time: Date.now(),
      frequency: 2,
      frequency_rank: 2,
      indexes: [],
      lexemes: [],
    },
    w1: {
      id: "w1",
      lemma: "w1",
      part_of_speech: "",
      phonetic: null,
      phonetic_url: null,
      phonetic_voice: null,
      update_time: Date.now(),
      frequency: 3,
      frequency_rank: 1,
      indexes: [],
      lexemes: [],
    },
    w2: {
      id: "w2",
      lemma: "w2",
      part_of_speech: "",
      phonetic: null,
      phonetic_url: null,
      phonetic_voice: null,
      update_time: Date.now(),
      frequency: 1,
      frequency_rank: 3,
      indexes: [],
      lexemes: [],
    },
  };
  const mostFrequentPicker = mostFrequent(async (ids) => {
    return ids.map((id) => words[id]);
  });
  const resultAll = await mostFrequentPicker(entries, 3);
  expect(resultAll.length).toBe(3);
  expect(resultAll[0].word_id).toBe("w1");
  expect(resultAll[1].word_id).toBe("w0");
  expect(resultAll[2].word_id).toBe("w2");
});
