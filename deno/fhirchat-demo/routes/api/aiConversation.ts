import { serve } from "https://deno.land/std@0.184.0/http/server.ts";
import { AgentExecutor } from "https://esm.sh/langchain/agents";
import { type ChainValues } from "https://esm.sh/langchain/schema";

import { createAssistantAgent } from "/workspace/packages/fhirman/agents/assistant.ts";
import { SessionLogger } from "/workspace/packages/fhirman/helpers/sessionLogger.ts";

function handler(req: Request): Response {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.addEventListener("open", () => {
    console.log("a client connected!");
  });

  let agent: AgentExecutor;

  async function questionHandler(event: MessageEvent) {
    if (!agent) {
      agent = await createAssistantAgent();
    }
    if (event.data === "ping") {
      socket.send("pong");
    } else {
      const response: ChainValues = await agent.call({
        input: event.data,
      });
      console.log("Agent response:", response);
      socket.send(response.output);
    }
  }

  socket.addEventListener("message", questionHandler);
  return response;
}

SessionLogger.init({});
serve(handler, { port: 8889 });
