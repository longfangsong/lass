import { needReviewNow } from "@/app/domain/repository/wordbook";
import { useEffect, useState } from "react";
import WordCard from "../../components/wordbook/wordCard";
import type { WordBookEntryWithDetails } from "@/types";

export default function Review() {
  const [toReview, setToReview] = useState<Array<WordBookEntryWithDetails>>([]);
  useEffect(() => {
    (async () => {
      const entries = await needReviewNow();
      setToReview(entries);
    })();
  }, []);
  const [currentIndex, setCurrentIndex] = useState(0);
  return (
    <div>
      {toReview.length > 0 && currentIndex < toReview.length ? (
        <div className="w-full">
          <WordCard
            entry={toReview[currentIndex]}
            onDone={() => {
              setCurrentIndex(currentIndex + 1);
            }}
          />
        </div>
      ) : (
        <p>No words to review</p>
      )}
    </div>
  );
}
