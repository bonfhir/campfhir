import { signal, type Signal } from "@preact/signals";
import * as uuid from "https://deno.land/std@0.192.0/uuid/mod.ts";
import { createContext } from "preact";
import { initWebSocket } from "../helpers/websocket.ts";
import { Message, Sender, Thought } from "../types/conversation.ts";

export type AppendToConversationFunction = (message: Message) => void;
export type SetQuestionFunction = (message: string) => void;
export type SubmitQuestionFunction = (message: string) => void;
export type CloseConversationFunction = () => void;

export type AIConversationContext = {
  conversation: Signal<Array<Message>>;
  lastQuestionAsked: Signal<string>;
  storedThoughts: Signal<Array<Thought>>;
  websocket: WebSocket;
  appendToConversation: AppendToConversationFunction;
  closeConversation: CloseConversationFunction;
  submitQuestion: SubmitQuestionFunction;
};

export type WSData = {
  response?: string;
  log?: {
    message: string;
    agentName: string;
    toolName?: string;
  };
};

function createAIConversationState(): AIConversationContext {
  const websocket = initWebSocket("ws://localhost:8889/api/aiConversation", {
    open: () => console.log("WS OPENED"),
    close: () => console.log("WS CLOSE"),
    error: (event) => console.log("WS ERROR: ", event),
    message: (event) => {
      console.log("WS MESSAGE EVENT: ", event);
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data) as WSData; // TODO unsafe

      if (data.response) {
        smartAppendToConversation(`💡 ${data.response}`, Sender.Assistant);
      } else if (data.log) {
        const { message, agentName, toolName } = data.log;
        if (!message.includes("Input") && !message.includes("Action")) {
          smartAppendToConversation(`🧠 ${message}`, Sender.Assistant);
        }
        smartAppendToThoughts(message, agentName, toolName);
      } else {
        console.error("Invalid WSData structure: ", data);
      }
    },
  });
  const conversation = signal<Array<Message>>([]);
  const lastQuestionAsked = signal<string>("");
  const storedThoughts = signal<Array<Message>>([]);

  const smartAppendToConversation = (message: string, sender: Sender) => {
    const lastIsLog = conversation.value
      ?.at(-1)
      ?.message?.at(-1)
      ?.startsWith("🧠");
    const formattedMessage = {
      id: uuid.v1.generate() as string,
      message,
      sender,
    };
    if (lastIsLog) {
      swapLastConversationLog(formattedMessage);
    } else {
      appendToConversation(formattedMessage);
    }
  };

  const appendToConversation: AppendToConversationFunction = (
    message: Message
  ) => {
    conversation.value = [...conversation.value, message];
  };

  const swapLastConversationLog = (message: Message) => {
    conversation.value = [...conversation.value.slice(0, -1), message];
  };

  const smartAppendToThoughts = (
    thoughtString: string,
    agentName: string,
    toolName: string
  ) => {
    const lastThought = storedThoughts.value.at(-1);
    const source = makeSourceLabel(agentName, toolName);
    if (lastThought?.source === source) {
      lastThought.thoughtsActions = [
        ...lastThought.thoughtsActions,
        thoughtString,
      ];
      storedThoughts.value = [
        ...storedThoughts.value.slice(0, -1),
        lastThought,
      ];
    } else {
      storedThoughts.value = [
        ...storedThoughts.value,
        {
          source: makeSourceLabel(agentName, toolName),
          thoughtsActions: [thoughtString],
        },
      ];
    }
  };

  const makeSourceLabel = (agentName: string, toolName: string): string => {
    let label = `${agentName}`;
    if (toolName) label += ` x ${toolName}`;
    return label;
  };

  const submitQuestion: SubmitQuestionFunction = (message: string) => {
    console.log("submitQuestion ws: ", websocket);
    lastQuestionAsked.value = message;
    appendToConversation({
      id: uuid.v1.generate() as string,
      message,
      sender: Sender.User,
    });
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(message);
    } else {
      console.log("Websocket not connected.");
    }
  };

  const closeConversation: CloseConversationFunction = () => {
    conversation.value = [];
    websocket.close();
  };

  return {
    websocket,
    conversation,
    lastQuestionAsked,
    storedThoughts,
    appendToConversation,
    closeConversation,
    submitQuestion,
  };
}

const currentAiConversationState = createAIConversationState();

export const AIConversationContext = createContext<AIConversationContext>(
  currentAiConversationState
);
