import { OpenAI } from "langchain/llms/openai";

// https://github.com/go-skynet/LocalAI
export function createLocalAIInstance(
  fields?: ConstructorParameters<typeof OpenAI>[0]
): OpenAI {
  return new OpenAI(fields, {
    basePath: "http://host.docker.internal:8080/v1",
  });
}
