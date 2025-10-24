import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;

  const [rows]: any = await pool.query(
    `SELECT l.*, c.full_name, c.best_phone, c.email
     FROM leads l JOIN contacts c ON l.contact_id=c.contact_id
     WHERE l.lead_id=? AND l.firm_id=? LIMIT 1`,
    [params.id, firmId]
  );
  if (!rows.length) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;
  const body = await req.json();
  await pool.query(
    `UPDATE leads SET status=?, assignee_user_id=? WHERE lead_id=? AND firm_id=?`,
    [body.status ?? null, body.assignee_user_id ?? null, params.id, firmId]
  );
  return NextResponse.json({ status: "ok" });
}



