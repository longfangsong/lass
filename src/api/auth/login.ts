import * as cookie from "cookie";
import { minutesToSeconds } from "date-fns";
import { getProvider } from "./provider";
import type { RouterContext } from "../router";

export async function get({ env, params }: RouterContext) {
  const providerName = params.provider;
  const provider = getProvider(env, providerName);

  if (!provider) {
    return new Response("Provider not found", { status: 404 });
  }
  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
  const encoder = new TextEncoder();
  const codeVerifierBuffer = encoder.encode(codeVerifier);
  const codeChallenge = btoa(
    String.fromCharCode(
      ...new Uint8Array(
        await crypto.subtle.digest("SHA-256", codeVerifierBuffer),
      ),
    ),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const redirect_uri = `${env.CF_PAGES_URL}/auth/callback/${providerName}`;
  const urlParams = new URLSearchParams({
    client_id: provider.client_id,
    redirect_uri: redirect_uri,
    response_type: "code",
    scope: provider.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const stateCookie = cookie.serialize("auth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: minutesToSeconds(5),
  });

  const verifierCookie = cookie.serialize("code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: minutesToSeconds(5),
  });

  const authUrl = `${provider.auth_url}?${urlParams}`;

  const response = new Response(null, {
    status: 302,
    headers: new Headers({
      Location: authUrl,
    }),
  });
  response.headers.append("Set-Cookie", stateCookie);
  response.headers.append("Set-Cookie", verifierCookie);

  return response;
}
