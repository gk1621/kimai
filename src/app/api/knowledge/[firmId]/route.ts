import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ensureKnowledgeSeededForFirm, rebuildKnowledgeForFirm } from "@/lib/knowledge";

function buildAppOrigin(req: NextRequest): string {
  const hdrProto = req.headers.get("x-forwarded-proto");
  const hdrHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = hdrProto || "https";
  const host = hdrHost || "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest, { params }: { params: { firmId: string } }) {
  const firmId = params.firmId;
  if (!firmId) return NextResponse.json({ error: "MISSING_FIRM_ID" }, { status: 400 });

  // Optional token check via firm_settings.agent.knowledge_token
  const [rows]: any = await pool.query(`SELECT agent FROM firm_settings WHERE firm_id=? LIMIT 1`, [firmId]);
  const agent = rows[0]?.agent ? JSON.parse(rows[0].agent) : {};
  const requiredToken = agent?.knowledge_token as string | undefined;
  if (requiredToken) {
    const provided = new URL(req.url).searchParams.get("token");
    if (!provided || provided !== requiredToken) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  await ensureKnowledgeSeededForFirm(firmId);
  const doc = await rebuildKnowledgeForFirm(firmId);

  const origin = buildAppOrigin(req);
  const body = {
    ...doc,
    knowledge_url: `${origin}/api/knowledge/${firmId}${requiredToken ? `?token=${requiredToken}` : ""}`,
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}


