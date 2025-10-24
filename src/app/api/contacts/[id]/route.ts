import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;
  const [rows]: any = await pool.query(
    `SELECT * FROM contacts WHERE contact_id=? AND firm_id=? LIMIT 1`,
    [params.id, firmId]
  );
  if (!rows.length) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(rows[0]);
}



