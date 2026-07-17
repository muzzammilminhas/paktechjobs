"use client";

import { RotateCcw } from "lucide-react";
import { CITIES, JOB_TYPES } from "@/lib/data";
import { DateRange, useFilters } from "@/context/FilterContext";

export function GlobalFilters() {
  const { city, jobType, dateRange, setCity, setJobType, setDateRange, resetFilters } = useFilters();
  return (
    <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
      <select className="input min-w-32 flex-1 lg:flex-none" aria-label="Filter by city" value={city} onChange={(e) => setCity(e.target.value)}>
        <option>All cities</option>{CITIES.map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="input min-w-28 flex-1 lg:flex-none" aria-label="Filter by job type" value={jobType} onChange={(e) => setJobType(e.target.value)}>
        <option>All types</option>{JOB_TYPES.map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="input min-w-28 flex-1 lg:flex-none" aria-label="Filter by date range" value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)}>
        <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option>
      </select>
      <button type="button" onClick={resetFilters} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-indigo-500 dark:hover:bg-slate-800" aria-label="Reset global filters"><RotateCcw size={17} /></button>
    </div>
  );
}
