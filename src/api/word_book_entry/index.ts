/**
 * Word Book Entry API Endpoint
 * 
 * Handles wordbook entries retrieval, export, and deletion operations.
 * 
 * Routes:
 * - GET /api/word_book_entry - Get wordbook entries (normal or export based on format parameter)
 * - DELETE /api/word_book_entry - Delete all wordbook entries
 */

import type { RouterContext } from '../router';
import * as jose from 'jose';
import * as cookie from 'cookie';
import { 
  queryWordBookEntries,
  deleteWordBookEntries as deleteWordBookEntriesQuery
} from './queries';
import {
  exportWordBookAsCSV,
} from './exportService';
import { 
  createDeletionResult 
} from '../settings/services/deletionService';
import { 
  isValidExportFormat, 
  generateExportFilename 
} from '../settings/domain/validation';
import {
  createJSONResponse,
  createCSVResponse,
} from '../utils/response';

/**
 * GET /api/word_book_entry
 * 
 * Retrieves user's wordbook entries or exports them based on format parameter.
 * 
 * Query Parameters:
 * - format: 'json' | 'csv' (optional) - Export format
 * 
 * Responses:
 * - 200: Entries retrieved/exported successfully
 * - 400: Invalid format parameter
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function get({ env, request, query }: RouterContext): Promise<Response> {
  try {
    // 1. Authenticate user
    const cookies = cookie.parse(request.headers.get('cookie') || '');
    const authToken = cookies.auth_token;

    if (!authToken) {
      return new Response(
        JSON.stringify({
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access this resource',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Verify JWT and get user email
    const secret = new TextEncoder().encode(env.AUTH_SECRET);
    const { payload } = await jose.jwtVerify(authToken, secret);
    const email = payload.email as string;

    if (!email) {
      return new Response(
        JSON.stringify({
          code: 'UNAUTHORIZED',
          message: 'Invalid token payload',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Check if export format is requested
    const format = query.get('format');
    
    if (format && !isValidExportFormat(format)) {
      return new Response(
        JSON.stringify({
          code: 'INVALID_REQUEST',
          message: "Invalid format parameter. Must be 'json' or 'csv'",
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Query wordbook entries from D1
    const entries = await queryWordBookEntries(env.DB, email);

    // 5. Return based on format
    if (format === 'json') {
      // Export as JSON with all fields
      return createJSONResponse(
        entries,
        generateExportFilename('wordbook', 'json')
      );
    } else if (format === 'csv') {
      // Export as CSV
      const csvData = exportWordBookAsCSV(entries);
      
      return createCSVResponse(
        csvData,
        generateExportFilename('wordbook', 'csv')
      );
    } else {
    // This endpoint no longer supports bare retrieval without an export format.
    return new Response(
      JSON.stringify({
        code: 'NOT_SUPPORTED',
        message: "This endpoint only supports exporting wordbook entries. Please specify ?format=json or ?format=csv",
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    }
  } catch (error) {
    console.error('Error in GET /api/word_book_entry:', error);
    return new Response(
      JSON.stringify({
        code: 'INTERNAL_ERROR',
        message: 'Failed to process request',
        details: {
          operation: 'get_word_book_entry',
          reason: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * DELETE /api/word_book_entry
 * 
 * Deletes all wordbook entries for the authenticated user.
 * 
 * Responses:
 * - 200: Entries deleted successfully
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function del({ env, request }: RouterContext): Promise<Response> {
  try {
    // 1. Authenticate user
    const cookies = cookie.parse(request.headers.get('cookie') || '');
    const authToken = cookies.auth_token;

    if (!authToken) {
      return new Response(
        JSON.stringify({
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access this resource',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Verify JWT and get user email
    const secret = new TextEncoder().encode(env.AUTH_SECRET);
    const { payload } = await jose.jwtVerify(authToken, secret);
    const email = payload.email as string;

    if (!email) {
      return new Response(
        JSON.stringify({
          code: 'UNAUTHORIZED',
          message: 'Invalid token payload',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Delete all wordbook entries
    const recordsDeleted = await deleteWordBookEntriesQuery(env.DB, email);

    // 4. Return deletion result
    const result = createDeletionResult(recordsDeleted);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in DELETE /api/word_book_entry:', error);
    return new Response(
      JSON.stringify({
        code: 'INTERNAL_ERROR',
        message: 'Failed to process request',
        details: {
          operation: 'delete_word_book_entry',
          reason: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
