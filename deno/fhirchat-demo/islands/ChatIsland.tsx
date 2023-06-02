import { useContext, useEffect } from "preact/hooks";
import { AIConversationState } from "../hooks/aiConversationContext.ts";

export default function ChatIsland() {
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

    appendToConversation(`👤 ${question.value}`);
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
    <section class="section conversation">
      <div class="box">
        <h6 class="title is-6 has-text-centered">
          Uncover insights from your EHR
        </h6>
      </div>
      <div class="box is-large">
        <ul>
          {conversation.value.map((message) => (
            <li>{message}</li>
          ))}
        </ul>
      </div>

      <form>
        <h4 class="title is-4">Ask me a question</h4>
        <div class="field is-grouped">
          <p class="control is-expanded">
            <input
              class="input"
              type="text"
              placeholder="Enter your question here"
              onChange={handleMessageChange}
            />
          </p>
          <p class="control">
            <a class="button is-info" onClick={handleSubmit}>
              send
            </a>
          </p>
        </div>
      </form>
    </section>
  );
}
