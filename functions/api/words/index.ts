import { getWordsByIndex, searchWord } from "@/lib/backend/word";

export async function onRequestGet(context: EventContext<CloudflareEnv, string, unknown>) {
  const url = new URL(context.request.url);
  const searchParam = url.searchParams.get("search");

  if (searchParam) {
    const db = context.env.DB;
    const result = await searchWord(db, searchParam);
    return Response.json(result);
  }

  const indexSpellParam = url.searchParams.get("index_spell");
  if (indexSpellParam) {
    const db = context.env.DB;
    const result = await getWordsByIndex(db, indexSpellParam);
    if (result === null) {
      return new Response("Not found", { status: 404 });
    }
    return Response.json(result);
  }

  return new Response("No parameter provided", { status: 400 });
};
