"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SeriesDatum } from "@/lib/types";

const COLORS: Record<string, string> = { Remote: "#6366f1", Onsite: "#14b8a6", Hybrid: "#f59e0b" };

export function DonutChart({ data }: { data: SeriesDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={96} paddingAngle={3} stroke="none">
            {data.map((entry) => <Cell key={entry.name} fill={COLORS[entry.name] || "#94a3b8"} />)}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value} jobs`, "Listings"]} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 text-center"><p className="text-3xl font-extrabold text-slate-950 dark:text-white">{total}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jobs</p></div>
    </div>
  );
}
