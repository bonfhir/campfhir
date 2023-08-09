import { signal, type Signal } from "@preact/signals";

let cursor: Signal;
const BLINK_INTERVAL = 0.5 * 1000; // half second

export function blinkingCursor() {
  if (cursor) return cursor;

  cursor = signal<string>("|");

  const intervalId = setInterval(() => {
    cursor.value = cursor.value === "|" ? "" : "|";
  }, BLINK_INTERVAL);
  console.log("interval: ", intervalId);

  return cursor;
}
