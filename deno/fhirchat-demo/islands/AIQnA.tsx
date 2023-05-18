import { useEffect, useState, useContext } from "preact/hooks";
import {
  AIConversationState,
  type AIConversationContext,
} from "../hooks/aiConversationContext.ts";

export default function AIQnA() {
  const {
    websocket,
    question,
    conversation,
    setQuestion,
    appendToConversation,
    submitQuestion,
  } = useContext(AIConversationState);

  function handleMessageChange(event: Event) {
    setQuestion((event.target as HTMLInputElement).value);
  }

  function handleSubmit(event: Event) {
    event.preventDefault();

    appendToConversation(question.value);
    submitQuestion(question.value);
    setQuestion("");
  }

  useEffect(() => {
    console.log("use effect!");
    return () => {
      websocket.close();
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
          {conversation.value.map((message) => (
            <li>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
