import * as jose from "jose";
import * as cookie from "cookie";

export interface User {
  email: string;
}

export function isSuccess(response: User | { error: string }): response is User {
  return "email" in response;
}

export async function auth(
  request: Request,
  secretString: string
): Promise<User | { error: string }> {
  const secret = new TextEncoder().encode(secretString);
  try {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const authToken = cookies.auth_token;

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
