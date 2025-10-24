import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { firm_id, action } = await req.json();
  if (!firm_id || !action) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const [rows]: any = await pool.query(`SELECT agent FROM firm_settings WHERE firm_id=? LIMIT 1`, [firm_id]);
  const current = rows[0]?.agent ? JSON.parse(rows[0].agent) : {};
  if (action === "disable") {
    delete current.knowledge_token;
  } else {
    current.knowledge_token = randomBytes(24).toString("hex");
  }
  await pool.query(
    `INSERT INTO firm_settings(firm_id, agent) VALUES(?,?) ON DUPLICATE KEY UPDATE agent=VALUES(agent), updated_at=CURRENT_TIMESTAMP`,
    [firm_id, JSON.stringify(current)]
  );
  return NextResponse.json({ knowledge_token: current.knowledge_token ?? null });
}


