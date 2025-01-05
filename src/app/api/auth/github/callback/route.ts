import { NextResponse, type NextRequest } from "next/server";
import * as jose from 'jose';

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const authStateInCookie = request.cookies.get('auth_state')?.value;
  const authStateInUrl = request.nextUrl.searchParams.get('state');
  if (authStateInCookie !== authStateInUrl) {
    // csrf attack detected
    const response = NextResponse.redirect(`${process.env.CF_PAGES_URL}/`);
    response.cookies.delete('auth_state');
    return response;
  }
  const code = request.nextUrl.searchParams.get('code');

  const params = new URLSearchParams({
    client_id: process.env.AUTH_GITHUB_ID!,
    client_secret: process.env.AUTH_GITHUB_SECRET!,
    code: code!
  });
  const tokenResponse = await fetch(
    `https://github.com/login/oauth/access_token?${params}`,
    {
      method: "POST", 
      headers: {
        Accept: "application/json",
      },
    },
  );
  
  const tokenResponseJSON: { access_token: string } = await tokenResponse.json();
  const accessToken = tokenResponseJSON.access_token;
  
  const userInfoResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "lass",
    },
  });

  const result: { email: string } = await userInfoResponse.json();
  
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET
  );

  const jwt = await new jose.SignJWT({ email: result.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  const response = NextResponse.redirect(`${process.env.CF_PAGES_URL}/`);
  response.cookies.set('auth_token', jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60
  });
  response.cookies.delete('auth_state');
  return response;
}
