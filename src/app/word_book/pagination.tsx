"use client";

import { Pagination } from "flowbite-react";
import { useSearchParams } from "next/navigation";

export function WordBookPagination({
  reviewProgressCount,
  pageSize,
  snapshotTime,
}: {
  snapshotTime: number;
  reviewProgressCount: number;
  pageSize: number;
}) {
  const searchParams = useSearchParams();
  const curretPageStr = searchParams.get("page");
  const currentPage = curretPageStr ? parseInt(curretPageStr) : 1;
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={Math.floor(reviewProgressCount / pageSize)}
      onPageChange={(page) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        params.set("fromPage", currentPage.toString());
        params.set(
          "snapshot",
          (snapshotTime || new Date().getTime()).toString(),
        );
        window.location.href = `?${params.toString()}`;
      }}
    />
  );
}
