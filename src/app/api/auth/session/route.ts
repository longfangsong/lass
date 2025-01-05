import { auth, isSuccess } from "@/lib/backend/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const authResult = await auth(request);
  if (isSuccess(authResult)) {
    return NextResponse.json(authResult);
  }
  return NextResponse.json(authResult, { status: 401 });
}
