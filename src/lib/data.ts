import { HistoryPoint, Job, JobsPayload, SourceHealthPayload } from "@/lib/types";

export const STANDARD_SKILLS = [
  "Flutter", "React", "Next.js", "Node.js", "Python", "Django", "FastAPI", "Java", "Spring",
  "PHP", "Laravel", "Vue", "Angular", "TypeScript", "JavaScript", "Dart", "SQL", "PostgreSQL",
  "MongoDB", "Firebase", "Supabase", "AWS", "Docker", "Kubernetes", "AI/ML", "TensorFlow",
  "PyTorch", "QA", "Selenium", "Cypress", "iOS", "Android", "Unity", "C++", "C#", "Kotlin", "Swift",
] as const;

export const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Peshawar", "Remote", "Other"];
export const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior", "Lead/Manager"];
export const JOB_TYPES = ["Onsite", "Remote", "Hybrid"];

export async function fetchJobs(): Promise<JobsPayload> {
  const response = await fetch("/data/jobs.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load jobs data");
  const payload = (await response.json()) as JobsPayload | Job[];
  return Array.isArray(payload)
    ? { last_updated: new Date().toISOString(), count: payload.length, jobs: payload }
    : payload;
}

export async function fetchHistory(): Promise<HistoryPoint[]> {
  const response = await fetch("/data/history/index.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load history data");
  return (await response.json()) as HistoryPoint[];
}

export async function fetchSourceHealth(): Promise<SourceHealthPayload> {
  const response = await fetch("/data/source_health.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load source health data");
  return (await response.json()) as SourceHealthPayload;
}

export function countBy<T>(items: T[], pick: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = pick(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function topEntries(counts: Record<string, number>, limit = 20) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export function skillCounts(jobs: Job[]) {
  const counts: Record<string, number> = {};
  jobs.forEach((job) => job.skills.forEach((skill) => (counts[skill] = (counts[skill] || 0) + 1)));
  return counts;
}

export function formatSalary(min: number | null, max: number | null) {
  if (min === null && max === null) return "Not disclosed";
  const format = (value: number) => `PKR ${Math.round(value / 1000)}k`;
  if (min !== null && max !== null) return `${format(min)} – ${format(max)}`;
  return min !== null ? `From ${format(min)}` : `Up to ${format(max as number)}`;
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`));
}
