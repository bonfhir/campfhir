// deno-lint-ignore-file
import { Head } from "$fresh/runtime.ts";
import AIQnA from "../islands/AIQnA.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Fresh App</title>
      </Head>
      <div>
        <img
          src="/logo.svg"
          width="128"
          height="128"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <p>
          Welcome to `fresh`. Try updating this message in the
          ./routes/index.tsx file, and refresh.
        </p>
        <AIQnA />
      </div>
    </>
  );
}
