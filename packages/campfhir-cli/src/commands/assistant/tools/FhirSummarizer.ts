import { OpenAI } from "langchain";
import { AgentExecutor, createJsonAgent, JsonToolkit } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { JsonObject, JsonSpec, Tool } from "langchain/tools";

const template = `You are a medical assistant answering health practitioners questions.

Answer the following question:

"{question}"

By summarizing the FHIR Restful API response data provided:

"{data}"`;

export class JSONResponseStore {
  jsonToolkit: JsonToolkit;
  jsonSpec: JsonSpec;

  constructor() {
    this.jsonSpec = new JsonSpec({});
    this.jsonToolkit = new JsonToolkit(this.jsonSpec);
  }

  setResponse(json: JsonObject) {
    this.jsonSpec.obj = json;
  }
}

export class FhirSummarizer extends Tool {
  name = "FhirSummarizer";
  description = `Useful for summarizing FHIR resources in a question context.  The input to this tool should be a question.  The output of this tool is a summary of the FHIR resource.`;

  jsonAgentExecutor: AgentExecutor;

  constructor(store: JSONResponseStore) {
    super();

    const llm = new OpenAI({ temperature: 0 });
    this.jsonAgentExecutor = createJsonAgent(llm, store.jsonToolkit);
  }

  async _call(input: string): Promise<string> {
    console.log("FhirSummarizer input: ", input);
    const result = await this.jsonAgentExecutor.call({
      input,
    });

    console.log(`Got output ${result.output}`);

    console.log(
      `Got intermediate steps ${JSON.stringify(
        result.intermediateSteps,
        null,
        2
      )}`
    );

    return result.output;
  }

  protected initializeChatChain(): LLMChain {
    const systemMessagePromptTemplate =
      SystemMessagePromptTemplate.fromTemplate(template);

    const humanMessagePromptTemplate =
      HumanMessagePromptTemplate.fromTemplate(`CONCISE SUMMARY:`);

    const chat = new ChatOpenAI({ temperature: 0 });
    const prompt = ChatPromptTemplate.fromPromptMessages([
      systemMessagePromptTemplate,
      humanMessagePromptTemplate,
    ]);

    return new LLMChain({
      prompt,
      llm: chat,
      verbose: true,
    });
  }
}
