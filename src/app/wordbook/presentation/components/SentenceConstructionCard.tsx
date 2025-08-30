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
import { GripVertical, X } from "lucide-react";
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
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface SentenceConstructionCardProps {
  entry: WordBookEntryWithDetails;
  onDone: () => void;
}

// Draggable word from word bank
function DraggableWordBankWord({ word, index, onClick, disabled }: { 
  word: string; 
  index: number; 
  onClick: () => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `bank-${index}`,
    disabled,
    data: { word, index, type: 'bank' },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

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
function SortableSelectedWord({ word, index, onRemove, disabled }: { 
  word: string; 
  index: number; 
  onRemove: (word: string, index: number) => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `selected-${index}`, 
    disabled,
    data: { word, index, type: 'selected' },
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
      className={`flex items-center bg-blue-100 dark:bg-blue-900 rounded-md p-2 ${
        isDragging ? 'z-50 shadow-lg' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded mr-2"
        title="Drag to reorder or drag back to word bank to remove"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <span className="text-lg px-2">{word}</span>
      <button
        onClick={() => onRemove(word, index)}
        disabled={disabled}
        className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded disabled:opacity-50 disabled:cursor-not-allowed ml-2"
        title="Remove word"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Droppable area for sentence construction
function SentenceDropArea({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'sentence-area',
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700' : ''} transition-colors`}
    >
      {children}
    </div>
  );
}

// Droppable area for word bank
function WordBankDropArea({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'word-bank',
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700' : ''} transition-colors`}
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
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleSelectedWordClick = (wordToRemove: string, index: number) => {
    // Remove word from selected answer
    const newUserAnswer = [...userAnswer];
    newUserAnswer.splice(index, 1);
    setUserAnswer(newUserAnswer);
    
    // Add word back to bank
    const newScrambled = [...(problem?.scrambledWords || [])];
    newScrambled.push(wordToRemove);
    setProblem(problem ? { ...problem, scrambledWords: newScrambled } : null);
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

    // Handle reordering within selected words
    if (activeId.startsWith('selected-') && overId.startsWith('selected-')) {
      const activeIndex = parseInt(activeId.replace('selected-', ''));
      const overIndex = parseInt(overId.replace('selected-', ''));

      if (activeIndex !== overIndex) {
        const newUserAnswer = [...userAnswer];
        const [movedWord] = newUserAnswer.splice(activeIndex, 1);
        newUserAnswer.splice(overIndex, 0, movedWord);
        setUserAnswer(newUserAnswer);
      }
      return;
    }

    // Handle dragging from word bank to sentence area
    if (activeId.startsWith('bank-') && overId === 'sentence-area') {
      const wordIndex = parseInt(activeId.replace('bank-', ''));
      const word = problem?.scrambledWords[wordIndex];
      
      if (word) {
        setUserAnswer([...userAnswer, word]);
        const newScrambled = [...(problem?.scrambledWords || [])];
        newScrambled.splice(wordIndex, 1);
        setProblem(problem ? { ...problem, scrambledWords: newScrambled } : null);
      }
      return;
    }

    // Handle dragging from sentence area back to word bank
    if (activeId.startsWith('selected-') && overId === 'word-bank') {
      const wordIndex = parseInt(activeId.replace('selected-', ''));
      const word = userAnswer[wordIndex];
      
      if (word) {
        const newUserAnswer = [...userAnswer];
        newUserAnswer.splice(wordIndex, 1);
        setUserAnswer(newUserAnswer);
        
        const newScrambled = [...(problem?.scrambledWords || [])];
        newScrambled.push(word);
        setProblem(problem ? { ...problem, scrambledWords: newScrambled } : null);
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
    const correct = userAnswer.join(" ") === problem.sentence;
    setIsCorrect(correct);
    setSubmitted(true);
    done(correct ? ReviewStatus.StillRemember : ReviewStatus.Forgotten);
  };

  if (!problem) {
    return null; // Or a loading indicator
  }

  // Get the word being dragged for the overlay
  const activeWord = activeId 
    ? activeId.startsWith('selected-') 
      ? userAnswer[parseInt(activeId.replace('selected-', ''))]
      : activeId.startsWith('bank-')
      ? problem.scrambledWords[parseInt(activeId.replace('bank-', ''))]
      : ''
    : '';

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
                items={userAnswer.map((_, index) => `selected-${index}`)} 
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex flex-wrap gap-2 justify-center">
                  {userAnswer.map((word, index) => (
                    <SortableSelectedWord
                      key={`selected-${index}`}
                      word={word}
                      index={index}
                      onRemove={handleSelectedWordClick}
                      disabled={submitted}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <div className="text-center text-xl">
                <span className="text-muted-foreground">
                  {submitted ? "" : "Drag words here or click words below to construct the sentence..."}
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
            {!submitted && problem.scrambledWords.length === 0 && userAnswer.length > 0 && (
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