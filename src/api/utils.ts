function unescapeString(str: string): string {
  return str.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

export function unescapeObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return unescapeString(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(unescapeObject) as T;
  }
  if (typeof obj === "object" && obj !== null) {
    const result: { [key: string]: unknown } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = unescapeObject(obj[key]);
      }
    }
    return result as T;
  }
  return obj;
}
