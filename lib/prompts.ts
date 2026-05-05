import type { ExtractedTreatment } from "./types";
import type { InsurancePolicy } from "./policies";

export function buildExtractionPrompt(note: string): string {
  return `You are a dental AI assistant.
Read the dentist's note below and extract every distinct treatment being considered.
Return ONLY valid JSON — no markdown, no explanation.

Schema:
{
  "treatments": [
    {
      "description": string,
      "clinical_intent": string,
      "urgency": "low" | "medium" | "high"
    }
  ],
  "confidence": number
}

"confidence" is a float 0–1 reflecting how clearly the note described the treatments.

Dentist note:
"""
${note}
"""`;
}

export function buildOptimizationPrompt(
  treatments: ExtractedTreatment[],
  policy: InsurancePolicy
): string {
  return `You are an AI insurance coding specialist that helps identify better-covered treatment alternatives.
For each intended treatment, find the best-covered CDT procedure from the policy
that still satisfies the clinical intent.

IMPORTANT SAFETY RULE: This tool provides information only. All suggestions MUST be reviewed
and approved by a licensed clinician before any substitution is made.

Ranking priority:
1. Covered > not covered
2. Higher coverage_percent
3. Lower invasiveness when outcomes are equivalent

patient_cost = estimated_cost * (1 - coverage_percent / 100)

Insurance policy:
${JSON.stringify(policy, null, 2)}

Intended treatments:
${JSON.stringify(treatments, null, 2)}

Return ONLY valid JSON — no markdown, no explanation.

Schema:
{
  "treatments": [
    {
      "original": {
        "name": string,
        "cdt_code": string,
        "covered": boolean,
        "coverage_percent": number,
        "estimated_cost": number,
        "patient_cost": number,
        "satisfies_clinical_intent": boolean
      },
      "recommended": { same shape as original },
      "alternatives": [ same shape, 1-2 items, sorted by patient_cost ASC ],
      "tradeoff_summary": string,
      "clinical_review_required": true,
      "clinical_notes": string
    }
  ],
  "total_original_cost": number,
  "total_patient_cost": number,
  "total_savings": number,
  "patient_summary": string
}

Rules:
- "clinical_review_required" must ALWAYS be true — never false
- "clinical_notes" must explain in one sentence what the dentist needs to verify before substituting
- "tradeoff_summary" must describe what the patient gives up (if anything) in plain English
- "patient_summary" must be 2–3 plain-English sentences and end with: "These suggestions must be reviewed and approved by your dentist before any changes are made."`;
}
