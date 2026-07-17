"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartRow = Record<string, string | number>;
const COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#f43f5e"];

export function ExperienceChart({ data, keys, height = 380, stacked = true }: { data: ChartRow[]; keys: string[]; height?: number; stacked?: boolean }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.18} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} minTickGap={12} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip />
          <Legend iconType="circle" iconSize={8} />
          {keys.map((key, index) => <Bar key={key} dataKey={key} stackId={stacked ? "demand" : undefined} fill={COLORS[index % COLORS.length]} radius={!stacked ? [5, 5, 0, 0] : undefined} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
