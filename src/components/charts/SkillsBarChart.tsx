"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SeriesDatum } from "@/lib/types";

export function SkillsBarChart({ data, height = 540 }: { data: SeriesDatum[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 22, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#64748b" opacity={0.18} />
          <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={86} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#6366f1", opacity: 0.08 }} />
          <Bar dataKey="value" name="Jobs" fill="#6366f1" radius={[0, 7, 7, 0]} barSize={15} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
