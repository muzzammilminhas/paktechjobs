"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, MapPin, Sparkles, TrendingUp } from "lucide-react";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendLine } from "@/components/charts/TrendLine";
import { ChartCard, EmptyState, ErrorState, LoadingState, PageIntro } from "@/components/ui";
import { useFilters } from "@/context/FilterContext";
import { countBy, fetchHistory, shortDate, skillCounts, topEntries } from "@/lib/data";
import { HistoryPoint } from "@/lib/types";

const metricIcons = [BriefcaseBusiness, Building2, Sparkles, MapPin];

export default function OverviewPage() {
  const { filteredJobs, loading, error } = useFilters();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  useEffect(() => { fetchHistory().then(setHistory).catch(() => setHistory([])); }, []);

  const metrics = useMemo(() => {
    const companies = new Set(filteredJobs.map((job) => job.company_name)).size;
    const skill = topEntries(skillCounts(filteredJobs), 1)[0]?.name || "—";
    const city = topEntries(countBy(filteredJobs, (job) => job.city), 1)[0]?.name || "—";
    return [
      { label: "Total jobs", value: filteredJobs.length.toLocaleString(), detail: "Active in selected range" },
      { label: "Companies", value: companies.toLocaleString(), detail: "Distinct employers" },
      { label: "Top skill", value: skill, detail: "Most requested technology" },
      { label: "Top city", value: city, detail: "Largest hiring market" },
    ];
  }, [filteredJobs]);

  const ratios = topEntries(countBy(filteredJobs, (job) => job.job_type), 3);
  const lineData = history.slice(-30).map((point) => ({ date: shortDate(point.date), jobs: point.total }));

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageIntro title="Pakistan’s tech hiring market, at a glance">Track current demand and spot movement across job portals. Every number responds to the global filters above.</PageIntro>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[index];
          return <article key={metric.label} className="panel relative overflow-hidden p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.label}</p><p className="mt-3 truncate text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white" title={metric.value}>{metric.value}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10"><Icon size={19} /></span></div><p className="mt-4 text-xs text-slate-400">{metric.detail}</p></article>;
        })}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard title="Jobs posted over time" subtitle="Daily market volume from the last 30 saved snapshots">
          {lineData.length ? <TrendLine data={lineData} lines={[{ key: "jobs", label: "Jobs", color: "#6366f1" }]} /> : <EmptyState>Historical data will appear after the first snapshot.</EmptyState>}
        </ChartCard>
        <ChartCard title="Work arrangement" subtitle="Remote, onsite and hybrid share of filtered listings">
          {ratios.length ? <DonutChart data={ratios} /> : <EmptyState />}
        </ChartCard>
      </section>
      <section className="mt-5 panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="eyebrow">Signal check</p><h3 className="mt-1 font-bold text-slate-950 dark:text-white">{filteredJobs.length ? `${metrics[2].value} leads current demand` : "No market signal in this filter"}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use Skills and Trends for a deeper view of the technologies behind hiring.</p></div>
        <span className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><TrendingUp size={17} /> Live dataset</span>
      </section>
    </>
  );
}
