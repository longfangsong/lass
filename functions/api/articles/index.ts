import {
  getArticleMetas,
  getArticleCount,
  getArticleMetasUpdatedAfter,
} from "@/lib/backend/article";

async function articleMetas(
  db: D1Database,
  limitParam: string | null | undefined,
  offsetParam: string | null | undefined
): Promise<Response> {
  const limit = parseInt(limitParam || "10");
  const offset = parseInt(offsetParam || "0");
  if (isNaN(limit) || isNaN(offset)) {
    return new Response("Invalid limit or offset", { status: 400 });
  }
  const [count, result] = await Promise.all([getArticleCount(db), getArticleMetas(db, limit, offset)]);
  const response = new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'X-Total-Count': count.toString()
    }
  });
  return response;
}

async function articleMetasUpdatedAfter(
  db: D1Database,
  updatedAfter: string,
  limitParam: string | null | undefined
): Promise<Response> {
  const timestamp = parseInt(updatedAfter);
  const limit = parseInt(limitParam || "10");
  if (isNaN(timestamp) || isNaN(limit)) {
    return new Response("Invalid updated_after or limit", { status: 400 });
  }
  const result = await getArticleMetasUpdatedAfter(db, timestamp, limit);
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function onRequestGet(context: EventContext<CloudflareEnv, string, unknown>) {
  const url = new URL(context.request.url);

  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const updatedAfter = url.searchParams.get("updated_after");
  if (updatedAfter) {
    return await articleMetasUpdatedAfter(context.env.DB, updatedAfter, limitParam);
  }
  if (limitParam || offsetParam) {
    return await articleMetas(context.env.DB, limitParam, offsetParam);
  }

  return new Response("No valid parameter provided", { status: 400 });
}
