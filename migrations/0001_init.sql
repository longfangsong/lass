-- Migration number: 0001 	 2025-07-18T23:26:21.525Z

CREATE TABLE Article (
    id CHAR(36) PRIMARY KEY,
    title text,
    content text,
    update_time INTEGER NOT NULL,
    url VARCHAR(2048),
    voice_url VARCHAR(2048)
);
CREATE INDEX idx_Article_update_time ON Article (update_time);

CREATE TABLE Word (
    id CHAR(36) PRIMARY KEY,
    lemma VARCHAR(255) NOT NULL,
    part_of_speech VARCHAR(32),
    phonetic VARCHAR(255),
    phonetic_voice BLOB,
    phonetic_url VARCHAR(2048),
    update_time INTEGER NOT NULL,
    frequency INTEGER
);
CREATE INDEX idx_Word_update_time ON Word (update_time);

CREATE TABLE WordIndex (
    id CHAR(36) PRIMARY KEY,
    word_id CHAR(36) NOT NULL REFERENCES Word(id),
    spell VARCHAR(255) NOT NULL,
    form VARCHAR(16),
    update_time INTEGER NOT NULL
);
CREATE INDEX idx_WordIndex_spell ON WordIndex(spell);
CREATE INDEX idx_WordIndex_word_id ON WordIndex(word_id);
CREATE INDEX idx_WordIndex_update_time ON WordIndex (update_time);

CREATE TABLE Lexeme (
    id CHAR(36) PRIMARY KEY,
    word_id CHAR(36) NOT NULL REFERENCES Word(id),
    definition TEXT NOT NULL,
    example TEXT,
    example_meaning TEXT,
    -- lexin-swe | folkets-lexikon | AI
    source VARCHAR(16) NOT NULL,
    update_time INTEGER NOT NULL
);
CREATE INDEX idx_Lexeme_word_id ON Lexeme(word_id);
CREATE INDEX idx_Lexeme_update_time ON Lexeme (update_time);

CREATE TABLE WordBookEntry (
    id CHAR(36) PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    word_id CHAR(36) NOT NULL REFERENCES Word(id),

    -- We use -1 instead of NULL for these 4 fields
    -- Because indexedb cannot index null values.
    passive_review_count INTEGER NOT NULL,
    next_passive_review_time INTEGER NOT NULL,
    active_review_count INTEGER NOT NULL,
    next_active_review_time INTEGER NOT NULL,

    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    update_time INTEGER NOT NULL
);
CREATE INDEX idx_WordBookEntry_user_email ON WordBookEntry(user_email);
CREATE INDEX idx_WordBookEntry_update_time ON WordBookEntry (update_time);
CREATE UNIQUE INDEX idx_WordBookEntry_word_id_user_email ON WordBookEntry (word_id, user_email);


CREATE TABLE UserSettings (
    user_email VARCHAR(255) PRIMARY KEY,
    -- no: 0, random: 1, most frequent: 2, fifo: 3
    auto_new_review INTEGER NOT NULL DEFAULT 2,
    daily_new_review_count INTEGER NOT NULL DEFAULT 10,
    update_time INTEGER NOT NULL
);
