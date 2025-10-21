/**
 * Response Utilities
 * 
 * Shared utilities for creating HTTP responses.
 */

/**
 * Escapes CSV field (handles quotes, commas, newlines)
 */
export function escapeCSVField(field: string | null): string {
  if (field === null) return '';
  
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return field;
}

/**
 * Generates Response object for JSON export
 */
export function createJSONResponse(data: unknown, filename: string): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Generates Response object for CSV export
 */
export function createCSVResponse(csvData: string, filename: string): Response {
  return new Response(csvData, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
