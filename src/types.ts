export interface Word {
  id: string;
  lemma: string;
  part_of_speech?: string;
  phonetic?: string;
  phonetic_voice?: ArrayBuffer;
  phonetic_url?: string;
  update_time?: number;
  frequency: number;
}

export interface Lexeme {
  id: string;
  word_id: string;
  definition: string;
  example?: string;
  example_meaning?: string;
  source: string;
  update_time: number;
}

export interface WordIndex {
  id: string;
  word_id: string;
  spell: string;
  form: string | null;
  update_time: number;
}
