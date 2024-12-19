import { getWord } from "@/lib/backend/data/word";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  _: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  const word = await getWord(getRequestContext().env.DB, id);
  if (word) {
    return NextResponse.json(word);
  } else {
    return new Response("Not found", { status: 404 });
  }
}
