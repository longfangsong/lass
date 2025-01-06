import * as cookie from 'cookie';
import { minutesToSeconds } from 'date-fns';

export const runtime = "edge";

export async function onRequestGet(context: EventContext<CloudflareEnv, string, unknown>) {
  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
  const encoder = new TextEncoder();
  const codeVerifierBuffer = encoder.encode(codeVerifier);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', codeVerifierBuffer))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const redirect_uri = `${context.env.CF_PAGES_URL}/auth/callback/google`;

  const params = new URLSearchParams({
    client_id: context.env.AUTH_GOOGLE_ID,
    redirect_uri: redirect_uri,
    response_type: 'code',
    scope: 'email profile',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const stateCookie = cookie.serialize('auth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: minutesToSeconds(5),
  });

  const verifierCookie = cookie.serialize('code_verifier', codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: minutesToSeconds(5),
  });

  const response = new Response(null, {
    status: 302,
    headers: new Headers({
      'Location': `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    })
  });
  
  response.headers.append('Set-Cookie', stateCookie);
  response.headers.append('Set-Cookie', verifierCookie);
  return response;
} 