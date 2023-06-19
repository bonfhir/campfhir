import { LLMChain } from "langchain/chains";

import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { BufferWindowMemory } from "langchain/memory";

import { createOpenAIInstance } from "../models/openai.ts";

import { EmitterOutputParser } from "../parsers/EmitterOutputParser.ts";
import { fhirQuestionPrompt } from "../prompts/fhirQuestionPrompt.ts";

import { DateToolkit } from "../tools/DateToolkit.ts";
import { FhirAPIServer } from "../tools/FhirAPIServer.ts";
import { FhirDocsToolkit } from "../tools/FhirDocsToolkit.ts";
import { ModelOutputEmitter } from "../events/ModelOutputEmitter.ts";

export async function createFhirAgent(emitter: ModelOutputEmitter) {
  const docsToolkit = new FhirDocsToolkit();
  const dateToolkit = new DateToolkit();

  const tools = [
    ...docsToolkit.tools,
    new FhirAPIServer(),
    ...dateToolkit.tools,
  ];

  const llm = createOpenAIInstance({ temperature: 0 });
  const prompt = await fhirQuestionPrompt(tools);
  const llmChain = new LLMChain({
    llm,
    prompt,
    // verbose: true,
  });
  const agent = new ZeroShotAgent({
    llmChain,
    allowedTools: tools.map((tool) => tool.name),
    outputParser: new EmitterOutputParser("FhirQuestion", emitter),
  });
  const memory = new BufferWindowMemory({ memoryKey: "chat_history" });
  return AgentExecutor.fromAgentAndTools({
    agent,
    tools: tools,
    memory,
  });
}
