import { signal, type Signal } from "@preact/signals";
import { createContext } from "preact";

import { initWebSocket } from "../helpers/websocket.ts";

export type AppendToConversationFunction = (message: string) => void;
export type SetQuestionFunction = (message: string) => void;
export type SubmitQuestionFunction = (message: string) => void;

export type AIConversationContext = {
  question: Signal<string>;
  conversation: Signal<string[]>;
  appendToConversation: AppendToConversationFunction;
  setQuestion: SetQuestionFunction;
  submitQuestion: SubmitQuestionFunction;
  websocket: WebSocket;
};

function createAIConversationContext(): AIConversationContext {
  const websocket = initWebSocket("ws://localhost:8000/api/aiConversation", {
    open: () => console.log("WS OPENED"),
    close: () => console.log("WS CLOSE"),
    error: (event) => console.log("WS ERROR: ", event),
    message: (event) => {
      const message = event as MessageEvent;
      const data = message.data as string; // TODO unsafe
      console.log("WS MESSAGE: ", event);
      appendToConversation(data);
    },
  });
  const question = signal<string>("");
  const conversation = signal<string[]>([]);

  const appendToConversation: AppendToConversationFunction = (
    message: string
  ) => {
    conversation.value = [...conversation.value, message];
  };

  const setQuestion: SetQuestionFunction = (message: string) => {
    question.value = message;
  };

  const submitQuestion: SubmitQuestionFunction = (message: string) => {
    console.log("submitQuestion ws: ", websocket);
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(message);
    } else {
      console.log("Websocket not connected.");
    }
  };

  return {
    websocket,
    question,
    conversation,
    appendToConversation,
    setQuestion,
    submitQuestion,
  };
}

const currentAiConversationState = createAIConversationContext();

export const AIConversationState = createContext<AIConversationContext>(
  currentAiConversationState
);
