import type { IntakePayload } from "@/lib/validators";

export function contactIdentityKey(payload: IntakePayload): string {
  const phone = payload.contact.best_phone?.replace(/\D/g, "") ?? "";
  const email = (payload.contact.email ?? "").toLowerCase();
  return `${payload.firm_id}:${phone}:${email}`;
}



