"use client";

import { redirect } from "next/navigation";
import { WordBookPagination } from "./pagination";
import WordTable from "./table";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export const runtime = "edge";

export default function WordBook({
  searchParams,
}: {
  searchParams?: { page?: number; fromPage?: string; snapshot?: number };
}) {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/api/auth/signin");
    }
  }, [status]);

  const [reviewProgressCount, setReviewProgressCount] = useState(0);
  useEffect(() => {
    (async () => {
      const { localFirstDataSource } = await import(
        "@/lib/datasource/localFirst"
      );
      const count = await localFirstDataSource.getReviewProgressCount();
      setReviewProgressCount(count);
    })();
  });
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
