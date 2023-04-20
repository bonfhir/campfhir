import { FewShotPromptTemplate, PromptTemplate } from "langchain/prompts";

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
Here are the known ENDPOINT & PARAM combinations.

{classesAndParams}

All other ENDPOINT are unknown.  All other ENDPOINT & PARAM combinations are unknown.
ENDPOINT names are case insensitive. There are no subclasses or roles derived from the known ENDPOINT.
Only known ENDPOINT & PARAM combination can be used in answers.
If you are asked for an unknown ENDPOINT or PARAM you should answer: "Sorry, I don't know about UNKNOWN", interpolating "UNKNOWN" with the unknown ENDPOINT or PARAM name.
Use the FhirApiSchema tool to query documentation about the known ENDPOINT & PARAM usage to build valid FHIR URL answers.
The FHIR URL answer should return as few results as possible.

** EXAMPLES**`;

export async function extrapolateFhirUrlInstructions(
  knowClassesAndParams: any
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
    classesAndParams: knowClassesAndParams,
  });
}
