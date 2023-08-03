import { useContext } from "preact/hooks";
import { AIConversationContext } from "../hooks/aiConversationContext.ts";

export default function SuggestionsIsland() {
  const { conversation } = useContext(AIConversationContext);

  return conversation.value.length !== 0 ? (
    <></>
  ) : (
    <section class="section-padding-large is-flex is-flex-direction-column is-justify-content-center is-align-items-center suggestions_section">
      <p class="is-size-5 title has-text-centered">Suggestions</p>

      <div class="card mx-6 mb-4 styled_card">
        <div class="card-content">
          <div class="content">
            Give me the contact information of X organization?
          </div>
        </div>
      </div>

      <div class="card mx-6 mb-4 styled_card">
        <div class="card-content">
          <div class="content">
            Provide me a list of encounters I need to finalize?
          </div>
        </div>
      </div>

      <div class="card mx-6 mb-4 styled_card">
        <div class="card-content">
          <div class="content">
            Give me a list of patients with Alzheimers that i have seen in the
            last 3 months?
          </div>
        </div>
      </div>
    </section>
  );
}
