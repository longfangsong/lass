import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/shared/presentation/components/ui/table";
import { Input } from "@/app/shared/presentation/components/ui/input";
import { Button } from "@/app/shared/presentation/components/ui/button";
import { Separator } from "@/app/shared/presentation/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/shared/presentation/components/ui/dialog";
import type { WordSearchResult, Word } from "@/types";
import WordDetail from "@/app/shared/presentation/components/word/wordDetail";
import { useAtomValue } from "jotai";
import { CheckCheck, FileDown } from "lucide-react";
import SaveToWordBookButton from "@/app/shared/presentation/components/word/saveToWordBook";
import PlayButton from "@/app/shared/presentation/components/playAudioButton";
import { Badge } from "@/app/shared/presentation/components/ui/badge";
import { searchWord } from "@/app/dictionary/application/search";
import { repository } from "@/app/dictionary/infrastructure/repository";
import { syncState } from "@/app/sync/presentation/atoms";
import { useRegisterSyncService } from "@/app/sync/presentation/hooks";
import { isProgress, isDownloading } from "@/app/sync/domain/types";

function WordDetailDialog({
  word,
  open,
  onOpenChange,
}: {
  word: Word & { frequency_rank?: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{word?.lemma}</DialogTitle>
          <DialogDescription>
            {word.frequency_rank &&
              (word.frequency_rank <= 100 ? (
                <Badge>Top 100</Badge>
              ) : word.frequency_rank <= 500 ? (
                <Badge>Top 500</Badge>
              ) : word.frequency_rank <= 1000 ? (
                <Badge>Top 1000</Badge>
              ) : word.frequency_rank <= 2000 ? (
                <Badge>Top 2000</Badge>
              ) : word.frequency_rank <= 5000 ? (
                <Badge>Top 5000</Badge>
              ) : (
                ""
              ))}
          </DialogDescription>
        </DialogHeader>
        <WordDetail
          word={word}
          buttons={[
            <SaveToWordBookButton word_id={word?.id} />,
            <PlayButton voice={word} />,
          ]}
        />
      </DialogContent>
    </Dialog>
  );
}

export function Dictionary() {
  useRegisterSyncService();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WordSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentSyncState = useAtomValue(syncState);
  const [selectedWord, setSelectedWord] = useState<
    (Word & { frequency_rank?: number }) | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestSearchQueryRef = useRef<string>("");

  // Determine if initialization is complete
  const isInitComplete = currentSyncState === "idle" || 
    (typeof currentSyncState === "object" && (!currentSyncState.initProgress || currentSyncState.initProgress === "idle"));
  const isIniting = isDownloading(currentSyncState);
  const initProgress = isIniting && typeof currentSyncState === "object" ? currentSyncState.initProgress : null;
  const search = async (spell: string, useAI: boolean = false) => {
    if (!spell.trim()) {
      setResults([]);
      return [];
    }
    
    // Track this search query
    const currentSearchQuery = spell;
    latestSearchQueryRef.current = currentSearchQuery;
    
    setIsLoading(true);
    try {
      let searchResults: WordSearchResult[];
      if (!isInitComplete || useAI) {
        const response = await fetch(
          `/api/words?spell=${encodeURIComponent(spell)}&ai=${useAI}`,
        );
        if (!response.ok) {
          throw new Error("Search request failed");
        }
        searchResults = await response.json();
      } else {
        searchResults = await searchWord(spell);
      }
      
      // Only update results if this is still the latest search
      if (latestSearchQueryRef.current === currentSearchQuery) {
        setResults(searchResults);
      }
      return searchResults;
    } catch (error) {
      console.error("Search failed:", error);
      // Only clear results if this is still the latest search
      if (latestSearchQueryRef.current === currentSearchQuery) {
        setResults([]);
      }
      return [];
    } finally {
      // Only set loading to false if this is still the latest search
      if (latestSearchQueryRef.current === currentSearchQuery) {
        setIsLoading(false);
      }
    }
  };

  const handleAISearch = () => {
    search(query, true).then(async (result) => {
      await Promise.all([
        result.map(async (it) => {
          const wordInfo = await fetch(`/api/words/${it.id}`);
          if (!wordInfo.ok) {
            throw new Error("Failed to fetch word details");
          }
          const word: Word = await wordInfo.json();
          await repository.put(word);
        }),
      ]);
    });
  };

  const handleKeyUp = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      search(query);
    }, 300);
  };

  const handleRowClick = async (wordId: string) => {
    try {
      let word;
      if (isInitComplete) {
        const localWord = await repository.get(wordId);
        word = localWord;
      } else {
        const response = await fetch(`/api/words/${wordId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch word details");
        }
        word = await response.json();
      }
      setSelectedWord(word);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch word details:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const shouldShowAISearch = !isLoading && query && results.length === 0;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search dictionary..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyUp={handleKeyUp}
          className="flex-1"
        />
      </div>

      {results.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spell</TableHead>
                <TableHead>Definitions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((word) => (
                <TableRow
                  key={word.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(word.id)}
                >
                  <TableCell className="font-medium">{word.lemma}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {word.definitions.map((definition, index) => (
                        <React.Fragment key={index}>
                          <div className="text-sm">{definition}</div>
                          {index !== word.definitions.length - 1 && (
                            <Separator className="m-1" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4">
          <div className="text-sm text-muted-foreground">Searching...</div>
        </div>
      )}

      {shouldShowAISearch && (
        <div className="text-center py-4 space-y-2">
          <div className="text-sm text-muted-foreground">No results found</div>
          <Button onClick={handleAISearch} variant="outline" size="sm">
            Search with AI
          </Button>
        </div>
      )}

      {isInitComplete && (
        <div className="text-muted-foreground flex flex-row items-center justify-center mt-4">
          <CheckCheck />
          <div className="ml-2">
            <p>Dictionary downloaded.</p>
            <p className="text-xs">
              Your search will be handled on your device.
            </p>
          </div>
        </div>
      )}

      {isIniting && initProgress && isProgress(initProgress) && (
        <div className="text-muted-foreground flex flex-row items-center justify-center mt-4">
          <FileDown />
          <div className="ml-2">
            <p>
              Downloaded{" "}
              {initProgress.done
                .map((item) => item.done)
                .reduce((a, b) => a + b, 0)}{" "}
              of {" "}
              {initProgress.done
                .map((item) => item.all)
                .reduce((a, b) => a + b, 0)}{" "}
              files.
            </p>
            <p className="text-xs">
              Your search will be handled on the server.
            </p>
          </div>
        </div>
      )}

      {selectedWord && (
        <WordDetailDialog
          word={selectedWord}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
}
