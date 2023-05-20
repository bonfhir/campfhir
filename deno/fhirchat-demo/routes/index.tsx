// deno-lint-ignore-file
import { Head } from "$fresh/runtime.ts";
import AIQnA from "../islands/AIQnA.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>CampFHIR</title>
      </Head>
      <div>
        <p>Uncover insights from you EHR</p>
        <AIQnA />
      </div>
    </>
  );
}
