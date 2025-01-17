import {
  ClientReviewProgressAtSnapshotWithWord,
  ClientSideDBReviewProgress,
  DBTypes,
  Word,
  WordSearchResult,
} from "../../types";

export interface DataSource {
  searchWord(spell: string): Promise<Array<WordSearchResult>>;
  getWord(id: string): Promise<Word | null>;
  getWordsByIndexSpell(spell: string): Promise<Array<Word>>;
  getReviewProgressCount(): Promise<number>;
  getReviewProgressAtSnapshotWithWord(
    snapshotTime: number,
    offset: number,
    limit: number,
  ): Promise<Array<ClientReviewProgressAtSnapshotWithWord>>;
  updateReviewProgress(
    reviewProgress: ClientSideDBReviewProgress,
  ): Promise<void>;
  createOrUpdateWordReview(word_id: string): Promise<void>;
  getArticlesAndCount(
    offset: number,
    limit: number,
  ): Promise<{ articles: Array<DBTypes.ArticleMeta>; count: number }>;
  getArticle(id: string): Promise<DBTypes.Article | null>;
}
