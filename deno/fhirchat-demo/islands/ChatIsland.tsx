import { useContext, useEffect, useState } from "preact/hooks";
import { AIConversationState } from "../hooks/aiConversationContext.ts";
import { useTextWithTypeAnimation } from "../hooks/typingAnimation.ts";

export default function ChatIsland() {
  const {
    question,
    conversation,
    agentMockResponse,
    setQuestion,
    appendToConversation,
    submitQuestion,
    closeConversation,
  } = useContext(AIConversationState);

  const { displayText, isTyping, resetTextAnimation } =
    useTextWithTypeAnimation({
      text: agentMockResponse.value,
      enabled: agentMockResponse.value !== "",
    });

  const handleMessageChange = (event: Event) => {
    event.preventDefault();
    setQuestion((event.target as HTMLInputElement).value);
  };

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (question.value === "") return;
    else {
      appendToConversation(question.value);
      submitQuestion(question.value);
      setQuestion("");
    }
  }

  const handleUserKeyPress = (event: KeyboardEvent) => {
    const { key } = event;
    if (key === "Enter" && question.value !== "") handleSubmit(event);
    else return;
  };

  useEffect(() => {
    globalThis.addEventListener("keydown", handleUserKeyPress);
    return () => {
      globalThis.removeEventListener("keydown", handleUserKeyPress);
    };
  });

  useEffect(() => {
    return () => {
      closeConversation();
    };
  }, []);

  useEffect(() => {
    if (agentMockResponse.value) resetTextAnimation();
  }, [agentMockResponse.value]);

  return (
    <section class="is-flex is-flex-direction-column is-justify-content-center  is-align-self-center">
      <ul>
        {conversation.value.map((message) => (
          <li>
            <div class="is-flex is-flex-direction-row pb-5">
              <span class="icon is-medium">
                <img src={"../images/user-avatar.svg"} alt="user avatar" />
              </span>
              <p class="is-size-6 has-text-left has-text-weight-normal pl-5 is-align-self-center user_prompt">
                {message}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <ul
        class={`${agentMockResponse.value === "" ? "is-hidden" : "is-visible"}`}
      >
        <li class="fhir_agent_container">
          <div class="is-flex is-align-items-center is-flex-direction-row">
            <span class="icon is-medium">
              <img src={"../images/agent-avatar.svg"} alt="user avatar" />
            </span>
            <p class="is-size-6 has-text-left has-text-weight-normal pl-5 is-align-self-center fhir_agent_prompt">
              {displayText}
            </p>
          </div>
        </li>
      </ul>

      <div class="field styled_text_input">
        <div class="control has-icons-right">
          <input
            class="input is-italic styled_input"
            type="text"
            placeholder="Enter a message"
            onInput={handleMessageChange}
            value={question}
          />

          <span class="icon is-small is-right">
            <img
              src={"../images/submit-icon.svg"}
              alt="acn logo"
              onClick={handleSubmit}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
