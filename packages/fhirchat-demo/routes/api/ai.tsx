import { HandlerContext, Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req: Request, _ctx: HandlerContext) {
    console.log("ws", req.url);

    if (req.headers.get("upgrade") != "websocket") {
      return new Response(null, { status: 501 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.addEventListener("open", () => {
      console.log("a client connected!");
    });
    socket.addEventListener("message", (event) => {
      console.log("ws message", event.data);
      if (event.data === "ping") {
        socket.send("pong");
      } else if (event.data === "pout") socket.send("pout");
    });
    return response;
  },
};
