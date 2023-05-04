import { OpenAI, PromptLayerOpenAI } from "langchain/llms/openai";

export function createOpenAIInstance(
  fields?: ConstructorParameters<typeof OpenAI>[0] & {
    promptLayerApiKey?: string;
    plTags?: string[];
  }
): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }

  if (process.env.PROMPTLAYER_API_KEY) {
    console.log("📡 broadcasting session to PromptLayer");
    return new PromptLayerOpenAI(fields);
  } else {
    return new OpenAI(fields);
  }
}
