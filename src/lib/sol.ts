export type SolComputation = {
  sol_date: string | null;
  days_to_sol: number | null;
  within_sol: boolean;
};

export function computeSol(payload: any): SolComputation {
  // If payload provides explicit SOL, trust it
  const explicit = payload?.sol_date ? new Date(payload.sol_date) : null;
  const incidentDateStr = payload?.incident?.date ?? null;
  const incident = incidentDateStr ? new Date(incidentDateStr) : null;

  let solDate: Date | null = explicit ?? null;

  if (!solDate && incident) {
    // Default heuristic: 3 years from incident
    const d = new Date(incident);
    d.setFullYear(d.getFullYear() + 3);
    solDate = d;
  }

  const today = new Date();
  const solISO = solDate ? solDate.toISOString().slice(0, 10) : null;
  let daysToSol: number | null = null;
  let within = true;
  if (solDate) {
    const diffMs = solDate.getTime() - new Date(today.toDateString()).getTime();
    daysToSol = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    within = daysToSol >= 0;
  }

  return {
    sol_date: solISO,
    days_to_sol: daysToSol,
    within_sol: within,
  };
}

export function solRiskBadge(daysToSol: number | null): "LOW" | "MEDIUM" | "HIGH" {
  if (daysToSol === null) return "LOW";
  if (daysToSol <= 30) return "HIGH";
  if (daysToSol <= 90) return "MEDIUM";
  return "LOW";
}



