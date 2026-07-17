"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendLine } from "@/components/charts/TrendLine";
import { ExperienceChart } from "@/components/charts/ExperienceChart";
import { ChartCard, EmptyState, ErrorState, LoadingState, PageIntro } from "@/components/ui";
import { useFilters } from "@/context/FilterContext";
import { CITIES, EXPERIENCE_LEVELS, fetchHistory, shortDate, skillCounts, topEntries } from "@/lib/data";
import { HistoryPoint } from "@/lib/types";

const palette = ["#6366f1", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6", "#0ea5e9", "#84cc16"];

export default function TrendsPage() {
  const { jobs, loading, error } = useFilters();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  useEffect(() => { fetchHistory().then((data) => setHistory(data.slice(-30))).catch(() => setHistory([])); }, []);
  const topSkills = useMemo(() => topEntries(skillCounts(jobs), 5).map((item) => item.name), [jobs]);

  const skillData = history.map((point) => ({ date: shortDate(point.date), ...Object.fromEntries(topSkills.map((skill, index) => [`s${index}`, point.skills[skill] || 0])) }));
  const cityData = history.map((point) => ({ date: shortDate(point.date), ...Object.fromEntries(CITIES.slice(0, 5).map((city, index) => [`c${index}`, point.cities[city] || 0])) }));
  const experienceData = history.map((point) => ({ name: shortDate(point.date), ...Object.fromEntries(EXPERIENCE_LEVELS.map((level) => [level, point.experience[level] || 0])) }));

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageIntro title="How is demand moving over time?">Thirty daily snapshots reveal whether technologies, locations and experience bands are gaining or losing momentum.</PageIntro>
      {!history.length ? <div className="panel"><EmptyState>Trend snapshots are not available yet.</EmptyState></div> : <div className="grid gap-5">
        <ChartCard title="Top 5 skills over time" subtitle="Daily listing counts for the current market-leading skills"><TrendLine data={skillData} lines={topSkills.map((skill, index) => ({ key: `s${index}`, label: skill, color: palette[index] }))} /></ChartCard>
        <ChartCard title="City-wise job postings" subtitle="Daily demand in the five primary tech markets"><TrendLine data={cityData} lines={CITIES.slice(0, 5).map((city, index) => ({ key: `c${index}`, label: city, color: palette[index] }))} /></ChartCard>
        <ChartCard title="Experience-level demand" subtitle="How daily listings are distributed by seniority"><ExperienceChart data={experienceData} keys={EXPERIENCE_LEVELS} height={350} /></ChartCard>
      </div>}
    </>
  );
}
