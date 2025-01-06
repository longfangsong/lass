import { getArticle } from "@/lib/backend/article";

export async function onRequestGet(context: EventContext<CloudflareEnv, string, { id: string }>) {
  const db = context.env.DB;
  const article = await getArticle(db, context.params.id as string);
  if (article) {
    return new Response(JSON.stringify(article), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } else {
    return new Response("Not found", { status: 404 });
  }
}
