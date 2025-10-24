import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 1), 50);

  const conn = await pool.getConnection();
  try {
    const [rows]: any = await conn.query(
      `SELECT t.transcript_id, t.lead_id, t.raw_text, t.structured_json, t.checksum, t.created_at
       FROM transcripts t
       JOIN leads l ON l.lead_id = t.lead_id
       WHERE l.firm_id = ? AND l.lead_id = ?
       ORDER BY t.created_at DESC
       LIMIT ${limit}`,
      [firmId, params.id]
    );
    return NextResponse.json({ data: rows });
  } finally {
    conn.release();
  }
}


