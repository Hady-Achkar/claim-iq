import type { ProcedureOption, ClaimResult } from "./types";

export function simulateClaim(procedure: ProcedureOption): ClaimResult {
  if (!procedure.covered) {
    return {
      status: "rejected",
      covered_amount: 0,
      patient_responsibility: procedure.estimated_cost,
      reasons: ["Procedure not covered under this plan"],
    };
  }

  if (procedure.coverage_percent >= 100) {
    return {
      status: "approved",
      covered_amount: procedure.estimated_cost,
      patient_responsibility: 0,
      reasons: ["Fully covered procedure"],
    };
  }

  return {
    status: "partially_approved",
    covered_amount: Math.round(procedure.estimated_cost * (procedure.coverage_percent / 100)),
    patient_responsibility: procedure.patient_cost,
    reasons: [`Covered at ${procedure.coverage_percent}% under this plan`],
  };
}
