import { ReviewIntervals } from "@/app/domain/service/wordbook/review";
import { NotReviewed, type WordBookEntryWithDetails } from "@/types";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
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

const reviewCountColor = [
  "bg-red-500",
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-green-500",
];

const fallbackData: Array<WordBookEntryWithDetails> = [];

export default function All() {
  const columns: ColumnDef<WordBookEntryWithDetails>[] = [
    {
      accessorKey: "lemma",
      header: "Word",
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
  ];
  const data = useLiveQuery(() => all());
  const table = useReactTable({
    columns,
    data: data || fallbackData,
    getCoreRowModel: getCoreRowModel(),
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
