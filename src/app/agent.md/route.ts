import { generateAgentDoc } from "@/lib/agentContent";

export async function GET() {
  return new Response(generateAgentDoc(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
