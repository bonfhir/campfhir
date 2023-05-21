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
        <header>
          <p>Uncover insights from you EHR</p>
        </header>
        <main>
          <AIQnA />
        </main>
      </body>
    </>
  );
}
