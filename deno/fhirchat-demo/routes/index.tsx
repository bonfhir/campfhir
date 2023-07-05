// deno-lint-ignore-file
import { Head } from "$fresh/runtime.ts";
import Footer from "../components/Footer.tsx";
import NavBar from "../components/NavBar.tsx";
import ChatIsland from "../islands/ChatIsland.tsx";
import SuggestionsIsland from "../islands/SuggestionsIsland.tsx";
import ThoughtsActionsIsland from "../islands/ThoughtsActionsIsland.tsx";

export default function Home() {
  return (
    <html>
      <body>
        <Head>
          <link rel="stylesheet" href="/styles/layout.css" />
          <link rel="stylesheet" href="/styles/chat.css" />
          <link
            href="https://fonts.googleapis.com/css?family=Raleway"
            rel="stylesheet"
          >
          </link>
          <link
            href="https://fonts.googleapis.com/css?family=Outfit"
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
          <ThoughtsActionsIsland />
          <NavBar />

          <div class="section_wrapper is-flex  is-flex-direction-column">
            <SuggestionsIsland />
            <ChatIsland />
          </div>

          <Footer />
        </div>
      </body>
    </html>
  );
}
