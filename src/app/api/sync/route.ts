import {
  getDBWordsUpdateIn,
  getDBWordIndexesUpdateIn,
  getDBLexemesUpdateIn,
} from "@/lib/backend/word";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest, NextResponse } from "next/server";
import {
  getDBReviewProgressUpdateIn,
  upsertDBReviewProgresses,
} from "@/lib/backend/review_progress";
import { ClientSideDBReviewProgress, DBTypes } from "@/lib/types";
import { auth } from "@/lib/backend/auth";
import { isSuccess } from "@/lib/backend/auth";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const db = getRequestContext().env.DB;
  const table = request.nextUrl.searchParams.get("table");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const offsetParam = request.nextUrl.searchParams.get("offset");
  const updatedAfter = request.nextUrl.searchParams.get("updated_after");
  const updatedBefore = request.nextUrl.searchParams.get("updated_before");
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
          db,
          Number(updatedAfter),
          Number(updatedBefore),
          Number(limitParam),
          Number(offsetParam),
        );
        break;
      case "WordIndex":
        result = await getDBWordIndexesUpdateIn(
          db,
          Number(updatedAfter),
          Number(updatedBefore),
          Number(limitParam),
          Number(offsetParam),
        );
        break;
      case "Lexeme":
        result = await getDBLexemesUpdateIn(
          db,
          Number(updatedAfter),
          Number(updatedBefore),
          Number(limitParam),
          Number(offsetParam),
        );
        break;
    }
  }
  if (result === null) {
    return new Response("No valid parameter provided", { status: 400 });
  }
  return NextResponse.json(result);
}

export const POST = async (request: NextRequest) => {
  const authResult = await auth(request);
  if (!isSuccess(authResult)) {
    return new NextResponse(null, { status: 401 });
  }
  const db = getRequestContext().env.DB;
  const table = request.nextUrl.searchParams.get("table");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const offsetParam = request.nextUrl.searchParams.get("offset");
  const updatedAfter = request.nextUrl.searchParams.get("updated_after");
  const updatedBefore = request.nextUrl.searchParams.get("updated_before");
  if (
    table !== null &&
    updatedAfter !== null &&
    updatedBefore !== null &&
    limitParam !== null &&
    offsetParam !== null
  ) {
    switch (table) {
      case "ReviewProgress":
        const payload: Array<ClientSideDBReviewProgress> = await request.json();
        const server_updates = await getDBReviewProgressUpdateIn(
          db,
          authResult.email,
          Number(updatedAfter),
          Number(updatedBefore),
          Number(limitParam),
          Number(offsetParam),
        );
        await upsertDBReviewProgresses(db, authResult.email, payload);
        return NextResponse.json(server_updates);
      default:
        return new Response(`Updating ${table} is not supported`, {
          status: 400,
        });
    }
  }
};
