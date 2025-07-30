import * as jose from "jose";
import * as cookie from "cookie";
import type { RouterContext } from "../router";

interface SessionData {
  email: string;
}

interface ErrorResponse {
  error: string;
}

export async function get({ env, request }: RouterContext): Promise<Response> {
  try {
    // Parse cookies from request
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const authToken = cookies.auth_token;

    // Check if auth token exists
    if (!authToken) {
      return new Response(
        JSON.stringify({
          error: "No authentication token found",
        } as ErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Verify and decode JWT
    const secret = new TextEncoder().encode(env.AUTH_SECRET);
    const { payload } = await jose.jwtVerify(authToken, secret);

    // Extract email from payload
    const email = payload.email as string;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Invalid token payload" } as ErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Return session data
    return new Response(JSON.stringify({ email } as SessionData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof jose.errors.JWTExpired) {
      return new Response(
        JSON.stringify({ error: "Token has expired" } as ErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (error instanceof jose.errors.JWTInvalid) {
      return new Response(
        JSON.stringify({ error: "Invalid token" } as ErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Handle other errors
    // Log error for debugging (in production, consider using a proper logging service)
    // console.error("Session verification error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication failed" } as ErrorResponse),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
