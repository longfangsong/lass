import * as jose from "jose";
import * as cookie from "cookie";
import { hoursToSeconds } from "date-fns";
import { getProvider } from "./provider";
import type { RouterContext } from "../router";

export async function get({ env, params, request }: RouterContext) {
  const providerName = params.provider;
  const provider = getProvider(env, providerName);

  if (!provider) {
    return new Response("Provider not found", { status: 404 });
  }

  const cookies = cookie.parse(request.headers.get("cookie") || "");
  const authStateInCookie = cookies.auth_state;
  const codeVerifier = cookies.code_verifier;
  const authStateInUrl = new URL(request.url).searchParams.get("state");

  const clearCookies = [
    cookie.serialize("auth_state", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 0,
    }),
    cookie.serialize("code_verifier", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 0,
    }),
  ];

  if (authStateInCookie !== authStateInUrl) {
    const response = new Response(null, {
      status: 302,
      headers: new Headers({
        Location: env.CF_PAGES_URL,
      }),
    });
    clearCookies.forEach((cookie) => {
      response.headers.append("Set-Cookie", cookie);
    });
    return response;
  }

  const code = new URL(request.url).searchParams.get("code");
  const redirect_uri = `${env.CF_PAGES_URL}/auth/callback/${providerName}`;

  // Get access token
  const tokenParams = new URLSearchParams({
    client_id: provider.client_id,
    client_secret: provider.client_secret,
    code: code!,
    grant_type: "authorization_code",
    redirect_uri: redirect_uri,
    code_verifier: codeVerifier!,
  });

  const tokenResponse = await fetch(`${provider.token_url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: tokenParams,
  });

  // Type definitions
  interface TokenResponse {
    access_token: string;
  }

  const tokenData = (await tokenResponse.json()) as TokenResponse;
  const accessToken = tokenData.access_token;

  // Get user information
  const userInfoResponse = await fetch(provider.user_info_uri, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "lass",
    },
  });

  const userData = (await userInfoResponse.json()) as { email: string };
  const email = userData.email;

  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  const jwt = await new jose.SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  const authTokenCookie = cookie.serialize("auth_token", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: hoursToSeconds(24),
  });

  const response = new Response(null, {
    status: 302,
    headers: {
      Location: env.CF_PAGES_URL,
    },
  });
  response.headers.set("Set-Cookie", authTokenCookie);
  clearCookies.forEach((cookie) => {
    response.headers.append("Set-Cookie", cookie);
  });
  return response;
}
