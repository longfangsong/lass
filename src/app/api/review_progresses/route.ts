import { isSuccess, User } from "@/lib/backend/auth";
import { auth } from "@/lib/backend/auth";
import {
  createReviewProgess,
  getReviewProgressAtSnapshotWithWord,
  getReviewProgressByWord,
  getReviewProgressesOfUserCount,
} from "@/lib/backend/review_progress";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export const HEAD = async (request: NextRequest) => {
  const authResult = await auth(request);
  if (!isSuccess(authResult)) {
    return new NextResponse(null, { status: 401 });
  }
  const db = getRequestContext().env.DB;
  const count = await getReviewProgressesOfUserCount(db, authResult.email);
  return new NextResponse(null, {
    headers: {
      "X-Total-Count": count.toString(),
    },
  });
}

export const GET = async (request: NextRequest) => {
  const authResult = await auth(request);
  if (!isSuccess(authResult)) {
    return new NextResponse(null, { status: 401 });
  }
  return await getBySnapshot(request, authResult);
};

export const POST = async (request: NextRequest) => {
  const authResult = await auth(request);
  if (!isSuccess(authResult)) {
    return new NextResponse(null, { status: 401 });
  }
  const db = getRequestContext().env.DB;
  const payload = await request.json<{ word_id: string }>();
  const existing = await getReviewProgressByWord(
    db,
    authResult.email,
    payload.word_id,
  );
  if (existing) {
    return NextResponse.json(existing, {
      status: 409,
    });
  }
  const id = await createReviewProgess(
    db,
    authResult.email,
    payload.word_id,
  );
  return NextResponse.json(id);
};

async function getBySnapshot(req: NextRequest, authResult: User) {
  const snapshotTimeString = req.nextUrl.searchParams.get("snapshot_time");
  const snapshotTime = snapshotTimeString
    ? parseInt(snapshotTimeString)
    : new Date().getTime();
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
  const db = getRequestContext().env.DB;
  const [count, reviewProgesses] = await Promise.all([
    getReviewProgressesOfUserCount(db, authResult.email),
    getReviewProgressAtSnapshotWithWord(
      db,
      authResult.email,
      snapshotTime,
      offset,
      limit,
    ),
  ]);
  const result = NextResponse.json(reviewProgesses);
  result.headers.set("X-Total-Count", count.toString());
  return result;
}
