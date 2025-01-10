import { PAGE_SIZE } from "@/lib/backend/review_progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { useEffect, useState } from "react";
import { ClientReviewProgressAtSnapshotWithWord } from "@/lib/types";
import { useAuth } from "../hooks/useAuth";
import { redirect } from "react-router";
import WordTableButtonsHeader from "./WordTableButtonsHeader";
import { WordRow } from "./WordRow";
import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";

function Skeleton() {
  return (
    <div role="status" className="max-w-sm animate-pulse">
      <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function WordTable({
  page,
  snapshot,
}: {
  page: number;
  snapshot: number;
}) {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) {
      redirect("/auth/login");
    }
  }, [loading, user]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataInTable, setDataInTable] = useState<
    Array<ClientReviewProgressAtSnapshotWithWord>
  >([]);
  useEffect(() => {
    (async () => {
      const data =
        await localFirstDataSource.getReviewProgressAtSnapshotWithWord(
          snapshot,
          (page - 1) * PAGE_SIZE,
          PAGE_SIZE
        );
      setDataInTable(data);
      setLoadingData(false);
    })();
  }, [page, snapshot]);
  return (
    <div className="max-w-full overflow-scroll">
      <Table striped className="overflow-scroll">
        <TableHead>
          <TableHeadCell className="w-0 px-0 text-center">Word</TableHeadCell>
          <TableHeadCell className="w-0 px-0 text-center">Next</TableHeadCell>
          <TableHeadCell className="w-0 px-0 text-center">Review</TableHeadCell>
          <TableHeadCell className="px-0 text-center">Meaning</TableHeadCell>
          <WordTableButtonsHeader />
        </TableHead>
        <TableBody>
          {loadingData ? <Skeleton /> : (
            dataInTable.map((reviewProgressWithWord) => (
              <WordRow
                key={reviewProgressWithWord.id}
                reviewProgressWithWord={reviewProgressWithWord}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
