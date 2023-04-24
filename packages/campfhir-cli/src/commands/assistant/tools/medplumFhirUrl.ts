import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { OpenAI } from "langchain";
import { AgentExecutor, ZeroShotAgent } from "langchain/agents";
import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { FewShotPromptTemplate, PromptTemplate } from "langchain/prompts";
import { SupabaseHybridSearch } from "langchain/retrievers/supabase";
import { Tool } from "langchain/tools";
import { loadJSONL } from "../helpers/jsonl";
const fhirURLTrainingDataPath = "/workspace/data/prompts.jsonl";
const exampleFormatterTemplate = "Q: {prompt} ||| fhirURL: {completion}";

const instructions = `You are asked to answer a medical assistant natural language question by providing the FHIR URL that would be used to query the FHIR API to answer the question.
The FHIR URL is a relative URL that can be used to query the FHIR API.

You should answer with a single FHIR URL string.

** FHIR URL FORMAT **

ENDPOINT?PARAM_1=VALUE_1&PARAM_2=VALUE_2

There is only one ENDPOINT per URL.
There can be an infinite number of PARAM_N=VALUE_N pairs.
Each ENDPOINT has its own specific set of allowed PARAM keys.

Here are the known ENDPOINT:

{endpoints}

All other ENDPOINT are unknown.
ENDPOINT names are case insensitive. There are no subclasses or roles derived from the known ENDPOINT.

To solve find the answer, you must do the following:
First, find the ENDPOINT that is most relevant to the question.  You must use the "endpointDefinition" tool to find the most relevant ENDPOINT.
Second, find the relevant ENDPOINT PARAM_N=VALUE_N pairs that are most useful to the question. You must use the "paramDefinition" tool to find the most relevant PARAM_N=VALUE_N pairs.
Third, combine the ENDPOINT and PARAM_N=VALUE_N pairs into a FHIR URL.

Only ENDPOINT & PARAM combination returned by the "endpointDefinition" and "paramDefinition" tools are known.
All other ENDPOINT & PARAM combinations are unknown.
Only known ENDPOINT & PARAM combination can be used in answers.
If you are asked for an unknown ENDPOINT or PARAM you should answer: "Sorry, I don't know about UNKNOWN", interpolating "UNKNOWN" with the unknown ENDPOINT or PARAM name.

** EXAMPLES**
`;

async function extrapolateFhirUrl2Instructions(
  endpoints: string[]
): Promise<string> {
  const examplePrompt = new PromptTemplate({
    inputVariables: ["prompt", "completion"],
    template: exampleFormatterTemplate,
  });
  console.log("examplePrompt: ", examplePrompt);

  const examples = await loadJSONL(fhirURLTrainingDataPath);

  const fewShotPrompt = new FewShotPromptTemplate({
    examples,
    examplePrompt,
    prefix: instructions,
    exampleSeparator: "\n\n",
    templateFormat: "f-string",
    inputVariables: ["classesAndParams"],
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
  console.log("endpoints: ", endpoints);
  return endpoints;
}

export class FhirURL2 extends Tool {
  name = "FhirURL";
  description =
    "Useful for finding the FHIR URL for a given FHIR resource.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool is a FHIR URL that can be used to query the FHIR API.";

  async _call(input: string): Promise<string> {
    console.log("FhirURL2 input: ", input);

    const endpoints = await retrieveKnowEndpointsFor(input);
    const instructions = await extrapolateFhirUrl2Instructions(endpoints);

    const template = `${instructions}\n\nBEGIN!\nQ: {input} ||| fhirURL:`;
    // console.log("template: ", template);

    const llm = new OpenAI({ temperature: 0 });
    const llmChain = new LLMChain({
      llm,
      prompt: new PromptTemplate({ template, inputVariables: ["input"] }),
      verbose: true,
    });

    const tools = [new EndpointDefinition(), new ParamDefinition()];

    const agent = new ZeroShotAgent({
      // how could this agent have memory
      llmChain,
      allowedTools: tools.map((tool) => tool.name),
    });

    const executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      returnIntermediateSteps: true,
    });

    const result = await executor.run(input);

    console.log("result: ", result);

    return result;
  }
}
