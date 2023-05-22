import { useContext, useEffect } from "preact/hooks";
import { AIConversationState } from "../hooks/aiConversationContext.ts";

export default function AIQnA() {
  const {
    question,
    conversation,
    setQuestion,
    appendToConversation,
    submitQuestion,
    closeConversation,
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
      closeConversation();
    };
  }, []);

  return (
    <div class="section conversation">
      <form class="flex-grow-1">
        <input
          type="text"
          class="w-full"
          placeholder="Type something..."
          onChange={handleMessageChange}
        />
        <button class="button is-dark" type="button" onClick={handleSubmit}>
          send
        </button>
      </form>

      <div class="box">
        <ul>
          {conversation.value.map((message) => (
            <li>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
