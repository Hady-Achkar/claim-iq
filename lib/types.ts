export interface ExtractedTreatment {
  description: string;
  clinical_intent: string;
  urgency: "low" | "medium" | "high";
}

export interface ExtractionResponse {
  treatments: ExtractedTreatment[];
  confidence: number;
}

export interface ProcedureOption {
  name: string;
  cdt_code: string;
  covered: boolean;
  coverage_percent: number;
  estimated_cost: number;
  patient_cost: number;
  satisfies_clinical_intent: boolean;
}

export interface OptimizedTreatment {
  original: ProcedureOption;
  recommended: ProcedureOption;
  alternatives: ProcedureOption[];
  tradeoff_summary: string;
  clinical_review_required: boolean;
  clinical_notes: string;
}

export interface ClaimResult {
  status: "approved" | "partially_approved" | "rejected";
  covered_amount: number;
  patient_responsibility: number;
  reasons: string[];
}

export interface OptimizeResponse {
  treatments: OptimizedTreatment[];
  total_original_cost: number;
  total_patient_cost: number;
  total_savings: number;
  patient_summary: string;
}
