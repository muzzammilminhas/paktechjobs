"use client";

import { useMemo } from "react";
import { SkillsBarChart } from "@/components/charts/SkillsBarChart";
import { SkillsHeatmap } from "@/components/charts/SkillsHeatmap";
import { ExperienceChart } from "@/components/charts/ExperienceChart";
import { ChartCard, EmptyState, ErrorState, LoadingState, PageIntro } from "@/components/ui";
import { useFilters } from "@/context/FilterContext";
import { CITIES, EXPERIENCE_LEVELS, skillCounts, topEntries } from "@/lib/data";

export default function SkillsPage() {
  const { filteredJobs, loading, error } = useFilters();
  const topSkills = useMemo(() => topEntries(skillCounts(filteredJobs), 20), [filteredJobs]);

  const heatmap = useMemo(() => topSkills.slice(0, 12).map(({ name }) => ({
    skill: name,
    values: Object.fromEntries(CITIES.map((city) => [city, filteredJobs.filter((job) => job.city === city && job.skills.includes(name)).length])),
  })), [filteredJobs, topSkills]);

  const experience = useMemo(() => topSkills.slice(0, 10).map(({ name }) => ({
    name,
    ...Object.fromEntries(EXPERIENCE_LEVELS.map((level) => [level, filteredJobs.filter((job) => job.experience_level === level && job.skills.includes(name)).length])),
  })), [filteredJobs, topSkills]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageIntro title="Which technologies are employers asking for?">Compare overall demand, geographic concentration and the seniority mix behind each skill.</PageIntro>
      <div className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <ChartCard title="Top 20 skills" subtitle="Number of filtered listings that mention each skill">
          {topSkills.length ? <SkillsBarChart data={topSkills} /> : <EmptyState />}
        </ChartCard>
        <div className="grid gap-5">
          <ChartCard title="Skills demand heatmap" subtitle="Darker cells indicate more jobs in that city">
            {heatmap.length ? <SkillsHeatmap data={heatmap} cities={CITIES} /> : <EmptyState />}
          </ChartCard>
          <ChartCard title="Skill demand by experience" subtitle="Top skills split across standardized seniority levels">
            {experience.length ? <ExperienceChart data={experience} keys={EXPERIENCE_LEVELS} /> : <EmptyState />}
          </ChartCard>
        </div>
      </div>
    </>
  );
}
