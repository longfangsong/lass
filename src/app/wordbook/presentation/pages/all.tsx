import { NotReviewed, type WordBookEntryWithDetails } from "@/types";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { endOfDay, formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import {
  AlertCircleIcon,
  ArrowUpDown,
  CheckCircle2Icon,
  ChevronDown,
  Trash2,
} from "lucide-react";
import PlayButton from "@/app/shared/presentation/components/playAudioButton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/app/shared/presentation/components/ui/alert";
import { Button } from "@/app/shared/presentation/components/ui/button";
import { Input } from "@/app/shared/presentation/components/ui/input";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/app/shared/presentation/components/ui/table";
import { cn } from "@/app/shared/presentation/lib/utils";
import { useSettings } from "@/app/settings/presentation/hooks/useSettings";

import {
  startActiveReviewProgress,
  startPassiveReviewProgress,
} from "../../application/startReview";
import { passiveReviewsStartedOrWillStartToday } from "../../application/reviewStats";
import { ReviewIntervals } from "../../domain/model";
import { repository } from "../../infrastructure/repository";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/shared/presentation/components/ui/dropdown-menu";

async function deleteEntry(entry: WordBookEntryWithDetails) {
  const deletedEntry = {
    id: entry.id,
    word_id: entry.word_id,
    passive_review_count: entry.passive_review_count,
    next_passive_review_time: entry.next_passive_review_time,
    active_review_count: entry.active_review_count,
    next_active_review_time: entry.next_active_review_time,
    deleted: true,
    update_time: Date.now(),
    sync_at: entry.sync_at,
  };
  await repository.update(deletedEntry);
}

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

export function All() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { settings } = useSettings();
  
  // Extract the daily new review count to avoid repetition
  const dailyNewReviewCount = settings?.daily_new_review_count ?? 20;
  const columns: ColumnDef<
    WordBookEntryWithDetails & { frequency_rank?: number }
  >[] = [
    {
      accessorKey: "lemma",
      header: "Word",
    },
    {
      accessorKey: "next_passive_review_time",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Next Passive Review
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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
      sortingFn: (rowA, rowB) => {
        const timeA: number = rowA.getValue("next_passive_review_time");
        const timeB: number = rowB.getValue("next_passive_review_time");
        if (timeA === NotReviewed && timeB === NotReviewed) {
          return 0;
        } else if (timeA === NotReviewed) {
          return 1;
        } else if (timeB === NotReviewed) {
          return -1;
        } else {
          return timeA - timeB;
        }
      },
    },
    {
      accessorKey: "next_active_review_time",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Next Active Review
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const time: number = row.getValue("next_active_review_time");
        const active_review_count: number = row.getValue("active_review_count");
        if (active_review_count === NotReviewed) {
          return <></>;
        } else if (active_review_count >= ReviewIntervals.length) {
          return "Klart!";
        } else if (time <= Date.now()) {
          return "Nu!";
        } else {
          return `I ${formatDistanceToNow(time, { locale: sv })}`;
        }
      },
      sortingFn: (rowA, rowB) => {
        const timeA: number = rowA.getValue("next_active_review_time");
        const timeB: number = rowB.getValue("next_active_review_time");
        if (timeA === NotReviewed && timeB === NotReviewed) {
          return 0;
        } else if (timeA === NotReviewed) {
          return 1;
        } else if (timeB === NotReviewed) {
          return -1;
        } else {
          return timeA - timeB;
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
      header: () => <div className="text-center">Passive Review</div>,
      cell: ({ row }) => {
        const count: number = row.getValue("passive_review_count");

        if (count === NotReviewed) {
          return (
            <div className="flex items-center">
              <Button
                className="mx-auto"
                onClick={() =>
                  startPassiveReviewProgress(repository, row.original)
                }
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
      accessorKey: "active_review_count",
      header: () => <div className="text-center">Active Review</div>,
      cell: ({ row }) => {
        const count: number = row.getValue("active_review_count");
        const passiveCount: number = row.getValue("passive_review_count");

        if (count === NotReviewed) {
          const canStartActive = passiveCount > 3;
          return (
            <div className="flex items-center">
              <Button
                className="mx-auto"
                onClick={() =>
                  startActiveReviewProgress(repository, row.original)
                }
                disabled={!canStartActive}
                title={
                  canStartActive
                    ? "Start active review"
                    : "Complete passive review more than 3 times to start"
                }
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
    {
      id: "delete",
      header: "Delete",
      cell: ({ row }) => (
        <Button
          variant="destructive"
          size="icon"
          onClick={() => deleteEntry(row.original)}
          title="Delete entry"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  const data = useLiveQuery(() => repository.all);
  const now = Date.now();
  const endOfToday = endOfDay(now);
  const remainToReview = data?.filter(
    (it) =>
      it.passive_review_count === 0 ||
      (0 <= it.next_passive_review_time &&
        it.next_passive_review_time <= endOfToday.getTime()),
  );
  const startToday = data ? passiveReviewsStartedOrWillStartToday(data) : [];
  const table = useReactTable({
    columns,
    data: data || fallbackData,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
  });
  return (
    <div>
      <Alert
        variant={
          // todo: magic numbers
          (remainToReview?.length || 0) <= 200
            ? "default"
            : (remainToReview?.length || 0) <= 500
              ? "warning"
              : "destructive"
        }
        className="my-2 sticky top-1 z-10"
      >
        {(remainToReview?.length || 0) <= dailyNewReviewCount * 10 ? (
          <CheckCircle2Icon />
        ) : (
          <AlertCircleIcon />
        )}
        <AlertTitle>
          {remainToReview?.length} remaining to review today
        </AlertTitle>
        {(remainToReview?.length || 0) > dailyNewReviewCount * 10 && (
          <AlertDescription>
            Be careful! Don't bite off more than you can chew!
          </AlertDescription>
        )}
      </Alert>
      <Alert
        variant={
          (startToday?.length || 0) <= dailyNewReviewCount
            ? "default"
            : (startToday?.length || 0) <= dailyNewReviewCount * 2.5
              ? "warning"
              : "destructive"
        }
        className="my-2 sticky top-14 z-10"
      >
        {(startToday?.length || 0) <= dailyNewReviewCount ? (
          <CheckCircle2Icon />
        ) : (
          <AlertCircleIcon />
        )}
        <AlertTitle>
          {startToday?.length} started or will start today
        </AlertTitle>
        {(startToday?.length || 0) > dailyNewReviewCount && (
          <AlertDescription>
            Be careful! Don't bite off more than you can chew!
          </AlertDescription>
        )}
      </Alert>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter words..."
          value={(table.getColumn("lemma")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("lemma")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id.replaceAll("_", " ")}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
