import { isSuccess } from "@/lib/backend/auth";
import { auth } from "@/lib/backend/auth";
import { updateReviewProgress } from "@/lib/backend/review_progress";
import { ReviewProgressPatchPayload } from "@/lib/types";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest, NextResponse } from "next/server";

type AppRouteHandlerFnContext = {
  params?: Record<string, string | string[]>;
};

export const runtime = "edge";

export const PATCH = async (request: NextRequest, ctx: AppRouteHandlerFnContext) => {
  const authResult = await auth(request);
  if (!isSuccess(authResult)) {
    return new NextResponse(null, { status: 401 });
  }
  const id = ctx.params?.id as string;
  const db = getRequestContext().env.DB;
  const payload = await request.json<ReviewProgressPatchPayload>();
  await updateReviewProgress(db, id, payload);
  return NextResponse.json(null);
};
