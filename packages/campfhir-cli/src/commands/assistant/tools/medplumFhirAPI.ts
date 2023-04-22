import { createJsonAgent, JsonToolkit } from "langchain/agents";
import { JsonObject, JsonSpec, Tool } from "langchain/tools";

import { getFHIR } from "../helpers/fhir";
// tslint:disable-next-line
import { LLMChain, OpenAI, PromptTemplate } from "langchain";
import medplumOpenAPI from "/workspace/data/medplum-openapi.json" assert { type: "json" };

import { extrapolateFhirUrlInstructions } from "../prompts/extrapolateFhirUrl";

const CLASS_PARAMS = {
  Patient: [
    "active",
    "name",
    "gender",
    "family",
    "birthdate",
    "address",
    "address-city",
    "address-country",
    "address-postalcode",
    "address-state",
    "death-date",
    "email",
    "general-practitioner",
    "given",
    "identifier",
    "phone",
    "telecom",
  ],
  Practitioner: [
    "active",
    "name",
    "gender",
    "address",
    "address-city",
    "address-country",
    "address-postalcode",
    "address-state",
    "email",
  ],
  RiskAssessment: ["risk"],
  Appointment: [
    "status",
    "start",
    "end",
    "participant",
    "actor",
    "appointment-type",
    "date",
    "identifier",
    "location",
    "patient",
    "practitioner",
    "reason-code",
    "reason-reference",
    "service-category",
    "service-type",
    "slot",
    "specialty",
    "subject",
  ],
  CarePlan: ["status", "intent", "title", "period", "activity"],
  Observation: [
    "status",
    "category",
    "code",
    "value",
    "subject",
    "effective",
    "issued",
    "patient",
    "performer",
    "encounter",
    "date",
  ],
};
const UNIVERSAL_PARAMS = [
  "_summary",
  "_id",
  "_profile",
  "_type",
  "_count",
  "_offset",
  "_format",
  "_pretty",
  "_summary",
  "_elements",
];
function knowClassesAndParams() {
  return Object.entries(CLASS_PARAMS)
    .map((entry) => {
      const [className, params] = entry;
      return `CLASS: ${className}, PARAM: ${[
        ...params,
        ...UNIVERSAL_PARAMS,
      ].join(", ")}`;
    })
    .join("\n");
}
export class FhirURL extends Tool {
  name = "FhirURL";
  description =
    "Useful for finding the FHIR URL for a given FHIR resource.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool is a FHIR URL that can be used to query the FHIR API.";

  async _call(input: string): Promise<string> {
    console.log("FhirURL input: ", input);
    const instructions = await extrapolateFhirUrlInstructions(
      knowClassesAndParams()
    );
    // console.log("instructions: ", instructions);

    const template = `${instructions}\n\nBEGIN!\nQ: {input} ||| fhirURL:`;
    // console.log("template: ", template);

    const llm = new OpenAI({ temperature: 0 });
    const llmChain = new LLMChain({
      llm,
      prompt: new PromptTemplate({ template, inputVariables: ["input"] }),
    });

    const result = await llmChain.call({ input });
    console.log("FhirURL output: ", result);
    return result.text as string;
  }
}
export class FhirAPI extends Tool {
  name = "FhirAPI";
  description = `Useful for getting the result of a FHIR URL. The input to this tool should be a valid relative FHIR URL that could be queried on a FHIR server. The output of this tool are the FHIR SearchSet Bundle response object converted to a JSON string.`;

  async _call(input: string): Promise<string> {
    try {
      console.log("FhirAPI input: ", input);
      const response = await getFHIR(input);
      console.log("FhirAPI output resource type: ", response.resourceType);
      console.log("FhirAPI output total: ", response.total || 0);
      console.log("FhirAPI output entry: ", response.entry?.length || 0);
      // console.log(`getFHIR response: ${JSON.stringify(response, null, 2)}`);

      return JSON.stringify(response);
    } catch (error) {
      console.error("getFhir error: ", error);

      throw error;
    }
  }
}

export function fhirJsonTools(): Tool[] {
  const medplumApiSchema = medplumOpenAPI as JsonObject;
  const toolkit = new JsonToolkit(new JsonSpec(medplumApiSchema));
  return toolkit.tools;
}

export class FhirApiToolkit {
  tools: Tool[];

  constructor() {
    // super();

    const medplumApiSchema = medplumOpenAPI as JsonObject;
    const jsonAgent = createJsonAgent(
      new OpenAI({ temperature: 0 }),
      new JsonToolkit(new JsonSpec(medplumApiSchema))
    );
    this.tools = [
      new FhirAPI(),
      new FhirURL(),
      // new DynamicTool({
      //   name: "FhirApiDocumentation",
      //   func: async (input: string) => {
      //     console.log("FHIR API DOC INPUT: ", input);
      //     const result = await jsonAgent.call({ input });
      //     console.log("FHIR API DOC RESULT: ", result);
      //     return result.output as string;
      //   },
      //   description: FHIR_API_DOCS_DESCRIPTION,
      // }),
    ];
  }
}
