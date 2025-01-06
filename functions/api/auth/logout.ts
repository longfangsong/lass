import * as cookie from "cookie";

export const runtime = "edge";

export async function onRequestGet() {
  const cookieStr = cookie.serialize("auth_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  const response = new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": cookieStr,
    },
  });

  return response;
}
