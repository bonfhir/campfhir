import { signal } from "@preact/signals";
import { useContext, useEffect, useMemo } from "preact/hooks";
import AgentMessage from "../components/AgentMessage.tsx";
import UserMessage from "../components/UserMessage.tsx";
import { extractInteractions } from "../helpers/extractConversationInteractions.ts";
import { AIConversationContext } from "../hooks/aiConversationContext.ts";
import { useTextWithTypeAnimation } from "../hooks/typingAnimation.ts";
import { Interaction, Message } from "../types/conversation.ts";

export default function ChatIsland() {
  const { conversation, closeConversation, submitQuestion } = useContext(
    AIConversationContext,
  );
  const interactions: Array<Interaction> = useMemo(
    () => extractInteractions(conversation.value),
    [conversation.value],
  );

  const userInput = signal<string>("");
  const mostRecentAgentResponse = interactions.at(-1)?.agentMessage;

  const { displayText, resetTextAnimation } = useTextWithTypeAnimation({
    text: mostRecentAgentResponse?.message,
    enabled: !!mostRecentAgentResponse?.message,
  });

  const determineAgentDisplayText = (agentMessage?: Message) => {
    const nullSafeAgentMessage = agentMessage?.message ?? "";

    return agentMessage?.id === mostRecentAgentResponse?.id
      ? displayText
      : nullSafeAgentMessage;
  };

  const handleMessageChange = (event: Event) => {
    event.preventDefault();
    userInput.value = (event.target as HTMLInputElement).value;
  };

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (userInput.value) {
      submitQuestion(userInput.value);
      userInput.value = "";
    }
  }

  const handleUserKeyPress = (event: KeyboardEvent) => {
    const { key } = event;
    const allowSubmission = key === "Enter" && userInput.value !== "";
    if (allowSubmission) handleSubmit(event);
  };

  useEffect(() => {
    globalThis.addEventListener("keydown", handleUserKeyPress);
    return () => {
      globalThis.removeEventListener("keydown", handleUserKeyPress);
    };
  });

  useEffect(() => {
    return closeConversation;
  }, []);

  useEffect(() => {
    if (mostRecentAgentResponse) resetTextAnimation();
  }, [conversation.value]);

  return (
    <section class="is-flex is-flex-direction-column is-justify-content-center  is-align-self-center">
      {interactions.map(({ userMessage, agentMessage }: Interaction) => {
        const agentDisplayText = determineAgentDisplayText(agentMessage);

        return (
          <>
            <UserMessage message={userMessage.message} />
            <AgentMessage message={agentDisplayText} />
          </>
        );
      })}

      <div class="field styled_text_input">
        <div class="control has-icons-right">
          <input
            class="input is-italic styled_input"
            type="text"
            placeholder="Enter a message"
            onInput={handleMessageChange}
            value={userInput}
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
