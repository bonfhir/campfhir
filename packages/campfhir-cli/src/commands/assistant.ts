import dotenv from "dotenv";
import { readFile } from "fs/promises";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { OpenAI } from "langchain/llms";
import { FewShotPromptTemplate, PromptTemplate } from "langchain/prompts";

const trainingDataFilePath = "/workspace/data/prompts.jsonl";
async function loadTrainingData() {
  return (await readFile(trainingDataFilePath, { encoding: "utf8", flag: "r" }))
    .split("\n")
    .filter(Boolean)
    .filter((x) => !x.startsWith("//"))
    .map((x) => JSON.parse(x));
}

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    const examples = await loadTrainingData();
    const exampleFormatterTemplate = "Q: {prompt} ||| api: {completion}";
    const examplePrompt = new PromptTemplate({
      inputVariables: ["prompt", "completion"],
      template: exampleFormatterTemplate,
    });

    const fewShotPrompt = new FewShotPromptTemplate({
      examples,
      examplePrompt,
      prefix: "What API path would answer the question below?",
      suffix: "Q: {prompt} ||| api:",
      inputVariables: ["prompt"],
      exampleSeparator: "\n\n",
      templateFormat: "f-string",
    });

    dotenv.config(); // get the OpenAPI key from .env file

    const text = "Q";

    const query = await prompts({
      type: "text",
      name: "prompt",
      message: text,
    });

    const prompt = await fewShotPrompt.format({ prompt: query.prompt });

    const llm = new OpenAI({ temperature: 0 });
    const apiPath = await llm.call(prompt);
    console.log("apiPath: ", apiPath);
  },
};
