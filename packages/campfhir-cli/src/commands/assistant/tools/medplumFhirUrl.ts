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

The Final Answer is a single FHIR URL string.

** FHIR URL FORMAT **

ENDPOINT?PARAMETER_1=VALUE_1&PARAMETER_2=VALUE_2

There is only one ENDPOINT per URL.
There can be an infinite number of PARAMETER_N=VALUE_N pairs.

Here are the known ENDPOINT:

{endpoints}

The special ENDPOINT "Resource" defines common parameters that can be used with every other ENDPOINT.
The special ENDPOINT "Resource" can be used in the tools inputs.
The special ENDPOINT "Resource" cannot be used in answers.

All other ENDPOINT are unknown.
ENDPOINT names are case insensitive. There are no subclasses or roles derived from the known ENDPOINT.

Each ENDPOINT has its own specific set of allowed PARAMETERs.
Only ENDPOINT & PARAMETER combination returned by the "EndpointParams" and "EndpointParameterDetails" tools are known.
All other ENDPOINT & PARAMETER combinations are unknown.
Only known ENDPOINT & PARAMETER combination can be used in answers.
If you are asked for an unknown ENDPOINT or PARAMETER you should answer: "Sorry, I don't know about UNKNOWN", interpolating "UNKNOWN" with the unknown ENDPOINT or PARAMETER name.

** EXAMPLES**
`;

async function extrapolateFhirUrl2Instructions(
  endpoints: string
): Promise<string> {
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
    inputVariables: ["endpoints"],
  });

  return await fewShotPrompt.format({
    endpoints,
  });
}

async function newRetriever(client: SupabaseClient) {
  return new SupabaseHybridSearch(new OpenAIEmbeddings(), {
    client,
    tableName: "documents",
    similarityQueryName: "match_documents",
    keywordQueryName: "kw_match_documents",
    similarityK: 10,
    keywordK: 10,
  });
}

async function retrieveKnowEndpointsFor(input: string): Promise<string[]> {
  const client = createClient(
    process.env.PUBLIC_SUPABASE_URL || "",
    process.env.PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const retriever = await newRetriever(client);

  const response = await retriever.getRelevantDocuments(input);

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

function prepareEndpointsString(endpoints: string[]) {
  return endpoints
    .map((endpoint) => {
      return `- ${endpoint}`;
    })
    .join("\n");
}
export class FhirURL2 extends Tool {
  name = "FhirURL";
  description =
    "Useful for finding the FHIR URL for a given FHIR resource.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool is a FHIR URL that can be used to query the FHIR API.";

  tools: Tool[];

  constructor() {
    super();
    this.tools = [new EndpointParams(), new EndpointParameterDetails()];
  }
  async _call(input: string): Promise<string> {
    const endpoints = await retrieveKnowEndpointsFor(input);

    console.log("Selected endpoints:");
    endpoints.forEach((endpoint) => {
      console.log(`📍 ${endpoint}`);
    });
    console.log("\n");

    const instructions = await extrapolateFhirUrl2Instructions(
      prepareEndpointsString(endpoints)
    );

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

    const llm = new OpenAI({ temperature: 0 });
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

    const executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools: this.tools,
      returnIntermediateSteps: true,
    });

    try {
      const response: ChainValues = await executor.call({
        input,
      });

      return response.output;
    } catch (error) {
      console.log("error: ", error);
      return `Sorry I don't know about: ${input}`;
    }
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
