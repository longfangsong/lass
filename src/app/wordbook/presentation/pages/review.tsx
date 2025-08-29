import type { WordBookEntryWithDetails } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { getWordBookEntryDetail } from "../../application/getDetails";
import { repository, wordTable } from "../../infrastructure/repository";
import { startPassiveReviewProgress } from "../../application/startReview";
import { getPicker } from "../../application/autoReview";
import { AutoNewReviewPolicy } from "@/types";
import { ChartByCount } from "../components/chartByCount";
import { ChartByDate } from "../components/chartByDate";
import SentenceConstructionCard from "../components/SentenceConstructionCard";
import WordCard from "../components/wordCard";
import { useSyncWordbook } from "../hooks/sync";

export default function Review() {
  const syncWordbook = useSyncWordbook();
  const [toReviewPassive, setToReviewPassive] = useState<
    Array<WordBookEntryWithDetails>
  >([]);
  const [toReviewActive, setToReviewActive] = useState<
    Array<WordBookEntryWithDetails>
  >([]);
  const [reviewMode, setReviewMode] = useState<
    "loading" | "passive" | "active" | "done"
  >("loading");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const passiveEntries = await repository.needPassiveReviewNow();
      let passiveDetails = await Promise.all(
        passiveEntries.map((entry) => getWordBookEntryDetail(entry)),
      );

      const activeEntries = await repository.needActiveReviewNow();
      const activeDetails = await Promise.all(
        activeEntries.map((entry) => getWordBookEntryDetail(entry)),
      );

      // Auto-start new passive reviews if needed (K=20)
      const K = 20;
      const currentTotalReviews = passiveDetails.length + activeDetails.length;
      
      if (currentTotalReviews < K) {
        const needToStart = K - currentTotalReviews;
        const notStartedEntries = await repository.reviewNotStarted();
        
        if (notStartedEntries.length > 0) {
          // Create bulk word getter for mostFrequent picker
          const bulkGetWord = async (ids: Array<string>) => {
            return await wordTable.bulkGet(ids);
          };
          
          // Use mostFrequent policy to pick new entries to start
          const picker = getPicker(bulkGetWord)(AutoNewReviewPolicy.MostFrequent);
          const toStart = await picker(notStartedEntries, needToStart);
          
          // Start passive review for selected entries
          await Promise.all(
            toStart.map(entry => startPassiveReviewProgress(repository, entry))
          );
          
          // Get details for newly started reviews and add to passive list
          const newDetails = await Promise.all(
            toStart.map((entry) => getWordBookEntryDetail(entry)),
          );
          passiveDetails = [...passiveDetails, ...newDetails];
        }
      }

      setToReviewPassive(passiveDetails);
      setToReviewActive(activeDetails);

      if (passiveDetails.length > 0) {
        setReviewMode("passive");
      } else if (activeDetails.length > 0) {
        setReviewMode("active");
      } else {
        console.log("Done");
        setReviewMode("done");
      }
    })();
  }, []);

  // Sync wordbook when component unmounts
  useEffect(() => {
    return syncWordbook;
  }, [syncWordbook]);

  const handleDone = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (reviewMode === "passive") {
      if (nextIndex < toReviewPassive.length) {
        setCurrentIndex(nextIndex);
      } else {
        setCurrentIndex(0);
        setReviewMode(toReviewActive.length > 0 ? "active" : "done");
      }
    } else if (reviewMode === "active") {
      if (nextIndex < toReviewActive.length) {
        setCurrentIndex(nextIndex);
      } else {
        setReviewMode("done");
      }
    }
  }, [currentIndex, reviewMode, toReviewActive, toReviewPassive]);

  if (reviewMode === "loading") {
    return <div>Loading reviews...</div>; // Or a spinner component
  }

  if (reviewMode === "passive" && currentIndex < toReviewPassive.length) {
    return (
      <div className="w-full">
        <WordCard entry={toReviewPassive[currentIndex]} onDone={handleDone} />
      </div>
    );
  }

  if (reviewMode === "active" && currentIndex < toReviewActive.length) {
    return (
      <div className="w-full">
        <SentenceConstructionCard
          entry={toReviewActive[currentIndex]}
          onDone={handleDone}
        />
      </div>
    );
  }

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
