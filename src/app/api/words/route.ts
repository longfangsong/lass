import { getWordsByIndex, searchWord } from "@/lib/backend/data/word";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse, type NextRequest } from "next/server";
export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParam = request.nextUrl.searchParams.get("search");

  if (searchParam) {
    const db = getRequestContext().env.DB;
    const result = await searchWord(db, searchParam);
    return NextResponse.json(result);
  }

  const indexSpellParam = request.nextUrl.searchParams.get("index_spell");
  if (indexSpellParam) {
    const db = getRequestContext().env.DB;
    const result = await getWordsByIndex(db, indexSpellParam);
    if (result === null) {
      return new Response("Not found", { status: 404 });
    }
    return NextResponse.json(result);
  }

  return new Response("No parameter provided", { status: 400 });
}
