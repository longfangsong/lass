import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "edge";


export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();
  // note: github does not support pkce
  const { AUTH_GITHUB_ID, CF_PAGES_URL } = getRequestContext().env;
  const redirect_uri = `${CF_PAGES_URL}/auth/callback/github`;

  const params = new URLSearchParams({
    client_id: AUTH_GITHUB_ID,
    redirect_uri: redirect_uri,
    response_type: 'code',
    scope: 'user:email read:user',
    state: state
  });
  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
  response.cookies.set('auth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });
  return response;
}
