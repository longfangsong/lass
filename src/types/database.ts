export interface Word {
  id: string;
  lemma: string;
  part_of_speech: string | null;
  phonetic: string | null;
  phonetic_voice: Array<number> | null;
  phonetic_url: string | null;
  update_time: number | null;
  frequency: number | null;
}

export interface Lexeme {
  id: string;
  word_id: string;
  definition: string;
  example: string | null;
  example_meaning: string | null;
  source: string;
  update_time: number | null;
}

export interface WordIndex {
  id: string;
  word_id: string;
  spell: string;
  form: string | null;
  update_time: number | null;
}
