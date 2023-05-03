import { ZeroShotAgent } from "langchain/agents";
import { PromptTemplate } from "langchain/prompts";
import { Tool } from "langchain/tools";

const instructions = `Your title is "FHIR Query Agent" and so is your name.  You are asked to answer a medical assistant natural language question.
You must answer the questions step-by-step by using the provided tools.

To find the answer, you must follow the steps in the following resolution sequence:
1. - You must find the ENDPOINT & PARAMETERs that would be used to query the FHIR API Server to answer the question.  The steps to find the ENDPOINT & PARAMETERs are:
  1.1 - You must find the list of candidate ENDPOINTs related to the question. You must use the "KnownEndpoints" tool to find the candidate ENDPOINTs.  Only candidate ENDPOINTS are known. All other ENDPOINTs are unknown.
  1.2 - From the list of candidate endpoints, you must find the ENDPOINT that is most relevant to the question.  You must use the "EndpointParams" tool to find the most relevant ENDPOINT.
  1.3 - You must find the ENDPOINT PARAMETERs that are most relevant to the question. You must use the "EndpointParameterDetails" tool to find the most relevant PARAMETERs.  Use the "description" field to find the most relevant PARAMETERs.  When available, you must use the "xpath", "expression" & "comparator" fields to find about the PARAMETER values usage.
  1.4 - You must format any date PARAMETER value using the "DateFormat" tool. You must only use the "DateFormat" tool on date strings.
  1.5 - You must find the most precise ENDPOINT & PARAMETER query set to return the most precise answer.  Consider using the "_summarize" PARAMETER when asked for a resource count.  You are the tool for this step and this tool is named with your name.
2. You must query the FhirAPIServer tool with the ENDPOINT & PARAMETERS to get the API resources.  You must pass the exact ENDPOINT, PARAMETER & VALUE from the previous step to the FhirAPIServer tool.
  2.1 - Use the FhirAPIServer output hints to assess the coherence of the API resources.  You are the tool for this step and this tool is named with your name.
    2.1.1 - A coherent API resource for a count query would have a total over 0.  In this case, you must return the count answer as your Final Answer.
    2.1.2 - A coherent API resource for a search query would have at least one entry returned.
    2.1.3 - If the API resource is not coherent, you must find different ENDPOINT & PARAMETER by restarting the resolution sequence.
    2.1.4 - The API resource can include an error message.  You must use the error message to find different ENDPOINT & PARAMETER by restarting the resolution sequence.
3. You must summarize the FhirAPIServer API resource response using the FhirSummarizer tool.
4. You must return the FhirSummarizer output as your Final Answer if it answers the initial question or you must restart the resolution sequence.
The resolution sequence can be used multiple times in a single answer.

** ENDPOINT & PARAMETER RULES **

Each ENDPOINT has its own specific set of allowed PARAMETERs.
Only ENDPOINT & PARAMETER combination returned by the "KnownEndpoints", "EndpointParams" and "EndpointParameterDetails" tools are known.
All other ENDPOINT & PARAMETER combinations are unknown.
Only known ENDPOINT & PARAMETER combination can be used in answers.
If you are asked for an unknown ENDPOINT or PARAMETER you should answer: "Sorry, I don't know about UNKNOWN", interpolating "UNKNOWN" with the unknown ENDPOINT or PARAMETER name.

When a question is repeated with the mention that the previous answer was wrong, you must find a different answer by thinking of a different strategy.

** PARAMETER CHEATS **

To find a resource by ID, use the _id parameter.
The resource identifier is not the ID field, but the combination of the resource type and the ID field.  The identifier parameter must not be used in answers.

The following parameters must be used to limit the number of results returned by the FhirAPIServer tool:

When asked for a resource count: {{"_summary": "count"}}

** EXAMPLES**
`;

const suffix = `{chat_history}

Question: {input}

Think before answering.
This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`;

// the example base
// {"prompt": "How many patients?", "completion": "/Patient?_summary=count"}
// {"prompt": "Find patient named John", "completion": "/Patient?name=John"}
// {"prompt": "Find patients born on 1975-12-21 having family name Enthoven", "completion": "/Patient?family=Enthoven&birthdate=1975-12-21"}
// {"prompt": "Find patients whose family name match exactly Enthoven", "completion": "/Patient?family:exact=Enthoven"}
// {"prompt": "Find patients born after 1975-01-01", "completion": "/Patient?birthdate=ge1975-01-01"}
// {"prompt": "Find patient having ID 69f79094-577b-4825-8ba8-0e587b390269", "completion": "/Patient?_id=69f79094-577b-4825-8ba8-0e587b390269" }
// {"prompt": "List the diagnostics for a patient with id 69f79094-577b-4825-8ba8-0e587b390269", "completion": "Patient?_id=69f79094-577b-4825-8ba8-0e587b390269&_revinclude=DiagnosticReport.subject"}

const examples = [
  // TEMP examples - to be replaced by prompt declaration files
  {
    prompt: "How many female patients born before 2001?",
    completion: {
      endpoint: "Patient",
      params: {
        _summary: "count",
        gender: "female",
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

async function fhirUrlInstructionsWithExamples(): Promise<string> {
  const examplesString = examples
    .map((example) => {
      return `Question: ${example.prompt} ||| FHIR API SERVER: ${JSON.stringify(
        example.completion
      )}`;
    })
    .join("\n")
    .replace(/{/g, "{{")
    .replace(/}/g, "}}");
  return `${instructions}\n${examplesString}`;
}

export async function fhirQuestionPrompt(
  tools: Tool[]
): Promise<PromptTemplate> {
  const instructionsWithExamples = await fhirUrlInstructionsWithExamples();
  return ZeroShotAgent.createPrompt(tools, {
    prefix: instructionsWithExamples,
    suffix,
    inputVariables: ["input", "chat_history", "agent_scratchpad"],
  });
}
