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

import { FhirApiToolkit } from "./tools/medplumFhirAPI";

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    dotenv.config(); // OpenAI + Medplum config from .env file

    const toolkit = new FhirApiToolkit();
    const tools = toolkit.tools;

    const agentPromptPrefix = `** INSTRUCTIONS **
You are a medical assistant answering questions about medical data stored in a FHIR API server.
Answer the questions as best you can. Always provide a complete summarized answer.
You can answer questions about the FHIR data and the FHIR specifications:

1. FHIR specifications:
These questions are about the FHIR class & protocol specifications.
For example, "What are the FHIR Patient properties names?" or "What are FHIR SearchSet bundles?"
You can use your general knowledge of FHIR to answer these questions.

2. FHIR data:
These questions are answered by querying a FHIR API server.
For example, "What are the active patients?" or "What are the active practitioners?".
You must use the FHIR URL tool to find the FHIR URL for the query.  You should not try to figure out the FHIR URL yourself.  Always use the FHIR URL tool to find any FHIR URL.
You must use the FHIR API tool to query the data you need.
If no FIHR data is available, you can simply answer that question with "no data".

All other question types are not supported and sound be answered with "I don't know".

You have access to the following tools:`;
    const agentPromptSuffix = `Think before answering.\nBegin!`;
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
