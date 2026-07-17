import { ReactNode } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";

export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return <div className="mb-5"><h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{children}</p></div>;
}

export function ChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <section className={`panel min-w-0 p-5 ${className}`}><div className="mb-5"><h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>{subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}</div>{children}</section>;
}

export function LoadingState() {
  return <div className="panel grid min-h-72 place-items-center"><div className="text-center text-slate-500"><LoaderCircle className="mx-auto mb-3 animate-spin text-indigo-500" /><p className="text-sm">Loading market data…</p></div></div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="panel grid min-h-72 place-items-center p-8 text-center"><div><AlertTriangle className="mx-auto mb-3 text-amber-500" /><h2 className="font-bold text-slate-900 dark:text-white">Data could not be loaded</h2><p className="mt-2 text-sm text-slate-500">{message}</p></div></div>;
}

export function EmptyState({ children = "No jobs match the current filters." }: { children?: ReactNode }) {
  return <div className="grid h-64 place-items-center text-center text-sm text-slate-500">{children}</div>;
}
