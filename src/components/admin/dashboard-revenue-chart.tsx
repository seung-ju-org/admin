"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { month: "Jan", value: 2200 },
  { month: "Feb", value: 3100 },
  { month: "Mar", value: 2800 },
  { month: "Apr", value: 3900 },
  { month: "May", value: 4200 },
  { month: "Jun", value: 4600 },
  { month: "Jul", value: 4300 },
  { month: "Aug", value: 5200 },
  { month: "Sep", value: 5600 },
  { month: "Oct", value: 6000 },
  { month: "Nov", value: 6800 },
  { month: "Dec", value: 7300 },
];

const chartConfig = {
  value: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function DashboardRevenueChart() {
  return (
    <ChartContainer className="h-[300px] w-full" config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="month"
          tickLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
        <Area
          dataKey="value"
          fill="var(--color-value)"
          fillOpacity={0.25}
          stroke="var(--color-value)"
          type="natural"
        />
      </AreaChart>
    </ChartContainer>
  );
}
