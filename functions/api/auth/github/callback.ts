import * as jose from "jose";
import * as cookie from "cookie";
import { hoursToSeconds } from "date-fns";

export const runtime = "edge";

export async function onRequestGet(
  context: EventContext<CloudflareEnv, string, unknown>
) {
  const cookies = cookie.parse(context.request.headers.get("cookie") || "");
  const authStateInCookie = cookies.auth_state;
  const authStateInUrl = new URL(context.request.url).searchParams.get("state");
  const clearStateCookie = cookie.serialize("auth_state", "", {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 0,
  });
  if (authStateInCookie !== authStateInUrl) {
    // csrf attack detected
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: context.env.CF_PAGES_URL,
        "Set-Cookie": clearStateCookie,
      },
    });
    return response;
  }

  const code = new URL(context.request.url).searchParams.get("code");

  const params = new URLSearchParams({
    client_id: context.env.AUTH_GITHUB_ID,
    client_secret: context.env.AUTH_GITHUB_SECRET,
    code: code!,
  });
  const tokenResponse = await fetch(
    `https://github.com/login/oauth/access_token?${params}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const tokenResponseJSON: { access_token: string } =
    await tokenResponse.json();
  const accessToken = tokenResponseJSON.access_token;

  const userInfoResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "lass",
    },
  });

  const result: { email: string } = await userInfoResponse.json();
  const secret = new TextEncoder().encode(context.env.AUTH_SECRET);
  const jwt = await new jose.SignJWT({ email: result.email })
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
      Location: context.env.CF_PAGES_URL,
    },
  });
  response.headers.set("Set-Cookie", authTokenCookie);
  response.headers.append("Set-Cookie", clearStateCookie);
  return response;
}
