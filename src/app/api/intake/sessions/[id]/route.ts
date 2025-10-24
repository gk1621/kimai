import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type Body = {
  session_data?: any;
  current_question_id?: number;
  status?: "active" | "completed" | "abandoned";
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = (await req.json()) as Body;

  const fields: string[] = [];
  const values: any[] = [];

  if (body.session_data !== undefined) {
    fields.push("session_data = ?");
    values.push(JSON.stringify(body.session_data));
  }
  if (body.current_question_id !== undefined) {
    fields.push("current_question_id = ?");
    values.push(body.current_question_id);
  }
  if (body.status) {
    fields.push("status = ?");
    values.push(body.status);
    if (body.status === "completed") {
      fields.push("completed_at = CURRENT_TIMESTAMP");
    }
  }

  if (fields.length === 0) return NextResponse.json({ updated: 0 });

  const sql = `UPDATE intake_sessions SET ${fields.join(", ")} WHERE id = ?`;
  values.push(id);

  const [res]: any = await pool.query(sql, values);
  return NextResponse.json({ updated: res.affectedRows ?? 0 });
}


