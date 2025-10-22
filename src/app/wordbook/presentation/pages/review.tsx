import { useEffect, useState } from "react";
import { ChartByCount } from "../components/chartByCount";
import { ChartByDate } from "../components/chartByDate";
import SentenceConstructionCard from "../components/sentenceConstructionCard";
import WordCard from "../components/wordCard";

import { useNewReviewWordsSession } from "../hooks";
import type { ToReview } from "../../application/reviewWordsSession";
import { Skeleton } from "@/app/shared/presentation/components/ui/skeleton";
import { Card } from "@/app/shared/presentation/components/ui/card";

export default function Review() {
  const [loading, setLoading] = useState(true);
  const [itemToReview, setItemToReview] = useState<ToReview | null>(null);
  const session = useNewReviewWordsSession();
  
  useEffect(() => {
    (async () => {
      if (session) {
        const item = await session.next();
        setItemToReview(item);
        setLoading(false);
      }
    })();
  }, [session]);

  if (loading || !session) {
    return <div className="w-full">
      <Card className="max-w-172 mx-auto">
        <Skeleton className="h-4 w-[250px]" />
      </Card>
    </div>;
  } else if (!itemToReview) {
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
  } else if (itemToReview.mode === "passive") {
    return (
      <div className="w-full">
        <WordCard entry={itemToReview.entry} onDone={async () => {
          const nextItem = await session.next();
          setItemToReview(nextItem);
        }} />
      </div>
    );
  } else if (itemToReview.mode === "active") {
    return (
      <div className="w-full">
        <SentenceConstructionCard entry={itemToReview.entry} onDone={async () => {
          const nextItem = await session.next();
          setItemToReview(nextItem);
        }} />
      </div>
    );
  }
}
