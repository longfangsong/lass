import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@app/components/ui/table";
import { Input } from "@app/components/ui/input";
import { Button } from "@app/components/ui/button";
import { Separator } from "@app/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@app/components/ui/dialog";
import type { WordSearchResult, Word } from "@/types";
import WordDetail from "@app/components/word/WordDetail";

function WordDetailDialog({
  word,
  open,
  onOpenChange,
}: {
  word: Word | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{word?.lemma}</DialogTitle>
        </DialogHeader>
        <WordDetail word={word} />
      </DialogContent>
    </Dialog>
  );
}

export function Dictionary() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WordSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (searchQuery: string, useAI: boolean = false) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/words?spell=${encodeURIComponent(searchQuery)}&ai=${useAI}`,
      );
      if (!response.ok) {
        throw new Error("Search request failed");
      }
      const searchResults = await response.json();
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAISearch = () => {
    handleSearch(query, true);
  };

  const handleKeyUp = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleRowClick = async (wordId: string) => {
    try {
      const response = await fetch(`/api/words/${wordId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch word details");
      }
      const word = await response.json();
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

      <WordDetailDialog
        word={selectedWord}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
