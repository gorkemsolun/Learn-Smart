"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import * as React from "react";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const CustomTooltip = ({ active, payload }: never) => {
  if (active && payload && payload.length) {
    const { day, timeSpent } = payload[0].payload;
    return (
      <div className="rounded bg-background p-2 text-foreground shadow-md">
        <p className="text-sm font-medium">{`Day: ${day}`}</p>
        <p className="text-sm">{`Time Spent: ${formatTime(timeSpent)}`}</p>
      </div>
    );
  }
  return null;
};

export function UserChart({ chartData }: { chartData: { day: string; timeSpent: number }[] }) {
  return (
    <Card className="h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <CardHeader className="pb-4">
        <CardTitle>User Analytics</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[47vh] w-full bg-transparent">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={true} axisLine={false} />
              <YAxis tickFormatter={(value) => formatTime(value)} width={70} />
              <ChartTooltip cursor={{ fill: "rgba(0,0,0,0.1)" }} content={<CustomTooltip />} />
              <Bar dataKey="timeSpent" fill="var(--color-desktop)" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
