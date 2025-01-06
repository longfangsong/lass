import { isSuccess, User } from "@/lib/backend/auth";
import { auth } from "@/lib/backend/auth";
import {
  createReviewProgess,
  getReviewProgressAtSnapshotWithWord,
  getReviewProgressByWord,
  getReviewProgressesOfUserCount,
} from "@/lib/backend/review_progress";

export async function onRequestHead(context: EventContext<CloudflareEnv, string, unknown>) {
  const authResult = await auth(context.request, context.env.AUTH_SECRET);
  if (!isSuccess(authResult)) {
    return new Response(null, { status: 401 });
  }
  const count = await getReviewProgressesOfUserCount(context.env.DB, authResult.email);
  return new Response(null, {
    headers: {
      "X-Total-Count": count.toString(),
    },
  });
}

export async function onRequestGet(context: EventContext<CloudflareEnv, string, unknown>) {
  const authResult = await auth(context.request, context.env.AUTH_SECRET);
  if (!isSuccess(authResult)) {
    return new Response(null, { status: 401 });
  }
  return await getBySnapshot(context.request, authResult, context.env);
}

export async function onRequestPost(context: EventContext<CloudflareEnv, string, unknown>) {
  const authResult = await auth(context.request, context.env.AUTH_SECRET);
  if (!isSuccess(authResult)) {
    return new Response(null, { status: 401 });
  }
  const payload = await context.request.json<{ word_id: string }>();
  const existing = await getReviewProgressByWord(
    context.env.DB,
    authResult.email,
    payload.word_id,
  );
  if (existing) {
    return Response.json(existing, {
      status: 409,
    });
  }
  const id = await createReviewProgess(
    context.env.DB,
    authResult.email,
    payload.word_id,
  );
  return Response.json(id);
};

async function getBySnapshot(request: Request, authResult: User, env: CloudflareEnv) {
  const url = new URL(request.url);
  const snapshotTimeString = url.searchParams.get("snapshot_time");
  const snapshotTime = snapshotTimeString
    ? parseInt(snapshotTimeString)
    : new Date().getTime();
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const [count, reviewProgesses] = await Promise.all([
    getReviewProgressesOfUserCount(env.DB, authResult.email),
    getReviewProgressAtSnapshotWithWord(
      env.DB,
      authResult.email,
      snapshotTime,
      offset,
      limit,
    ),
  ]);
  const response = Response.json(reviewProgesses);
  response.headers.set("X-Total-Count", count.toString());
  return response;
}
