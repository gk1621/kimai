export type UrgencyResult = { score: number; rationale: string };

export function computeUrgency(payload: any): UrgencyResult {
  // Base score
  let score = 1;
  const reasons: string[] = [];

  // Hint from payload
  if (typeof payload?.urgency_hint === "number") {
    score = Math.max(1, Math.min(5, Math.round(payload.urgency_hint)));
    reasons.push("Provided urgency_hint");
  }

  // SOL proximity boosts urgency
  const solDateStr = payload?.sol_date ?? payload?.incident?.sol_date ?? null;
  if (solDateStr) {
    const solDate = new Date(solDateStr);
    const today = new Date();
    const days = Math.ceil((solDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 90) {
      score = Math.max(score, days <= 30 ? 5 : 4);
      reasons.push(`SOL in ${days} days`);
    }
  }

  // Scenario weighting
  const scenario = String(payload?.scenario ?? "");
  if (["MEDICAL", "WORKLOSS"].includes(scenario)) {
    score = Math.max(score, 3);
    reasons.push("Scenario weighting");
  }

  return { score, rationale: reasons.join("; ") };
}



