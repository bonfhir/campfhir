// deno-lint-ignore-file
import { Head } from "$fresh/runtime.ts";
import AIQnA from "../islands/AIQnA.tsx";

export default function Home() {
  return (
    <>
      <body>
        <Head>
          <link rel="stylesheet" href="/styles/layout.css" />
          <link rel="stylesheet" href="/styles/bulma.css" />
          <title>CampFHIR</title>
        </Head>
        <div class="container hero is-fullheight is-fullhd">
          <div class="lside">
            <div class="lside-inner has-background-grey"></div>
          </div>
          <div class="midsection has-background-white-bis">
            <header>
              <div class="box">
                <p>Uncover insights from you EHR</p>
              </div>
            </header>
            <main>
              <AIQnA />
            </main>
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
      </body>
    </>
  );
}
