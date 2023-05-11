import { LLMChain } from "langchain/chains";

import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { BufferWindowMemory } from "langchain/memory";

import { createOpenAIInstance } from "../models/openai";

import { LoggingOutputParser } from "../parsers/LoggingOutputParser";
import { fhirQuestionPrompt } from "../prompts/fhirQuestionPrompt";

import { DateToolkit } from "../tools/DateToolkit";
import { FhirAPIServer } from "../tools/FhirAPIServer";
import { FhirDocsToolkit } from "../tools/FhirDocsToolkit";

import { type CurrentUser } from "../helpers/currentUser";

export async function createFhirAgent(currentUser: CurrentUser) {
  const docsToolkit = new FhirDocsToolkit();
  const dateToolkit = new DateToolkit();

  const tools = [
    ...docsToolkit.tools,
    new FhirAPIServer(),
    ...dateToolkit.tools,
  ];

  const llm = createOpenAIInstance({ temperature: 0 });
  const prompt = await fhirQuestionPrompt(currentUser, tools);
  const llmChain = new LLMChain({
    llm,
    prompt,
    // verbose: true,
  });
  const agent = new ZeroShotAgent({
    llmChain,
    allowedTools: tools.map((tool) => tool.name),
    outputParser: new LoggingOutputParser("FhirQuestion"),
  });
  const memory = new BufferWindowMemory({ memoryKey: "chat_history" });
  return AgentExecutor.fromAgentAndTools({
    agent,
    tools: tools,
    memory,
  });
}
