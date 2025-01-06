import { PAGE_SIZE } from "@/lib/backend/review_progress";
import { Table, TableBody, TableHead, TableHeadCell } from "flowbite-react";
import { useEffect, useState } from "react";
import { ClientReviewProgressAtSnapshotWithWord } from "@/lib/types";
import { useAuth } from "../hooks/useAuth";
import { redirect } from "react-router";
import WordTableButtonsHeader from "./WordTableButtonsHeader";
import { WordRow } from "./WordRow";
import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";

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
          {dataInTable.map((reviewProgressWithWord) => (
            <WordRow
              key={reviewProgressWithWord.id}
              reviewProgressWithWord={reviewProgressWithWord}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
