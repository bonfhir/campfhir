import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

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
  const files = fs.readdirSync(dirPath);
  let examples = [] as FhirPromptExample[];
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const fileText = fs.readFileSync(filePath, "utf8");
    examples = [...examples, ...yaml.parse(fileText)];
  });
  console.log("examples: ", JSON.stringify(examples, null, 2));
  return examples;
}
