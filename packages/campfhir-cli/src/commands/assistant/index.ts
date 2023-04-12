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

import { extrapolateFhirUrlInstructions } from "./prompts/extrapolateFhirUrl";
import { MedplumFhirAPI } from "./tools/medplumFhirAPI";

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

    const tools = [new MedplumFhirAPI()];
    const fhirInstructions = await extrapolateFhirUrlInstructions(
      knowClassesAndParams()
    );
    const agentPromptPrefix = `** INSTRUCTIONS **
Answer the following questions as best you can.  You are a medical assistant answering questions from healthcare professionals.

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
      HumanMessagePromptTemplate.fromTemplate(`{input}

This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`);

    const chatAgentPrompt = ChatPromptTemplate.fromPromptMessages([
      agentInstructionPrompt,
      agentScratchpadPrompt,
    ]);

    console.log("chatPrompt: ", chatAgentPrompt);

    const chat = new ChatOpenAI({ temperature: 0 });
    console.log("chat: ", chat);

    const llmChain = new LLMChain({ llm: chat, prompt: chatAgentPrompt });

    const agent = new ZeroShotAgent({
      llmChain,
      allowedTools: tools.map((tool) => tool.name),
    });

    const executor = AgentExecutor.fromAgentAndTools({ agent, tools });

    for (;;) {
      // loop until exit/quit
      const query = await prompts({
        type: "text",
        name: "question",
        message: "Q", // pass Chatbot message here?
      });

      if (["quit", "exit"].includes(query.question)) {
        console.log("\nbye-bye 👋\n");
        process.exit(0); // exit on exit or quit
      }

      try {
        const response = await executor.run(query.question);
        console.log("response: ", response);
      } catch (error) {
        console.log("error response: ", error);
        return;
      }
    }
  },
};
