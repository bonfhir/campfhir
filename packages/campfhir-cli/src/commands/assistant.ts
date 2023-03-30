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
    const instructions = `** INSTRUCTIONS **
The only known api classes valid for answer are: Patient, RiskAssessment, Practitioner, Appointment, CarePlan.
All other classes are unknown.
Classes names are case insensitive. There are no subclasses or roles derived from the known classes.
If you are asked for an unknown class you should answer: "Sorry, I don't know about CLASS", interpolating "CLASS" with the unknown class name.

Each class has a known set of valid querystring for answer:

The only known querystrings valid for RiskAssessment are: subject, risk, _summary.
The only known querystrings valid for CarePlan are: status, intent, title, _summary.

All other querystring are unknown.
The answer can only contain known querystring.

If the querystring is invalid or unknown, you should answer: "Sorry, I don't know the parameter QUERYSTRING", interpolating "QUERYSTRING" with the unknown or invalid querystring.

** EXAMPLES**
`;

    const examplePrompt = new PromptTemplate({
      inputVariables: ["prompt", "completion"],
      template: exampleFormatterTemplate,
    });

    console.log("examplePrompt: ", examplePrompt);

    const fewShotPrompt = new FewShotPromptTemplate({
      examples,
      examplePrompt,
      prefix: instructions,
      suffix:
        "What API path would answer the question below?\nQ: {prompt} ||| api:",
      inputVariables: ["prompt"],
      exampleSeparator: "\n\n",
      templateFormat: "f-string",
    });

    console.log("fewShotPrompt: ", fewShotPrompt);

    dotenv.config(); // get the OpenAPI key from .env file

    const text = "Q";

    const query = await prompts({
      type: "text",
      name: "prompt",
      message: text,
    });

    const prompt = await fewShotPrompt.format({ prompt: query.prompt });

    console.log("prompt: ", prompt);

    const llm = new OpenAI({ temperature: 0 });
    const apiPath = await llm.call(prompt);
    console.log("apiPath: ", apiPath);
  },
};
