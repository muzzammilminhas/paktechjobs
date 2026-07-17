import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";
import { Header } from "@/components/Header";
import { MobileNav, Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: { default: "PakTechJobs — Pakistan Tech Job Market", template: "%s | PakTechJobs" },
  description: "Daily intelligence on technology jobs, skills, cities and hiring companies across Pakistan.",
  applicationName: "PakTechJobs",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">{`
          try { if (localStorage.getItem('paktechjobs-theme') === 'light') document.documentElement.classList.remove('dark'); } catch (_) {}
        `}</Script>
        <AppProviders>
          <div className="min-h-screen lg:pl-64">
            <Sidebar />
            <Header />
            <main className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
              {children}
            </main>
            <MobileNav />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
