import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

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
import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";
import { aggregate } from "@app/application/usecase/wordbook/aggregate/byTimes";

const chartConfig = {
  word_count: {
    label: "To review",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ChartByDate() {
  const [data, setData] = useState<Array<{ date: string; word_count: number }>>(
    [],
  );
  useEffect(() => {
    (async () => {
      const rawData = await aggregate();
      const now = new Date();
      const newData = rawData.map((item, index) => {
        return {
          date: format(addDays(now, index), "dd"),
          word_count: item.length,
        };
      });
      setData(newData);
    })();
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Estimation - Coming 30 Days</CardTitle>
        <CardDescription>
          How many words should you review on each day in the next 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="min-h-[125px]" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="word_count" fill="var(--color-word_count)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
