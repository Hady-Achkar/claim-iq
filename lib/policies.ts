export interface PolicyProcedure {
  name: string;
  cdt_code: string;
  covered: boolean;
  coverage_percent: number;
  estimated_cost: number;
}

export interface InsurancePolicy {
  id: string;
  name: string;
  type: "PPO" | "HMO" | "DHMO" | "indemnity";
  procedures: PolicyProcedure[];
}

export const POLICIES: Record<string, InsurancePolicy> = {
  demo_ppo: {
    id: "demo_ppo",
    name: "Demo PPO Plan",
    type: "PPO",
    procedures: [
      { name: "Composite Filling",  cdt_code: "D2391", covered: false, coverage_percent: 0,   estimated_cost: 200 },
      { name: "Amalgam Filling",    cdt_code: "D2140", covered: true,  coverage_percent: 80,  estimated_cost: 120 },
      { name: "Root Canal (molar)", cdt_code: "D3330", covered: true,  coverage_percent: 50,  estimated_cost: 600 },
      { name: "Crown (PFM)",        cdt_code: "D2750", covered: true,  coverage_percent: 50,  estimated_cost: 900 },
      { name: "Extraction",         cdt_code: "D7140", covered: true,  coverage_percent: 80,  estimated_cost: 150 },
      { name: "Periapical X-ray",   cdt_code: "D0220", covered: true,  coverage_percent: 100, estimated_cost: 30  },
    ],
  },
};

export const DEFAULT_POLICY_ID = "demo_ppo";

// Scale path: swap POLICIES lookup for an async DB/API call keyed by policy ID.
// The optimizer prompt accepts any InsurancePolicy shape, so the AI logic stays
// identical regardless of which insurer's data is supplied.
// e.g. export async function getPolicy(id: string): Promise<InsurancePolicy>
