import { Progress } from "@/components/ui/progress";

type Step = "extracting" | "optimizing";

interface StepIndicatorProps {
  step: Step;
}

const STEPS: { key: Step; label: string; value: number }[] = [
  { key: "extracting", label: "Extracting treatments…",       value: 40 },
  { key: "optimizing", label: "Optimising for coverage…",     value: 80 },
];

export function StepIndicator({ step }: StepIndicatorProps) {
  const current = STEPS.find((s) => s.key === step)!;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground animate-pulse">{current.label}</p>
      <Progress value={current.value} className="h-1.5" />
    </div>
  );
}
