import { AgentExecutor, JsonToolkit, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { BufferMemory } from "langchain/memory";
import { JsonObject, JsonSpec, Tool } from "langchain/tools";

import { SessionLogger } from "../helpers/sessionLogger";
import { LoggingOutputParser } from "../parsers/LoggingOutputParser";

export class JSONResponseStore {
  jsonToolkit: JsonToolkit;
  jsonSpec: JsonSpec;

  constructor() {
    this.jsonSpec = new JsonSpec({});
    this.jsonToolkit = new JsonToolkit(this.jsonSpec);
  }

  setResponse(json: JsonObject) {
    SessionLogger.separator();
    SessionLogger.log("JSON: ", json);
    SessionLogger.separator();
    this.jsonSpec.obj = json;
  }
}

export const JSON_PREFIX = `You are an agent designed to interact with JSON responses from a FHIR Restful API server.
Your goal is to return a final answer by interacting with the JSON.

You have access to the following tools which help you learn more about the JSON you are interacting with.
Only use the below tools. Only use the information returned by the below tools to construct your final answer.
Do not make up any information that is not contained in the JSON.
Your input to the tools should be in the form of in json pointer syntax (e.g. /key1/0/key2).
You must escape a slash in a key with a ~1, and escape a tilde with a ~0.
For example, to access the key /foo, you would use /~1foo
You should only use keys that you know for a fact exist. You must validate that a key exists by seeing it previously when calling 'json_list_keys'.
If you have not seen a key in one of those responses, you cannot use it.
You should only add one key at a time to the path. You cannot add multiple keys at once.
If you encounter a null or undefined value, go back to the previous key, look at the available keys, and try again.

If asked about 'type', you must ignore the 'searchset' 'type' property and answer with the 'resource' 'type' property.

If the question does not seem to be related to the JSON, just return "I don't know" as the answer.
If the question is about some totals, use the 'total' key to get the total.'
When in doubt, always begin your interaction with the 'json_list_keys' with an empty string as the input to see what keys exist in the JSON.

Note that sometimes the value at a given path is large. In this case, you will get an error "Value is a large dictionary, should explore its keys directly".
In this case, you should ALWAYS follow up by using the 'json_list_keys' tool to see what keys exist at that path.
Do not simply refer the user to the JSON or a section of the JSON, as this is not a valid answer. Keep digging until you find the answer and explicitly return it.
Don't be creative. Don't make up information. Only use the information returned by the tools to construct your answer.
Provide the source used to answer in the Final Answer.

`;

export const JSON_SUFFIX = `{chat_history}

Question: {input}
Thought: I should look at the keys that exist to see what I can query. I should use the 'json_list_keys' tool with an empty string as the input.
{agent_scratchpad}`;

function createFhirSummarizerAgent(llm: OpenAI, toolkit: JsonToolkit) {
  const { tools } = toolkit;
  const prompt = ZeroShotAgent.createPrompt(tools, {
    prefix: JSON_PREFIX,
    suffix: JSON_SUFFIX,
    inputVariables: ["input", "agent_scratchpad", "chat_history"],
  });
  const chain = new LLMChain({ prompt, llm });
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

export class FhirSummarizer extends Tool {
  name = "FhirSummarizer";
  description = `Useful for summarizing FHIR resources in a question context.  The input to this tool should be a question.  The output of this tool is a summary of the FHIR resource.`;

  jsonAgentExecutor: AgentExecutor;

  constructor(store: JSONResponseStore) {
    super();

    const llm = new OpenAI({ temperature: 0 });
    this.jsonAgentExecutor = createFhirSummarizerAgent(llm, store.jsonToolkit);
  }

  async _call(input: string): Promise<string> {
    console.log("FhirSummarizer input: ", input);
    const result = await this.jsonAgentExecutor.call({
      input,
    });

    console.log(`Got output ${result.output}`);

    return result.output;
  }
}
