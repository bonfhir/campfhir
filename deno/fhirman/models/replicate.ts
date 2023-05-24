import { Replicate } from "langchain/llms/replicate";

export function createReplicateInstance() {
  if (!Deno.env.get("REPLICATE_API_KEY")) {
    throw new Error("REPLICATE_API_KEY not set");
  }

  return new Replicate({
    model:
      "replicate/vicuna-13b:a68b84083b703ab3d5fbf31b6e25f16be2988e4c3e21fe79c2ff1c18b99e61c1",
  });
}
