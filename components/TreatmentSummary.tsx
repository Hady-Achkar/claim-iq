import type { OptimizedTreatment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TreatmentSummaryProps {
  treatments: OptimizedTreatment[];
}

export function TreatmentSummary({ treatments }: TreatmentSummaryProps) {
  const changed   = treatments.filter(t => t.original.cdt_code !== t.recommended.cdt_code);
  const unchanged = treatments.filter(t => t.original.cdt_code === t.recommended.cdt_code);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Treatment Overview
          <span className="text-xs font-normal text-muted-foreground">
            {changed.length} changed · {unchanged.length} unchanged
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">

        {changed.map((t, i) => (
          <div key={i}>
            {i > 0 && <Separator />}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="default" className="shrink-0 text-xs">Changed</Badge>
                <span className="text-sm truncate">
                  <span className="line-through text-muted-foreground">{t.original.name}</span>
                  <span className="mx-1.5 text-muted-foreground">→</span>
                  <span className="font-medium">{t.recommended.name}</span>
                </span>
              </div>
              <span className="text-sm font-semibold shrink-0">
                −€{t.original.patient_cost - t.recommended.patient_cost}
              </span>
            </div>
          </div>
        ))}

        {changed.length > 0 && unchanged.length > 0 && <Separator />}

        {unchanged.map((t, i) => (
          <div key={i}>
            {i > 0 && <Separator />}
            <div className="flex items-center justify-between py-2.5 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="shrink-0 text-xs">No change</Badge>
                <span className="text-sm text-muted-foreground truncate">{t.original.name}</span>
              </div>
              <span className="text-sm text-muted-foreground shrink-0">
                €{t.recommended.patient_cost}
              </span>
            </div>
          </div>
        ))}

      </CardContent>
    </Card>
  );
}
