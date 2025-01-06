import * as jose from "jose";
import * as cookie from "cookie";
import { hoursToSeconds } from "date-fns";

export const runtime = "edge";

export async function onRequestGet(
  context: EventContext<CloudflareEnv, string, unknown>
) {
  const cookies = cookie.parse(context.request.headers.get("cookie") || "");
  const authStateInCookie = cookies.auth_state;
  const codeVerifier = cookies.code_verifier;
  const authStateInUrl = new URL(context.request.url).searchParams.get("state");

  const clearCookies = [
    cookie.serialize('auth_state', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 0,
    }),
    cookie.serialize('code_verifier', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 0,
    })
  ];

  if (authStateInCookie !== authStateInUrl) {
    const response = new Response(null, {
      status: 302,
      headers: new Headers({
        Location: context.env.CF_PAGES_URL,
      })
    });
    clearCookies.forEach(cookie => {
      response.headers.append('Set-Cookie', cookie);
    });
    return response;
  }

  const code = new URL(context.request.url).searchParams.get("code");
  const redirect_uri = `${context.env.CF_PAGES_URL}/auth/callback/google`;

  // 获取访问令牌
  const tokenParams = new URLSearchParams({
    client_id: context.env.AUTH_GOOGLE_ID,
    client_secret: context.env.AUTH_GOOGLE_SECRET,
    code: code!,
    grant_type: 'authorization_code',
    redirect_uri: redirect_uri,
    code_verifier: codeVerifier!,
  });

  const tokenResponse = await fetch(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    }
  );

  // 添加类型定义
  interface TokenResponse {
    access_token: string;
  }

  interface UserData {
    email: string;
  }

  const tokenData = await tokenResponse.json() as TokenResponse;
  const accessToken = tokenData.access_token;

  // 获取用户信息
  const userInfoResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const userData = await userInfoResponse.json() as UserData;
  const secret = new TextEncoder().encode(context.env.AUTH_SECRET);
  const jwt = await new jose.SignJWT({ email: userData.email })
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
  clearCookies.forEach(cookie => {
    response.headers.append("Set-Cookie", cookie);
  });
  return response;
} 