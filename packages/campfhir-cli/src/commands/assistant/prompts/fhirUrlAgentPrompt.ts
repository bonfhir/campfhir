const fhirURLTrainingDataPath = "/workspace/data/prompts.jsonl";
import { ZeroShotAgent } from "langchain/agents";
import { FewShotPromptTemplate, PromptTemplate } from "langchain/prompts";
import { Tool } from "langchain/tools";

import { loadJSONL } from "../helpers/jsonl";

const exampleFormatterTemplate = "Q: {prompt} ||| fhirURL: {completion}";

const instructions = `You are asked to answer a medical assistant natural language question by providing the FHIR URL that would be used to query the FHIR API to answer the question.
The FHIR URL is a relative URL that can be used to query the FHIR API.

To find the answer, you must do the following:
First, you must find the list of candidate ENDPOINTs related to the question. You must use the "KnownEndpoints" tool to find the candidate ENDPOINTs.  Only candidate ENDPOINTS are known. All other ENDPOINTs are unknown.
Second, from the list of candidate endpoints, you must find the ENDPOINT that is most relevant to the question.  You must use the "EndpointParams" tool to find the most relevant ENDPOINT.
Third, you must find the relevant ENDPOINT PARAM_N=VALUE_N pairs that are most useful to the question. You must use the "EndpointParameterDetails" tool to find the most relevant PARAM_N=VALUE_N pairs.
Fourth, you must format any date PARAM using the "DateFormat" tool.
Fifth, you must combine the ENDPOINT and PARAM_N=VALUE_N pairs into a FHIR URL.

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

When a question is repeated with the mention that the previous answer was wrong, you must find a different answer by thinking of a different strategy.

** GENERAL GUIDELINE FOR ALL ENDPOINTS **

To find a resource by ID, use the _id parameter.
The resource identifier is not the ID field, but the combination of the resource type and the ID field.  The identifier parameter must not be used in answers.

The following parameters should be used when possible to limit the number of results returned by the FHIR API:

When asked for a resource count: _summary=count
When asked for a specific resource property: _elements=PROPERTY

** EXAMPLES**
`;

const suffix = `{chat_history}

Question: {input}

Think before answering.
This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`;

async function fhirUrlInstructionsWithExamples(): Promise<string> {
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

export async function fhirUrlAgentPrompt(
  tools: Tool[]
): Promise<PromptTemplate> {
  const instructionsWithExamples = await fhirUrlInstructionsWithExamples();
  return ZeroShotAgent.createPrompt(tools, {
    prefix: instructionsWithExamples,
    suffix,
    inputVariables: ["input", "chat_history", "agent_scratchpad"],
  });
}
