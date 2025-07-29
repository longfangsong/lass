import { useEffect, useState } from "react";
import WordCard from "../../components/wordbook/wordCard";
import type { WordBookEntryWithDetails } from "@app/types";
import { ChartByCount } from "../../components/wordbook/chartByCount";
import { ChartByDate } from "../../components/wordbook/chartByDate";
import { repository } from "@/app/domain/repository/wordbookEntry";
import { getWordBookEntryDetail } from "@/app/application/usecase/wordbook/getDetails";

export default function Review() {
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
