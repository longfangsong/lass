// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DBTypes {
  export interface ArticleMeta {
    id: string;
    title: string;
  }

  export interface Article extends ArticleMeta {
    content: string;
    create_time: number;
    url: string;
    voice_url: string;
  }

  export interface Word {
    id: string;
    lemma: string;
    part_of_speech: string;
    phonetic: string;
    phonetic_voice: Array<number> | null;
    phonetic_url: string | null;
    update_time: number;
  }

  export interface WordIndex {
    id: string;
    word_id: string;
    spell: string;
    form: string | null;
    update_time: number;
  }

  export interface Lexeme {
    id: string;
    word_id: string;
    definition: string;
    example: string | null;
    example_meaning: string | null;
    source: string;
    update_time: number;
  }

  export interface ReviewProgress {
    id: string;
    user_email: string;
    word_id: string;
    query_count: number;
    review_count: number;
    last_last_review_time: number | null;
    last_review_time: number | null;
    update_time: number;
  }
}

export type Lexeme = DBTypes.Lexeme;

export interface WordSearchResult {
  id: string;
  lemma: string;
  definitions: Array<string>;
}

export interface Word extends DBTypes.Word {
  indexes: Array<DBTypes.WordIndex>;
  lexemes: Array<DBTypes.Lexeme>;
}

export interface ReviewProgress extends DBTypes.ReviewProgress {
  next_reviewable_time: number | null;
}

export interface ReviewProgressAtSnapshot extends ReviewProgress {
  snapshot_next_reviewable_time: number | null;
  snapshot_review_count: number;
}

export type ReviewProgressAtSnapshotWithWord = ReviewProgressAtSnapshot &
  DBTypes.Word & {
    lexemes: Array<DBTypes.Lexeme>;
  };

export interface ReviewProgressPatchPayload {
  query_count?: number;
  review_count?: number;
  last_last_review_time?: number | null;
  last_review_time?: number;
}

export type ClientSideDBReviewProgress = Omit<
  DBTypes.ReviewProgress,
  "user_email"
>;

export type ClientSideReviewProgress = Omit<ReviewProgress, "user_email">;

export type ClientSideReviewProgressAtSnapshot = Omit<
  ReviewProgressAtSnapshot,
  "user_email"
>;

export type ClientReviewProgressAtSnapshotWithWord = Omit<
  ReviewProgressAtSnapshotWithWord,
  "user_email"
>;
