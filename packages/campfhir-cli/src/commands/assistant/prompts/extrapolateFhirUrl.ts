import { FewShotPromptTemplate, PromptTemplate } from "langchain/prompts";

import { loadJSONL } from "../helpers/jsonl";

const fhirURLTrainingDataPath = "/workspace/data/prompts.jsonl";
const exampleFormatterTemplate = "Q: {prompt} ||| fhirURL: {completion}";
const instructions = `The answers are found by querying the FHIR API.  The FHIR API is a RESTful API that is used to query medical data.
The FHIR API is accessed by constructing a FHIR URL. The structure of the FHIR URL is:

CLASS?PARAM_1=VALUE_1&PARAM_2=VALUE_2

There is only one CLASS per URL.
There can be an infinite number of PARAM_N=VALUE_N pairs.
Each CLASS has its own specific set of allowed PARAM keys.
Here are the known CLASS & PARAM combinations.

{classesAndParams}

All other CLASS are unknown.  All other CLASS & PARAM combinations are unknown.
CLASS names are case insensitive. There are no subclasses or roles derived from the known CLASS.
Only known CLASS & PARAM combination can be used in answers.
If you are asked for an unknown CLASS or PARAM you should answer: "Sorry, I don't know about UNKNOWN", interpolating "UNKNOWN" with the unknown CLASS or PARAM name.

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
