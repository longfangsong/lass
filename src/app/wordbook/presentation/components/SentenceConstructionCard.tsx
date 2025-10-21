import { Button } from "@/app/shared/presentation/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/app/shared/presentation/components/ui/card";
import { Skeleton } from "@/app/shared/presentation/components/ui/skeleton";
import type { WordBookEntryWithDetails } from "@/types";
import { useEffect, useState, useRef } from "react";
import { reviewActive, ReviewStatus } from "../../domain/model";
import { repository } from "../../infrastructure/repository";
import { createSentenceProblem } from "../../application/createSentenceProblem";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SentenceConstructionCardProps {
  entry: WordBookEntryWithDetails;
  onDone: () => void;
}

type SelectedWord = {
  id: string;
  word: string;
};

// Draggable word from word bank
function DraggableWordBankWord({
  word,
  index,
  onClick,
  disabled,
}: {
  word: string;
  index: number;
  onClick: () => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `bank-${index}`,
      disabled,
      data: { word, index, type: "bank" },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Button
      ref={setNodeRef}
      style={style}
      variant="outline"
      onClick={onClick}
      className="hover:bg-accent hover:text-accent-foreground transition-colors cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
      disabled={disabled}
    >
      {word}
    </Button>
  );
}

// Sortable Word component for selected words with drag and drop
function SortableSelectedWord({
  word,
  id,
  disabled,
  onClick,
}: {
  word: string;
  id: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    disabled,
    data: { word, id, type: "selected" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={!disabled ? onClick : undefined}
      className={`flex items-center bg-blue-100 dark:bg-blue-900 rounded-md p-2 ${
        isDragging ? "z-50 shadow-lg" : ""
      } ${
        disabled
          ? "opacity-50"
          : "cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
      } cursor-grab active:cursor-grabbing`}
      title={
        disabled
          ? ""
          : "Click to remove, or drag to reorder / drag back to word bank to remove"
      }
      {...attributes}
      {...listeners}
    >
      <span className="text-lg px-2">{word}</span>
    </div>
  );
}

// Droppable area for sentence construction
function SentenceDropArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "sentence-area",
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700" : ""} transition-colors`}
    >
      {children}
    </div>
  );
}

