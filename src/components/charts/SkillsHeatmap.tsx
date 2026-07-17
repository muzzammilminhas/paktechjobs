"use client";

interface HeatRow { skill: string; values: Record<string, number> }

export function SkillsHeatmap({ data, cities }: { data: HeatRow[]; cities: string[] }) {
  const max = Math.max(1, ...data.flatMap((row) => cities.map((city) => row.values[city] || 0)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-1.5 text-xs">
        <thead><tr><th className="pb-2 pr-3 text-left font-semibold text-slate-500">Skill</th>{cities.map((city) => <th key={city} className="pb-2 text-center font-semibold text-slate-500">{city}</th>)}</tr></thead>
        <tbody>{data.map((row) => <tr key={row.skill}><th className="whitespace-nowrap pr-3 text-left font-semibold text-slate-700 dark:text-slate-200">{row.skill}</th>{cities.map((city) => {
          const value = row.values[city] || 0;
          const alpha = value === 0 ? 0.04 : 0.16 + (value / max) * 0.78;
          return <td key={city} className="h-9 min-w-16 rounded-lg text-center font-bold" style={{ backgroundColor: `rgba(99,102,241,${alpha})`, color: alpha > 0.52 ? "white" : undefined }} title={`${row.skill} in ${city}: ${value} jobs`}>{value}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>
  );
}
