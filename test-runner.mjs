// Inline claim simulation (mirrors lib/simulate.ts)
function simulateClaim(proc) {
  if (!proc || !proc.covered) {
    return {
      status: "rejected",
      covered_amount: 0,
      patient_responsibility: proc?.estimated_cost ?? 0,
      reasons: ["Procedure not covered under this plan"],
    };
  }
  if (proc.coverage_percent >= 100) {
    return { status: "approved", covered_amount: proc.estimated_cost, patient_responsibility: 0, reasons: ["Fully covered"] };
  }
  return {
    status: "partially_approved",
    covered_amount: Math.round(proc.estimated_cost * (proc.coverage_percent / 100)),
    patient_responsibility: proc.patient_cost,
    reasons: [`Covered at ${proc.coverage_percent}%`],
  };
}

const BASE = "http://localhost:3000";

async function extract(note) {
  const r = await fetch(`${BASE}/api/extract`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }),
  });
  return r.json();
}

async function optimize(treatments) {
  const r = await fetch(`${BASE}/api/optimize`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ treatments }),
  });
  return r.json();
}

let totalChecks = 0, totalPassed = 0;

function check(label, pass, detail = "") {
  totalChecks++;
  if (pass) totalPassed++;
  const icon = pass ? "✅" : "❌";
  console.log(`  ${icon} ${label}${detail ? " — " + detail : ""}`);
  return pass;
}

