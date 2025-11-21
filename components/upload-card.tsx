import { useCallback, useState } from "react";
import { CloudUpload, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadCardProps = {
  fileName?: string;
  onSelectFile: (file: File) => void;
  onSourceChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  gated?: boolean;
};

export function UploadCard({
  fileName,
  onSelectFile,
  onSourceChange,
  onSubmit,
  disabled,
  gated
}: UploadCardProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragging(false);
      const droppedFile = event.dataTransfer.files?.[0];
      if (droppedFile) onSelectFile(droppedFile);
    },
    [onSelectFile]
  );

  return (
    <Card className="glass card-hover border border-border/70">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">Upload & Scan</CardTitle>
          <CardDescription>Drag a sample or drop a URL. Source is required.</CardDescription>
        </div>
        {gated && (
          <div className="flex items-center gap-2 rounded-full border border-dashed border-amber-400/60 bg-amber-100/70 px-4 py-1 text-xs font-semibold uppercase text-amber-700 dark:bg-amber-500/20 dark:text-amber-100">
            <Lock className="h-4 w-4" />
            Login required
          </div>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        <motion.label
          className={cn(
            "flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-gradient-to-br from-muted/40 to-background text-center transition-all",
            dragging && "border-primary/70 bg-primary/5 shadow-lg shadow-primary/10"
          )}
          htmlFor="file"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            id="file"
            type="file"
            className="hidden"
            onChange={(e) => {
              const next = e.target.files?.[0];
              if (next) onSelectFile(next);
            }}
            aria-label="Upload file for scanning"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CloudUpload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold">{fileName ?? "Drag & drop your file"}</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
        </motion.label>

        <div className="grid gap-2">
          <Label htmlFor="source" className="flex items-center gap-2">
            Optional note / source
          </Label>
          <Input
            id="source"
            placeholder="Add a label or leave blank"
            onChange={(e) => onSourceChange(e.target.value)}
          />
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={onSubmit}
          disabled={disabled}
          aria-label="Submit for scanning"
        >
          Upload &amp; Scan
        </Button>
      </CardContent>
    </Card>
  );
}
