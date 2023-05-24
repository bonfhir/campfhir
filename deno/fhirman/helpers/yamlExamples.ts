import { join } from "https://deno.land/std@0.188.0/path/mod.ts";
import { parse } from "https://deno.land/std@0.184.0/yaml/mod.ts";

export type FhirPromptExample = {
  prompt: string;
  completion: {
    endpoint: string;
    params: Record<string, string>;
  };
};

export function readYamlExamples(
  dirPath = "/workspace/data/prompts"
): FhirPromptExample[] {
  const decoder = new TextDecoder("utf-8");
  const files = Deno.readDirSync(dirPath);
  let examples = [] as FhirPromptExample[];
  for (const file of files) {
    const filePath = join(dirPath, file.name);
    const byteArray = Deno.readFileSync(filePath);
    const fileText = decoder.decode(byteArray);
    examples = [...examples, ...parse(fileText)];
  }
  return examples;
}
