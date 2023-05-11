import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

import { getCurrentUser } from "../helpers/currentUser";
import { createOpenAIInstance } from "../models/openai";

import { LoggingOutputParser } from "../parsers/LoggingOutputParser";
import { assistantPrompt } from "../prompts/assistantPrompt";
import { FhirQuestion } from "../tools/FhirQuestion";

export async function createAssistantAgent() {
  const currentUser = await getCurrentUser();

  const tools = [new FhirQuestion(currentUser)];

  const agentPrompt = await assistantPrompt(currentUser, tools);

  const llm = createOpenAIInstance({ temperature: 0 });
  const memory = new BufferMemory({ memoryKey: "chat_history" });
  const llmChain = new LLMChain({
    llm,
    prompt: agentPrompt,
  });

  const agent = new ZeroShotAgent({
    llmChain,
    allowedTools: tools.map((tool) => tool.name),
    outputParser: new LoggingOutputParser("FHIR Assistant"),
  });

  return AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    memory,
  });
}
