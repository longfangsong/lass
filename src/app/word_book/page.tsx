import { auth } from "@/lib/auth";
import { getReviewProgressesOfUserCount } from "@/lib/data/review_progress";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { Pagination } from "flowbite-react";
import { redirect } from "next/navigation";
import { WordBookPagination } from "./pagination";

export const runtime = "edge";
export default async function WordBook({
  searchParams,
}: {
  searchParams?: { page?: number; fromPage?: string; snapshot?: string };
}) {
  const db = getRequestContext().env.DB;
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  const reviewProgressCount = await getReviewProgressesOfUserCount(
    db,
    session.user.email,
  );
  return (
    <WordBookPagination
      reviewProgressCount={reviewProgressCount}
      pageSize={10}
      snapshotTime={0}
    />
  );
}
