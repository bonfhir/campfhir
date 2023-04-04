import dotenv from "dotenv";
import { readFile } from "fs/promises";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
import { BufferMemory } from "langchain/memory";
import {
  ChatPromptTemplate,
  FewShotPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

const trainingDataFilePath = "/workspace/data/prompts.jsonl";
async function loadTrainingData() {
  return (await readFile(trainingDataFilePath, { encoding: "utf8", flag: "r" }))
    .split("\n")
    .filter(Boolean)
    .filter((x) => !x.startsWith("//"))
    .map((x) => JSON.parse(x));
}

const CLASSES = [
  "Patient",
  "RiskAssessment",
  "Practitioner",
  "Appointment",
  "CarePlan",
];

const CLASS_PARAMS = {
  Patient: ["active", "name", "gender", "_summary"],
  Practitioner: ["active", "name", "gender", "_summary"],
  RiskAssessment: ["risk", "_summary"],
  Appointment: ["status", "start", "end", "participant"],
  CarePlan: ["status", "intent", "title", "period", "activity"],
};
function knowClassesAndParams() {
  return Object.entries(CLASS_PARAMS)
    .map((entry) => {
      const [className, params] = entry;
      return `CLASS: ${className}, PARAM: ${params.join(", ")}`;
    })
    .join("\n");
}

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    const examples = await loadTrainingData();
    const exampleFormatterTemplate = "Q: {prompt} ||| api: {completion}";
    const instructions = `** INSTRUCTIONS **
The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context.  The AI is a technical medical assistant.  If the AI does not know the answer to a question, it truthfully says it does not know.

The answers are API paths.
The structure of the API paths is:
/CLASS?PARAM_1=VALUE_1&PARAM_2=VALUE_2
There is only one CLASS per path.
There can be an infinite number of PARAM_N=VALUE_N pairs.
Each CLASS has its own specific set of allowed PARAM keys.
Here are the known CLASS & PARAM combinations.

{classesAndParams}

All other CLASS are unknown.  All other CLASS & PARAM combinations are unknown.
CLASS names are case insensitive. There are no subclasses or roles derived from the known CLASS.
Only known CLASS & PARAM combination can be used in answers.
If you are asked for an unknown CLASS or PARAM you should answer: "Sorry, I don't know about UNKNOWN", interpolating "UNKNOWN" with the unknown CLASS or PARAM name.

** EXAMPLES**`;

    const examplePrompt = new PromptTemplate({
      inputVariables: ["prompt", "completion"],
      template: exampleFormatterTemplate,
    });

    console.log("examplePrompt: ", examplePrompt);

    const fewShotPrompt = new FewShotPromptTemplate({
      examples,
      examplePrompt,
      prefix: instructions,
      exampleSeparator: "\n\n",
      templateFormat: "f-string",
      inputVariables: ["classesAndParams"],
    });

    console.log("fewShotPrompt: ", fewShotPrompt);

    const instructionPrompt = SystemMessagePromptTemplate.fromTemplate(
      await fewShotPrompt.format({ classesAndParams: knowClassesAndParams() })
    );
    console.log("instructionPrompt: ", instructionPrompt);
    const questionPrompt = HumanMessagePromptTemplate.fromTemplate(
      "What API path would answer the question below?\nQ: {question} ||| api:"
    );
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      instructionPrompt,
      new MessagesPlaceholder("history"),
      questionPrompt,
    ]);
    console.log("chatPrompt: ", chatPrompt);

    dotenv.config(); // get the OpenAPI key from .env file

    const chat = new ChatOpenAI({ temperature: 0 });
    console.log("chat: ", chat);

    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
    });

    const conversation = new ConversationChain({
      llm: chat,
      prompt: chatPrompt,
      memory,
    });

    while (true) {
      const query = await prompts({
        type: "text",
        name: "question",
        message: "Q", // pass Chatbot message here?
      });

      if (["quit", "exit"].includes(query.question)) {
        console.log("\nbye-bye 👋\n");
        process.exit(0); // exit on exit or quit
      }

      const result = await conversation.predict({ question: query.question });
      console.log("result: ", result);
    }
  },
};
