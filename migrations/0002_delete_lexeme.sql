-- Migration number: 0002 	 2025-11-17T17:03:23.925Z

-- Add deleted field to Lexeme table
ALTER TABLE Lexeme ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
