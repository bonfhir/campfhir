import dotenv from "dotenv";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

import { type ChainValues } from "langchain/schema";

import { LoggingOutputParser } from "./parsers/LoggingOutputParser";
import { FhirApiToolkit } from "./tools/medplumFhirAPI";

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    dotenv.config(); // OpenAI + Medplum config from .env file

    const toolkit = new FhirApiToolkit();
    const tools = toolkit.tools;

    const agentPromptPrefix = `** INSTRUCTIONS **
You are a medical assistant answering questions about medical data stored in a FHIR RESTful API server.
Answer the questions as best you can. Always provide a complete summarized answer.

These questions are answered by querying a FHIR RESTful API server.
For example, "What are the active patients?" or "What are the active practitioners?".
You must use the FHIR URL tool to find the FHIR URL for the query.  The only valid FHIR URL are the ones output from the FHIR URL tool.  Always use the FHIR URL tool to find any FHIR URL.
You should find the FHIR URL that returns the most precise & minimal data for the question.  If the question is about some resource property you should ask not only for the resource but also for the property.
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

    const agentScratchpadPrompt =
      HumanMessagePromptTemplate.fromTemplate(`** INPUT **
{input}

** SCRATCHPAD **
{agent_scratchpad}`);

    const chatAgentPrompt = ChatPromptTemplate.fromPromptMessages([
      agentInstructionPrompt,
      agentScratchpadPrompt,
    ]);

    const chat = new ChatOpenAI({ temperature: 0 });

    const llmChain = new LLMChain({
      llm: chat,
      prompt: chatAgentPrompt,
      // verbose: true,
    });

    const agent = new ZeroShotAgent({
      llmChain,
      allowedTools: tools.map((tool) => tool.name),
      outputParser: new LoggingOutputParser("FHIR Assistant"),
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

      console.log("");

      if (["quit", "exit"].includes(query.question)) {
        console.log("\nbye-bye 👋\n");
        process.exit(0); // exit on exit or quit
      }

      try {
        const response: ChainValues = await executor.call({
          input: query.question,
        });

        console.log(`🔰 ${response.output}}\n`);
      } catch (error) {
        console.log("error response: ", error);
      }
    }
  },
};
