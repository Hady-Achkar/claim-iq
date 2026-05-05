import type { OptimizeResponse } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SavingsSummaryProps {
  data: OptimizeResponse;
  lowConfidence: boolean;
}

export function SavingsSummary({ data, lowConfidence }: SavingsSummaryProps) {
  const savingsPct = data.total_original_cost > 0
    ? Math.round((data.total_savings / data.total_original_cost) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                Estimated Savings
              </p>
              <p className="text-4xl font-bold tracking-tight">€{data.total_savings}</p>
              <Badge variant="secondary" className="mt-2">
                {savingsPct}% less out-of-pocket
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-16 mx-4" />
            <div className="text-right text-sm space-y-1">
              <p className="text-muted-foreground">
                Original &nbsp;
                <span className="line-through">€{data.total_original_cost}</span>
              </p>
              <p className="font-semibold text-base">€{data.total_patient_cost} your cost</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {lowConfidence && (
        <Alert variant="destructive">
          <AlertTitle>Low confidence extraction</AlertTitle>
          <AlertDescription>
            The dentist note was unclear. Please review the extracted treatments
            before relying on this optimisation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
