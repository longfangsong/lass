import { fetchWithSemaphore } from "@/lib/fetch";
import { db } from "../db";
import { DBTypes } from "@/lib/types";
import { EntityTable } from "dexie";
import Semaphore from "semaphore-promise";

const PAGE_SIZE = 2000;

export const syncSemaphore = new Semaphore(1);

async function sync<T>(table: EntityTable<T, keyof T>, tableName: string) {
    const release = await syncSemaphore.acquire();
    const lastUpdatedTime = await db.meta.get(tableName).then(meta => meta?.version || 0);
    const now = new Date();
    if (now.getTime() - lastUpdatedTime < 1000 * 60 * 60 * 24) {
        release();
        return;
    }
    let currentOffset = 0;
    while (true) {
        const queryResult = await fetchWithSemaphore(
            `/api/sync?table=${tableName}&limit=${PAGE_SIZE}&offset=${currentOffset}&updated_after=${lastUpdatedTime}&updated_before=${now.getTime()}`);
        const result: Array<T> = await queryResult.json();
        if (result.length < PAGE_SIZE) {
            break;
        }
        table.bulkPut(result);
        currentOffset += PAGE_SIZE;
    }
    await db.meta.put({ table_name: tableName, version: now.getTime() });
    release();
}

export async function syncWord() {
    await sync(db.word as EntityTable<DBTypes.Word, keyof DBTypes.Word>, "Word");
}

export async function syncWordIndex() {
    await sync(db.wordIndex as EntityTable<DBTypes.WordIndex, keyof DBTypes.WordIndex>, "WordIndex");
}

export async function syncLexeme() {
    await sync(db.lexeme as EntityTable<DBTypes.Lexeme, keyof DBTypes.Lexeme>, "Lexeme");
}
