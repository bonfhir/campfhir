import { AgentExecutor, JsonToolkit, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { BufferMemory } from "langchain/memory";
import { Tool } from "langchain/tools";

import { JSONResponseStore } from ".";
import { createOpenAIInstance } from "../../models/openai";
import { LoggingOutputParser } from "../../parsers/LoggingOutputParser";
import {
  SUMMARIZE_JSON_PREFIX,
  SUMMARIZE_JSON_SUFFIX,
} from "../../prompts/fhirSummarizerPrompt";

export class FhirSummarizer extends Tool {
  name = "FhirSummarizer";
  description = `Useful for summarizing FHIR resources in a question context.  The input to this tool should be a question.  The output of this tool is a summary of the FHIR resource.`;

  jsonAgentExecutor: AgentExecutor;

  constructor(store: JSONResponseStore) {
    super();

    const llm = createOpenAIInstance({ temperature: 0 });
    this.jsonAgentExecutor = this.initializeAgent(llm, store.jsonToolkit);
  }

  async _call(input: string): Promise<string> {
    console.log("FhirSummarizer input: ", input);
    const result = await this.jsonAgentExecutor.call({
      input,
    });

    console.log(`Got output ${result.output}`);

    return result.output;
  }

  protected initializeAgent(llm: OpenAI, toolkit: JsonToolkit) {
    const { tools } = toolkit;
    const prompt = ZeroShotAgent.createPrompt(tools, {
      prefix: SUMMARIZE_JSON_PREFIX,
      suffix: SUMMARIZE_JSON_SUFFIX,
      inputVariables: ["input", "agent_scratchpad", "chat_history"],
    });
    const chain = new LLMChain({
      prompt,
      llm,
      //verbose: true
    });
    const agent = new ZeroShotAgent({
      llmChain: chain,
      allowedTools: tools.map((t) => t.name),
      outputParser: new LoggingOutputParser("FhirSummarizer"),
    });
    const memory = new BufferMemory({ memoryKey: "chat_history" });
    return AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      memory,
    });
  }
}
