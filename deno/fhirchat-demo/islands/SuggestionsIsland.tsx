import { useContext } from "preact/hooks";
import { AIConversationState } from "../hooks/aiConversationContext.ts";
export default function SuggestionsIsland() {
  const { conversation } = useContext(AIConversationState);

  return conversation.value.length !== 0
    ? <></>
    : (
      <section class="section-padding-large is-flex is-flex-direction-column is-justify-content-center is-align-items-center suggestions_section">
        <p class="is-size-5 title has-text-centered">Suggestions</p>

        <div class="card mx-6 mb-4 styled_card">
          <div class="card-content">
            <div class="content">
              (Basic Question) “Lorem ipsum dolor sit amet, consectetur
              adipiscing?”
            </div>
          </div>
        </div>

        <div class="card mx-6 mb-4 styled_card">
          <div class="card-content">
            <div class="content">
              (Contextual Question) “Nullam pulvinar, orci et viverra lobortis,
              eros ante pharetra quam?”
            </div>
          </div>
        </div>

        <div class="card mx-6 mb-4 styled_card">
          <div class="card-content">
            <div class="content">
              (Question with a specific output format)“Nullam pulvinar, orci et
              viverra lobortis, eros ante?”
            </div>
          </div>
        </div>
      </section>
    );
}
