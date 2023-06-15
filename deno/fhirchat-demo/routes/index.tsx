// deno-lint-ignore-file
import { Head } from "$fresh/runtime.ts";
import NavIsland from "../islands/NavIsland.tsx";
import ChatIsland from "../islands/ChatIsland.tsx";
import SuggestionsIsland from "../islands/SuggestionsIsland.tsx";
import FooterIsland from "../islands/FooterIsland.tsx";


export default function Home() {
  return (
    <>
      <body class="has-background-white-ter">
        <Head>
          <link rel="stylesheet" href="/styles/layout.css" />
          <link rel="stylesheet" href="/styles/chat.css" />
          <title>FHIR Chat</title>
        </Head>
        
          <NavIsland/>
         
          <SuggestionsIsland/>
          
          <ChatIsland />

        <FooterIsland/>
        
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
