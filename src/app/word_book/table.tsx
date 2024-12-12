import { auth } from "@/lib/auth";
import {
  getReviewProgressAtSnapshotWithWord,
  getReviewProgressesAtSnapshot,
  PAGE_SIZE,
} from "@/lib/data/review_progress";
import { getWords } from "@/lib/data/word";
import { getDB } from "@/lib/db";
import { Table, TableBody, TableHead, TableHeadCell } from "flowbite-react";
import { redirect } from "next/navigation";
import { WordRow } from "./wordRow";
import WordTableButtonsHeader from "./wordTableButtonsHeader";

export default async function WordTable({
  page,
  snapshot,
}: {
  page: number;
  snapshot: number;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }
  const [release, db] = await getDB();
  const dataInTable = await getReviewProgressAtSnapshotWithWord(
    db,
    session.user.email,
    snapshot,
    (page - 1) * PAGE_SIZE,
    PAGE_SIZE,
  );
  release();
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
