import { NextRequest } from "next/server";
import * as jose from "jose";

export interface User {
  email: string;
}

export function isSuccess(response: User | { error: string }): response is User {
  return "email" in response;
}

export async function auth(
  request: NextRequest
): Promise<User | { error: string }> {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  try {
    const authToken = request.cookies.get("auth_token")?.value;

    if (!authToken) {
      return { error: "No auth token" };
    }

    const { payload } = await jose.jwtVerify(authToken, secret);
    return {
      email: payload.email as string,
    };
  } catch {
    return {
      error: "Invalid token",
    };
  }
}
