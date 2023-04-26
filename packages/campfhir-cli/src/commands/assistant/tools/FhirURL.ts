import * as fs from "fs";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { OpenAI } from "langchain";
import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { FewShotPromptTemplate, PromptTemplate } from "langchain/prompts";
import { SupabaseHybridSearch } from "langchain/retrievers/supabase";
import { type ChainValues } from "langchain/schema";
import { Tool } from "langchain/tools";
import { loadJSONL } from "../helpers/jsonl";
import { LoggingOutputParser } from "../parsers/LoggingOutputParser";

const fhirURLTrainingDataPath = "/workspace/data/prompts.jsonl";
const exampleFormatterTemplate = "Q: {prompt} ||| fhirURL: {completion}";

const instructions = `You are asked to answer a medical assistant natural language question by providing the FHIR URL that would be used to query the FHIR API to answer the question.
The FHIR URL is a relative URL that can be used to query the FHIR API.

To find the answer, you must do the following:
First, find the list of candidate ENDPOINTs related to the question. You must use the "KnownEndpoints" tool to find the candidate ENDPOINTs.  Only candidate ENDPOINTS are known. All other ENDPOINTs are unknown.
Second, from the list of candidate endpoints, find the ENDPOINT that is most relevant to the question.  You must use the "EndpointParams" tool to find the most relevant ENDPOINT.
Third, find the relevant ENDPOINT PARAM_N=VALUE_N pairs that are most useful to the question. You must use the "ParamDefinition" tool to find the most relevant PARAM_N=VALUE_N pairs.
Fourth, combine the ENDPOINT and PARAM_N=VALUE_N pairs into a FHIR URL.

The Final Answer is a single FHIR URL string.

** FHIR URL FORMAT **

ENDPOINT?PARAMETER_1=VALUE_1&PARAMETER_2=VALUE_2

There is only one ENDPOINT per URL.
There can be an infinite number of PARAMETER_N=VALUE_N pairs.

Each ENDPOINT has its own specific set of allowed PARAMETERs.
Only ENDPOINT & PARAMETER combination returned by the "EndpointParams" and "EndpointParameterDetails" tools are known.
All other ENDPOINT & PARAMETER combinations are unknown.
Only known ENDPOINT & PARAMETER combination can be used in answers.
If you are asked for an unknown ENDPOINT or PARAMETER you should answer: "Sorry, I don't know about UNKNOWN", interpolating "UNKNOWN" with the unknown ENDPOINT or PARAMETER name.

** EXAMPLES**
`;

async function extrapolateFhirUrl2Instructions(): Promise<string> {
  const examplePrompt = new PromptTemplate({
    inputVariables: ["prompt", "completion"],
    template: exampleFormatterTemplate,
  });

  const examples = await loadJSONL(fhirURLTrainingDataPath);

  const fewShotPrompt = new FewShotPromptTemplate({
    examples,
    examplePrompt,
    prefix: instructions,
    exampleSeparator: "\n\n",
    templateFormat: "f-string",
    inputVariables: [],
  });

  return await fewShotPrompt.format({});
}

export class FhirURL extends Tool {
  name = "FhirURL";
  description =
    "Useful for finding the FHIR URL for a given FHIR resource.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool is a FHIR URL that can be used to query the FHIR API.";

  tools: Tool[];
  executor: AgentExecutor | undefined;

