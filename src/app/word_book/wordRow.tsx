"use client";

import { formatDistance } from "date-fns";
import { sv } from "date-fns/locale/sv";
import { TableCell, TableRow } from "flowbite-react";
import { PlayButton } from "../_components/PlayButton";
import { Lexeme, ReviewProgressAtSnapshot, Word } from "@/lib/types";
import { useEffect, useState } from "react";
import BlurElement from "./blurElement";
import { ReviewButton } from "./reviewButton";
import { DoneButton } from "./doneButton";
import { ResetButton } from "./resetButton";

function lexemePriority(lexeme: Lexeme) {
  return lexeme.source === "lexin-swe" ? 0 : 1;
}
export const REVIEW_DAYS_MAP: { [key: number]: number } = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 15,
  5: 30,
};

export function WordRow({
  reviewProgress,
  word,
}: {
  reviewProgress: ReviewProgressAtSnapshot;
  word: Word;
}) {
  const [currentReviewProgress, setCurrentReviewProgress] =
    useState(reviewProgress);
  const [nextReviewableTime, setNextReviewableTime] = useState<number | null>(
    reviewProgress.next_reviewable_time,
  );
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateInterval = () => {
      if (nextReviewableTime === null) return;

      const timeUntilNextReview = nextReviewableTime - now.getTime();

      if (timeUntilNextReview < 60 * 1000) {
        // Less than 1 minute, update every second
        intervalId = setInterval(() => setNow(new Date()), 1000);
      } else if (timeUntilNextReview < 60 * 60 * 1000) {
        // Less than 1 hour, update every minute
        intervalId = setInterval(() => setNow(new Date()), 60 * 1000);
      } else {
        // More than 1 hour, update every hour
        intervalId = setInterval(() => setNow(new Date()), 60 * 60 * 1000);
      }
    };

    updateInterval();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [nextReviewableTime, now]);
  const reviewCountColor = [
    "bg-red-500",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-500",
  ];
  const handleReview = (newReviewCount: number) => {
    const newCurrentReviewTime = new Date().getTime();

    let daysToAdd: number | null = null;
    if (newReviewCount in REVIEW_DAYS_MAP) {
      daysToAdd = REVIEW_DAYS_MAP[newReviewCount];
    } else if (6 in REVIEW_DAYS_MAP) {
      daysToAdd = null;
    }

    const newNextReviewTime = daysToAdd
      ? newCurrentReviewTime + daysToAdd * 24 * 60 * 60 * 1000
      : null;

    setCurrentReviewProgress({
      ...currentReviewProgress,
      review_count: newReviewCount,
    });
    setNextReviewableTime(newNextReviewTime);
    setNow(new Date());
  };

  const handleDone = () => {
    setCurrentReviewProgress({
      ...currentReviewProgress,
      review_count: 6,
    });
    setNextReviewableTime(null);
  };

  return (
    <TableRow key={reviewProgress.id}>
      <TableCell>{word.lemma}</TableCell>
      <TableCell>
        {nextReviewableTime === null
          ? "Done!"
          : nextReviewableTime < new Date().getTime()
            ? "Nu"
            : `I ${formatDistance(nextReviewableTime!, new Date(), { locale: sv })}`}
      </TableCell>
      <TableCell>
        <div className="flex flex-col-reverse items-center">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className={`w-3.5 h-0.5 rounded-sm m-px
                          ${
                            index < currentReviewProgress.review_count
                              ? reviewCountColor[index]
                              : "bg-gray-300"
                          }`}
            ></div>
          ))}
          <span>{currentReviewProgress.review_count}</span>
        </div>
      </TableCell>
      <TableCell>
        {word.lexemes
          .toSorted((a, b) => lexemePriority(a) - lexemePriority(b))
          .map((lexeme) => {
            return (
              <div key={lexeme.id}>
                <BlurElement>{lexeme.definition}</BlurElement>
                <div className="grid grid-cols-2">
                  <span className="text-sm text-green-500">
                    {lexeme.example ? lexeme.example : ""}
                  </span>
                  <BlurElement className="text-sm text-blue-500">
                    {lexeme.example_meaning ? lexeme.example_meaning : ""}
                  </BlurElement>
                </div>
              </div>
            );
          })}
      </TableCell>
      <TableCell>
        <PlayButton voice={word} />
      </TableCell>
      <TableCell>
        <ReviewButton
          review={currentReviewProgress}
          onClick={() => handleReview(currentReviewProgress.review_count + 1)}
        />
      </TableCell>
      <TableCell>
        {currentReviewProgress.review_count < 6 ? (
          <DoneButton review={currentReviewProgress} onClick={handleDone} />
        ) : (
          <ResetButton
            review={currentReviewProgress}
            onClick={() => handleReview(1)}
          />
        )}
      </TableCell>
    </TableRow>
  );
}
