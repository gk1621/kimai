import { describe, it, expect } from "vitest";
import { computeSol } from "../src/lib/sol";
import { computeUrgency } from "../src/lib/urgency";

describe("computeSol", () => {
  it("defaults to 3 years from incident when no explicit SOL", () => {
    const res = computeSol({ incident: { date: "2025-01-01" } });
    expect(res.sol_date).toBe("2028-01-01");
  });
});

describe("computeUrgency", () => {
  it("uses urgency_hint when provided", () => {
    const u = computeUrgency({ urgency_hint: 5 });
    expect(u.score).toBe(5);
  });
});


