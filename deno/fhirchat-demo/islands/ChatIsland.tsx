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
    if(question.value === "") return;
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
    <section class="section section-padding-large is-flex is-flex-direction-column is-justify-content-center is-align-self-center">
 
        <ul>
          {conversation.value.map((message) => (
            <li>{message}</li>
          ))}
        </ul>
      

        <div class="field styled_text_input">
  <p class="control has-icons-right">
  <input
              class="input "
              type="text"
              placeholder="Enter a message"
              onChange={handleMessageChange}
            />

<span class="icon is-small is-right"  onClick={handleSubmit} >
    <i class="fas fa-arrow-right styled_icon"/>
  </span>
  </p>
</div>
    </section>
  );
}
