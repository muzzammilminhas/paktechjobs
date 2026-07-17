"use client";

import { useMemo } from "react";
import { SkillsBarChart } from "@/components/charts/SkillsBarChart";
import { ChartCard, EmptyState, ErrorState, LoadingState, PageIntro } from "@/components/ui";
import { useFilters } from "@/context/FilterContext";
import { countBy, skillCounts, topEntries } from "@/lib/data";

export default function CompaniesPage() {
  const { filteredJobs, loading, error } = useFilters();
  const companies = useMemo(() => topEntries(countBy(filteredJobs, (job) => job.company_name), 20), [filteredJobs]);
  const rows = useMemo(() => companies.map(({ name, value }) => {
    const jobs = filteredJobs.filter((job) => job.company_name === name);
    return {
      name, value,
      cities: Array.from(new Set(jobs.map((job) => job.city))).slice(0, 3),
      role: topEntries(countBy(jobs, (job) => job.job_title), 1)[0]?.name || "—",
      skills: topEntries(skillCounts(jobs), 4).map((item) => item.name),
    };
  }), [companies, filteredJobs]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageIntro title="Who is hiring—and for what?">See the employers with the strongest listing volume and the roles, cities and technologies behind that demand.</PageIntro>
      <ChartCard title="Top 20 hiring companies" subtitle="Ranked by active filtered job listings">
        {companies.length ? <SkillsBarChart data={companies} height={520} /> : <EmptyState />}
      </ChartCard>
      <section className="panel mt-5 overflow-hidden">
        <div className="border-b px-5 py-4"><h3 className="text-sm font-bold text-slate-900 dark:text-white">Company hiring profiles</h3><p className="mt-1 text-xs text-slate-500">A compact look at where and how each top employer is hiring.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/60"><tr><th className="px-5 py-3">Company</th><th className="px-5 py-3">Jobs</th><th className="px-5 py-3">Cities</th><th className="px-5 py-3">Top role</th><th className="px-5 py-3">Skills they hire for</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">{rows.map((row) => <tr key={row.name} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-900/30"><td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{row.name}</td><td className="px-5 py-4">{row.value}</td><td className="px-5 py-4 text-slate-500 dark:text-slate-400">{row.cities.join(", ")}</td><td className="max-w-64 px-5 py-4">{row.role}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{row.skills.map((skill) => <span key={skill} className="badge border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">{skill}</span>)}</div></td></tr>)}</tbody></table></div>
      </section>
    </>
  );
}
