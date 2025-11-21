import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ResultPanelProps = {
  verdict?: string;
  heuristicScore?: number;
  externalIds?: string[];
  raw?: unknown;
};

function formatLabel(value?: string) {
  if (!value) return "–";
  return value.replace(/_/g, " ");
}

export function ResultPanel({ verdict, heuristicScore, externalIds, raw }: ResultPanelProps) {
  return (
    <Card className="glass card-hover h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg">Results</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={verdict === "malicious" ? "destructive" : verdict ? "success" : "muted"}>
            {formatLabel(verdict) || "pending"}
          </Badge>
          {typeof heuristicScore === "number" && (
            <Badge variant={heuristicScore > 70 ? "destructive" : heuristicScore > 30 ? "warning" : "success"}>
              Heuristic {heuristicScore}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {externalIds?.length ? (
          <div className="flex flex-wrap gap-2">
            {externalIds.map((id) => (
              <Badge key={id} variant="default" className="bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-700 dark:text-blue-100">
                External: {id}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">External IDs will appear when your scan completes.</p>
        )}

        <Separator />

        <pre className="max-h-[320px] overflow-auto rounded-xl bg-slate-950/90 p-4 text-xs text-slate-200 shadow-inner dark:bg-slate-900">
          {raw ? JSON.stringify(raw, null, 2) : "// Submit a scan to see prettified JSON results"}
        </pre>
      </CardContent>
    </Card>
  );
}
