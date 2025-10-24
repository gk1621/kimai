import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  const { firmName, name, email, password } = await req.json();
  if (!firmName || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const firmId = randomUUID();
    await conn.query('INSERT INTO firms(firm_id, name) VALUES(?, ?)', [firmId, firmName]);
    const userId = randomUUID();
    const pwd = await hash(password, 10);
    await conn.query(
      `INSERT INTO users(user_id, firm_id, email, name, role, password_hash) VALUES(?, ?, ?, ?, 'ADMIN', ?)`,
      [userId, firmId, email, name || null, pwd]
    );
    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    await conn.rollback();
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  } finally {
    conn.release();
  }
}


