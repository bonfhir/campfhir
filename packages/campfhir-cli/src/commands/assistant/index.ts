import dotenv from "dotenv";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { BufferMemory } from "langchain/memory";

import { type ChainValues } from "langchain/schema";

import { LoggingOutputParser } from "./parsers/LoggingOutputParser";
import { FhirQuestion } from "./tools/FhirQuestion";

import { SessionLogger } from "./helpers/sessionLogger";

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    dotenv.config(); // OpenAI + Medplum config from .env file

    SessionLogger.init({});

    const tools = [new FhirQuestion()];

    const agentPromptPrefix = `** INSTRUCTIONS **
You are a medical assistant answering questions about medical data stored in a FHIR RESTful API server.
All questions should be answered in the context of the medical data stored in the FHIR RESTful API server.

You must use the FhirQuestion tool to answer questions about medical data stored in a FHIR RESTful API server.
For the Final Answer, You must summarize the FhirQuestion tool's response in the context of the users question.

The question input to the FhirQuestion tool should be the exact unmodified question from the user.
When going back & repeating any question, you must mention in the tools question input that the previous answer was wrong.

You have access to the following tools:`;
    const agentPromptSuffix = `{chat_history}

Question: {input}

Think before answering.
This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`;
    const agentPrompt = ZeroShotAgent.createPrompt(tools, {
      prefix: agentPromptPrefix,
      suffix: agentPromptSuffix,
      inputVariables: ["input", "chat_history", "agent_scratchpad"],
    });

    const llm = new OpenAI({ temperature: 0 });
    const memory = new BufferMemory({ memoryKey: "chat_history" });
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
      memory,
      //returnIntermediateSteps: true,
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

      SessionLogger.logQuestion(query.question);

      try {
        const response: ChainValues = await executor.call({
          input: query.question,
        });

        const answer = `🔰 ${response.output}\n`;
        SessionLogger.logAnswer(answer);
        console.log(answer);
      } catch (error) {
        console.log("error response: ", error);
        SessionLogger.log("error", error);
      }
    }
  },
};
