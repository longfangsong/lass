/**
 * Settings API Endpoint
 * 
 * Handles user settings retrieval, export, and deletion operations.
 * 
 * Routes:
 * - GET /api/settings - Get user settings (normal or export based on format parameter)
 * - DELETE /api/settings - Delete user settings (account deletion)
 */

import type { RouterContext } from '../router';
import * as jose from 'jose';
import * as cookie from 'cookie';
import { 
  queryUserSettings,
  deleteUserSettings as deleteUserSettingsQuery
} from './services/queries';
import {
  exportSettingsAsCSV,
} from './services/exportService';
import { 
  createDeletionResult 
} from './services/deletionService';
import { 
  isValidExportFormat, 
  generateExportFilename 
} from './domain/validation';
import {
  createJSONResponse,
  createCSVResponse,
} from '../utils/response';/**
 * GET /api/settings
 * 
 * Retrieves user settings or exports them based on format parameter.
 * 
 * Query Parameters:
 * - format: 'json' | 'csv' (optional) - Export format
 * 
 * Responses:
 * - 200: Settings retrieved/exported successfully
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

    // 4. Query user settings from D1
    const settings = await queryUserSettings(env.DB, email);

    if (!settings) {
      return new Response(
        JSON.stringify({
          code: 'NOT_FOUND',
          message: 'User settings not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Return based on format
    if (format === 'json') {
      // Export as JSON with all fields including email and registeredAt
      const exportData = settings;
      
      return createJSONResponse(
        exportData,
        generateExportFilename('settings', 'json')
      );
    } else if (format === 'csv') {
      // Export as CSV
      const csvData = exportSettingsAsCSV(
        settings.user_email,
        settings.auto_new_review,
        settings.daily_new_review_count,
        settings.update_time
      );
      
      return createCSVResponse(
        csvData,
        generateExportFilename('settings', 'csv')
      );
    } else {
      // Normal retrieval (no email/registeredAt)
      return new Response(
        JSON.stringify({
          autoNewReview: settings.auto_new_review,
          dailyNewReviewCount: settings.daily_new_review_count,
          updatedAt: new Date(settings.update_time).toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return new Response(
      JSON.stringify({
        code: 'INTERNAL_ERROR',
        message: 'Failed to process request',
        details: {
          operation: 'get_settings',
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
 * DELETE /api/settings
 * 
 * Deletes user settings (account deletion).
 * 
 * Responses:
 * - 200: Settings deleted successfully
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

    // 3. Delete user settings
    const recordsDeleted = await deleteUserSettingsQuery(env.DB, email);

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
    console.error('Error in DELETE /api/settings:', error);
    return new Response(
      JSON.stringify({
        code: 'INTERNAL_ERROR',
        message: 'Failed to process request',
        details: {
          operation: 'delete_settings',
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