// Droppable area for word bank
function WordBankDropArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "word-bank",
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700" : ""} transition-colors`}
    >
      {children}
    </div>
  );
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
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState<SelectedWord[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const idCounter = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  useEffect(() => {
    // Reset state for the new entry and create a new problem
    setLoading(true);
    (async () => {
      const newProblem = await createSentenceProblem(entry);
      if (!newProblem) {
        // Cannot create a problem for this word, so skip it.
        onDone();
      } else {
        setProblem(newProblem);
        setLoading(false);
      }
    })();
    setUserAnswer([]);
    setSubmitted(false);
    setIsCorrect(false);
  }, [entry, onDone]);

  const handleWordBankClick = (word: string, index: number) => {
    const newId = `word-${idCounter.current++}`;
    setUserAnswer([...userAnswer, { id: newId, word }]);
    // Remove word from bank
    const newScrambled = [...(problem?.scrambledWords || [])];
    newScrambled.splice(index, 1);
    setProblem(problem ? { ...problem, scrambledWords: newScrambled } : null);
  };

  const handleSelectedWordClick = (wordId: string) => {
    if (submitted) return;

    const wordToRemove = userAnswer.find((w) => w.id === wordId);
    if (wordToRemove) {
      setUserAnswer(userAnswer.filter((w) => w.id !== wordId));

      const newScrambled = [
        ...(problem?.scrambledWords || []),
        wordToRemove.word,
      ];
      setProblem(problem ? { ...problem, scrambledWords: newScrambled } : null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Handle reordering within selected words
    if (activeType === "selected" && overType === "selected") {
      if (activeId !== overId) {
        setUserAnswer((items) => {
          const oldIndex = items.findIndex((item) => item.id === activeId);
          const newIndex = items.findIndex((item) => item.id === overId);
          if (oldIndex === -1 || newIndex === -1) return items;

          const newItems = Array.from(items);
          const [removed] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, removed);
          return newItems;
        });
      }
      return;
    }

    // Handle dragging from word bank to sentence area
    if (
      activeType === "bank" &&
      (overId === "sentence-area" || overType === "selected")
    ) {
      const wordIndex = active.data.current?.index as number;
      const word = problem?.scrambledWords[wordIndex];

      if (word !== undefined) {
        const newId = `word-${idCounter.current++}`;

        const newUserAnswer = [...userAnswer];
        let dropIndex = -1;
        if (overType === "selected") {
          dropIndex = userAnswer.findIndex((w) => w.id === over.id);
        }

        if (dropIndex !== -1) {
          newUserAnswer.splice(dropIndex, 0, { id: newId, word });
        } else {
          newUserAnswer.push({ id: newId, word });
        }
        setUserAnswer(newUserAnswer);

        // Remove from scrambledWords
        const newScrambled = [...(problem?.scrambledWords || [])];
        newScrambled.splice(wordIndex, 1);
        setProblem(
          problem ? { ...problem, scrambledWords: newScrambled } : null,
        );
      }
      return;
    }

    // Handle dragging from sentence area back to word bank
    if (activeType === "selected" && overId === "word-bank") {
      const wordToRemove = userAnswer.find((w) => w.id === activeId);
      if (wordToRemove) {
        setUserAnswer(userAnswer.filter((w) => w.id !== activeId));

        const newScrambled = [
          ...(problem?.scrambledWords || []),
          wordToRemove.word,
        ];
        setProblem(
          problem ? { ...problem, scrambledWords: newScrambled } : null,
        );
      }
      return;
    }
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
    const correct =
      userAnswer.map((w) => w.word).join(" ") === problem.sentence;
    setIsCorrect(correct);
    setSubmitted(true);
    done(correct ? ReviewStatus.StillRemember : ReviewStatus.Forgotten);
  };

  if (!problem) {
    return null; // Or a loading indicator
  }

  // Get the word being dragged for the overlay
  const activeWord = activeId
    ? activeId.startsWith("selected-")
      ? userAnswer.find((w) => w.id === activeId)?.word || ""
      : activeId.startsWith("bank-")
        ? problem?.scrambledWords[parseInt(activeId.replace("bank-", ""))] || ""
        : ""
    : "";

  if (loading || !problem) {
    return (
      <Card className="max-w-172 mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-muted-foreground">
            Construct the sentence for:
          </CardTitle>
          <CardContent className="text-center text-lg py-4">
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </CardContent>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md bg-muted min-h-24 p-4">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
        </CardContent>
        <CardFooter className="pt-8 flex w-full flex-wrap justify-around">
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    );
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Selected words area with drag-and-drop */}
          <SentenceDropArea className="border rounded-md bg-muted min-h-24 p-4 mb-4 relative">
            {userAnswer.length > 0 ? (
              <SortableContext
                items={userAnswer.map((w) => w.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex flex-wrap gap-2 justify-center">
                  {userAnswer.map((wordObj) => (
                    <SortableSelectedWord
                      key={wordObj.id}
                      word={wordObj.word}
                      id={wordObj.id}
                      disabled={submitted}
                      onClick={() => handleSelectedWordClick(wordObj.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <div className="text-center text-xl">
                <span className="text-muted-foreground">
                  {submitted
                    ? ""
                    : "Drag words here or click words below to construct the sentence..."}
                </span>
              </div>
            )}
            {!submitted && userAnswer.length === 0 && (
              <div className="absolute inset-0 border-2 border-dashed border-muted-foreground/30 rounded-md pointer-events-none" />
            )}
          </SentenceDropArea>

          {/* Word bank area */}
          <WordBankDropArea className="flex flex-wrap gap-2 justify-center min-h-12 relative">
            {!submitted &&
              problem.scrambledWords.map((word, index) => (
                <DraggableWordBankWord
                  key={`bank-${index}`}
                  word={word}
                  index={index}
                  onClick={() => handleWordBankClick(word, index)}
                  disabled={submitted}
                />
              ))}
            {!submitted &&
              problem.scrambledWords.length === 0 &&
              userAnswer.length > 0 && (
                <div className="text-center text-sm text-muted-foreground italic py-4">
                  Drag words back here to remove them from your sentence
                </div>
              )}
          </WordBankDropArea>

          {/* Drag overlay for better visual feedback */}
          <DragOverlay>
            {activeId && activeWord ? (
              <div className="bg-blue-100 dark:bg-blue-900 rounded-md p-2 shadow-lg border-2 border-blue-300 dark:border-blue-700 transform rotate-3">
                <span className="text-lg px-2">{activeWord}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

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
