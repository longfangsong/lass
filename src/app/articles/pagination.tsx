"use client";

import { PAGE_SIZE } from "@/lib/backend/review_progress";
import { Pagination } from "flowbite-react";
import { useSearchParams } from "next/navigation";

export function ArticlesPagination({ count }: { count: number }) {
  const searchParams = useSearchParams();
  const curretPageStr = searchParams.get("page");
  const currentPage = curretPageStr ? parseInt(curretPageStr) : 1;
  return (
    <div className="flex justify-center">
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(count / PAGE_SIZE)}
        onPageChange={(page) => {
          const params = new URLSearchParams(searchParams);
          params.set("page", page.toString());
          window.location.href = `?${params.toString()}`;
        }}
      />
    </div>
  );
}
