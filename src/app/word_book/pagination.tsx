"use client";

import { PAGE_SIZE } from "@/lib/data/review_progress";
import { Pagination } from "flowbite-react";
import { useSearchParams } from "next/navigation";

export function WordBookPagination({
  reviewProgressCount,
  snapshotTime,
}: {
  snapshotTime: number;
  reviewProgressCount: number;
}) {
  const searchParams = useSearchParams();
  const curretPageStr = searchParams.get("page");
  const currentPage = curretPageStr ? parseInt(curretPageStr) : 1;
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={Math.ceil(reviewProgressCount / PAGE_SIZE)}
      onPageChange={(page) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        params.set("fromPage", currentPage.toString());
        params.set("snapshot", snapshotTime.toString());
        window.location.href = `?${params.toString()}`;
      }}
    />
  );
}
