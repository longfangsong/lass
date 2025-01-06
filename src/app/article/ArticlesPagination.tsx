import { PAGE_SIZE } from "@/lib/backend/review_progress";
import { Pagination } from "flowbite-react";
import { useSearchParams, useNavigate } from "react-router";

export function ArticlesPagination({ count }: { count: number }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentPage = parseInt(searchParams.get("page") || "1");

  return (
    <div className="flex justify-center">
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(count / PAGE_SIZE)}
        onPageChange={(page) => {
          const params = new URLSearchParams(searchParams);
          params.set("page", page.toString());
          navigate(`?${params.toString()}`);
        }}
      />
    </div>
  );
}
