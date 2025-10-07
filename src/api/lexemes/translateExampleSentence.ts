import type { Lexeme } from '@/types';
import * as deepl from 'deepl-node';

export interface LexemeUpdateRequest {
  fill_example_meaning?: '1' | 'true'
}

async function translateText(apiKey: string, text: string): Promise<string> {
  const translator = new deepl.Translator(apiKey);
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot translate empty text');
  }

  if (text.length > 5000) { // DeepL limit is much higher, but we limit for safety
    throw new Error('Text too long for translation (max 5000 characters)');
  }

  const result = await translator.translateText(
    text,
    'sv', // Swedish
    'en-US' // English (US)
  );

  if (!result || !result.text || typeof result.text !== 'string') {
    throw new Error('Invalid translation response from DeepL API');
  }

  return result.text.trim();
}

/**
 * PATCH /lexemes/{lexeme_id} endpoint
 * Updates a lexeme's example_meaning field using DeepL translation
 */
export async function handleLexemeUpdate(
  request: Request,
  env: Env,
  lexemeId: string
): Promise<Response> {
  // Parse query parameters
  const url = new URL(request.url);
  const fillExampleMeaning = url.searchParams.get('fill_example_meaning');

  if (fillExampleMeaning !== '1' && fillExampleMeaning !== 'true') {
    return new Response(
      JSON.stringify({ error: 'fill_example_meaning parameter must be "1" or "true"' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get lexeme from database
    const lexeme = await getLexemeById(env.DB, lexemeId);
    
    if (!lexeme) {
      return new Response(
        JSON.stringify({ error: 'Lexeme not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if translation is needed
    if (!lexeme.example || lexeme.example.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Cannot translate empty example',
          lexeme: lexeme
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (lexeme.example_meaning && lexeme.example_meaning.trim().length > 0) {
      // Already has translation, return as-is
      return new Response(
        JSON.stringify({ lexeme: lexeme }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Perform translation
    try {
      const result = await translateText(env.DEEPL_API_KEY, lexeme.example);

      // Update database with translation
      const updatedLexeme = await updateLexemeExampleMeaning(
        env.DB,
        lexemeId,
        result
      );

      return Response.json({ lexeme: updatedLexeme });
    } catch (error) {
      // Handle translation errors gracefully
      console.error('Translation failed:', error);
      return new Response("Translation failed", { status: 500 });
    }
  } catch (error) {
    console.error('Lexeme update failed:', error);
    return new Response("Internal server error", { status: 500 });
  }
}


async function getLexemeById(db: D1Database, lexemeId: string): Promise<Lexeme | null> {
  const result = await db
    .prepare('SELECT id, word_id, definition, example, example_meaning, source, update_time FROM Lexeme WHERE id = ?')
    .bind(lexemeId)
    .first<Lexeme>();
  
  return result || null;
}

async function updateLexemeExampleMeaning(
  db: D1Database,
  lexemeId: string,
  exampleMeaning: string
): Promise<Lexeme> {
  const now = Date.now();
  await db
    .prepare('UPDATE Lexeme SET example_meaning = ?, update_time = ? WHERE id = ?')
    .bind(exampleMeaning, now, lexemeId)
    .run();

  // Return updated lexeme
  const updated = await getLexemeById(db, lexemeId);
  if (!updated) {
    throw new Error('Failed to retrieve updated lexeme');
  }
  
  return updated;
}
