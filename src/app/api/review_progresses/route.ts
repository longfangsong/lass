import { auth } from "@/lib/auth";
import {
  createReviewProgess,
  getReviewProgressByWord,
  getReviewProgressesOfUser,
} from "@/lib/data/review_progress";
import { getDB } from "@/lib/db";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export const GET = auth(async (request: NextRequest) => {
  const req = request as NextRequest & { auth: Session };
  if (!req.auth.user?.email) {
    return new NextResponse(null, { status: 401 });
  }
  const snapshotTimeString = request.nextUrl.searchParams.get("snapshot_time");
  const snapshotTime = snapshotTimeString
    ? parseInt(snapshotTimeString)
    : new Date().getTime();
  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");
  let limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");
  const [release, db] = await getDB();
  const reviewProgesses = await getReviewProgressesOfUser(
    db,
    req.auth.user.email,
    snapshotTime,
    offset,
    limit,
  );
  release();
  return NextResponse.json(reviewProgesses);
});

export const POST = auth(async (request: NextRequest) => {
  const req = request as NextRequest & { auth: Session };
  if (!req.auth.user?.email) {
    return new NextResponse(null, { status: 401 });
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
