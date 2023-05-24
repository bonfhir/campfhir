import { HuggingFaceInference } from "langchain/llms/hf";

export function createHuggingFaceInstance() {
  return new HuggingFaceInference({ model: "TheBloke/stable-vicuna-13B-GPTQ" });
}
