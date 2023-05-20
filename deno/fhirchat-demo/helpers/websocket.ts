type WebSocketEventCallback = (
  this: WebSocket,
  event: Event | MessageEvent | CloseEvent
) => void;
type WebSocketEventName = keyof WebSocketEventMap;
type WebSocketCallbacks = {
  open?: WebSocketEventCallback;
  message?: WebSocketEventCallback;
  close?: WebSocketEventCallback;
  error?: WebSocketEventCallback;
};

export function initWebSocket(
  address: string,
  callbacks?: WebSocketCallbacks
): WebSocket {
  const ws = new WebSocket(address);

  if (callbacks) {
    Object.entries(callbacks).forEach(([eventName, callback]) => {
      ws.addEventListener(eventName as WebSocketEventName, callback);
    });
  }

  return ws;
}
// TODO: maybe something with ws.close()??
