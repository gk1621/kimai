import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

function buildAppOrigin(req: NextRequest): string {
  const hdrProto = req.headers.get("x-forwarded-proto");
  const hdrHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = hdrProto || "https";
  const host = hdrHost || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const { firm_id, agent_id } = await req.json();
  if (!firm_id || !agent_id) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });

  // Determine knowledge URL (include token if present)
  const [rows]: any = await pool.query(`SELECT agent FROM firm_settings WHERE firm_id=? LIMIT 1`, [firm_id]);
  const agent = rows[0]?.agent ? JSON.parse(rows[0].agent) : {};
  const token = agent?.knowledge_token as string | undefined;

  const origin = buildAppOrigin(req);
  const knowledge_url = `${origin}/api/knowledge/${firm_id}${token ? `?token=${token}` : ""}`;

  // Determine API key
  let apiKey = process.env.ELEVENLABS_API_KEY;
  const eleven = rows[0]?.elevenlabs ? JSON.parse(rows[0].elevenlabs) : undefined;
  if (!apiKey && eleven?.apiKey) apiKey = eleven.apiKey;
  if (!apiKey) return NextResponse.json({ error: "MISSING_ELEVENLABS_API_KEY" }, { status: 400 });

  const resp = await fetch(`https://api.elevenlabs.io/v1/agents/${encodeURIComponent(agent_id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({ knowledge_url }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: "ELEVENLABS_ERROR", status: resp.status, detail: text }, { status: 502 });
  }

  return NextResponse.json({ ok: true, knowledge_url }, { status: 200 });
}


