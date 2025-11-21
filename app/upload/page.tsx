"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UploadCard } from "@/components/upload-card";
import { RunSteps, type RunStep, type StepStatus } from "@/components/run-steps";
import { ResultPanel } from "@/components/result-panel";
import { LogConsole, type LogLine } from "@/components/log-console";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ScanResult = {
  verdict?: string;
  heuristic_score?: number;
  external_ids?: string[];
  [key: string]: unknown;
};

type UserSession = { username?: string; email?: string; token?: string; expires_at?: number };
type OutcomeHighlights = {
  score: number;
  verdict?: string;
  family?: string;
  yaraMatches: number;
  iocCount: number;
  storefrontAlert: boolean;
  edrHints: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

const DEFAULT_STEPS: RunStep[] = [
  { id: "upload", label: "Upload artifact", description: "Push sample to pipeline", status: "pending" },
  { id: "static", label: "Static analysis", description: "PE headers, imports, entropy", status: "pending" },
  { id: "network", label: "Network scrape", description: "URI, DNS, and beacon detection", status: "pending" },
  { id: "yara", label: "YARA rules", description: "Match against curated rulesets", status: "pending" },
  { id: "external", label: "VT / HA lookups", description: "Enrich with external intel", status: "pending" },
  { id: "heuristic", label: "Heuristic verdict", description: "Blend signals into a score", status: "pending" }
];

export default function UploadPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<RunStep[]>(DEFAULT_STEPS);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [scanId, setScanId] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | undefined>();
  const [verdict, setVerdict] = useState<string | undefined>();
  const [heuristic, setHeuristic] = useState<number | undefined>();
  const [externalIds, setExternalIds] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeHighlights>({
    score: 0,
    verdict: "pending",
    family: "unknown",
    yaraMatches: 0,
    iocCount: 0,
    storefrontAlert: false,
    edrHints: []
  });
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState({ total: 1280, flagged: 214, averageMs: 8.6 });
  const startedAt = useRef<number | null>(null);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

  const progress = useMemo(() => {
    const successes = steps.filter((s) => s.status === "success").length;
    const running = steps.some((s) => s.status === "running");
    const base = (successes / steps.length) * 100;
    return Math.min(100, base + (running ? 8 : 0));
  }, [steps]);

  useEffect(() => {
    const loadSession = () => {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("guardian:user") ?? localStorage.getItem("pixel-pitch:user")
          : null;
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          // ignore malformed payloads
        }
      }
    };
    loadSession();

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const setStepStatus = (id: string, status: StepStatus) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, status } : step)));
  };

  const deriveOutcomes = (data: any) => {
    const heuristicScoreRaw =
      typeof data?.heuristic_score === "number"
        ? data.heuristic_score
        : typeof data?.result?.heuristic?.score === "number"
        ? data.result.heuristic.score
        : undefined;
    const rawScore = heuristicScoreRaw !== undefined ? heuristicScoreRaw * (heuristicScoreRaw <= 1 ? 100 : 1) : 0;
    const heuristicScore = clampScore(100 - rawScore);
    const verdictLabel = data?.verdict ?? data?.result?.heuristic?.verdict;

    let family: string | undefined;
    const vtResults = data?.result?.external?.vt_report?.data?.attributes?.results;
    if (vtResults && typeof vtResults === "object") {
      const firstHit = Object.values(vtResults).find((entry: any) => entry?.result) as any;
      family = firstHit?.result;
    }

    const yaraMatches = Array.isArray(data?.result?.static?.yara?.matches)
      ? data.result.static.yara.matches.length
      : 0;
    const urls = Array.isArray(data?.result?.network?.urls) ? data.result.network.urls.length : 0;
    const domains = Array.isArray(data?.result?.network?.domains) ? data.result.network.domains.length : 0;
    const iocCount = urls + domains;

    const suspiciousStrings = Array.isArray(data?.result?.static?.suspicious_strings)
      ? data.result.static.suspicious_strings
      : [];
    const storefrontAlert = suspiciousStrings.some((s: string) => /google play|play services/i.test(s));
    const edrHintsSet = new Set<string>();
    suspiciousStrings.forEach((s: string) => {
      if (/frida/i.test(s)) edrHintsSet.add("Frida tooling present");
      if (/magisk/i.test(s)) edrHintsSet.add("Magisk/root traces");
      if (/\\bsu\\b|su\b/i.test(s)) edrHintsSet.add("su/root artifacts");
    });
    if (data?.result?.static?.has_native_code) edrHintsSet.add("Native code detected");

    setOutcomes({
      score: heuristicScore,
      verdict: verdictLabel,
      family: family || "unknown",
      yaraMatches,
      iocCount,
      storefrontAlert,
      edrHints: Array.from(edrHintsSet)
    });
  };

  const resetFlow = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
    setSteps(DEFAULT_STEPS);
    setLogs([]);
    setResult(undefined);
    setVerdict(undefined);
    setHeuristic(undefined);
    setExternalIds([]);
    setScanId(null);
    setOutcomes({
      score: 0,
      verdict: "pending",
      family: "unknown",
      yaraMatches: 0,
      iocCount: 0,
      storefrontAlert: false,
      edrHints: []
    });
  };

  const scoreTone = (value: number) => {
    if (value >= 70) return { track: "rgba(16, 185, 129, 0.15)", color: "rgb(16,185,129)" };
    if (value >= 40) return { track: "rgba(245, 158, 11, 0.18)", color: "rgb(245,158,11)" };
    return { track: "rgba(239, 68, 68, 0.18)", color: "rgb(239,68,68)" };
  };

  const adaptStatus = (value?: string): StepStatus => {
    if (!value) return "pending";
    if (["done", "success", "completed", "complete"].includes(value)) return "success";
    if (["running", "active", "in_progress"].includes(value)) return "running";
    if (["error", "failed"].includes(value)) return "error";
    return "pending";
  };

  const finalize = (status: "completed" | "failed", payload?: ScanResult) => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
    setIsScanning(false);
    const end = Date.now();
    const durationSec = startedAt.current ? (end - startedAt.current) / 1000 : stats.averageMs;
    const nextVerdict = payload?.verdict?.toLowerCase() ?? verdict;
    const flaggedRun = nextVerdict && !["clean", "benign", "passed"].includes(nextVerdict);

    setStats((prev) => {
      const total = prev.total + 1;
      const flagged = flaggedRun ? prev.flagged + 1 : prev.flagged;
      const averageMs = (prev.averageMs * prev.total + durationSec) / total;
      return { total, flagged, averageMs };
    });

    if (status === "failed") {
      toast.error("Scan failed", { description: "Check the console for details." });
      return;
    }

    toast.success("Scan completed", { description: `Finished in ${durationSec.toFixed(1)}s` });
  };

  const pollScan = async (id: string, headers: Record<string, string>) => {
    try {
      const response = await fetch(`${API_BASE}/scan/${id}`, { method: "GET", headers });
      if (!response.ok) {
        throw new Error(`Poll failed with ${response.status}`);
      }
      const data: any = await response.json();

      if (Array.isArray(data?.steps)) {
        setSteps((prev) =>
          prev.map((step) => {
            const incoming = data.steps.find((s: any) => s.id === step.id || s.name === step.label);
            return incoming ? { ...step, status: adaptStatus(incoming.status) } : step;
          })
        );
      } else {
        // fallback: auto-advance one pending step at a time
        setSteps((prev) => {
          const next = [...prev];
          const runningIdx = next.findIndex((s) => s.status === "running");
          if (runningIdx >= 0) {
            next[runningIdx] = { ...next[runningIdx], status: "success" };
            const pendingIdx = next.findIndex((s) => s.status === "pending");
            if (pendingIdx >= 0) next[pendingIdx] = { ...next[pendingIdx], status: "running" };
          }
          return next;
        });
      }

      if (Array.isArray(data?.logs)) {
        setLogs((prev) => {
          const merged = [...prev];
          data.logs.forEach((line: any) => {
            const message = typeof line === "string" ? line : line.message ?? "";
            if (message && !merged.some((l) => l.message === message)) {
              merged.push({
                level: (line.level ?? "info") as LogLine["level"],
                message,
                timestamp: line.timestamp
              });
            }
          });
          return merged.slice(-80);
        });
      }

      const incoming = {
        verdict: data?.verdict ?? data?.result?.verdict,
        heuristic_score: data?.heuristic_score ?? data?.result?.heuristic_score,
        external_ids: data?.external_ids ?? data?.result?.external_ids
      } satisfies ScanResult;

      setResult(data?.result ?? data);
      setVerdict(incoming.verdict);
      if (typeof incoming.heuristic_score === "number") setHeuristic(incoming.heuristic_score);
      if (incoming.external_ids) setExternalIds(incoming.external_ids);
      if (data) deriveOutcomes(data);

      if (data?.status === "completed") {
        setSteps((prev) => prev.map((s) => ({ ...s, status: s.status === "error" ? "error" : "success" })));
        finalize("completed", incoming);
        return;
      }

      if (data?.status === "failed") {
        setSteps((prev) => prev.map((s) => ({ ...s, status: s.status === "running" ? "error" : s.status })));
        finalize("failed");
        return;
      }

      pollTimer.current = setTimeout(() => pollScan(id, headers), 1300);
    } catch (error: any) {
      setLogs((prev) => [...prev, { level: "error", message: error?.message ?? "poll failed" }]);
      pollTimer.current = setTimeout(() => pollScan(id, headers), 1800);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.warning("Login required", { description: "Head to the Auth page to start a session." });
      return;
    }
    if (!file) {
      toast.error("Missing file", { description: "Drop a file to continue." });
      return;
    }
    resetFlow();
    startedAt.current = Date.now();
    setIsScanning(true);
    setStepStatus("upload", "running");
    setLogs([{ level: "info", message: `Uploading ${file.name}` }]);

    const form = new FormData();
    form.append("file", file);
    // optional helper text; backend treats missing source as null
    // form.append("source", source);
    const headers: Record<string, string> = {};
    const effectiveKey = process.env.NEXT_PUBLIC_GUARDIAN_KEY;
    if (effectiveKey) headers["guardian-key"] = effectiveKey;

    try {
      const response = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        body: form,
        headers
      });
      if (!response.ok) {
        throw new Error(`Upload failed with ${response.status}`);
      }
      const data: any = await response.json();
      const id = data?.scan_id ?? data?.id ?? crypto.randomUUID();
      setScanId(id);
      setStepStatus("upload", "success");
      setStepStatus("static", "running");
      setLogs((prev) => [...prev, { level: "info", message: `Queued scan ${id}` }]);
      pollScan(id, headers);
    } catch (error: any) {
      setStepStatus("upload", "error");
      setIsScanning(false);
      toast.error("Upload failed", { description: error?.message ?? "Unable to start scan" });
    }
  };

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
              <Link className="hover:text-primary" href="/">
                Home
              </Link>
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
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold">Upload your APK</h1>
              <p className="text-muted-foreground">
                Drop a build, add the source, and slide into the run view below. Clean and simple.
              </p>
            </div>
            <Badge variant={user ? "success" : "muted"} className="font-mono">
              {user ? user.username || user.email : "Login required"}
            </Badge>
          </div>
          {scanId && (
            <Badge variant="muted" className="font-mono">
              #{scanId}
            </Badge>
          )}
        </section>

        <section className="rounded-3xl border border-border/70 bg-white/70 p-6 shadow-sm dark:bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Outcomes</p>
              <p className="text-lg font-semibold">Derived from the latest scan</p>
            </div>
            <Badge
              variant={
                outcomes.verdict?.toLowerCase().includes("malicious") ? "destructive" : outcomes.verdict ? "default" : "muted"
              }
              className="capitalize"
            >
              {outcomes.verdict || "pending"}
            </Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
              {(() => {
                const tone = scoreTone(outcomes.score);
                return (
                  <div
                    className="relative h-20 w-20 shrink-0 rounded-full"
                    style={{
                      background: `conic-gradient(${tone.color} ${outcomes.score * 3.6}deg, ${tone.track} 0deg)`
                    }}
                    aria-hidden
                  >
                    <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center text-xl font-semibold">
                      {outcomes.score}
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-1">
                <p className="text-sm font-semibold">Malware score</p>
                <p className="text-xs text-muted-foreground">Heuristic score scaled to 0-100</p>
                <Badge variant="muted" className="capitalize">
                  {outcomes.verdict || "pending"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Family label</p>
                <Badge variant="muted">{outcomes.family || "unknown"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border/60 bg-white/70 p-3 text-muted-foreground dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-wide">YARA matches</p>
                  <p className="text-xl font-semibold text-foreground">{outcomes.yaraMatches}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-white/70 p-3 text-muted-foreground dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-wide">IOCs</p>
                  <p className="text-xl font-semibold text-foreground">{outcomes.iocCount}</p>
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-dashed border-amber-400/60 bg-amber-50/60 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="font-semibold text-amber-900 dark:text-amber-50">Storefront notifications</p>
                <p>{outcomes.storefrontAlert ? "Google Play related warnings present." : "No storefront warnings detected."}</p>
              </div>
              <div className="space-y-1 rounded-xl border border-dashed border-emerald-400/60 bg-emerald-50/60 p-3 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100">
                <p className="font-semibold text-emerald-900 dark:text-emerald-50">EDR-for-Android policy hints</p>
                {outcomes.edrHints.length ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {outcomes.edrHints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No anti-analysis/rooting hints flagged.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="upload" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Uploader</p>
              <h2 className="text-2xl font-semibold">Submit a sample</h2>
            </div>
            {!user && (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="underline underline-offset-4">
                    Go to Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="ghost" size="sm" className="underline underline-offset-4">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <UploadCard
            fileName={file?.name}
            onSelectFile={setFile}
            onSourceChange={() => {}}
            onSubmit={handleUpload}
            disabled={isScanning}
            gated={!user}
          />
        </section>

        <section id="dashboard" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Dashboard</p>
              <h2 className="text-2xl font-semibold">Live run</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <RunSteps steps={steps} progress={progress} />
              <ResultPanel verdict={verdict} heuristicScore={heuristic} externalIds={externalIds} raw={result} />
            </div>
            <div className="space-y-4">
              <LogConsole logs={logs} />
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary">
                <p className="font-semibold">Polling</p>
                <p>
                  Status checks call `GET /scan/{'{scan_id}'}` with the optional `guardian-key` header. Non-200 responses show a
                  toast and keep the console up to date.
                </p>
              </div>
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
