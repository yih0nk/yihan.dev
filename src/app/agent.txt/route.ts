import { generateAgentDoc } from "@/lib/agentContent";

export async function GET() {
  return new Response(generateAgentDoc(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
