"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SeriesDatum } from "@/lib/types";

export function CityChart({ data, height = 360 }: { data: SeriesDatum[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.18} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#6366f1", opacity: 0.08 }} />
          <Bar dataKey="value" name="Jobs" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={58} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
