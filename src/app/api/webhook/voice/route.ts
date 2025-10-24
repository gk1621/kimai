import { NextResponse } from "next/server";

export async function POST() {
  const wsUrl = process.env.TWILIO_STREAM_WS_URL || "wss://YOUR_DOMAIN/api/stream";
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record transcribe="false" maxLength="1800" playBeep="false" />
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`;
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}

export async function GET() {
  return POST();
}


