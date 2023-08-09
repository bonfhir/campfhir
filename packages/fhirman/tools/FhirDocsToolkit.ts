import * as fs from "fs";
import process from "process";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { SupabaseHybridSearch } from "langchain/retrievers/supabase";

import { Toolkit } from "langchain/agents";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Tool } from "langchain/tools";

import {
  readYamlExamples,
  type FhirPromptExample,
} from "../helpers/yamlExamples.ts";

export class FhirDocsToolkit extends Toolkit {
  tools: Tool[];

  constructor() {
    super();

    this.tools = [
      new KnownEndpoints(),
      new FhirAPIExamples(),
      new EndpointParams(),
      // new EndpointParameterDetails(), // TODO: prove this is too much information
    ];
  }
}

export class KnownEndpoints extends Tool {
  name = "KnownEndpoints";
  description =
    "Useful for finding the known FHIR ENDPOINTS.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool are ENDPOINT & PARAMETER usage examples.";

  supabase: SupabaseClient;
  retriever: SupabaseHybridSearch | undefined;

  constructor() {
    super();

    this.supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL || "",
      process.env.PUBLIC_SUPABASE_ANON_KEY || "",
      {
        auth: {
          persistSession: false,
        },
      }
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

export class FhirAPIExamples extends Tool {
  name = "FhirAPIExamples";
  description =
    "Useful for finding the usage examples for a given FHIR ENDPOINT.  The input to this tool should be a FHIR ENDPOINT name.  The output of this tool is a deterministic JSON list of usage examples for the given FHIR ENDPOINT.";
  formatedExamples: { [key: string]: string } = {};

  constructor() {
    super();
    const examples: { [key: string]: string[] } = {};
    readYamlExamples().forEach((example: FhirPromptExample) => {
      const endpoint = example.completion.endpoint.toLowerCase();
      if (!examples[endpoint]) {
        examples[endpoint] = [];
      }
      examples[endpoint].push(this.formatExample(example));
    });

    this.formatedExamples = Object.fromEntries(
      Object.entries(examples).map(([endpoint, examples]) => {
        return [endpoint, examples.join("\n")];
      })
    );
  }
  async _call(input: string): Promise<string> {
    let examples: string | undefined;
    try {
      examples = this.formatedExamples[input.toLowerCase()];
    } catch (error) {
      console.log("FhirAPIExamples error: ", error);
    }
    return examples || "No examples found for this endpoint";
  }

  protected formatExample(example: FhirPromptExample): string {
    return `Question: ${example.prompt} ||| FhirAPIServer: "${JSON.stringify(
      example.completion
    )}"`;
  }
}
export class EndpointParams extends Tool {
  name = "EndpointParams";
  description =
    "Useful for finding the valid parameters for a given FHIR ENDPOINT.  The input to this tool should be a FHIR ENDPOINT name.  The output of this tool is a deterministic JSON list of valid parameters for the given FHIR ENDPOINT.";

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
    const params = this.paramsForBase(input);
    console.log("EndpointParams: ", input, params);
    return JSON.stringify(params);
  }

  protected paramsForBase(base: string): string[][] {
    const baseParams = Object.values(this.searchParamsByBase[base] || {});
    return baseParams.map((param: any) => {
      return param.code;
      // const { code, description } = param;
      // return [base, code, description];
    });
  }
}

export class EndpointParameterDetails extends Tool {
  name = "EndpointParameterDetails";
  description =
    "Useful for finding the details of a given FHIR PARAMETER.  The input to this tool should be a FHIR ENDPOINT & PARAMETER name pair, joined by a column (:).  The input format is ENDPOINT:PARAMETER.  The output of this tool is the deterministic usage properties of the given FHIR PARAMETER, as JSON.";

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

function searchParamsFromResource(resource: {
  id: string;
  code: string;
  type: string;
  expression: string;
  description: string;
  xpath: string;
  xpathUsage: string;
  base: string[];
  comparator: string[];
  target: string[];
}) {
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
    comparator: comparator || undefined,
    target: target || undefined,
  };

  return searchParams;
}

const searchParamsWhitelist = [
  "_id",
  "_summary",
  "_type",
  "account",
  "active",
  "actor",
  "address",
  "appointment-type",
  "appointment",
  "birthdate",
  "category",
  "class",
  "code:text",
  "condition",
  "date",
  "diagnosis",
  "email",
  "encounter",
  "family",
  "gender",
  "given",
  "goal",
  "intent",
  "length",
  "location-period",
  "location",
  "name",
  "organization",
  "participant-type",
  "participant",
  "patient",
  "performer",
  "phone",
  "practitioner",
  "reason-code",
  "schedule",
  "service-category",
  "service-provider",
  "service-type",
  "slot",
  "specialty",
  "start",
  "status",
  "subject",
  "telecom",
  "title",
  "topic",
  "type",
  "url",
  "value",
]; // TODO: add more
// filtered to reduce the size of the tools responses
function filterParamByWhitelist(entries: any[]) {
  return entries.filter((entry: any) =>
    searchParamsWhitelist.includes(entry.resource.code)
  );
}

let paramsByBase: any;
function compileSearchParamsByBase(searchParamsSpec: any) {
  if (!paramsByBase) {
    paramsByBase = {};
    const resourceParams = filterParamByWhitelist(searchParamsSpec.entry)
      .filter((entry: any) => entry.resource.base.includes("Resource"))
      .reduce((acc: any, entry: any) => {
        const resource = entry.resource;
        const searchParams = searchParamsFromResource(resource);
        acc[searchParams.code] = searchParams;
        return acc;
      }, {});

    filterParamByWhitelist(searchParamsSpec.entry).forEach((entry: any) => {
      const resource = entry.resource;
      resource.base.forEach((resourceType: string) => {
        if (!paramsByBase[resourceType]) {
          paramsByBase[resourceType] = resourceParams;
        }

        const searchParams = searchParamsFromResource(resource);

        paramsByBase[resourceType][searchParams.code] = searchParams;
      });
    });
  }

  return paramsByBase;
}
