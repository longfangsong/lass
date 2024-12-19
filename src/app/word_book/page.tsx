import { auth } from "@/lib/auth";
import { getReviewProgressesOfUserCount } from "@/lib/backend/data/review_progress";
import { redirect } from "next/navigation";
import { WordBookPagination } from "./pagination";
import WordTable from "./table";
import { getDB } from "@/lib/backend/db";

export const runtime = "edge";

export default async function WordBook({
  searchParams,
}: {
  searchParams?: { page?: number; fromPage?: string; snapshot?: number };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  const [release, db] = await getDB();
  const reviewProgressCount = await getReviewProgressesOfUserCount(
    db,
    session.user.email,
  );
  release();
  return (
    <div>
      <WordTable
        page={searchParams?.page || 1}
        snapshot={searchParams?.snapshot || new Date().getTime()}
      />
      <WordBookPagination
        reviewProgressCount={reviewProgressCount}
        snapshotTime={searchParams?.snapshot || new Date().getTime()}
      />
    </div>
  );
}
