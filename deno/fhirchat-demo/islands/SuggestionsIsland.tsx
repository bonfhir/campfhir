
export default function SuggestionsIsland() {
  return (
    <section class="section section-padding-large is-flex is-flex-direction-column is-justify-content-center is-align-items-center">
      <p class="is-size-5 title has-text-centered">
        Suggestions
      </p>

      <div class="card mx-6 mb-4 styled_card">
        <div class="card-content">
          <div class="content">
            (Basic Question) “Lorem ipsum dolor sit amet, consectetur adipiscing?” 
          </div>
        </div>
      </div>

      <div class="card mx-6 mb-4 styled_card">
        <div class="card-content">
          <div class="content">
          (Contextual Question) “Nullam pulvinar, orci et viverra lobortis, eros ante pharetra quam?”
          </div>
        </div>
      </div>

      <div class="card mx-6 mb-4 styled_card">
        <div class="card-content">
          <div class="content">
          (Question with a specific output format)“Nullam pulvinar, orci et viverra lobortis, eros ante?”
          </div>
        </div>
      </div>
    </section>
  );
}
