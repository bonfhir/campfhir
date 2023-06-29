import { useContext, useEffect } from "preact/hooks";
import { AIConversationState } from "../hooks/aiConversationContext.ts";

import { AppState } from "../hooks/appContext.ts";
import { useTextWithTypeAnimation } from "../hooks/typingAnimation.ts";

export default function ChatIsland() {
  const {
    question,
    conversation,
    setQuestion,
    appendToConversation,
    submitQuestion,
    closeConversation,
  } = useContext(AIConversationState);

  const { setThoughtsActionsPanel } = useContext(AppState);

  const userQuestion = conversation.value[0];
  const agentResponse = conversation.value[1];

  const { displayText, isTyping, resetTextAnimation } =
    useTextWithTypeAnimation({
      text: agentResponse,
      enabled: agentResponse !== "",
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
    const allowSubmission = key === "Enter" && question.value !== "";
    if (allowSubmission) handleSubmit(event);
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
    if (agentResponse) resetTextAnimation();
  }, [conversation.value]);

  return (
    <section class="is-flex is-flex-direction-column is-justify-content-center  is-align-self-center">
      {userQuestion && (
        <ul>
          <li>
            <div class="is-flex is-flex-direction-row pb-5">
              <span class="icon is-medium">
                <img src={"../images/user-avatar.svg"} alt="user avatar" />
              </span>
              <p class="is-size-6 has-text-left has-text-weight-normal pl-5 is-align-self-center user_prompt">
                {userQuestion}
              </p>
            </div>
          </li>
        </ul>
      )}

      {agentResponse && (
        <ul>
          <li class="fhir_agent_container">
            <div class="is-flex is-align-items-center is-flex-direction-row">
              <span class="icon is-medium">
                <img src={"../images/agent-avatar.svg"} alt="user avatar" />
              </span>
              <p class="is-size-6 has-text-left has-text-weight-normal pl-5 is-align-self-center fhir_agent_prompt">
                {displayText}
              </p>
            </div>
            <div class="is-flex is-flex-direction-row is-align-items-center control">
              {!isTyping && (
                <span
                  class="icon is-medium"
                  onClick={() => setThoughtsActionsPanel(true)}
                >
                  <img src={"../images/settings.svg"} alt="settings" />
                </span>
              )}
            </div>
          </li>
        </ul>
      )}

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
