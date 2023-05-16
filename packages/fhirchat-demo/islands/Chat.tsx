import { useEffect, useState } from "preact/hooks";

export default function Chat() {
  const [websocket, setWebsocket] = useState<WebSocket>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);

  function handleMessageChange(event: Event) {
    setMessage((event.target as HTMLInputElement).value);
  }

  function handleSubmit(event: Event) {
    event.preventDefault();

    setMessages([...messages, message]);

    console.log("handleSubmit ws: ", websocket);

    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(message);
    }

    setMessage("");
  }

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/api/ai");
    setWebsocket(ws);

    ws.addEventListener("open", () => {
      console.log("ws open", ws);
    });
    ws.addEventListener("message", (event) => {
      console.log("ws message", event.data);
    });
    ws.addEventListener("close", () => {
      console.log("ws close");
    });
    ws.addEventListener("error", (event) => {
      console.log("ws error", event);
    });
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div class="flex gap-2 w-full">
      <form class="flex-grow-1">
        <input
          type="text"
          class="w-full"
          placeholder="Type something..."
          onChange={handleMessageChange}
        />
        <button onClick={handleSubmit}>send</button>
      </form>

      <div class="flex-grow-1">
        <ul>
          {messages.map((message) => (
            <li>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
