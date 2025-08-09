import { LabelList, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@app/presentation/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@app/presentation/components/ui/chart";
import "./chartByCount.css";
import { useEffect, useState } from "react";
import { NotReviewed } from "@/types";
import { ReviewIntervals } from "@app/domain/model/wordbookEntry";
import { aggregate } from "@/app/application/service/wordbook/aggregate/byCount";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { repository } from "@/app/infrastructure/indexeddb/wordbookEntryRepository";

export const description = "A simple pie chart";

const chartConfig = {
  word_count: {
    label: "word_count",
  },
  "-1": {
    label: "Not Started",
    color: "var(--count-chart--1)",
  },
  "0": {
    label: "Just Started",
    color: "var(--count-chart-0)",
  },
  "1": {
    label: "1 time",
    color: "var(--count-chart-1)",
  },
  "2": {
    label: "2 times",
    color: "var(--count-chart-2)",
  },
  "3": {
    label: "3 times",
    color: "var(--count-chart-3)",
  },
  "4": {
    label: "4 times",
    color: "var(--count-chart-4)",
  },
  "5": {
    label: "5 times",
    color: "var(--count-chart-5)",
  },
  "6": {
    label: "Done",
    color: "var(--count-chart-6)",
  },
} satisfies ChartConfig;

export function ChartByCount() {
  const [data, setData] = useState<
    Array<{ word_count: number; review_count: string }> | undefined
  >(undefined);
  const [showNotStarted, setShowNotStarted] = useState(true);
  const [showDone, setShowDone] = useState(true);
  useEffect(() => {
    (async () => {
      const rawData = await aggregate(repository);
      if (!showNotStarted && rawData[NotReviewed]) {
        delete rawData[NotReviewed];
      }
      if (!showDone && rawData[ReviewIntervals.length]) {
        delete rawData[ReviewIntervals.length];
      }
      const newData = [];
      for (
        let review_count = NotReviewed;
        review_count <= ReviewIntervals.length;
        review_count++
      ) {
        const word_count = rawData[review_count];
        newData.push({
          word_count: word_count?.length || 0,
          review_count: review_count.toString(),
          fill: `var(--count-chart-${review_count})`,
        });
      }
      setData(newData);
    })();
  }, [showDone, showNotStarted]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="grid gap-1">
          <CardTitle>Reviewed times distribution</CardTitle>
          <CardDescription>
            How many words have you reviewed for X times?
          </CardDescription>
          <div className="flex items-center gap-3">
            <Checkbox
              id="not-started"
              checked={showNotStarted}
              onCheckedChange={(state) => setShowNotStarted(state === true)}
            />
            <Label htmlFor="not-started">Show not started</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="done"
              checked={showDone}
              onCheckedChange={(state) => setShowDone(state === true)}
            />
            <Label htmlFor="done">Show done</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={data} dataKey="word_count" nameKey="review_count">
              <LabelList
                dataKey="review_count"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={
                  ((value: keyof typeof chartConfig) => {
                    const dataItem = data?.find(
                      (it) => it.review_count.toString() === value.toString(),
                    );
                    if (
                      value !== NotReviewed.toString() &&
                      dataItem?.word_count
                    ) {
                      return chartConfig[value].label;
                    } else {
                      return "";
                    }
                  }) as unknown as (_: React.ReactNode) => React.ReactNode
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
