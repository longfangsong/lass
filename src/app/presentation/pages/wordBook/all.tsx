import { ReviewIntervals } from "@/app/domain/service/wordbook/review";
import { NotReviewed, type WordBookEntryWithDetails } from "@/types";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { all } from "@/app/domain/repository/wordbook";
import { startReviewProgress } from "@/app/application/usecase/wordbook/startReviewProgress";
import PlayButton from "../../components/playAudioButton";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

const reviewCountColor = [
  "bg-red-500",
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-green-500",
];

const fallbackData: Array<
  WordBookEntryWithDetails & { frequency_rank?: number }
> = [];

export default function All() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns: ColumnDef<
    WordBookEntryWithDetails & { frequency_rank?: number }
  >[] = [
    {
      accessorKey: "lemma",
      header: "Word",
    },
    {
      accessorKey: "next_passive_review_time",
      header: "Next Review",
      cell: ({ row }) => {
        const time: number = row.getValue("next_passive_review_time");
        const passive_review_count: number = row.getValue(
          "passive_review_count",
        );
        if (passive_review_count === NotReviewed) {
          return <></>;
        } else if (passive_review_count >= ReviewIntervals.length) {
          return "Klart!";
        } else if (time <= Date.now()) {
          return "Nu!";
        } else {
          return `I ${formatDistanceToNow(time, { locale: sv })}`;
        }
      },
    },
    {
      header: "Meaning",
      cell: ({ row }) => {
        const meanings: Array<string> = row.original.lexemes.map(
          (lexeme) => lexeme.definition,
        );
        return (
          <>
            {meanings.map((meaning) => (
              <p
                key={meaning}
                className="max-w-sm wrap-break-word whitespace-normal mb-3 last:mb-0"
              >
                {meaning}
              </p>
            ))}
          </>
        );
      },
    },
    {
      accessorKey: "frequency_rank",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Frequency Rank
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      // cell: ({ row }) => {
      //   const frequencyRank = row.original.frequency_rank;

      //   if (frequencyRank !== undefined) {
      //     return frequencyRank.toString();
      //   }
      // },
    },
    {
      accessorKey: "passive_review_count",
      header: () => <div className="text-center">Review</div>,
      cell: ({ row }) => {
        const count: number = row.getValue("passive_review_count");

        if (count === NotReviewed) {
          return (
            <div className="flex items-center">
              <Button
                className="mx-auto"
                onClick={() => startReviewProgress(row.original)}
              >
                Start
              </Button>
            </div>
          );
        }

        return (
          <div className="flex flex-col-reverse items-center">
            {ReviewIntervals.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-3.5 h-0.5 rounded-sm m-px",
                  index < count ? reviewCountColor[index] : "bg-gray-300",
                )}
              ></div>
            ))}
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      header: "Phonetic",
      cell: ({ row }) => <PlayButton voice={row.original} />,
    },
  ];
  const data = useLiveQuery(() => all());
  const table = useReactTable({
    columns,
    data: data || fallbackData,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
