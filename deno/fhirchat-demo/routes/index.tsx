// deno-lint-ignore-file
import { Head } from "$fresh/runtime.ts";
import ChatIsland from "../islands/ChatIsland.tsx";

export default function Home() {
  return (
    <>
      <body class="has-background-white-ter">
        <Head>
          <link rel="stylesheet" href="/styles/layout.css" />
          <link rel="stylesheet" href="/styles/chat.css" />
          <title>FHIR Chat</title>
        </Head>
        <div class="container hero is-fullheight is-fullhd">
          <div class="navbar is-fixed-top has-background-primary"></div>
          <div class="lside">
            <div class="lside-inner has-background-white-ter"></div>
          </div>
          <div class="midsection has-background-white-ter">
            <header></header>
            <ChatIsland />
            <footer>
              <div class="box">
                <h3>©2023 ACN</h3>
              </div>
            </footer>
          </div>
          <div class="rside">
            <div class="rside-inner has-background-white-ter"></div>
          </div>
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
