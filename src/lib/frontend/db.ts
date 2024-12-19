import Dexie, { EntityTable } from 'dexie';
import { DBTypes } from '../types';

export const db = new Dexie('lass') as Dexie & {
    meta: EntityTable<{
        table_name: string;
        version: number;
    }, 'table_name'>;
    word: EntityTable<DBTypes.Word, 'id'>;
    wordIndex: EntityTable<DBTypes.WordIndex, 'id'>;
    lexeme: EntityTable<DBTypes.Lexeme, 'id'>;
};

db.version(1).stores({
    meta: 'table_name',
    word: 'id, lemma, update_time',
    wordIndex: 'id, word_id, spell, update_time',
    lexeme: 'id, word_id, update_time',
});
