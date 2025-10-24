import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const scenario_id = Number(params.id);
  if (!scenario_id) return NextResponse.json({ error: "INVALID_SCENARIO_ID" }, { status: 400 });
  const [rows]: any = await pool.query(
    `SELECT id, question_text, order_index FROM scenario_questions WHERE scenario_id=? ORDER BY order_index, id`,
    [scenario_id]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const scenario_id = Number(params.id);
  if (!scenario_id) return NextResponse.json({ error: "INVALID_SCENARIO_ID" }, { status: 400 });
  const { firm_id, question_text, order_index } = await req.json();
  if (!firm_id || !question_text) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const [res]: any = await pool.query(
    `INSERT INTO scenario_questions(firm_id, scenario_id, question_text, order_index) VALUES (?,?,?,?)`,
    [firm_id, scenario_id, question_text, order_index ?? 0]
  );
  return NextResponse.json({ id: res.insertId }, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const scenario_id = Number(params.id);
  if (!scenario_id) return NextResponse.json({ error: "INVALID_SCENARIO_ID" }, { status: 400 });
  const { firm_id, updates } = await req.json();
  if (!firm_id || !Array.isArray(updates)) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const u of updates) {
      await conn.query(
        `UPDATE scenario_questions SET question_text=COALESCE(?, question_text), order_index=COALESCE(?, order_index)
         WHERE id=? AND firm_id=? AND scenario_id=?`,
        [u.question_text ?? null, u.order_index ?? null, u.id, firm_id, scenario_id]
      );
    }
    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json({ error: "DB_ERROR", detail: (e as Error).message }, { status: 500 });
  } finally {
    conn.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const scenario_id = Number(params.id);
  const { firm_id, question_id } = await req.json();
  if (!scenario_id || !firm_id || !question_id) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  await pool.query(`DELETE FROM scenario_questions WHERE id=? AND firm_id=? AND scenario_id=?`, [question_id, firm_id, scenario_id]);
  return NextResponse.json({ ok: true });
}


