import { Cohere } from "langchain/llms/cohere";

export function createCohereInstance() {
  if (!Deno.env.get("COHERE_API_KEY")) {
    throw new Error("COHERE_API_KEY not set");
  }

  return new Cohere({});
}
