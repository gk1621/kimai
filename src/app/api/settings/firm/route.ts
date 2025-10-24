import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firm_id = searchParams.get("firm_id");
  if (!firm_id) return NextResponse.json({ error: "MISSING_FIRM_ID" }, { status: 400 });
  const [rows]: any = await pool.query(`SELECT elevenlabs, twilio, agent FROM firm_settings WHERE firm_id=?`, [firm_id]);
  return NextResponse.json(rows[0] ?? { elevenlabs: null, twilio: null, agent: null });
}

export async function PUT(req: NextRequest) {
  const { firm_id, elevenlabs, twilio, agent } = await req.json();
  if (!firm_id) return NextResponse.json({ error: "MISSING_FIRM_ID" }, { status: 400 });

  await pool.query(
    `INSERT INTO firm_settings (firm_id, elevenlabs, twilio, agent) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE elevenlabs=VALUES(elevenlabs), twilio=VALUES(twilio), agent=VALUES(agent)`,
    [firm_id, elevenlabs ? JSON.stringify(elevenlabs) : null, twilio ? JSON.stringify(twilio) : null, agent ? JSON.stringify(agent) : null]
  );
  return NextResponse.json({ status: "ok" });
}


