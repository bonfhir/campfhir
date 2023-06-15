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

//   useEffect(() => {
// console.log("reload");

//   setInterval(function() {
//     location.reload();
//   }, 3000);
// }, []);

  return (
    <section class="section section-padding-large is-flex is-flex-direction-column is-justify-content-center">
 
        <ul>
          {conversation.value.map((message) => (
            <li>{message}</li>
          ))}
        </ul>
      
      <form>
        <div class="field is-grouped">
          <p class="control is-expanded">
            <input
              class="input"
              type="text"
              placeholder="Enter a message"
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
