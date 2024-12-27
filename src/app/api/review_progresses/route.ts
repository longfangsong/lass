import { auth } from "@/lib/auth";
import {
  createReviewProgess,
  getReviewProgressAtSnapshotWithWord,
  getReviewProgressByWord,
  getReviewProgressesOfUserCount,
} from "@/lib/backend/data/review_progress";
import { getDB } from "@/lib/backend/db";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export const HEAD = auth(async (request: NextRequest) => {
  const req = request as NextRequest & { auth: Session };
  if (!req.auth.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const [release, db] = await getDB();
  const count = await getReviewProgressesOfUserCount(db, req.auth.user.email);
  release();
  return new NextResponse(null, {
    headers: {
      "X-Total-Count": count.toString(),
    },
  });
});

export const GET = auth(async (request: NextRequest) => {
  const req = request as NextRequest & { auth: Session };
  if (!req.auth.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return await getBySnapshot(req);
});

export const POST = auth(async (request: NextRequest) => {
  const req = request as NextRequest & { auth: Session };
  if (!req.auth.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const db = getRequestContext().env.DB;
  const payload = await request.json<{ word_id: string }>();
  const existing = await getReviewProgressByWord(
    db,
    req.auth.user.email,
    payload.word_id,
  );
  if (existing) {
    return NextResponse.json(existing, {
      status: 409,
    });
  }
  const id = await createReviewProgess(
    db,
    req.auth.user.email,
    payload.word_id,
  );
  return NextResponse.json(id);
});

async function getBySnapshot(req: NextRequest & { auth: Session }) {
  const snapshotTimeString = req.nextUrl.searchParams.get("snapshot_time");
  const snapshotTime = snapshotTimeString
    ? parseInt(snapshotTimeString)
    : new Date().getTime();
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
  let limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
  const [release, db] = await getDB();
  const [count, reviewProgesses] = await Promise.all([
    getReviewProgressesOfUserCount(db, req.auth.user?.email!),
    getReviewProgressAtSnapshotWithWord(
      db,
      req.auth.user?.email!,
      snapshotTime,
      offset,
      limit,
    ),
  ]);
  release();
  const result = NextResponse.json(reviewProgesses);
  result.headers.set("X-Total-Count", count.toString());
  return result;
}
