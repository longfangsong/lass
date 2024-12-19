import { auth } from "@/lib/auth";
import { updateReviewProgress } from "@/lib/backend/data/review_progress";
import { ReviewProgressPatchPayload } from "@/lib/types";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type AppRouteHandlerFnContext = {
  params?: Record<string, string | string[]>;
};

export const runtime = "edge";

export const PATCH = auth(
  async (request: NextRequest, ctx: AppRouteHandlerFnContext) => {
    const id = ctx.params?.id as string;
    const req = request as NextRequest & { auth: Session };
    if (!req.auth.user?.email) {
      return new NextResponse(null, { status: 401 });
    }
    const db = getRequestContext().env.DB;
    const payload = await request.json<ReviewProgressPatchPayload>();
    await updateReviewProgress(db, id, payload);
    return NextResponse.json(null);
  },
);
