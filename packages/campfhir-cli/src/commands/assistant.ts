import dotenv from "dotenv";
import { readFile } from "fs/promises";

import { LLMChain } from "langchain";
import { ChatOpenAI } from "langchain/chat_models";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import prompts from "prompts";
import { CommandModule } from "yargs";

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

** EXAMPLES**`;

    const examplePrompt = new PromptTemplate({
      inputVariables: ["prompt", "completion"],
      template: exampleFormatterTemplate,
    });

    // console.log("examplePrompt: ", examplePrompt);

    const fewShotPrompt = new FewShotPromptTemplate({
      examples,
      examplePrompt,
      prefix: instructions,
      exampleSeparator: "\n\n",
      templateFormat: "f-string",
      inputVariables: [],
    });

    //console.log("fewShotPrompt: ", fewShotPrompt);

    const instructionPrompt = SystemMessagePromptTemplate.fromTemplate(
      await fewShotPrompt.format({})
    );
    const questionPrompt = HumanMessagePromptTemplate.fromTemplate(
      "What API path would answer the question below?\nQ: {question} ||| api:"
    );
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      instructionPrompt,
      questionPrompt,
    ]);
    //console.log("chatPrompt: ", chatPrompt);

    dotenv.config(); // get the OpenAPI key from .env file

    const chat = new ChatOpenAI({ temperature: 0 });
    // console.log("chat: ", chat);

    const chain = new LLMChain({ llm: chat, prompt: chatPrompt });

    while (true) {
      const query = await prompts({
        type: "text",
        name: "question",
        message: "Q", // pass Chatbot message here?
      });

      const result = await chain.call({ question: query.question });
      console.log("result: ", result);
    }
  },
};
