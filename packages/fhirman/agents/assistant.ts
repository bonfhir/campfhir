import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

import { getCurrentUser } from "../helpers/currentUser.ts";
import { createOpenAIInstance } from "../models/openai.ts";

import { EmitterOutputParser } from "../parsers/EmitterOutputParser.ts";
import { assistantPrompt } from "../prompts/assistantPrompt.ts";
import { FhirQuestion } from "../tools/FhirQuestion.ts";

// @ts-ignore
import { ModelOutputEmitter } from "../events/ModelOutputEmitter.ts";

export type AssistantAgent = {
  events: ModelOutputEmitter;
  agent: AgentExecutor;
};

export async function createAssistantAgent(): Promise<AssistantAgent> {
  const outputEmitter = new ModelOutputEmitter();
  const currentUser = await getCurrentUser();

  const tools = [new FhirQuestion(outputEmitter)];

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
    outputParser: new EmitterOutputParser("FHIR Assistant", outputEmitter),
  });

  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    memory,
  });

  return {
    agent: executor,
    events: outputEmitter,
  };
}
