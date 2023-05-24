import { OpenAI, PromptLayerOpenAI } from "langchain/llms/openai";

export function createOpenAIInstance(): OpenAI {
  if (!Deno.env.get("OPENAI_API_KEY")) {
    throw new Error("OPENAI_API_KEY not set");
  }

  if (Deno.env.get("PROMPTLAYER_API_KEY")) {
    return new PromptLayerOpenAI({ temperature: 0 });
  } else {
    return new OpenAI({ temperature: 0 });
  }
}
