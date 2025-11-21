import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "running" | "success" | "error";

export type RunStep = {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
};

const STATUS_META: Record<StepStatus, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "muted" },
  running: { label: "Running", tone: "warning" },
  success: { label: "Complete", tone: "success" },
  error: { label: "Failed", tone: "destructive" }
};

export function RunSteps({ steps, progress }: { steps: RunStep[]; progress: number }) {
  return (
    <Card className="glass card-hover h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Live Scan Trace</CardTitle>
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                initial={false}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ ease: "easeInOut", duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence initial={false}>
          {steps.map((step, idx) => {
            const meta = STATUS_META[step.status];
            return (
              <Fragment key={step.id}>
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border border-border/70 bg-gradient-to-br from-background to-muted/20 p-3",
                    step.status === "running" && "animate-pulse-soft border-primary/40"
                  )}
                  aria-live={step.status === "running" ? "polite" : undefined}
                >
                  <div
                    className={cn(
                      "mt-1 h-3 w-3 rounded-full border-2",
                      step.status === "success" && "border-emerald-400 bg-emerald-400/30",
                      step.status === "running" && "border-amber-400 bg-amber-200/50",
                      step.status === "pending" && "border-muted-foreground/40",
                      step.status === "error" && "border-destructive bg-destructive/30"
                    )}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{step.label}</p>
                      <Badge variant={meta.tone as any}>{meta.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
                {idx < steps.length - 1 && <div className="ml-5 h-[1px] bg-border/60" aria-hidden />}
              </Fragment>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
