"use client";

import { useMemo } from "react";
import { CityChart } from "@/components/charts/CityChart";
import { ChartCard, EmptyState, ErrorState, LoadingState, PageIntro } from "@/components/ui";
import { useFilters } from "@/context/FilterContext";
import { CITIES, skillCounts, topEntries } from "@/lib/data";

export default function CitiesPage() {
  const { filteredJobs, loading, error } = useFilters();
  const rows = useMemo(() => CITIES.map((city) => {
    const jobs = filteredJobs.filter((job) => job.city === city);
    const salaries = jobs.flatMap((job) => [job.salary_min, job.salary_max]).filter((value): value is number => value !== null);
    return {
      name: city,
      value: jobs.length,
      topSkill: topEntries(skillCounts(jobs), 1)[0]?.name || "—",
      avgSalary: salaries.length ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : null,
      remote: jobs.length ? Math.round(jobs.filter((job) => job.job_type === "Remote").length / jobs.length * 100) : 0,
    };
  }).sort((a, b) => b.value - a.value), [filteredJobs]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageIntro title="Where is Pakistan’s tech hiring concentrated?">The free, accessible chart view replaces a paid mapping library while keeping city comparisons precise.</PageIntro>
      <ChartCard title="Jobs by city" subtitle="Current listing volume across standardized locations">
        {rows.some((row) => row.value) ? <CityChart data={rows} /> : <EmptyState />}
      </ChartCard>
      <section className="panel mt-5 overflow-hidden">
        <div className="border-b px-5 py-4"><h3 className="text-sm font-bold text-slate-900 dark:text-white">City market table</h3><p className="mt-1 text-xs text-slate-500">Salary averages use disclosed minimum and maximum values only.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/60"><tr><th className="px-5 py-3">City</th><th className="px-5 py-3">Total jobs</th><th className="px-5 py-3">Top skill</th><th className="px-5 py-3">Avg salary</th><th className="px-5 py-3">Remote %</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">{rows.map((row) => <tr key={row.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30"><td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{row.name}</td><td className="px-5 py-4">{row.value}</td><td className="px-5 py-4"><span className="badge border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">{row.topSkill}</span></td><td className="px-5 py-4">{row.avgSalary ? `PKR ${Math.round(row.avgSalary / 1000)}k` : "Not available"}</td><td className="px-5 py-4">{row.remote}%</td></tr>)}</tbody></table></div>
      </section>
    </>
  );
}
