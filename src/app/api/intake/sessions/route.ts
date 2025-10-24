import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { firm_id, case_type_id, caller_phone } = await req.json();
  if (!firm_id) return NextResponse.json({ error: "MISSING_FIRM_ID" }, { status: 400 });
  const id = randomUUID();

  await pool.query(
    `INSERT INTO intake_sessions(id, firm_id, case_type_id, caller_phone, status) VALUES (?, ?, ?, ?, 'active')`,
    [id, firm_id, case_type_id ?? null, caller_phone ?? null]
  );

  return NextResponse.json({ id }, { status: 201 });
}


