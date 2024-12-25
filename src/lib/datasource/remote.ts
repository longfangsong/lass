import { fetchWithSemaphore } from "../fetch";
import {
  ClientReviewProgressAtSnapshotWithWord,
  ClientSideDBReviewProgress,
  ReviewProgressAtSnapshot,
  Word,
  WordSearchResult,
} from "../types";
import { DataSource } from "./datasource";

export class RemoteDataSource implements DataSource {
  async getReviewProgressAtSnapshotWithWord(
    snapshotTime: number,
    offset: number,
    limit: number,
  ): Promise<Array<ClientReviewProgressAtSnapshotWithWord>> {
    const response = await fetchWithSemaphore(
      `/api/review_progress?snapshot_time=${snapshotTime}&offset=${offset}&limit=${limit}`,
    );
    return await response.json();
  }
  async getReviewProgressCount(): Promise<number> {
    const response = await fetchWithSemaphore("/api/review_progress", {
      method: "HEAD",
    });
    return parseInt(response.headers.get("X-Total-Count") ?? "0");
  }

  async searchWord(spell: string): Promise<Array<WordSearchResult>> {
    const response = await fetchWithSemaphore(`/api/words?search=${spell}`);
    return await response.json();
  }

  async getWordsByIndexSpell(spell: string): Promise<Array<Word>> {
    const response = await fetchWithSemaphore(
      `/api/words?index_spell=${spell}`,
    );
    return await response.json();
  }

  async getWord(id: string): Promise<Word | null> {
    const response = await fetchWithSemaphore(`/api/words/${id}`);
    return await response.json();
  }
}

export const remoteDataSource = new RemoteDataSource();
