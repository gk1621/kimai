import { NextResponse } from "next/server";
import { readKnowledgeTemplate } from "@/lib/knowledge";

export async function GET() {
  const tpl = await readKnowledgeTemplate();
  return new NextResponse(JSON.stringify(tpl, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}


