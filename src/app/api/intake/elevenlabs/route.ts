import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { computeSol } from "@/lib/sol";
import { computeUrgency } from "@/lib/urgency";
import { IntakePayloadSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")?.split(" ")[1];
  if (auth !== process.env.ELEVENLABS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idem = req.headers.get("idempotency-key") ?? "";
  const json = await req.json();
  const parse = IntakePayloadSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD", detail: parse.error.flatten() }, { status: 400 });
  }
  const payload = parse.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Upsert contact (by firm + best_phone unique heuristic)
    await conn.query(
      `INSERT INTO contacts(contact_id, firm_id, full_name, best_phone, email, mailing_address, dob)
       VALUES(UUID(), ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), best_phone=VALUES(best_phone), email=VALUES(email), mailing_address=VALUES(mailing_address), dob=VALUES(dob)`,
      [
        payload.firm_id,
        payload.contact.full_name,
        payload.contact.best_phone,
        payload.contact.email ?? null,
        payload.contact.mailing_address ?? null,
        payload.contact.dob ?? null,
      ]
    );
    const [contactRow]: any = await conn.query(
      `SELECT contact_id FROM contacts WHERE firm_id=? AND best_phone=? ORDER BY created_at DESC LIMIT 1`,
      [payload.firm_id, payload.contact.best_phone]
    );
    const contact_id: string = contactRow[0]?.contact_id;

    const sol = computeSol(payload);
    const urg = computeUrgency(payload);
    const idempotency_key = idem || payload.call_id || null;

    await conn.query(
      `INSERT IGNORE INTO leads(lead_id, firm_id, contact_id, status, scenario, urgency_index, urgency_rationale, sol_deadline, days_to_sol, within_sol, referral_source, elevenlabs_call_id, idempotency_key)
       VALUES(UUID(), ?, ?, 'NEW', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.firm_id,
        contact_id,
        payload.scenario,
        urg?.score ?? 1,
        urg?.rationale ?? null,
        payload.sol_date ?? sol.sol_date ?? null,
        sol.days_to_sol ?? null,
        sol.within_sol,
        payload.referral_source ?? null,
        payload.call_id ?? null,
        idempotency_key,
      ]
    );

    const [leadRow]: any = await conn.query(
      `SELECT lead_id FROM leads WHERE firm_id=? AND contact_id=? ORDER BY created_at DESC LIMIT 1`,
      [payload.firm_id, contact_id]
    );
    const lead_id: string = leadRow[0]?.lead_id;

    await conn.query(
      `INSERT INTO incidents(incident_id, lead_id, date_of_incident, location, description, injuries, providers, police_report, witnesses, photos_or_video, defendant_info, insurance_info)
       VALUES(UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lead_id,
        payload.incident?.date ?? null,
        payload.incident?.location ?? null,
        payload.incident?.description ?? null,
        payload.incident?.injuries ?? null,
        JSON.stringify(payload.incident?.providers ?? []),
        payload.incident?.police_report ?? null,
        JSON.stringify(payload.incident?.witnesses ?? []),
        !!payload.incident?.photos_or_video,
        JSON.stringify(payload.incident?.defendant_info ?? {}),
        JSON.stringify(payload.incident?.insurance_info ?? {}),
      ]
    );

    if (payload.transcript?.raw || payload.transcript?.structured) {
      await conn.query(
        `INSERT INTO transcripts(transcript_id, lead_id, raw_text, structured_json, checksum)
         VALUES(UUID(), ?, ?, ?, SHA2(CONCAT(IFNULL(?,''), IFNULL(?,'')), 256))`,
        [
          lead_id,
          payload.transcript?.raw ?? null,
          JSON.stringify(payload.transcript?.structured ?? {}),
          payload.transcript?.raw ?? "",
          JSON.stringify(payload.transcript?.structured ?? {}),
        ]
      );
    }

    await conn.commit();
    return NextResponse.json({ status: "ok", lead_id }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json({ error: "DB_ERROR", detail: (e as Error).message }, { status: 500 });
  } finally {
    conn.release();
  }
}



