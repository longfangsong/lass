import {
  getArticle,
  getArticleMetas,
  getArticleCount,
  getArticleMetasUpdatedAfter,
} from "@/lib/data/article";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "edge";

async function articleMetas(
  db: D1Database,
  limitParam: string | null | undefined,
  offsetParam: string | null | undefined
): Promise<NextResponse> {
  const limit = parseInt(limitParam || "10");
  const offset = parseInt(offsetParam || "0");
  if (isNaN(limit) || isNaN(offset)) {
    return new NextResponse("Invalid limit or offset", { status: 400 });
  }
  const [count, result] = await Promise.all([getArticleCount(db), getArticleMetas(db, limit, offset)]);
  const response = NextResponse.json(result);
  response.headers.set('X-Total-Count', count.toString());
  return response;
}

async function articleMetasUpdatedAfter(
  db: D1Database,
  updatedAfter: string,
  limitParam: string | null | undefined
): Promise<NextResponse> {
  const timestamp = parseInt(updatedAfter);
  const limit = parseInt(limitParam || "10");
  if (isNaN(timestamp) || isNaN(limit)) {
    return new NextResponse("Invalid updated_after or limit", { status: 400 });
  }
  const result = await getArticleMetasUpdatedAfter(db, timestamp, limit);
  return NextResponse.json(result);
}

export async function GET(request: NextRequest) {
  const db = getRequestContext().env.DB;

  const limitParam = request.nextUrl.searchParams.get("limit");
  const offsetParam = request.nextUrl.searchParams.get("offset");
  const updatedAfter = request.nextUrl.searchParams.get("updated_after");
  if (updatedAfter) {
    return await articleMetasUpdatedAfter(db, updatedAfter, limitParam);
  }
  if (limitParam || offsetParam) {
    return await articleMetas(db, limitParam, offsetParam);
  }

  return new Response("No valid parameter provided", { status: 400 });
}
