import { Button } from "@/app/shared/presentation/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/app/shared/presentation/components/ui/card";
import type { WordBookEntryWithDetails } from "@/types";
import { useEffect, useState } from "react";
import { reviewActive, ReviewStatus } from "../../domain/model";
import { repository } from "../../infrastructure/repository";
import { createSentenceProblem } from "../../application/createSentenceProblem";

interface SentenceConstructionCardProps {
  entry: WordBookEntryWithDetails;
  onDone: () => void;
}

export default function SentenceConstructionCard({
  entry,
  onDone,
}: SentenceConstructionCardProps) {
  const [problem, setProblem] = useState<{
    sentence: string;
    meaning: string;
    scrambledWords: string[];
  } | null>(null);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // Reset state for the new entry and create a new problem
    const newProblem = createSentenceProblem(entry);
    if (!newProblem) {
      // Cannot create a problem for this word, so skip it.
      onDone();
    } else {
      setProblem(newProblem);
    }
    setUserAnswer([]);
    setSubmitted(false);
    setIsCorrect(false);
  }, [entry, onDone]);

  const handleWordBankClick = (word: string, index: number) => {
    setUserAnswer([...userAnswer, word]);
    // Remove word from bank
    const newScrambled = [...(problem?.scrambledWords || [])];
    newScrambled.splice(index, 1);
    setProblem(problem ? { ...problem, scrambledWords: newScrambled } : null);
  };

  const done = async (status: ReviewStatus) => {
    const newEntry = reviewActive(entry, status);
    await repository.insert(newEntry);
    setTimeout(() => {
      onDone();
    }, 2000);
  };

  const handleCheckAnswer = () => {
    if (!problem) return;
    const correct = userAnswer.join(" ") === problem.sentence;
    setIsCorrect(correct);
    setSubmitted(true);
    done(correct ? ReviewStatus.StillRemember : ReviewStatus.Forgotten);
  };

  if (!problem) {
    return null; // Or a loading indicator
  }

  return (
    <Card className="max-w-172 mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-muted-foreground">
          Construct the sentence for:
        </CardTitle>
        <CardContent className="text-center text-lg py-4">
          <p>{problem.meaning}</p>
        </CardContent>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md bg-muted min-h-24 p-4 mb-4 text-center text-xl">
          {userAnswer.join(" ") || (
            <span className="text-muted-foreground">...</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-center min-h-12">
          {!submitted &&
            problem.scrambledWords.map((word, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleWordBankClick(word, index)}
              >
                {word}
              </Button>
            ))}
        </div>
        {submitted && (
          <div
            className={`text-center p-4 rounded-md ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            <h3 className="font-bold">
              {isCorrect ? "Correct!" : "Incorrect."}
            </h3>
            <p>{problem.sentence}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-8 flex w-full flex-wrap justify-around">
        {!submitted && (
          <Button
            onClick={handleCheckAnswer}
            disabled={userAnswer.length === 0}
          >
            Check Answer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
