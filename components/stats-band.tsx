import type { ElementType } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

type Stat = {
  label: string;
  value: string;
  icon: ElementType;
  accent: string;
  helper: string;
};

export function StatsBand({ total, flagged, averageMs }: { total: number; flagged: number; averageMs: number }) {
  const stats: Stat[] = [
    { label: "Runs processed", value: total.toLocaleString(), icon: Activity, accent: "from-blue-500/25 to-indigo-500/10", helper: "Total submissions" },
    { label: "Flagged for review", value: flagged.toLocaleString(), icon: ShieldCheck, accent: "from-amber-500/25 to-orange-500/10", helper: "Needs analyst eyes" },
    { label: "Avg duration", value: `${averageMs.toFixed(1)}s`, icon: Clock, accent: "from-emerald-500/25 to-cyan-500/10", helper: "Rolling average" }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <Card className="relative overflow-hidden border border-white/20 bg-white/80 backdrop-blur-lg dark:border-white/5 dark:bg-slate-900/70">
            <div className="absolute inset-0 bg-gradient-to-br opacity-70" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-70`} />
            <div className="relative flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-foreground shadow-sm dark:bg-slate-900/80">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.helper}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
