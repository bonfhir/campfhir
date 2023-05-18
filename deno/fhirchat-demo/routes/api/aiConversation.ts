import { serve } from "https://deno.land/std@0.184.0/http/server.ts";
import { OpenAI } from "https://esm.sh/langchain/llms/openai";

function handler(req: Request): Response {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.addEventListener("open", () => {
    console.log("a client connected!");
  });

  let model: OpenAI;

  async function messageHandler(event) {
    if (!model) {
      model = new OpenAI({
        temperature: 0,
      });
    }
    if (event.data === "ping") {
      socket.send("pong");
    } else if (event.data === "pout") {
      socket.send("pout pout");
    } else {
      const res = await model.call(event.data);
      console.log("AI:", res);
      socket.send(res);
    }
  }

  socket.addEventListener("message", messageHandler);
  return response;
}

serve(handler);
