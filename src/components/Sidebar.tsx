"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, Building2, Compass, MapPin, Radar, Sparkles } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Overview", icon: Radar },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/cities", label: "Cities", icon: MapPin },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/trends", label: "Trends", icon: BarChart3 },
  { href: "/explorer", label: "Explorer", icon: Compass },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="PakTechJobs home">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-white shadow-glow"><BriefcaseBusiness size={20} /></span>
      <span><span className="block text-base font-extrabold tracking-tight text-slate-950 dark:text-white">PakTechJobs</span><span className="block text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Market intelligence</span></span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200/80 bg-white/90 px-4 py-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:block">
      <div className="px-2"><Brand /></div>
      <nav className="mt-9 space-y-1" aria-label="Main navigation">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} className={clsx("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition", active ? "bg-indigo-500 text-white shadow-glow" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white")}><Icon size={18} /><span>{label}</span></Link>;
        })}
      </nav>
      <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
        <p className="eyebrow">Daily pulse</p>
        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Fresh listings, every morning.</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Rozee · Mustakbil · Glassdoor</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-between overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 lg:hidden" aria-label="Mobile navigation">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link key={href} href={href} aria-label={label} className={clsx("flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold", active ? "bg-indigo-500 text-white" : "text-slate-500 dark:text-slate-400")}><Icon size={17} /><span>{label}</span></Link>;
      })}
    </nav>
  );
}
