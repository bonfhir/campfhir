import { ZeroShotAgent } from "langchain/agents";
import { PromptTemplate } from "langchain/prompts";
import { Tool } from "langchain/tools";

const instructions = `Your title is "FHIR Query Agent" and so is your name.  You are a data query agent.
You must answer the questions step-by-step by using the provided tools.  Don't skip any step.

To find the answer, you must follow the steps in the following resolution sequence:
1. - You must find the ENDPOINT & PARAMETERs that would be used to query the FHIR API Server to answer the question.  The steps to find the ENDPOINT & PARAMETERs are:
  1.1 - You must find the list of candidate ENDPOINTs related to the question. You must use the "KnownEndpoints" tool to find the candidate ENDPOINTs.  Only candidate ENDPOINTS are known. All other ENDPOINTs are unknown.
  1.2 - From the list of candidate endpoints, you must find the ENDPOINT that is most relevant to the question.  You must use the "EndpointParams" tool to find the most relevant ENDPOINT.
  1.3 - You must compare the "FhirAPIExamples" tool examples to find the input to the "FhirAPIServer" tool.
  1.4 - For date PARAMETERs, you must format any date PARAMETER value using the "DateFormat" tool.
2. - You must explain, one-by-one, why each PARAMETERs are used in query.
3. - You must analyse the PARAMETER explanations and keep PARAMETERS that answer the question.
4. - You must query the "FhirAPIServer" tool with the ENDPOINT & PARAMETERS to get the API resources.  You must pass the exact ENDPOINT, PARAMETER & VALUE from the previous step to the FhirAPIServer tool.
  4.1 - Use the "FhirAPIServer" output hints to assess the coherence of the API resources.
    4.1.1 - A coherent API resource for a count query would have a total over 0.  In this case, you must return the count answer as your Final Answer.
    4.1.2 - A coherent API resource for a search query would have at least one entry returned.
    4.1.3 - If the API resource is not coherent, you must find different ENDPOINT & PARAMETER by restarting the resolution sequence.
    4.1.4 - The API resource can include an error message.  You must use the error message to find different ENDPOINT & PARAMETER by restarting the resolution sequence.
5. - You must make sure that the "FhirAPIServer" output answers the question or you must restart the resolution sequence.
6. - You must summarize the "FhirAPIServer" output to answer the question as your Final Answer.  Always provide a source to explain with your Final Answer.
The resolution sequence can be used multiple times in a single answer.

** ENDPOINT & PARAMETER RULES **

Each ENDPOINT has its own specific set of allowed PARAMETERs.
Only ENDPOINT & PARAMETER combination returned by the "KnownEndpoints", "EndpointParams" and "FhirAPIExamples" tools are known.
All other ENDPOINT & PARAMETER combinations are unknown.
Only known ENDPOINT & PARAMETER combination can be used in answers.
If you are asked for an unknown ENDPOINT or PARAMETER you should answer: "Sorry, I don't know about UNKNOWN", interpolating "UNKNOWN" with the unknown ENDPOINT or PARAMETER name.

When a question is repeated with the mention that the previous answer was wrong, you must find a different answer by thinking of a different strategy.

** PARAMETER CHEATS **

To find a resource by ID, use the _id parameter.
The resource identifier is not the ID field, but the combination of the resource type and the ID field.  The identifier parameter must not be used in answers.

The following parameters must be used to limit the number of results returned by the FhirAPIServer tool:

Question: "how many": {{"_summary": "count"}}
Question: "what is the": NO _summary PARAMETER
`;

const suffix = `Think before answering.

{chat_history}

Question: {input}

This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`;

export const examples = [
  // TEMP examples - to be replaced by prompt declaration files
  {
    prompt: "How many female patients",
    completion: {
      endpoint: "Patient",
      params: {
        _summary: "count",
        gender: "female",
      },
    },
  },
  {
    prompt: "How many patients born before 2001?",
    completion: {
      endpoint: "Patient",
      params: {
        _summary: "count",
        birthdate: "lt2001-01-01",
      },
    },
  },
  {
    prompt: "Find patient named John",
    completion: {
      endpoint: "Patient",
      params: {
        name: "John",
      },
    },
  },
  {
    prompt: "Find patients born on 1975-12-21 having family name Enthoven",
    completion: {
      endpoint: "Patient",
      params: {
        birthdate: "1975-12-21",
        family: "Enthoven",
      },
    },
  },
  {
    prompt: "Find patients whose family name match exactly Enthoven",
    completion: {
      endpoint: "Patient",
      params: {
        "family:exact": "Enthoven",
      },
    },
  },
  {
    prompt: "Find patients born after 1975-01-01",
    completion: {
      endpoint: "Patient",
      params: {
        birthdate: "ge1975-01-01",
      },
    },
  },
  {
    prompt: "Find patient having ID 69f79094-577b-4825-8ba8-0e587b390269",
    completion: {
      endpoint: "Patient",
      params: {
        _id: "69f79094-577b-4825-8ba8-0e587b390269",
      },
    },
  },
  {
    prompt:
      "List the diagnostics for a patient with id 69f79094-577b-4825-8ba8-0e587b390269",
    completion: {
      endpoint: "Patient",
      params: {
        _id: "69f79094-577b-4825-8ba8-0e587b390269",
        _revinclude: "DiagnosticReport.subject",
      },
    },
  },
];

export function formatedExamples(): string {
  return examples
    .map((example) => {
      return `Question: ${example.prompt} ||| FhirAPIServer: "${JSON.stringify(
        example.completion
      )}"`;
    })
    .join("\n");
}

export async function fhirQuestionPrompt(
  tools: Tool[]
): Promise<PromptTemplate> {
  return ZeroShotAgent.createPrompt(tools, {
    prefix: instructions,
    suffix,
    inputVariables: ["input", "chat_history", "agent_scratchpad"],
  });
}
