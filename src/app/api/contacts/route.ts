import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const firmId = (session as any).user.firm_id as string;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const where: string[] = ["firm_id=?"]; const params: any[] = [firmId];
  if (q) { where.push("(full_name LIKE ? OR best_phone LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }

  const [rows]: any = await pool.query(
    `SELECT * FROM contacts WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 50`,
    params
  );
  return NextResponse.json({ data: rows });
}



