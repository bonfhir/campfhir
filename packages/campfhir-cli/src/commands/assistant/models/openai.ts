import { OpenAI, PromptLayerOpenAI } from "langchain/llms/openai";
import process from "process";

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
    return new PromptLayerOpenAI(fields);
  } else {
    return new OpenAI(fields);
  }
}
