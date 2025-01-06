import * as cookie from 'cookie';
import { minutesToSeconds } from 'date-fns';

export const runtime = "edge";

export async function onRequestGet(context: EventContext<CloudflareEnv, string, unknown>) {
  const state = crypto.randomUUID();
  // note: github does not support pkce
  const redirect_uri = `${context.env.CF_PAGES_URL}/auth/callback/github`;

  const params = new URLSearchParams({
    client_id: context.env.AUTH_GITHUB_ID,
    redirect_uri: redirect_uri,
    response_type: 'code',
    scope: 'user:email read:user',
    state: state
  });

  const cookieStr = cookie.serialize('auth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: minutesToSeconds(5),
  });


  const response = new Response(null, {
    status: 302,
    headers: {
      'Location': `https://github.com/login/oauth/authorize?${params}`,
      'Set-Cookie': cookieStr
    }
  });
  return response;
}
