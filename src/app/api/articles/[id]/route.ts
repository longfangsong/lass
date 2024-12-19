import { getArticle } from "@/lib/backend/data/article";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  _: NextRequest,
  { params: { id } }: { params: { id: string } }
) {
  const db = getRequestContext().env.DB;
  const article = await getArticle(db, id);
  if (article) {
    return NextResponse.json(article);
  } else {
    return new Response("Not found", { status: 404 });
  }
}
