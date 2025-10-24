import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  const [rows]: any = await pool.query(
    `SELECT task_id, lead_id, title, due_at, assignee_user_id, status, created_at
     FROM tasks
     WHERE firm_id=? AND lead_id=?
     ORDER BY COALESCE(due_at, created_at) ASC
     LIMIT ${limit}`,
    [firmId, params.id]
  );
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;
  const body = await req.json();
  await pool.query(
    `INSERT INTO tasks(task_id, firm_id, lead_id, title, due_at, assignee_user_id, status)
     VALUES(UUID(), ?, ?, ?, ?, ?, 'OPEN')`,
    [firmId, params.id, body.title, body.due_at ?? null, body.assignee_user_id ?? null]
  );
  return NextResponse.json({ status: "ok" }, { status: 201 });
}



