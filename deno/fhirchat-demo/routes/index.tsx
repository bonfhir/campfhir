// deno-lint-ignore-file
import { Head } from "$fresh/runtime.ts";
import NavBar from "../components/NavBar.tsx";
import ChatIsland from "../islands/ChatIsland.tsx";
import Suggestions from "../components/Suggestions.tsx";
import Footer from "../components/Footer.tsx";

export default function Home() {
  return (
    <>
      <body>
        <Head>
          <link rel="stylesheet" href="/styles/layout.css" />
          <link rel="stylesheet" href="/styles/chat.css" />
          <link
            href="https://fonts.googleapis.com/css?family=Raleway"
            rel="stylesheet"
          >
          </link>
          <script
            defer
            src="https://use.fontawesome.com/releases/v5.3.1/js/all.js"
          >
          </script>
          <title>FHIR Chat</title>
        </Head>

        <div class="flex_wrapper is-flex is-flex-direction-column">
          <NavBar />

          <div class="section_wrapper is-flex  is-flex-direction-column">
            <Suggestions />
            <ChatIsland />
          </div>

          <Footer />
        </div>

        <div class="modal">
          <div class="modal-background"></div>
          <div class="modal-card">
            <header class="modal-card-head">
              <p class="modal-card-title">Modal title</p>
              <button class="delete" aria-label="close"></button>
            </header>
            <section class="modal-card-body">
              <h1>MODAL</h1>
            </section>
            <footer class="modal-card-foot">
              <button class="button is-success">Save changes</button>
              <button class="button">Cancel</button>
            </footer>
          </div>
        </div>
      </body>
    </>
  );
}
