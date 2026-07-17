"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState, ErrorState, LoadingState, PageIntro } from "@/components/ui";
import { useFilters } from "@/context/FilterContext";
import { EXPERIENCE_LEVELS, formatSalary, JOB_TYPES, shortDate, STANDARD_SKILLS } from "@/lib/data";

const PAGE_SIZE = 25;

export default function ExplorerPage() {
  const { filteredJobs, loading, error } = useFilters();
  const [search, setSearch] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("All experience");
  const [jobType, setJobType] = useState("All types");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const results = useMemo(() => filteredJobs.filter((job) => {
    const haystack = `${job.job_title} ${job.company_name} ${job.description} ${job.skills.join(" ")}`.toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (skills.length && !skills.every((skill) => job.skills.includes(skill))) return false;
    if (experience !== "All experience" && job.experience_level !== experience) return false;
    if (jobType !== "All types" && job.job_type !== jobType) return false;
    const min = Number(salaryMin) || 0;
    const max = Number(salaryMax) || Number.POSITIVE_INFINITY;
    if (salaryMin && (job.salary_max === null || job.salary_max < min)) return false;
    if (salaryMax && (job.salary_min === null || job.salary_min > max)) return false;
    return true;
  }).sort((a, b) => b.posted_date.localeCompare(a.posted_date)), [filteredJobs, search, skills, experience, jobType, salaryMin, salaryMax]);

  useEffect(() => { setPage(1); setExpanded(null); }, [search, skills, experience, jobType, salaryMin, salaryMax, filteredJobs]);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const toggleSkill = (skill: string) => setSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]);
  const clearLocal = () => { setSearch(""); setSkills([]); setExperience("All experience"); setJobType("All types"); setSalaryMin(""); setSalaryMax(""); };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <>
      <PageIntro title="Search every listing in one place">Combine text, skill, experience, arrangement and salary filters. Select a row to inspect its full details.</PageIntro>
      <section className="panel p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.6fr)_repeat(4,minmax(135px,.7fr))_auto]">
          <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} className="input w-full pl-9" placeholder="Search title, company or keyword" /></label>
          <details className="relative"><summary className="input flex cursor-pointer list-none items-center justify-between gap-2"><span className="truncate">{skills.length ? `${skills.length} skill${skills.length > 1 ? "s" : ""}` : "All skills"}</span><ChevronDown size={15} /></summary><div className="absolute left-0 z-20 mt-2 max-h-72 w-64 overflow-auto rounded-xl border bg-white p-2 shadow-2xl dark:bg-slate-900">{STANDARD_SKILLS.map((skill) => <label key={skill} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><input type="checkbox" checked={skills.includes(skill)} onChange={() => toggleSkill(skill)} className="accent-indigo-500" />{skill}</label>)}</div></details>
          <select className="input" value={experience} onChange={(e) => setExperience(e.target.value)}><option>All experience</option>{EXPERIENCE_LEVELS.map((level) => <option key={level}>{level}</option>)}</select>
          <select className="input" value={jobType} onChange={(e) => setJobType(e.target.value)}><option>All types</option>{JOB_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
          <div className="flex gap-2"><input className="input w-full min-w-0" type="number" min="0" step="10000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="Min PKR" aria-label="Minimum salary" /><input className="input w-full min-w-0" type="number" min="0" step="10000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="Max PKR" aria-label="Maximum salary" /></div>
          <button type="button" onClick={clearLocal} className="grid h-10 w-10 place-items-center rounded-xl border text-slate-400 hover:border-indigo-400 hover:text-indigo-500" aria-label="Clear explorer filters"><X size={17} /></button>
        </div>
        {skills.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <button key={skill} onClick={() => toggleSkill(skill)} className="badge gap-1 border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">{skill}<X size={12} /></button>)}</div>}
      </section>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{results.length.toLocaleString()} matching jobs</h3><p className="mt-1 text-xs text-slate-500">Skill selections use AND matching.</p></div><span className="flex items-center gap-2 text-xs text-slate-400"><SlidersHorizontal size={15} /> Page {page} of {pageCount}</span></div>
        {!visible.length ? <EmptyState /> : <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/60"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Skills</th><th className="px-4 py-3">Experience</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Salary</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Source</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">{visible.map((job) => <JobRows key={job.id} job={job} open={expanded === job.id} onToggle={() => setExpanded(expanded === job.id ? null : job.id)} />)}</tbody></table></div>}
        <div className="flex items-center justify-between border-t px-5 py-4"><p className="text-xs text-slate-500">Showing {visible.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, results.length)} of {results.length}</p><div className="flex gap-2"><button className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page"><ChevronLeft size={16} /></button><button className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} aria-label="Next page"><ChevronRight size={16} /></button></div></div>
      </section>
    </>
  );
}

function JobRows({ job, open, onToggle }: { job: import("@/lib/types").Job; open: boolean; onToggle: () => void }) {
  return <>
    <tr onClick={onToggle} className="cursor-pointer align-top transition hover:bg-slate-50/70 dark:hover:bg-slate-900/30" aria-expanded={open}><td className="max-w-64 px-4 py-4 font-semibold text-slate-900 dark:text-white">{job.job_title}</td><td className="max-w-52 px-4 py-4">{job.company_name}</td><td className="px-4 py-4">{job.city}</td><td className="max-w-64 px-4 py-4"><div className="flex flex-wrap gap-1">{job.skills.slice(0, 3).map((skill) => <span key={skill} className="badge border-slate-200 bg-slate-50 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{skill}</span>)}{job.skills.length > 3 && <span className="text-xs text-slate-400">+{job.skills.length - 3}</span>}</div></td><td className="px-4 py-4">{job.experience_level}</td><td className="px-4 py-4"><span className="badge border-indigo-200 text-indigo-600 dark:border-indigo-500/30 dark:text-indigo-300">{job.job_type}</span></td><td className="whitespace-nowrap px-4 py-4">{formatSalary(job.salary_min, job.salary_max)}</td><td className="whitespace-nowrap px-4 py-4">{shortDate(job.posted_date)}</td><td className="px-4 py-4">{job.source}</td></tr>
    {open && <tr className="bg-indigo-50/50 dark:bg-indigo-500/5"><td colSpan={9} className="px-5 py-5"><div className="grid gap-5 lg:grid-cols-[1fr_auto]"><div><p className="text-sm font-bold text-slate-900 dark:text-white">Job details</p><p className="mt-2 max-w-4xl whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{job.description || "No extended description was provided by the source."}</p><div className="mt-3 flex flex-wrap gap-2">{job.skills.map((skill) => <span key={skill} className="badge border-indigo-200 bg-white text-indigo-600 dark:border-indigo-500/20 dark:bg-slate-900 dark:text-indigo-300">{skill}</span>)}</div></div>{job.job_url && <a href={job.job_url} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white hover:bg-indigo-600">View original <ExternalLink size={15} /></a>}</div></td></tr>}
  </>;
}
