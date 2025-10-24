import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const scenario = searchParams.get("scenario");
  const q = searchParams.get("q");
  const page = Number(searchParams.get("page") ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const where: string[] = ["l.firm_id = ?"];
  const params: any[] = [firmId];
  if (status) { where.push("l.status = ?"); params.push(status); }
  if (scenario) { where.push("l.scenario = ?"); params.push(scenario); }
  if (q) { where.push("(c.full_name LIKE ? OR c.best_phone LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }

  const conn = await pool.getConnection();
  try {
    const [rows]: any = await conn.query(
      `SELECT l.*, c.full_name, c.best_phone
       FROM leads l JOIN contacts c ON l.contact_id = c.contact_id
       WHERE ${where.join(" AND ")}
       ORDER BY l.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return NextResponse.json({ data: rows });
  } finally {
    conn.release();
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;

  const body = await req.json();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Simple upsert: if lead_id present, update; else create
    if (body.lead_id) {
      await conn.query(
        `UPDATE leads SET status=?, assignee_user_id=? WHERE lead_id=? AND firm_id=?`,
        [body.status ?? null, body.assignee_user_id ?? null, body.lead_id, firmId]
      );
    } else {
      await conn.query(
        `INSERT INTO leads(lead_id, firm_id, contact_id, status, scenario)
         VALUES(UUID(), ?, ?, ?, ?)`,
        [firmId, body.contact_id, body.status ?? "NEW", body.scenario]
      );
    }
    await conn.commit();
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json({ error: "DB_ERROR", detail: (e as Error).message }, { status: 500 });
  } finally {
    conn.release();
  }
}



