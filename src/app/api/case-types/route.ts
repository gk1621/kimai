import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { rebuildKnowledgeForFirm } from "@/lib/knowledge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const practice_area_id = searchParams.get("practice_area_id");
  if (!practice_area_id) return NextResponse.json({ error: "MISSING_PRACTICE_AREA_ID" }, { status: 400 });
  const [rows]: any = await pool.query(
    `SELECT id, name, code, priority_score, active FROM case_types WHERE practice_area_id=? ORDER BY priority_score DESC, name`,
    [practice_area_id]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { practice_area_id, name, code, priority_score } = await req.json();
  if (!practice_area_id || !name) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const [res]: any = await pool.query(
    `INSERT INTO case_types(practice_area_id, name, code, priority_score) VALUES (?, ?, ?, ?)`,
    [practice_area_id, name, code ?? null, priority_score ?? 0]
  );
  // find firm_id and rebuild
  const [pa]: any = await pool.query(`SELECT firm_id FROM practice_areas WHERE id=?`, [practice_area_id]);
  const firm_id = pa[0]?.firm_id;
  if (firm_id) rebuildKnowledgeForFirm(firm_id).catch(() => {});
  return NextResponse.json({ id: res.insertId }, { status: 201 });
}