  constructor() {
    super();
    this.tools = [
      new KnownEndpoints(),
      new EndpointParams(),
      new EndpointParameterDetails(),
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

  async initializeAgent() {
    const llm = new OpenAI({ temperature: 0 });
    const instructions = await extrapolateFhirUrl2Instructions();

    const agentPromptPrefixTemplate = new PromptTemplate({
      template: instructions,
      inputVariables: [],
    });
    const agentPromptPrefix = await agentPromptPrefixTemplate.format({});
    const agentPromptSuffix = `Question: {input}

Think before answering.
This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`;
    const agentPrompt = ZeroShotAgent.createPrompt(this.tools, {
      prefix: agentPromptPrefix,
      suffix: agentPromptSuffix,
    });

    const llmChain = new LLMChain({
      llm,
      prompt: agentPrompt,
      // verbose: true,
    });

    const agent = new ZeroShotAgent({
      // how could this agent have memory
      llmChain,
      allowedTools: this.tools.map((tool) => tool.name),
      outputParser: new LoggingOutputParser("FhirURL"),
    });

    return AgentExecutor.fromAgentAndTools({
      agent,
      tools: this.tools,
      returnIntermediateSteps: true,
    });
  }
}

function compileSearchParamsByBase(searchParamsSpec: any) {
  const searchParamsByBase: any = {};
  searchParamsSpec.entry.forEach((entry: any) => {
    const resource = entry.resource;
    resource.base.forEach((resourceType: string) => {
      if (!searchParamsByBase[resourceType]) {
        searchParamsByBase[resourceType] = {};
      }
      const {
        id,
        code,
        type,
        expression,
        description,
        xpath,
        xpathUsage,
        base,
        comparator,
        target,
      } = resource;

      const searchParams = {
        id,
        code,
        type,
        expression,
        description,
        xpath,
        xpathUsage,
        base,
      };

      if (comparator) searchParams["comparator"] = comparator;
      if (target) searchParams["target"] = target;

      searchParamsByBase[resourceType][code] = searchParams;
    });
  });

  return searchParamsByBase;
}

class KnownEndpoints extends Tool {
  name = "KnownEndpoints";
  description =
    "Useful for finding the known FHIR ENDPOINTS.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool is a JSON list of known FHIR ENDPOINTS.";

  supabase: SupabaseClient;
  retriever: SupabaseHybridSearch | undefined;

  constructor() {
    super();

    this.supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL || "",
      process.env.PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }

  async _call(input: string): Promise<string> {
    const endpoints = await this.retrieveKnowEndpointsFor(input);
    return JSON.stringify(endpoints);
  }

  protected async retrieveKnowEndpointsFor(input: string): Promise<string[]> {
    if (!this.retriever) {
      this.retriever = await this.newRetriever(this.supabase);
    }

    const response = await this.retriever.getRelevantDocuments(input);

    const endpoints = [
      ...new Set(
        response
          .map((doc: Document) => {
            const { base, target } = doc.metadata;
            return [base as string, target as string];
          })
          .flat()
          .filter((x: any) => x)
      ),
    ];
    return endpoints;
  }

  protected async newRetriever(client: SupabaseClient) {
    return new SupabaseHybridSearch(new OpenAIEmbeddings(), {
      client,
      tableName: "documents",
      similarityQueryName: "match_documents",
      keywordQueryName: "kw_match_documents",
      similarityK: 10,
      keywordK: 10,
    });
  }
}

class EndpointParams extends Tool {
  name = "EndpointParams";
  description =
    "Useful for finding the valid parameters for a given FHIR ENDPOINT.  The input to this tool should be a FHIR ENDPOINT name.  The output of this tool is a JSON list of valid parameters for the given FHIR ENDPOINT.";

  searchParamsByBase: any;

  constructor() {
    super();
    const jsonText = fs.readFileSync(
      "/workspace/data/fhir-r4b-search-parameters.json",
      "utf8"
    );
    const searchParamsSpec = JSON.parse(jsonText);

    this.searchParamsByBase = compileSearchParamsByBase(searchParamsSpec);
  }

  async _call(input: string): Promise<string> {
    // TODO: take Resource endpoint into account
    const baseParams = Object.values(this.searchParamsByBase[input] || {});
    const params = baseParams.map((param: any) => {
      return param.code;
      //const { code, description } = param;
      //return [input, code, description];
    });
    return JSON.stringify(params);
  }
}

class EndpointParameterDetails extends Tool {
  name = "EndpointParameterDetails";
  description =
    "Useful for finding the details of a given FHIR PARAMETER.  The input to this tool should be a FHIR ENDPOINT & PARAMETER name pair, joined by a column (:).  The input format is ENDPOINT:PARAMETER.  The output of this tool is the usage properties of the given FHIR PARAMETER, as JSON.";

  searchParamsByBase: any;

  constructor() {
    super();
    const jsonText = fs.readFileSync(
      "/workspace/data/fhir-r4b-search-parameters.json",
      "utf8"
    );
    const searchParamsSpec = JSON.parse(jsonText);

    this.searchParamsByBase = compileSearchParamsByBase(searchParamsSpec);
  }

  async _call(input: string): Promise<string> {
    if (!input.includes(":")) {
      return "Error: input must be of the form <base>:<param>";
    }

    const [base, param] = input.split(":");
    const paramSpec = this.searchParamsByBase[base as string][param as string];
    return JSON.stringify(paramSpec);
  }
}
