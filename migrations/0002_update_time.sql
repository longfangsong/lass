-- Migration number: 0002 	 2024-11-30T21:52:56.845Z
ALTER TABLE Word
ADD COLUMN update_time INTEGER DEFAULT 1733004535000;

ALTER TABLE WordIndex
ADD COLUMN update_time INTEGER DEFAULT 1733004535000;

ALTER TABLE Lexeme
ADD COLUMN update_time INTEGER DEFAULT 1733004535000;

ALTER TABLE ReviewProgress
ADD COLUMN update_time INTEGER DEFAULT 1733004535000;

CREATE INDEX idx_Article_create_time ON Article (create_time);

CREATE INDEX idx_Word_update_time ON Word (update_time);

CREATE INDEX idx_WordIndex_update_time ON WordIndex (update_time);

CREATE INDEX idx_Lexeme_update_time ON Lexeme (update_time);

CREATE INDEX idx_ReviewProgress_update_time ON ReviewProgress (update_time);
