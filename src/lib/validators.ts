import { z } from "zod";

export const ContactSchema = z.object({
  full_name: z.string().min(1),
  best_phone: z.string().min(3),
  email: z.string().email().optional().nullable(),
  mailing_address: z.string().optional().nullable(),
  dob: z.string().date().optional().nullable().or(z.null()).or(z.undefined()),
});

export const IncidentSchema = z.object({
  date: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  injuries: z.string().optional().nullable(),
  providers: z.array(z.record(z.any())).optional().nullable(),
  police_report: z.union([z.string(), z.boolean()]).optional().nullable(),
  witnesses: z.array(z.record(z.any())).optional().nullable(),
  photos_or_video: z.boolean().optional().nullable(),
  defendant_info: z.record(z.any()).optional().nullable(),
  insurance_info: z.record(z.any()).optional().nullable(),
});

export const IntakePayloadSchema = z.object({
  firm_id: z.string().min(1),
  call_id: z.string().optional().nullable(),
  contact: ContactSchema,
  scenario: z.enum(["MOTOR_VEHICLE", "MEDICAL", "EMPLOYMENT", "PREMISES", "WORKLOSS", "OTHER"]),
  incident: IncidentSchema.optional().nullable(),
  transcript: z.object({ raw: z.string().optional().nullable(), structured: z.record(z.any()).optional().nullable() }).optional().nullable(),
  referral_source: z.string().optional().nullable(),
  sol_date: z.string().optional().nullable(),
  urgency_hint: z.number().optional().nullable(),
});

export type IntakePayload = z.infer<typeof IntakePayloadSchema>;



