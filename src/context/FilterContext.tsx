"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { fetchJobs } from "@/lib/data";
import { Job } from "@/lib/types";

export type DateRange = "7" | "30" | "90" | "all";
interface FilterContextValue {
  jobs: Job[]; filteredJobs: Job[]; city: string; jobType: string; dateRange: DateRange;
  setCity: (value: string) => void; setJobType: (value: string) => void;
  setDateRange: (value: DateRange) => void; resetFilters: () => void;
  lastUpdated: string; loading: boolean; error: string | null;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("All cities");
  const [jobType, setJobType] = useState("All types");
  const [dateRange, setDateRange] = useState<DateRange>("90");

  useEffect(() => {
    fetchJobs().then((payload) => {
      setJobs(payload.jobs);
      setLastUpdated(payload.last_updated);
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  const filteredJobs = useMemo(() => {
    const cutoff = dateRange === "all" ? null : new Date(Date.now() - Number(dateRange) * 86400000);
    return jobs.filter((job) => {
      if (city !== "All cities" && job.city !== city) return false;
      if (jobType !== "All types" && job.job_type !== jobType) return false;
      return !cutoff || new Date(`${job.posted_date}T23:59:59`) >= cutoff;
    });
  }, [jobs, city, jobType, dateRange]);

  const resetFilters = () => { setCity("All cities"); setJobType("All types"); setDateRange("90"); };

  return <FilterContext.Provider value={{ jobs, filteredJobs, city, jobType, dateRange, setCity, setJobType, setDateRange, resetFilters, lastUpdated, loading, error }}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used inside FilterProvider");
  return context;
}
