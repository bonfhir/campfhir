import { Cohere } from "langchain/llms/cohere";

export function createCohereInstance() {
  if (!process.env.COHERE_API_KEY) {
    throw new Error("COHERE_API_KEY not set");
  }

  return new Cohere({});
}
