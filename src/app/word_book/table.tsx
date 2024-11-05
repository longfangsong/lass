import { auth } from "@/lib/auth";
import {
  getReviewProgressesOfUser,
  PAGE_SIZE,
} from "@/lib/data/review_progress";
import { getWord } from "@/lib/data/word";
import { getDB } from "@/lib/db";
import { Table, TableBody, TableHead, TableHeadCell } from "flowbite-react";
import { redirect } from "next/navigation";
import { WordRow } from "./wordRow";

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
  const reviewProgresses = await getReviewProgressesOfUser(
    db,
    session.user.email,
    snapshot,
    (page - 1) * PAGE_SIZE,
    PAGE_SIZE,
  );
  release();
  const dataInTable = await Promise.all(
    reviewProgresses.map(async (reviewProgress) => {
      const [release, db] = await getDB();
      const word = await getWord(db, reviewProgress.word_id);
      release();
      return {
        reviewProgress,
        word: word!,
      };
    }),
  );
  return (
    <div className="max-w-full overflow-scroll">
      <Table striped className="overflow-scroll">
        <TableHead>
          <TableHeadCell className="w-0">Word</TableHeadCell>
          <TableHeadCell className="w-0">Next</TableHeadCell>
          <TableHeadCell className="w-0">Review</TableHeadCell>
          <TableHeadCell>Meaning</TableHeadCell>
          <TableHeadCell className="w-0">Play</TableHeadCell>
          <TableHeadCell className="w-0">Review</TableHeadCell>
          <TableHeadCell className="w-0">Done</TableHeadCell>
        </TableHead>
        <TableBody>
          {dataInTable.map(({ reviewProgress, word }) => (
            <WordRow
              key={reviewProgress.id}
              reviewProgress={reviewProgress}
              word={word}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