const tests = [
  // 1 ─────────────────────────────────────────────
  {
    name: "happy_path_full_case",
    async run() {
      const note = "Patient presents with severe pain in lower right molar. Deep caries noted. Recommend composite filling. If pulp involved, root canal and crown required. Periapical X-ray needed.";
      const ext = await extract(note);
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      console.log(`  → extracted ${ext.treatments?.length} treatments, confidence ${ext.confidence}`);

      check("min 3 treatments", ext.treatments?.length >= 3, `got ${ext.treatments?.length}`);
      check("max 4 treatments", ext.treatments?.length <= 4, `got ${ext.treatments?.length}`);
      check("confidence >= 0.7", ext.confidence >= 0.7, `got ${ext.confidence}`);
      const descs = ext.treatments.map(t => t.description.toLowerCase()).join(" ");
      check("includes composite filling", descs.includes("composite"));
      check("includes periapical x-ray", descs.includes("x-ray") || descs.includes("periapical"));

      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }
      console.log(`  → savings €${opt.total_savings}`);

      const swapped = opt.treatments?.find(t =>
        t.original.name.toLowerCase().includes("composite") &&
        t.recommended.name.toLowerCase().includes("amalgam")
      );
      check("composite → amalgam swap", !!swapped);
      check("savings >= 150", opt.total_savings >= 150, `€${opt.total_savings}`);
      check("all clinical_review_required = true", opt.treatments?.every(t => t.clinical_review_required === true));
      const allText = JSON.stringify(opt).toLowerCase();
      check("no 'no difference'", !allText.includes("no difference"));
      check("no 'guaranteed'", !allText.includes("guaranteed"));
    }
  },

  // 2 ─────────────────────────────────────────────
  {
    name: "already_optimal",
    async run() {
      const ext = await extract("Patient requires periapical X-ray and amalgam filling.");
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }
      console.log(`  → ${ext.treatments?.length} extracted, savings €${opt.total_savings}`);

      const changed = opt.treatments?.filter(t => t.original.name !== t.recommended.name);
      check("no swaps needed", changed?.length === 0, `${changed?.length} swap(s)`);
      check("total_savings = 0", opt.total_savings === 0, `€${opt.total_savings}`);
      check("no invented extra treatments", opt.treatments?.length === ext.treatments?.length);
    }
  },

  // 3 ─────────────────────────────────────────────
  {
    name: "coverage_swap_core_demo",
    async run() {
      const ext = await extract("Small cavity on upper molar. Recommend composite filling.");
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }

      const swapped = opt.treatments?.find(t =>
        t.original.name.toLowerCase().includes("composite") &&
        t.recommended.name.toLowerCase().includes("amalgam")
      );
      check("composite → amalgam swap", !!swapped);
      if (swapped) {
        const savings = swapped.original.patient_cost - swapped.recommended.patient_cost;
        check("savings 150–200", savings >= 150 && savings <= 200, `€${savings}`);
        const tradeoff = swapped.tradeoff_summary?.toLowerCase() ?? "";
        check("tradeoff mentions aesthetic/appearance",
          tradeoff.includes("aesthet") || tradeoff.includes("color") || tradeoff.includes("colour") || tradeoff.includes("appearance") || tradeoff.includes("visible"),
          `"${swapped.tradeoff_summary?.slice(0,60)}..."`);
        const origClaim = simulateClaim(swapped.original);
        const recClaim  = simulateClaim(swapped.recommended);
        check("original claim = rejected", origClaim.status === "rejected", origClaim.status);
        check("optimized claim != rejected", recClaim.status !== "rejected", recClaim.status);
      }
    }
  },

  // 4 ─────────────────────────────────────────────
  {
    name: "cheaper_but_worse_option",
    async run() {
      const ext = await extract("Severe decay in molar with pulp involvement. Root canal recommended.");
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }

      const rcT = opt.treatments?.find(t =>
        t.recommended.name.toLowerCase().includes("root canal") ||
        t.original.name.toLowerCase().includes("root canal")
      );
      check("root canal kept as recommended", !!rcT, rcT ? rcT.recommended.name : "not found");

      const allText = JSON.stringify(opt).toLowerCase();
      check("extraction listed as alternative", allText.includes("extraction") || allText.includes("d7140"));
      check("explains tradeoff with cheaper option",
        allText.includes("extract") || allText.includes("remove") || allText.includes("loss") || allText.includes("tooth"));
      check("clinical_review_required = true", opt.treatments?.every(t => t.clinical_review_required === true));
    }
  },

  // 5 ─────────────────────────────────────────────
  {
    name: "low_confidence_input",
    async run() {
      const ext = await extract("Patient has tooth issue, may need treatment.");
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      console.log(`  → ${ext.treatments?.length} treatment(s), confidence ${ext.confidence}`);
      check("confidence <= 0.6", ext.confidence <= 0.6, `got ${ext.confidence}`);
      check("max 1 treatment", ext.treatments?.length <= 1, `got ${ext.treatments?.length}`);
      check("UI warning would trigger", ext.confidence < 0.6, `threshold is 0.6, got ${ext.confidence}`);
    }
  },

  // 6 ─────────────────────────────────────────────
  {
    name: "multi_treatment_case",
    async run() {
      const note = "Patient needs composite filling on two molars, possible root canal on one, crown afterward, and X-rays for both.";
      const ext = await extract(note);
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      console.log(`  → extracted ${ext.treatments?.length} treatments`);
      check("min 4 treatments", ext.treatments?.length >= 4, `got ${ext.treatments?.length}`);

      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }
      check("same count in/out", opt.treatments?.length === ext.treatments?.length,
        `in ${ext.treatments?.length}, out ${opt.treatments?.length}`);
      check("at least one composite → amalgam swap", opt.treatments?.some(t =>
        t.original.name.toLowerCase().includes("composite") &&
        t.recommended.name.toLowerCase().includes("amalgam")
      ));
    }
  },

  // 7 ─────────────────────────────────────────────
  {
    name: "fully_covered_case",
    async run() {
      const ext = await extract("Periapical X-ray required.");
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }
      console.log(`  → patient cost €${opt.total_patient_cost}, savings €${opt.total_savings}`);
      check("patient_cost = 0", opt.total_patient_cost === 0, `€${opt.total_patient_cost}`);
      check("savings = 0", opt.total_savings === 0, `€${opt.total_savings}`);
      const claim = simulateClaim(opt.treatments?.[0]?.recommended);
      check("claim = approved", claim?.status === "approved", claim?.status);
    }
  },

  // 8 ─────────────────────────────────────────────
  {
    name: "conflicting_options",
    async run() {
      const note = "Tooth may need extraction or root canal depending on severity.";
      const ext = await extract(note);
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      const descs = ext.treatments?.map(t => t.description.toLowerCase()).join(" | ");
      console.log(`  → treatments: ${descs}`);
      check("extraction extracted", descs?.includes("extract"), `"${descs}"`);
      check("root canal extracted", descs?.includes("root canal") || descs?.includes("pulp") || descs?.includes("endodontic"), `"${descs}"`);

      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }
      const allText = JSON.stringify(opt).toLowerCase();
      check("root canal present", allText.includes("root canal") || allText.includes("d3330"));
      check("extraction present", allText.includes("extraction") || allText.includes("d7140"));
      check("tradeoff explained for each", opt.treatments?.every(t => (t.tradeoff_summary?.length ?? 0) > 10));
    }
  },

  // 9 ─────────────────────────────────────────────
  {
    name: "hallucination_guard",
    async run() {
      const ext = await extract("Patient needs cleaning.");
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      console.log(`  → extracted: ${JSON.stringify(ext.treatments?.map(t => t.description))}`);
      const opt = await optimize(ext.treatments);
      if (opt.error) { check("no 500 error", false, opt.error); return; }

      const knownCodes = new Set(["D2391","D2140","D3330","D2750","D7140","D0220"]);
      const allCodes = opt.treatments?.flatMap(t => [
        t.original?.cdt_code, t.recommended?.cdt_code,
        ...(t.alternatives?.map(a => a.cdt_code) ?? []),
      ]).filter(Boolean);
      const invented = allCodes?.filter(c => !knownCodes.has(c));
      check("no invented CDT codes", invented?.length === 0, invented?.join(", ") || "clean");
      check("response is valid JSON array", Array.isArray(opt.treatments));
    }
  },

  // 10 ────────────────────────────────────────────
  {
    name: "language_safety",
    async run() {
      const ext = await extract("Recommend composite filling.");
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }
      const allText = JSON.stringify(opt).toLowerCase();

      check("no 'no difference'", !allText.includes("no difference"));
      check("no 'identical outcome/result'", !allText.includes("identical outcome") && !allText.includes("identical result"));
      check("no 'guaranteed outcome/result'", !allText.includes("guaranteed outcome") && !allText.includes("guaranteed result"));
      check("uses clinical/similar language", allText.includes("clinical") || allText.includes("similar"));
      check("mentions tradeoff", allText.includes("tradeoff") || allText.includes("trade-off"));
    }
  },

  // 11 ────────────────────────────────────────────
  {
    name: "cost_consistency",
    async run() {
      const ext = await extract("Patient needs composite filling and root canal.");
      if (ext.error) { check("extraction succeeded", false, ext.error); return; }
      const opt = await optimize(ext.treatments);
      if (opt.error) { check("optimization succeeded", false, opt.error); return; }

      const sumOrig   = opt.treatments?.reduce((s, t) => s + t.original.patient_cost, 0) ?? 0;
      const sumPatient = opt.treatments?.reduce((s, t) => s + t.recommended.patient_cost, 0) ?? 0;
      const calcSavings = sumOrig - sumPatient;

      console.log(`  → reported: orig €${opt.total_original_cost} patient €${opt.total_patient_cost} savings €${opt.total_savings}`);
      console.log(`  → computed: orig €${sumOrig} patient €${sumPatient} savings €${calcSavings}`);

      check("total_original_cost matches sum", Math.abs(opt.total_original_cost - sumOrig) <= 1,
        `reported ${opt.total_original_cost}, sum ${sumOrig}`);
      check("total_patient_cost matches sum", Math.abs(opt.total_patient_cost - sumPatient) <= 1,
        `reported ${opt.total_patient_cost}, sum ${sumPatient}`);
      check("savings = original − patient", Math.abs(opt.total_savings - calcSavings) <= 1,
        `reported ${opt.total_savings}, calc ${calcSavings}`);
    }
  },
];

// ─── runner ────────────────────────────────────────
let testsPassed = 0, testsFailed = 0;
for (const test of tests) {
  console.log(`\n${"─".repeat(62)}`);
  console.log(`🧪  ${test.name}`);
  console.log("─".repeat(62));
  const before = totalChecks;
  try {
    await test.run();
    const allPassed = totalChecks === before || totalPassed >= before + (totalChecks - before);
    testsPassed++;
  } catch (err) {
    console.log(`  ❌ CRASHED — ${err.message}`);
    testsFailed++;
  }
}

console.log(`\n${"═".repeat(62)}`);
console.log(`RESULTS  ${tests.length} tests | checks: ${totalPassed}/${totalChecks} passed`);
console.log("═".repeat(62));
