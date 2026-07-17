"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, Database, MapPin, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { DonutChart } from "@/components/charts/DonutChart";
import { TrendLine } from "@/components/charts/TrendLine";
import { ChartCard, EmptyState, ErrorState, LoadingState, PageIntro } from "@/components/ui";
import { useFilters } from "@/context/FilterContext";
import { countBy, fetchHistory, shortDate, skillCounts, topEntries } from "@/lib/data";
import { HistoryPoint, SourceStatus } from "@/lib/types";

const metricIcons = [BriefcaseBusiness, Building2, Sparkles, MapPin];
const sourceStyles: Record<SourceStatus, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  degraded: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  cached: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300",
  failed: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
};
const sourceLabels: Record<SourceStatus, string> = { healthy: "Live", degraded: "Guarded", cached: "Cached", failed: "Unavailable" };

function sourceFreshness(value: string | null) {
  if (!value) return "No successful run yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last success unavailable";
  return `Last success ${new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date)}`;
}

export default function OverviewPage() {
  const { filteredJobs, loading, error, sourceHealth } = useFilters();
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
      {sourceHealth && (
        <section className="mt-5 panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Source reliability</p>
              <h3 className="mt-1 font-bold text-slate-950 dark:text-white">Protected multi-source pipeline</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{sourceHealth.publish_message}</p>
            </div>
            <span className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${sourceHealth.publish_status === "published" ? sourceStyles.healthy : sourceStyles.degraded}`}>
              <ShieldCheck size={16} /> {sourceHealth.fresh_sources}/{sourceHealth.total_sources} sources live · {sourceHealth.cached_sources} cached
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {sourceHealth.sources.map((source) => (
              <article key={source.source} className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-slate-700/70 dark:bg-slate-900/30" title={source.message}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{source.source}</p>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${sourceStyles[source.status]}`}>{sourceLabels[source.status]}</span>
                </div>
                <div className="mt-4 flex items-end gap-2"><Database size={16} className="mb-1 text-slate-400" /><strong className="text-2xl text-slate-950 dark:text-white">{source.effective_count}</strong><span className="mb-1 text-xs text-slate-400">active jobs</span></div>
                <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{sourceFreshness(source.last_success_at)}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">A failed portal can use its last successful cache for up to {sourceHealth.cache_ttl_days} days. Large unexplained drops are held for two confirmation runs.</p>
        </section>
      )}
      <section className="mt-5 panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="eyebrow">Signal check</p><h3 className="mt-1 font-bold text-slate-950 dark:text-white">{filteredJobs.length ? `${metrics[2].value} leads current demand` : "No market signal in this filter"}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use Skills and Trends for a deeper view of the technologies behind hiring.</p></div>
        <span className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><TrendingUp size={17} /> Guarded dataset</span>
      </section>
    </>
  );
}
