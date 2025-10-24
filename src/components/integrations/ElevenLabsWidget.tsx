"use client";

import Script from "next/script";
import React from "react";

// Allow TSX to recognize the custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        "agent-id"?: string;
      };
    }
  }
}

type ElevenLabsWidgetProps = {
  agentId?: string;
};

export default function ElevenLabsWidget({ agentId }: ElevenLabsWidgetProps) {
  const resolvedAgentId = agentId || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "agent_2201k4x4s1vsev6aczk04ekz09pd";
  return (
    <>
      <Script id="elevenlabs-convai-script" src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />
      {resolvedAgentId ? (
        <elevenlabs-convai agent-id={resolvedAgentId} />
      ) : null}
    </>
  );
}


