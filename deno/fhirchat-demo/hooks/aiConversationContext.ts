import { type Signal, signal } from "@preact/signals";
import { createContext } from "preact";

import { initWebSocket } from "../helpers/websocket.ts";

export type AppendToConversationFunction = (message: string) => void;
export type SetQuestionFunction = (message: string) => void;
export type SubmitQuestionFunction = (message: string) => void;
export type closeConversationFunction = () => void;

export type AIConversationContext = {
  question: Signal<string>;
  conversation: Signal<string[]>;
  appendToConversation: AppendToConversationFunction;
  setQuestion: SetQuestionFunction;
  submitQuestion: SubmitQuestionFunction;
  websocket: WebSocket;
  closeConversation: closeConversationFunction;
};

export type WSData = {
  response?: string;
  log?: {
    message: string;
    agentName: string;
    toolName?: string;
  };
};

function createAIConversationContext(): AIConversationContext {
  const websocket = initWebSocket("ws://localhost:8889/api/aiConversation", {
    open: () => console.log("WS OPENED"),
    close: () => console.log("WS CLOSE"),
    error: (event) => console.log("WS ERROR: ", event),
    message: (event) => {
      console.log("WS MESSAGE EVENT: ", event);
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data) as WSData; // TODO unsafe

      if (data.response) {
        smartAppendToConversation(`💡 ${data.response}`);
      } else if (data.log) {
        const { message, agentName, toolName } = data.log;
        if (!message.includes("Input") && !message.includes("Action")) {
          smartAppendToConversation(`🧠 ${data.log.message}`);
        } else {
          console.debug("Model silent log: ", message, agentName, toolName);
        }
      } else {
        console.error("Invalid WSData structure: ", data);
      }
    },
  });
  const question = signal<string>("");
  const conversation = signal<string[]>([]);

  const smartAppendToConversation = (message: string) => {
    const lastIsLog = conversation.value[conversation.value.length - 1]
      ?.startsWith("🧠");
    if (lastIsLog) {
      swapLastConversationLog(message);
    } else {
      appendToConversation(message);
    }
  };

  const appendToConversation: AppendToConversationFunction = (
    message: string,
  ) => {
    conversation.value = [...conversation.value, message];
  };

  const swapLastConversationLog = (message: string) => {
    conversation.value = [...conversation.value.slice(0, -1), message];
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

  const closeConversation: closeConversationFunction = () => {
    question.value = "";
    conversation.value = [];

    websocket.close();
  };

  return {
    websocket,
    question,
    conversation,
    appendToConversation,
    setQuestion,
    submitQuestion,
    closeConversation,
  };
}

const currentAiConversationState = createAIConversationContext();

export const AIConversationState = createContext<AIConversationContext>(
  currentAiConversationState,
);
