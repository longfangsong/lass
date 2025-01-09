-- Migration number: 0003 	 2025-01-09T09:53:54.452Z
CREATE UNIQUE INDEX idx_ReviewProgress_word_id_user_email ON ReviewProgress (word_id, user_email);
