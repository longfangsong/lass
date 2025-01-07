import {
  formatDistance,
  hoursToMilliseconds,
  minutesToMilliseconds,
  secondsToMilliseconds,
} from "date-fns";
import { sv } from "date-fns/locale/sv";
import { Button, TableCell, TableRow } from "flowbite-react";
import { ClientReviewProgressAtSnapshotWithWord, Lexeme } from "@/lib/types";
import { useEffect, useState } from "react";
import { useWindowSize } from "@uidotdev/usehooks";
import { millisecondsInDay } from "date-fns/constants";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import BlurElement from "./BlurElement";
import DoneButton from "./DoneButton";
import PlayButton from "../components/PlayButton";
import ResetButton from "./ResetButton";
import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";

async function updateWordReview(review: ClientReviewProgressAtSnapshotWithWord) {
  const now = new Date();
  review.review_count += 1;
  review.last_last_review_time = review.last_review_time;
  review.last_review_time = now.getTime();
  review.update_time = now.getTime();
  await localFirstDataSource.updateReviewProgress(review);
}

function lexemePriority(lexeme: Lexeme) {
  return lexeme.source === "lexin-swe" ? 0 : 1;
}

const REVIEW_GAP_DAYS = [0, 1, 3, 7, 15, 30];

export function Controls({ buttons }: { buttons: Array<React.ReactElement> }) {
  const { width } = useWindowSize();
  if (!width || width < 640) {
    return (
      <TableCell>
        <div className="flex flex-col gap-2 my-auto">{buttons}</div>
      </TableCell>
    );
  } else {
    return (
      <>
        {buttons.map((it: React.ReactElement, index) => (
          <TableCell className="px-0" key={index}>
            {it}
          </TableCell>
        ))}
      </>
    );
  }
}

export function WordRow({
  reviewProgressWithWord,
}: {
  reviewProgressWithWord: ClientReviewProgressAtSnapshotWithWord;
}) {
  const [currentReviewProgress, setCurrentReviewProgress] = useState(
    reviewProgressWithWord
  );
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateInterval = () => {
      if (currentReviewProgress.next_reviewable_time === null) return;

      const timeUntilNextReview =
        currentReviewProgress.next_reviewable_time - now.getTime();

      if (timeUntilNextReview < minutesToMilliseconds(1)) {
        // Less than 1 minute, update every second
        intervalId = setInterval(
          () => setNow(new Date()),
          secondsToMilliseconds(1)
        );
      } else if (timeUntilNextReview < hoursToMilliseconds(1)) {
        // Less than 1 hour, update every minute
        intervalId = setInterval(
          () => setNow(new Date()),
          minutesToMilliseconds(1)
        );
      } else {
        // More than 1 hour, update every hour
        intervalId = setInterval(
          () => setNow(new Date()),
          hoursToMilliseconds(1)
        );
      }
    };

    updateInterval();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentReviewProgress, now]);
  const reviewCountColor = [
    "bg-red-500",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-500",
  ];
  const handleReview = (newReviewCount: number) => {
    const newCurrentReviewTime = now.getTime();

    let daysToAdd: number | null = null;
    if (newReviewCount in REVIEW_GAP_DAYS) {
      daysToAdd = REVIEW_GAP_DAYS[newReviewCount];
    } else {
      daysToAdd = null;
    }

    const newNextReviewTime = daysToAdd
      ? newCurrentReviewTime + daysToAdd * millisecondsInDay
      : null;

    setCurrentReviewProgress({
      ...currentReviewProgress,
      last_last_review_time: currentReviewProgress.last_review_time,
      last_review_time: now.getTime(),
      next_reviewable_time: newNextReviewTime,
      review_count: newReviewCount,
    });
    setNow(new Date());
  };

  const handleDone = () => {
    setCurrentReviewProgress({
      ...currentReviewProgress,
      review_count: 6,
      next_reviewable_time: null,
    });
  };

  return (
    <TableRow key={reviewProgressWithWord.id}>
      <TableCell className="px-3">{reviewProgressWithWord.lemma}</TableCell>
      <TableCell className="px-3">
        {currentReviewProgress.review_count >= 6
          ? "Done!"
          : currentReviewProgress.next_reviewable_time &&
            currentReviewProgress.next_reviewable_time < new Date().getTime()
          ? "Nu"
          : `I ${formatDistance(
              currentReviewProgress.next_reviewable_time!,
              new Date(),
              { locale: sv }
            )}`
        }
      </TableCell>
      <TableCell className="px-3">
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
      <TableCell className="px-3">
        {reviewProgressWithWord.lexemes
          .toSorted((a, b) => lexemePriority(a) - lexemePriority(b))
          .map((lexeme) => {
            return (
              <div key={lexeme.id}>
                <BlurElement>{lexeme.definition}</BlurElement>
                <div className="grid grid-cols-1 md:grid-cols-2">
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
      <Controls
        buttons={[
          <PlayButton
            key={`${reviewProgressWithWord.id}-play`}
            className="mx-auto"
            voice={reviewProgressWithWord}
          />,
          <Button
            aria-label="Review"
            className="p-0 mx-auto"
            key={`${reviewProgressWithWord.id}-done`}
            onClick={async () => {
              const newReviewCount = currentReviewProgress.review_count + 1;
              await updateWordReview(reviewProgressWithWord);
              handleReview(newReviewCount);
            }}
            disabled={currentReviewProgress.next_reviewable_time === null || currentReviewProgress.next_reviewable_time >= new Date().getTime()}
          >
            <IoCheckmarkDoneOutline className="h-4 w-4" />
          </Button>,
          currentReviewProgress.review_count < 6 ? (
            <DoneButton
              key={`${reviewProgressWithWord.id}-done`}
              review={currentReviewProgress}
              onClick={handleDone}
            />
          ) : (
            <ResetButton
              key={`${reviewProgressWithWord.id}-reset`}
              review={currentReviewProgress}
              onClick={() => handleReview(1)}
            />
          ),
        ]}
      />
    </TableRow>
  );
}
