import { getWord } from "@/lib/backend/word";

export async function onRequestGet(context: EventContext<CloudflareEnv, string, unknown>) {
  const id: string = context.params.id as string;
  const word = await getWord(context.env.DB, id);
  if (word) {
    return Response.json(word);
  } else {
    return new Response("Not found", { status: 404 });
  }
}
