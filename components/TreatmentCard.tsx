"use client";

import { useState } from "react";
import type { OptimizedTreatment, ProcedureOption, ClaimResult } from "@/lib/types";
import { simulateClaim } from "@/lib/simulate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

function ClaimStatusBadge({ status }: { status: ClaimResult["status"] }) {
  if (status === "approved")
    return <Badge variant="default">Approved</Badge>;
  if (status === "partially_approved")
    return <Badge variant="secondary">Partially Approved</Badge>;
  return <Badge variant="destructive">Rejected</Badge>;
}

function ClaimPanel({ label, proc, claim }: { label: string; proc: ProcedureOption; claim: ClaimResult }) {
  return (
    <Card className="flex-1">
      <CardContent className="pt-4 pb-4 flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <ClaimStatusBadge status={claim.status} />
        <div className="text-sm space-y-0.5 mt-1">
          <p className="text-muted-foreground">Covered: <span className="text-foreground font-medium">€{claim.covered_amount}</span></p>
          <p className="text-muted-foreground">You pay: <span className="text-foreground font-bold text-base">€{claim.patient_responsibility}</span></p>
        </div>
        <p className="text-xs text-muted-foreground">{claim.reasons[0]}</p>
        <p className="text-xs font-mono text-muted-foreground">{proc.cdt_code}</p>
      </CardContent>
    </Card>
  );
}

export function TreatmentCard({ treatment, index }: { treatment: OptimizedTreatment; index: number }) {
  const { original, recommended, tradeoff_summary, clinical_notes, alternatives } = treatment;
  const [selected, setSelected] = useState<"optimized" | "original">("optimized");

  const originalClaim   = simulateClaim(original);
  const recommendedClaim = simulateClaim(recommended);
  const activePlan  = selected === "optimized" ? recommended : original;
  const activeClaim = selected === "optimized" ? recommendedClaim : originalClaim;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Treatment {index + 1}</span>
          <Badge variant="outline">{original.name}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">

        {/* Clinician review — always visible */}
        <Alert>
          <AlertDescription className="font-medium">
            ⚠ Requires dentist approval before applying any changes
          </AlertDescription>
        </Alert>

        {/* Claim simulation */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Insurance Claim Simulation
          </p>
          <div className="flex gap-3">
            <ClaimPanel label="Original Plan"   proc={original}     claim={originalClaim} />
            <ClaimPanel label="Optimized Plan"  proc={recommended}  claim={recommendedClaim} />
          </div>
        </div>

        {original.cdt_code !== recommended.cdt_code && <Separator />}

        {/* Plan toggle — only shown when a swap was made */}
        {original.cdt_code !== recommended.cdt_code && <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Select Plan
          </p>
          <div className="flex gap-2">
            <Button
              variant={selected === "optimized" ? "default" : "outline"}
              size="sm"
              className="flex-1 flex-col h-auto py-2"
              onClick={() => setSelected("optimized")}
            >
              <span className="text-xs opacity-70">AI Suggestion</span>
              <span>{recommended.name}</span>
              <span className="text-xs opacity-80">€{recommended.patient_cost}</span>
            </Button>
            <Button
              variant={selected === "original" ? "default" : "outline"}
              size="sm"
              className="flex-1 flex-col h-auto py-2"
              onClick={() => setSelected("original")}
            >
              <span className="text-xs opacity-70">Dentist Original</span>
              <span>{original.name}</span>
              <span className="text-xs opacity-80">€{original.patient_cost}</span>
            </Button>
          </div>
        </div>}

        {/* Active selection summary — only when a swap exists */}
        {original.cdt_code !== recommended.cdt_code && (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-muted/50">
            <span className="text-muted-foreground">Selected: <span className="text-foreground font-medium">{activePlan.name}</span></span>
            <ClaimStatusBadge status={activeClaim.status} />
          </div>
        )}

        {/* Tradeoff + clinical notes */}
        {tradeoff_summary && (
          <p className="text-sm text-muted-foreground border-l-2 pl-3 italic">
            {tradeoff_summary}
          </p>
        )}

        {clinical_notes && (
          <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
            🩺 {clinical_notes}
          </p>
        )}

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Other Covered Options
              </p>
              <div className="flex flex-wrap gap-2">
                {alternatives.map((alt) => (
                  <Card key={alt.cdt_code} className="flex-none">
                    <CardContent className="px-3 py-2 text-xs flex flex-col gap-0.5">
                      <span className="font-medium">{alt.name}</span>
                      <span className="font-mono text-muted-foreground">{alt.cdt_code}</span>
                      <span className="text-muted-foreground">€{alt.patient_cost} you pay</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
}
