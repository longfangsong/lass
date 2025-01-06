import { isSuccess } from "@/lib/backend/auth";
import { auth } from "@/lib/backend/auth";
import { updateReviewProgress } from "@/lib/backend/review_progress";
import { ReviewProgressPatchPayload } from "@/lib/types";

export async function onRequestPatch(context: EventContext<CloudflareEnv, string, unknown>) {
  const authResult = await auth(context.request, context.env.AUTH_SECRET);
  if (!isSuccess(authResult)) {
    return new Response(null, { status: 401 });
  }
  const id = context.params.id as string;
  const payload = await context.request.json<ReviewProgressPatchPayload>();
  await updateReviewProgress(context.env.DB, id, payload);
  return Response.json(null);
};
