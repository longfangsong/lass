import type { WordBookEntryWithDetails } from "@/types";
import { useEffect, useState } from "react";
import { getWordBookEntryDetail } from "../../application/getDetails";
import { repository } from "../../infrastructure/repository";
import { ChartByCount } from "../components/chartByCount";
import { ChartByDate } from "../components/chartByDate";
import WordCard from "../components/wordCard";
import { useSyncWordbook } from "../hooks/sync";

export default function Review() {
  const syncWordbook = useSyncWordbook();
  const [toReview, setToReview] = useState<Array<WordBookEntryWithDetails>>([]);
  useEffect(() => {
    (async () => {
      const entries = await repository.needReviewNow();
      const withDetails = await Promise.all(
        entries.map((entry) => getWordBookEntryDetail(entry)),
      );
      setToReview(withDetails);
    })();
  }, []);

  // Sync wordbook when component unmounts
  useEffect(() => {
    return syncWordbook;
  }, [syncWordbook]);

  const [currentIndex, setCurrentIndex] = useState(0);
  if (toReview.length > 0 && currentIndex < toReview.length) {
    return (
      <div className="w-full">
        <WordCard
          entry={toReview[currentIndex]}
          onDone={() => {
            setCurrentIndex(currentIndex + 1);
          }}
        />
      </div>
    );
  } else {
    return (
      <>
        <h1 className="scroll-m-20 text-center text-4xl font-bold tracking-tight text-balance">
          No words to review now!
        </h1>
        <p className="text-center">Relax and check your progress here.</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartByCount />
          <ChartByDate />
        </div>
      </>
    );
  }
}
