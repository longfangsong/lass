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
import PlayButton from "../../components/playAudioButton";
import { endOfDay, formatDistanceToNow, isSameDay, subDays } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { AlertCircleIcon, ArrowUpDown, CheckCircle2Icon } from "lucide-react";
import { repository } from "@/app/domain/repository/wordbookEntry";
import { ReviewIntervals } from "@/app/domain/model/wordbookEntry";
import { startReviewProgress } from "@/app/application/usecase/wordbook/startReview";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

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
            {meanings.map((meaning, index) => (
              <p
                key={index}
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
  const data = useLiveQuery(() => repository.all());
  const toReview = data?.filter(
    (it) =>
      it.passive_review_count === 0 ||
      endOfDay(new Date()).getTime() <= it.next_passive_review_time,
  );
  const startToday = toReview?.filter((it) => {
    const result =
      it.passive_review_count === 0 ||
      (it.passive_review_count === 1 &&
        isSameDay(subDays(it.next_passive_review_time, 1), new Date()));
    return result;
  });
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
    <div>
      <Alert
        variant={
          (toReview?.length || 0) <= 200
            ? "default"
            : (toReview?.length || 0) <= 500
              ? "warning"
              : "destructive"
        }
        className="my-2 sticky top-1 z-10"
      >
        {(toReview?.length || 0) <= 200 ? (
          <CheckCircle2Icon />
        ) : (
          <AlertCircleIcon />
        )}
        <AlertTitle>{toReview?.length} to review today</AlertTitle>
        {(toReview?.length || 0) > 200 && (
          <AlertDescription>
            Be careful! Don't bite off more than you can chew!
          </AlertDescription>
        )}
      </Alert>
      <Alert
        variant={
          (startToday?.length || 0) <= 20
            ? "default"
            : (startToday?.length || 0) <= 50
              ? "warning"
              : "destructive"
        }
        className="my-2 sticky top-14 z-10"
      >
        {(startToday?.length || 0) <= 20 ? (
          <CheckCircle2Icon />
        ) : (
          <AlertCircleIcon />
        )}
        <AlertTitle>
          {startToday?.length} started or will start today
        </AlertTitle>
        {(toReview?.length || 0) > 20 && (
          <AlertDescription>
            Be careful! Don't bite off more than you can chew!
          </AlertDescription>
        )}
      </Alert>
      <div className="border rounded-sm">
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
