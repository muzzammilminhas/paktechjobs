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

export interface HistoryPoint {
  date: string;
  total: number;
  skills: Record<string, number>;
  cities: Record<string, number>;
  experience: Record<string, number>;
  job_types: Record<string, number>;
}

export interface SeriesDatum { name: string; value: number }
