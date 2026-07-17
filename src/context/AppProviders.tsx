"use client";

import { ReactNode } from "react";
import { FilterProvider } from "@/context/FilterContext";
import { ThemeProvider } from "@/context/ThemeContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider><FilterProvider>{children}</FilterProvider></ThemeProvider>;
}
