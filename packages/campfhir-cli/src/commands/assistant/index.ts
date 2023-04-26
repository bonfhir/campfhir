import dotenv from "dotenv";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { OpenAI } from "langchain";
import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";

import { type ChainValues } from "langchain/schema";

import { LoggingOutputParser } from "./parsers/LoggingOutputParser";
import { FhirAPI } from "./tools/FhirAPI";
import { FhirURL } from "./tools/FhirURL";

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    dotenv.config(); // OpenAI + Medplum config from .env file

    const tools = [new FhirURL(), new FhirAPI()];

    const agentPromptPrefix = `** INSTRUCTIONS **
You are a medical assistant answering questions about medical data stored in a FHIR RESTful API server.

To find the answer, you must do the following:
First, you must find the FHIR URL that would be used to query the FHIR API to answer the question.
Second, you must query the FHIR API with the FHIR URL to get the answer.
Last, summarize the FHIR API response as the Final Answer.

If no FIHR API data is available, you can simply answer that question with "no data".

All other question types are not supported and sound be answered with "I don't know".

You have access to the following tools:`;
    const agentPromptSuffix = `Question: {input}

Think before answering.
This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`;
    const agentPrompt = ZeroShotAgent.createPrompt(tools, {
      prefix: agentPromptPrefix,
      suffix: agentPromptSuffix,
    });

    const llm = new OpenAI({ temperature: 0 });
    const llmChain = new LLMChain({
      llm,
      prompt: agentPrompt,
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

        console.log(`🔰 ${response.output}\n`);
      } catch (error) {
        console.log("error response: ", error);
      }
    }
  },
};
