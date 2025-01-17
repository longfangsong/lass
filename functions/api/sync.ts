import {
  getDBWordsUpdateIn,
  getDBWordIndexesUpdateIn,
  getDBLexemesUpdateIn,
} from "@/lib/backend/word";
import {
  getDBReviewProgressUpdateIn,
  upsertDBReviewProgresses,
} from "@/lib/backend/review_progress";
import { ClientSideDBReviewProgress } from "@/lib/types";
import { auth } from "@/lib/backend/auth";
import { isSuccess } from "@/lib/backend/auth";
import { getArticlesUpdatedAfter } from "@/lib/backend/article";

export async function onRequestGet(
  context: EventContext<CloudflareEnv, string, unknown>,
) {
  const url = new URL(context.request.url);
  const table = url.searchParams.get("table");
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const updatedAfter = url.searchParams.get("updated_after");
  const updatedBefore = url.searchParams.get("updated_before");
  let result = null;
  if (
    table !== null &&
    updatedAfter !== null &&
    updatedBefore !== null &&
    limitParam !== null &&
    offsetParam !== null
  ) {
    switch (table) {
      case "Word":
        result = await getDBWordsUpdateIn(
          context.env.DB,
          Number(updatedAfter),
          Number(updatedBefore),
          Number(limitParam),
          Number(offsetParam),
        );
        break;
      case "WordIndex":
        result = await getDBWordIndexesUpdateIn(
          context.env.DB,
          Number(updatedAfter),
          Number(updatedBefore),
          Number(limitParam),
          Number(offsetParam),
        );
        break;
      case "Lexeme":
        result = await getDBLexemesUpdateIn(
          context.env.DB,
          Number(updatedAfter),
          Number(updatedBefore),
          Number(limitParam),
          Number(offsetParam),
        );
        break;
    }
  } else if (limitParam !== null && updatedAfter !== null) {
    if (table === "Article") {
      result = await getArticlesUpdatedAfter(
        context.env.DB,
        Number(updatedAfter),
        Number(limitParam),
      );
    }
  }
  if (result === null) {
    return new Response("No valid parameter provided", { status: 400 });
  }
  return Response.json(result);
}

export async function onRequestPost(
  context: EventContext<CloudflareEnv, string, unknown>,
) {
  const authResult = await auth(context.request, context.env.AUTH_SECRET);
  const url = new URL(context.request.url);
  if (!isSuccess(authResult)) {
    return new Response(null, { status: 401 });
  }

  const table = url.searchParams.get("table");
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const updatedAfter = url.searchParams.get("updated_after");
  const updatedBefore = url.searchParams.get("updated_before");
  if (
    table !== null &&
    updatedAfter !== null &&
    updatedBefore !== null &&
    limitParam !== null &&
    offsetParam !== null
  ) {
    switch (table) {
      case "ReviewProgress": {
        const payload: Array<ClientSideDBReviewProgress> =
          await context.request.json();
        const serverUpdates = await getDBReviewProgressUpdateIn(
          context.env.DB,
          authResult.email,
          Number(updatedAfter),
          Number(updatedBefore),
          Number(limitParam),
          Number(offsetParam),
        );
        await upsertDBReviewProgresses(
          context.env.DB,
          authResult.email,
          payload,
        );
        return Response.json(serverUpdates);
      }
      default:
        return new Response(`Updating ${table} is not supported`, {
          status: 400,
        });
    }
  }
}
