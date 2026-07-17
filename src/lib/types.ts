export type City = "Lahore" | "Karachi" | "Islamabad" | "Rawalpindi" | "Peshawar" | "Remote" | "Other";
export type ExperienceLevel = "Entry Level" | "Mid Level" | "Senior" | "Lead/Manager";
export type JobType = "Onsite" | "Remote" | "Hybrid";

export interface Job {
  id: string;
  job_title: string;
  company_name: string;
  city: City;
  skills: string[];
  experience_level: ExperienceLevel;
  job_type: JobType;
  salary_min: number | null;
  salary_max: number | null;
  posted_date: string;
  source: string;
  description: string;
  job_url: string;
}

export interface JobsPayload { last_updated: string; count: number; jobs: Job[] }

export type SourceStatus = "healthy" | "degraded" | "cached" | "failed";

export interface SourceHealthItem {
  source: string;
  status: SourceStatus;
  live_count: number;
  cached_count: number;
  effective_count: number;
  last_success_at: string | null;
  message: string;
}

export interface SourceHealthPayload {
  generated_at: string;
  publish_status: "published" | "preserved";
  publish_message: string;
  guard_streak: number;
  previous_count: number;
  published_count: number;
  fresh_sources: number;
  cached_sources: number;
  failed_sources: number;
  total_sources: number;
  cache_ttl_days: number;
  sources: SourceHealthItem[];
}

export interface HistoryPoint {
  date: string;
  total: number;
  skills: Record<string, number>;
  cities: Record<string, number>;
  experience: Record<string, number>;
  job_types: Record<string, number>;
}

export interface SeriesDatum { name: string; value: number }
