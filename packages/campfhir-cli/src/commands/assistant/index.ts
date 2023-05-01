import dotenv from "dotenv";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { BufferMemory } from "langchain/memory";

import { type ChainValues } from "langchain/schema";

import { LoggingOutputParser } from "./parsers/LoggingOutputParser";
import { FhirAPI } from "./tools/FhirAPI";
import { FhirSummarizer, JSONResponseStore } from "./tools/FhirSummarizer";
import { FhirURL } from "./tools/FhirURL";

import { SessionLogger } from "./helpers/sessionLogger";

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    dotenv.config(); // OpenAI + Medplum config from .env file

    SessionLogger.init({});

    const store = new JSONResponseStore();

    const tools = [
      new FhirURL(),
      new FhirAPI(store),
      new FhirSummarizer(store),
    ];

    const agentPromptPrefix = `** INSTRUCTIONS **
You are a medical assistant answering questions about medical data stored in a FHIR RESTful API server.

To find the answer, you must do the following:
First, you must find the FHIR URL that would be used to query the FHIR API to answer the question.
When retrying the FHIR URL tool, you must keep the exact same question mention in the question that the previous answer was wrong and that you expect a different answer.

Second, you must query the FHIR API with the FHIR URL to get the answer.  You must pass the exact URL from the previous step to the FhirAPI tool.
Use the FhirAPI output hints to assess the coherence of the answer.
A coherent count answer would have a total over 0.
A coherent search answer would have at least one entry returned.

If the answer is coherent, you must go to the FhirSummarizer tool. Else, you must go back to the FhirURL tool.
Third, you must ask the FhirSummarizer for a summarization of the answer.

Fourth, you must return the FhirSummarizer tool's Final Answer as your Final Answer.

The question input to the FhirURL tool should be the exact unmodified question from the user.
The url input to the FhirAPI tool should be the exact unmodified response from the FhirURL tool.
The input to the FhirSummarizer tool should be the exact unmodified question from the user.
The declared Final Answer should be the exact unmodified response from the FhirSummarizer tool.

When going back & repeating any question, you must mention in the question that the previous answer was wrong.

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
