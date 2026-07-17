"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface LineDefinition { key: string; label?: string; color: string }
type ChartRow = Record<string, string | number>;

export function TrendLine({ data, lines, height = 330 }: { data: ChartRow[]; lines: LineDefinition[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.18} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip />
          {lines.length > 1 && <Legend iconType="circle" iconSize={8} />}
          {lines.map((line) => <Line key={line.key} type="monotone" dataKey={line.key} name={line.label || line.key} stroke={line.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
