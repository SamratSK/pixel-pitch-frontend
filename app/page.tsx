"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Sparkles, UploadCloud, Workflow } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatsBand } from "@/components/stats-band";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEFAULT_STATS = { total: 1280, flagged: 214, averageMs: 8.6 };
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const FLOW_STEPS = [
  {
    title: "Front door",
    body: "FastAPI app (app.py) with optional guardian-key rate limit on /scan; serves static UI at /ui."
  },
  {
    title: "Auth (UI gating)",
    body: "File-based users.json via POST /auth/register + /auth/login; tokens are in-memory only and not required for scans."
  },
  {
    title: "Upload → storage",
    body: "POST /scan saves the APK to uploads/ and creates a ScanRecord with status pending."
  },
  {
    title: "Queue / worker",
    body: "If Redis is reachable, jobs push there; otherwise a local thread runs the scan. worker pulls and runs _run_scan."
  },
  {
    title: "Static analysis",
    body: "SHA256/size, zip entry counts, native .so flag, ASCII strings (frida/magisk/su/URLs), sample package entries, AndroidManifest.xml parse when available, optional YARA if configured."
  },
  {
    title: "Network scrape",
    body: "Secondary pass over strings to collect URLs/domains for IOC hints."
  },
  {
    title: "Dynamic plan",
    body: "Returns a recommended sandbox playbook (no execution)."
  },
  {
    title: "External services (optional)",
    body: "VirusTotal + Hybrid Analysis submit/report if API keys set; submission IDs/reports live under result.external."
  },
  {
    title: "Heuristic verdict",
    body: "Combines static/network flags into score + verdict (malicious_suspect vs unknown), with reasons."
  },
  {
    title: "Persistence",
    body: "Result/status stored in memory or Redis; GET /scan/{scan_id} serves the record for polling."
  },
  {
    title: "Metrics",
    body: "metrics.py tracks totals, flagged/malicious counts, and avg duration over last 30; exposed at GET /stats."
  },
  {
    title: "UI loop",
    body: "Static page posts to /scan then polls /scan/{scan_id} until finished/failed, rendering JSON + logs."
  }
];

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    const controller = new AbortController();
    const loadStats = async () => {
      try {
        const headers: Record<string, string> = {};
        const envKey = process.env.NEXT_PUBLIC_GUARDIAN_KEY;
        if (envKey) headers["guardian-key"] = envKey;
        const res = await fetch(`${API_BASE}/stats`, { headers, signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setStats((prev) => ({
          total: Number(data?.total_scans) || prev.total,
          flagged: Number(data?.flagged_scans ?? data?.malicious_scans) || prev.flagged,
          averageMs: Number(data?.avg_duration_seconds_last_30) || prev.averageMs
        }));
      } catch {
        // leave defaults on error
      }
    };
    loadStats();
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guardian</p>
              <p className="text-lg font-semibold">Security cockpit</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <Link className="hover:text-primary" href="/upload">
                Upload
              </Link>
            </nav>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link className="hover:text-primary" href="/auth/login">
                Login
              </Link>
              <Link className="hover:text-primary" href="/auth/register">
                Register
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-10">
        <section id="home" className="flex min-h-[60vh] items-center justify-center px-4 py-8">
          <div className="max-w-4xl space-y-7 text-center">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-white/70 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-sm dark:bg-slate-900/70">
              <Sparkles className="h-4 w-4 text-primary" />
              Mobile threat lab
            </div>
            <div className="space-y-5">
              <h1 className="text-5xl font-semibold leading-tight sm:text-6xl">Stay ahead of shady releases.</h1>
              <p className="text-xl text-muted-foreground">
                Drop an APK and exhale—we will guide you straight to the upload desk when you are ready. The cockpit and verdicts are one click away.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="mr-2 h-5 w-5" />
                Upload APK
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) router.push("/upload");
                }}
              />
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Analytics snapshot</p>
              <p className="text-lg font-semibold">Fresh numbers with space to breathe.</p>
            </div>
            <Badge variant="default">Live</Badge>
          </div>
          <div className="mt-4 w-full">
            <StatsBand total={stats.total} flagged={stats.flagged} averageMs={stats.averageMs} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Workflow</p>
              <p className="text-lg font-semibold">How the pipeline runs end-to-end</p>
            </div>
          </div>
          <div className="relative rounded-3xl border border-border/70 bg-white/60 p-6 shadow-sm dark:bg-slate-900/70">
            <div className="space-y-4">
              {FLOW_STEPS.map((step, idx) => (
                <div key={step.title} className="relative pl-6">
                  {idx < FLOW_STEPS.length - 1 && (
                    <div
                      className="absolute left-[9px] top-6 bottom-0 w-px bg-gradient-to-b from-primary/60 to-transparent"
                      aria-hidden
                    />
                  )}
                  <div className="absolute left-0 top-4 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                  <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm dark:bg-slate-900/60">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{step.title}</span>
                      <span className="text-xs font-mono text-muted-foreground">0{idx + 1}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-center border-t border-border/60 py-6 text-sm text-muted-foreground">
          Made with ❤️ by Nithyaneshwar and Samrat
        </footer>
      </div>
    </main>
  );
}
