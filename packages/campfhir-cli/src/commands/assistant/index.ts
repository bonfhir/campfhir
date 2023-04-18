import dotenv from "dotenv";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

import { type AgentStep, type ChainValues } from "langchain/schema";

import { extrapolateFhirUrlInstructions } from "./prompts/extrapolateFhirUrl";
import { FhirApiToolkit } from "./tools/medplumFhirAPI";

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
    dotenv.config(); // OpenAI + Medplum config from .env file

    const toolkit = new FhirApiToolkit();
    const tools = toolkit.tools;
    const fhirInstructions = await extrapolateFhirUrlInstructions(
      knowClassesAndParams()
    );
    const agentPromptPrefix = `** INSTRUCTIONS **
Answer the following questions as best you can.
Think before answering.
Two types of questions are supported:

1. FHIR specifications:
These questions are about the FHIR class & protocol specifications.
For example, "What are the FHIR Patient properties names?" or "What are FHIR SearchSet bundles?"
You can use your general knowledge of FHIR to answer these questions.

2. FHIR data:
These questions are answered by querying a FHIR API server.
For example, "What are the active patients?" or "What are the active practitioners?".
You can use the FHIR API tool to get the data you need.
You can also use the JSON Explorer tool to explore the FHIR SearchSet Bundle response object converted to a JSON string.
If no FIHR data is available, you can simply answer that question with "no data".

${fhirInstructions}You have access to the following tools:`;
    const agentPromptSuffix = `Begin!`;
    const agentPrompt = ZeroShotAgent.createPrompt(tools, {
      prefix: agentPromptPrefix,
      suffix: agentPromptSuffix,
    });

    const agentInstructionPrompt = new SystemMessagePromptTemplate(agentPrompt);
    console.log("agentPrompt: ", agentPrompt);
    console.log("agentInstructionPrompt: ", agentInstructionPrompt);

    const agentScratchpadPrompt =
      HumanMessagePromptTemplate.fromTemplate(`** INPUT **
{input}

** SCRATCHPAD **
{agent_scratchpad}`);

    const chatAgentPrompt = ChatPromptTemplate.fromPromptMessages([
      agentInstructionPrompt,
      agentScratchpadPrompt,
    ]);

    console.log("chatPrompt: ", chatAgentPrompt);

    const chat = new ChatOpenAI({ temperature: 0 });
    console.log("chat: ", chat);

    const llmChain = new LLMChain({
      llm: chat,
      prompt: chatAgentPrompt,
      verbose: true,
    });

    const agent = new ZeroShotAgent({
      llmChain,
      allowedTools: tools.map((tool) => tool.name),
    });

    const executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      returnIntermediateSteps: true,
    });

    for (;;) {
      // loop until exit/quit
      const query = await prompts({
        type: "text",
        name: "question",
        message: "💬",
      });

      if (["quit", "exit"].includes(query.question)) {
        console.log("\nbye-bye 👋\n");
        process.exit(0); // exit on exit or quit
      }

      try {
        const response: ChainValues = await executor.call({
          input: query.question,
        });
        console.log("response: ", response);

        response.intermediateSteps?.forEach((step: AgentStep) => {
          console.log(`💠 ${step.action.log}\n`);
        });

        console.log("🔰 ", response.output);
      } catch (error) {
        console.log("error response: ", error);
        // return;
      }
    }
  },
};
