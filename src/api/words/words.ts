import type { RouterContext } from "../router";
import type { Word } from "@/types";

export async function get({ params, env }: RouterContext) {
  const word: Word | null = await env.DB.prepare(
    "SELECT * FROM Word WHERE id = ?",
  )
    .bind(params.id)
    .first();
  if (word === null) {
    return new Response("Word not found", { status: 404 });
  } else {
    return Response.json(word);
  }
}
