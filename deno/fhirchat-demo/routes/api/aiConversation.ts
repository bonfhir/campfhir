import { serve } from "https://deno.land/std@0.184.0/http/server.ts";
import { type ChainValues } from "https://esm.sh/langchain/schema";

import {
  type AssistantAgent,
  createAssistantAgent,
} from "/workspace/packages/fhirman/agents/assistant.ts";
import { SessionLogger } from "/workspace/packages/fhirman/helpers/sessionLogger.ts";

import { MODEL_OUTPUT_EVENT } from "/workspace/packages/fhirman/events/ModelOutputEmitter.ts";

function handler(req: Request): Response {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.addEventListener("open", () => {
    console.log("a client connected!");
  });

  let assistant: AssistantAgent;

  async function questionHandler(event: MessageEvent) {
    if (!assistant) {
      assistant = await createAssistantAgent();
      assistant.events.on(
        MODEL_OUTPUT_EVENT,
        (message, agentName, toolName) => {
          socket.send(
            JSON.stringify({ log: { message, agentName, toolName } }),
          );
        },
      );
    }
    if (event.data === "ping") {
      socket.send("pong");
    } else if (event.data) {
      const response: ChainValues = await assistant.agent.call({
        input: event.data,
      });
      console.log("Agent response:", response);
      socket.send(JSON.stringify({ response: response.output }));
    }
  }

  socket.addEventListener("message", questionHandler);
  return response;
}

SessionLogger.init({});
serve(handler, { port: 8889 });
