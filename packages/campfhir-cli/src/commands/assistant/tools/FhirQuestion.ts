import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";

import { type ChainValues } from "langchain/schema";
import { Tool } from "langchain/tools";

import { BufferWindowMemory } from "langchain/memory";
import { LoggingOutputParser } from "../parsers/LoggingOutputParser";
import { fhirQuestionPrompt } from "../prompts/fhirQuestionPrompt";
import { DateToolkit } from "./DateToolkit";

import { createOpenAIInstance } from "../models/openai";
import { FhirDocsToolkit } from "./FhirDocsToolkit";
import { FhirAPIServer2 } from "./FhirQueryToolkit/FhirAPI";

export class FhirQuestion extends Tool {
  name = "FhirQuestion";
  description =
    "Useful for answering questions about medical data stored on a FHIR RESTful API server.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool is the summarized Fhir RESTFul API server response.";

  tools: Tool[];
  executor: AgentExecutor | undefined;

  constructor() {
    super();

    const docsToolkit = new FhirDocsToolkit();
    // const queryToolkit = new FhirQueryToolkit();
    const dateToolkit = new DateToolkit();

    this.tools = [
      ...docsToolkit.tools,
      new FhirAPIServer2(),
      //...queryToolkit.tools,
      ...dateToolkit.tools,
    ];
  }

  async _call(input: string): Promise<string> {
    if (!this.executor) {
      this.executor = await this.initializeAgent();
    }

    try {
      const response: ChainValues = await this.executor.call({
        input,
      });

      return response.output;
    } catch (error) {
      console.log("error: ", error);
      return `Sorry I don't know about: ${input}`;
    }
  }

  protected async initializeAgent() {
    const llm = createOpenAIInstance({ temperature: 0 });
    const prompt = await fhirQuestionPrompt(this.tools);
    const llmChain = new LLMChain({
      llm,
      prompt,
      // verbose: true,
    });
    const agent = new ZeroShotAgent({
      llmChain,
      allowedTools: this.tools.map((tool) => tool.name),
      outputParser: new LoggingOutputParser("FhirQuestion"),
    });
    const memory = new BufferWindowMemory({ memoryKey: "chat_history" });
    return AgentExecutor.fromAgentAndTools({
      agent,
      tools: this.tools,
      memory,
    });
  }
}
