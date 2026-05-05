"use client";

import { useState } from "react";
import { NoteInput } from "@/components/NoteInput";
import { StepIndicator } from "@/components/StepIndicator";
import { SavingsSummary } from "@/components/SavingsSummary";
import { TreatmentSummary } from "@/components/TreatmentSummary";
import { TreatmentCard } from "@/components/TreatmentCard";
import { PatientSummary } from "@/components/PatientSummary";
import type { ExtractionResponse, OptimizeResponse } from "@/lib/types";

type State = "idle" | "extracting" | "optimizing" | "done" | "needs_more_info" | "error";

export default function Home() {
  const [state, setState] = useState<State>("idle");
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null);
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  async function handleSubmit(note: string) {
    setState("extracting");
    setExtraction(null);
    setResult(null);

    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!extractRes.ok) throw new Error();
      const extracted: ExtractionResponse = await extractRes.json();

      // Not enough to work with — ask for more detail instead of failing
      if (!extracted.treatments?.length || extracted.confidence < 0.3) {
        setExtraction(extracted);
        setState("needs_more_info");
        return;
      }

      setExtraction(extracted);
      setState("optimizing");

      const optimizeRes = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatments: extracted.treatments }),
      });
      if (!optimizeRes.ok) throw new Error();
      const optimized: OptimizeResponse = await optimizeRes.json();
      setResult(optimized);
      setState("done");
    } catch {
      setState("error");
    }
  }

  const loading = state === "extracting" || state === "optimizing";
  const changedTreatments = result?.treatments.filter(
    t => t.original.cdt_code !== t.recommended.cdt_code
  ) ?? [];

  return (
    <main>
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">

        <div>
          <h2 className="text-lg font-semibold">Coverage Optimizer</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Paste a dentist note to find the best-covered treatment alternatives
            under your insurance policy.
          </p>
        </div>

        <NoteInput onSubmit={handleSubmit} loading={loading} />

        {loading && <StepIndicator step={state as "extracting" | "optimizing"} />}

        {/* Friendly prompt when note is too vague */}
        {state === "needs_more_info" && (
          <div className="rounded-lg border-2 border-destructive/60 bg-destructive/5 p-5 flex flex-col gap-1.5">
            <p className="font-semibold text-sm text-destructive">Couldn&apos;t identify any treatments</p>
            <p className="text-sm text-muted-foreground">
              The note is too vague to extract procedures. Try adding:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5 mt-0.5">
              <li>Tooth location <span className="text-foreground/70">(e.g. lower right molar)</span></li>
              <li>Condition <span className="text-foreground/70">(e.g. deep caries)</span></li>
              <li>Recommended procedure <span className="text-foreground/70">(e.g. composite filling)</span></li>
            </ul>
          </div>
        )}

        {/* Generic error */}
        {state === "error" && (
          <div className="rounded-lg border border-dashed p-6 text-center flex flex-col gap-2">
            <p className="font-medium text-sm">Something went wrong</p>
            <p className="text-sm text-muted-foreground">Please try again in a moment.</p>
          </div>
        )}

        {state === "done" && result && extraction && (
          <div className="flex flex-col gap-6">
            <SavingsSummary
              data={result}
              lowConfidence={extraction.confidence < 0.6}
            />

            {/* Quick overview — always shown */}
            <TreatmentSummary treatments={result.treatments} />

            {/* Detailed cards — only changed treatments */}
            {changedTreatments.length > 0 && (
              <div className="flex flex-col gap-4">
                {changedTreatments.map((t, i) => (
                  <TreatmentCard key={i} treatment={t} index={i} />
                ))}
              </div>
            )}

            <PatientSummary summary={result.patient_summary} />
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t pt-4">
          Demo uses a hardcoded PPO policy. In production, policies load per insurer
          from a database — the optimiser works identically regardless of which policy is supplied.
        </p>

      </div>
    </main>
  );
}
