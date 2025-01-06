import { auth, isSuccess } from "@/lib/backend/auth";

export async function onRequestGet(context: EventContext<CloudflareEnv, string, unknown>) {
  const authResult = await auth(context.request, context.env.AUTH_SECRET);
  if (isSuccess(authResult)) {
    return new Response(JSON.stringify(authResult), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  return new Response(JSON.stringify(authResult), {
    status: 401,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
