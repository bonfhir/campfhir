import * as fs from "fs";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { OpenAI } from "langchain";
import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseHybridSearch } from "langchain/retrievers/supabase";
import { type ChainValues } from "langchain/schema";
import { Tool } from "langchain/tools";

import { BufferMemory } from "langchain/memory";
import { LoggingOutputParser } from "../parsers/LoggingOutputParser";
import { fhirUrlAgentPrompt } from "../prompts/fhirUrlAgentPrompt";

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

  protected async initializeAgent() {
    const llm = new OpenAI({ temperature: 0 });
    const prompt = await fhirUrlAgentPrompt(this.tools);
    const llmChain = new LLMChain({
      llm,
      prompt,
      //verbose: true,
    });
    const agent = new ZeroShotAgent({
      llmChain,
      allowedTools: this.tools.map((tool) => tool.name),
      outputParser: new LoggingOutputParser("FhirURL"),
    });
    const memory = new BufferMemory({ memoryKey: "chat_history" });
    return AgentExecutor.fromAgentAndTools({
      agent,
      tools: this.tools,
      memory,
      //returnIntermediateSteps: true,
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
