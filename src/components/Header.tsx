"use client";

import { usePathname } from "next/navigation";
import { Clock3 } from "lucide-react";
import { GlobalFilters } from "@/components/GlobalFilters";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useFilters } from "@/context/FilterContext";

const titles: Record<string, { eyebrow: string; title: string }> = {
  "/": { eyebrow: "Market snapshot", title: "Overview" },
  "/skills": { eyebrow: "Demand intelligence", title: "Skills" },
  "/cities": { eyebrow: "Location intelligence", title: "Cities" },
  "/companies": { eyebrow: "Hiring landscape", title: "Companies" },
  "/trends": { eyebrow: "30-day movement", title: "Trends" },
  "/explorer": { eyebrow: "Listing database", title: "Job Explorer" },
};

export function Header() {
  const pathname = usePathname();
  const copy = titles[pathname] || titles["/"];
  const { lastUpdated } = useFilters();
  const updated = lastUpdated ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastUpdated)) : "Loading data…";
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/90 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center justify-between gap-4">
          <div><p className="eyebrow">{copy.eyebrow}</p><h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{copy.title}</h1></div>
          <div className="xl:hidden"><ThemeToggle /></div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <GlobalFilters />
          <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 xl:block" />
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Clock3 size={15} /><span><span className="hidden sm:inline">Updated </span>{updated}</span></div>
          <div className="hidden xl:block"><ThemeToggle /></div>
        </div>
      </div>
    </header>
  );
}
