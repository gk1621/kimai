import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ALLOWED_GROUPS = new Set([
  "disclaimer",
  "pii_security",
  "triage_priority_rules",
  "handoff_criteria",
  "handoff_action",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firm_id = searchParams.get("firm_id");
  if (!firm_id) return NextResponse.json({ error: "MISSING_FIRM_ID" }, { status: 400 });
  const [rows]: any = await pool.query(
    `SELECT id, group_name, item_text, display_order FROM global_policies WHERE firm_id=? ORDER BY group_name, display_order, id`,
    [firm_id]
  );
  const out: any = { disclaimer: [], pii_security: [], triage_priority_rules: [], handoff_protocol: { criteria: [], action: "" } };
  for (const r of rows) {
    const item = { id: r.id, text: r.item_text, display_order: r.display_order };
    if (r.group_name === "disclaimer") out.disclaimer.push(item);
    else if (r.group_name === "pii_security") out.pii_security.push(item);
    else if (r.group_name === "triage_priority_rules") out.triage_priority_rules.push(item);
    else if (r.group_name === "handoff_criteria") out.handoff_protocol.criteria.push(item);
    else if (r.group_name === "handoff_action") out.handoff_protocol.action = r.item_text;
  }
  return NextResponse.json(out);
}

export async function POST(req: NextRequest) {
  const { firm_id, group_name, item_text, display_order } = await req.json();
  if (!firm_id || !group_name || !item_text) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  if (!ALLOWED_GROUPS.has(group_name)) return NextResponse.json({ error: "INVALID_GROUP" }, { status: 400 });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (group_name === "handoff_action") {
      await conn.query(`DELETE FROM global_policies WHERE firm_id=? AND group_name='handoff_action'`, [firm_id]);
    }
    const [res]: any = await conn.query(
      `INSERT INTO global_policies(firm_id, group_name, item_text, display_order) VALUES (?,?,?,?)`,
      [firm_id, group_name, item_text, display_order ?? 0]
    );
    await conn.commit();
    return NextResponse.json({ id: res.insertId }, { status: 201 });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json({ error: "DB_ERROR", detail: (e as Error).message }, { status: 500 });
  } finally {
    conn.release();
  }
}

export async function PUT(req: NextRequest) {
  const { id, firm_id, item_text, display_order } = await req.json();
  if (!id || !firm_id) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  await pool.query(`UPDATE global_policies SET item_text=COALESCE(?, item_text), display_order=COALESCE(?, display_order) WHERE id=? AND firm_id=?`, [item_text ?? null, display_order ?? null, id, firm_id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id, firm_id } = await req.json();
  if (!id || !firm_id) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  await pool.query(`DELETE FROM global_policies WHERE id=? AND firm_id=?`, [id, firm_id]);
  return NextResponse.json({ ok: true });
}


