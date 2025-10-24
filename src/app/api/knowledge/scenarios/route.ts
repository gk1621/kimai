import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firm_id = searchParams.get("firm_id");
  if (!firm_id) return NextResponse.json({ error: "MISSING_FIRM_ID" }, { status: 400 });
  const [rows]: any = await pool.query(
    `SELECT s.id, s.name, s.statute_of_limitations, COUNT(q.id) AS question_count
     FROM scenarios s
     LEFT JOIN scenario_questions q ON q.scenario_id = s.id
     WHERE s.firm_id=?
     GROUP BY s.id, s.name, s.statute_of_limitations
     ORDER BY s.name`,
    [firm_id]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { firm_id, name, statute_of_limitations, data } = await req.json();
  if (!firm_id || !name) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const [res]: any = await pool.query(
    `INSERT INTO scenarios(firm_id, name, statute_of_limitations, data) VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE statute_of_limitations=VALUES(statute_of_limitations), data=VALUES(data)`,
    [firm_id, name, statute_of_limitations ?? null, data ? JSON.stringify(data) : null]
  );
  const id = res.insertId || (await pool.query(`SELECT id FROM scenarios WHERE firm_id=? AND name=?`, [firm_id, name]).then((r: any) => r[0][0]?.id));
  return NextResponse.json({ id });
}


