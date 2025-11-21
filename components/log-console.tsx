import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type LogLine = {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp?: string;
};

const tone: Record<LogLine["level"], string> = {
  info: "bg-blue-500/10 text-blue-500",
  warn: "bg-amber-500/15 text-amber-600 dark:text-amber-200",
  error: "bg-destructive/15 text-destructive-foreground",
  debug: "bg-slate-500/10 text-slate-500 dark:text-slate-200"
};

export function LogConsole({ logs }: { logs: LogLine[] }) {
  return (
    <Card className="glass card-hover h-full">
      <CardHeader>
        <CardTitle className="text-lg">Live Console</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-auto rounded-xl bg-slate-950/90 p-3 text-xs text-slate-100 dark:bg-slate-900">
          {logs.length === 0 && (
            <p className="text-slate-400">Running logs will stream here once a scan kicks off.</p>
          )}
          <ul className="space-y-2">
            {logs.map((log, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Badge className={tone[log.level]} variant="muted">
                  {log.level}
                </Badge>
                <span className="text-slate-300">
                  {log.timestamp && <span className="mr-2 text-slate-500">{log.timestamp}</span>}
                  {log.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
