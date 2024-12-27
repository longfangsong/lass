"use client";

import { PAGE_SIZE } from "@/lib/backend/data/review_progress";
import { Table, TableBody, TableHead, TableHeadCell } from "flowbite-react";
import { redirect } from "next/navigation";
import { WordRow } from "./wordRow";
import WordTableButtonsHeader from "./wordTableButtonsHeader";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ClientReviewProgressAtSnapshotWithWord } from "@/lib/types";

export default function WordTable({
  page,
  snapshot,
}: {
  page: number;
  snapshot: number;
}) {
  const { status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/api/auth/signin");
    }
  }, [status]);
  const [dataInTable, setDataInTable] = useState<
    Array<ClientReviewProgressAtSnapshotWithWord>
  >([]);
  useEffect(() => {
    (async () => {
      const { localFirstDataSource } = await import(
        "@/lib/frontend/datasource/localFirst"
      );
      const data =
        await localFirstDataSource.getReviewProgressAtSnapshotWithWord(
          snapshot,
          (page - 1) * PAGE_SIZE,
          PAGE_SIZE
        );
      setDataInTable(data);
    })();
  }, []);
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
