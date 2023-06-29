import { useContext } from "preact/hooks";
import { AIConversationState } from "../hooks/aiConversationContext.ts";
import { AppState } from "../hooks/appContext.ts";

export default function ThoughtsActionsIsland() {
  const { thoughtActionPanelOpen, setThoughtsActionsPanel } = useContext(
    AppState,
  );
  const { lastQuestionAsked, storedThoughts } = useContext(AIConversationState);

  return (
    <aside
      class={`menu slide_out_container ${
        thoughtActionPanelOpen.value ? "is-visible" : "is-hidden"
      }`}
    >
      <div class="close_button control is-flex is-align-items-center mb-3">
        <span
          class="icon is-medium"
          onClick={() => setThoughtsActionsPanel(false)}
        >
          <img src={"../images/close.svg"} alt="close" />
        </span>
        CLOSE
      </div>
      <p class="slide_out_title mb-2">Thoughts and Actions</p>
      <p class="slide_out_description mb-6">
        The steps and actions taken by the FhirChat agent to generate the
        answer.
      </p>

      <p class="slide_out_question mb-2">{lastQuestionAsked.value}</p>

      {storedThoughts.value.map((item) => (
        <div class="mb-2">
          <div class="slide_out_content_style is-flex is-align-items-center">
            <span class="icon is-medium">
              <img src={"../images/thought.svg"} alt="thought avatar" />
            </span>
            {item.source}
          </div>
          {item.thoughtsActions?.map((thoughts_actions: string) => (
            <div class="slide_out_content_style is-flex is-align-items-center">
              <span class="icon is-medium">
                <img src={"../images/action.svg"} alt="action avatar" />
              </span>
              {thoughts_actions}
            </div>
          ))}
        </div>
      ))}

      <p class="slide_out_question my-5">
        Answer: There are 287 female patients born before 1977.
      </p>

      <p class="slide_out_title">Provide Feedback</p>
      <div class="is-flex is-flex-direction-row is-align-items-center">
        <span class="icon is-medium">
          <img src={"../images/thumb-up.svg"} alt="accurate answer" />
        </span>
        <p class="slide_out_feedback">Accurate</p>

        <span class="icon is-medium">
          <img src={"../images/thumb-down.svg"} alt="not accurate answer" />
        </span>
        <p class="slide_out_feedback">Not accurate</p>
      </div>
    </aside>
  );
}
