import { fetchWithSemaphore } from "../fetch";
import { Word, WordSearchResult } from "../types";
import { DataSource } from "./datasource";

export class RemoteDataSource implements DataSource {
    async searchWord(spell: string): Promise<Array<WordSearchResult>> {
        const response = await fetchWithSemaphore(`/api/words?search=${spell}`);
        return await response.json();
    }

    async getWordsByIndexSpell(spell: string): Promise<Array<Word>> {
        const response = await fetchWithSemaphore(`/api/words?index_spell=${spell}`);
        return await response.json();
    }

    async getWord(id: string): Promise<Word | null> {
        const response = await fetchWithSemaphore(`/api/words/${id}`);
        return await response.json();
    }
}

export const remoteDataSource = new RemoteDataSource();