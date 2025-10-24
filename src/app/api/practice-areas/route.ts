import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { rebuildKnowledgeForFirm } from "@/lib/knowledge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firm_id = searchParams.get("firm_id");
  if (!firm_id) return NextResponse.json({ error: "MISSING_FIRM_ID" }, { status: 400 });
  const [rows]: any = await pool.query(
    `SELECT id, name, description, active FROM practice_areas WHERE firm_id=? ORDER BY name`,
    [firm_id]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { firm_id, name, description } = await req.json();
  if (!firm_id || !name) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const [res]: any = await pool.query(
    `INSERT INTO practice_areas(firm_id, name, description) VALUES (?, ?, ?)`,
    [firm_id, name, description ?? null]
  );
  // trigger rebuild (fire-and-forget)
  rebuildKnowledgeForFirm(firm_id).catch(() => {});
  return NextResponse.json({ id: res.insertId }, { status: 201 });
}


