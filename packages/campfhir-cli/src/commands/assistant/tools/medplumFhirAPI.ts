import { createJsonAgent, JsonToolkit } from "langchain/agents";
import { JsonObject, JsonSpec, Tool } from "langchain/tools";

import { getFHIR } from "../helpers/fhir";
// tslint:disable-next-line
import { LLMChain, OpenAI, PromptTemplate } from "langchain";
import medplumOpenAPI from "/workspace/data/medplum-openapi.json" assert { type: "json" };

import { extrapolateFhirUrlInstructions } from "../prompts/extrapolateFhirUrl";

const CLASS_PARAMS = {
  Patient: ["active", "name", "gender"],
  Practitioner: ["active", "name", "gender"],
  RiskAssessment: ["risk", "_summary"],
  Appointment: ["status", "start", "end", "participant"],
  CarePlan: ["status", "intent", "title", "period", "activity"],
};
function knowClassesAndParams() {
  return Object.entries(CLASS_PARAMS)
    .map((entry) => {
      const [className, params] = entry;
      return `CLASS: ${className}, PARAM: ${params.join(", ")}`;
    })
    .join("\n");
}
export class FhirURL extends Tool {
  name = "FhirURL";
  description =
    "Useful for finding the FHIR URL for a given FHIR resource.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool is a FHIR URL that can be used to query the FHIR API.";

  async _call(input: string): Promise<string> {
    console.log("input: ", input);
    const instructions = await extrapolateFhirUrlInstructions(
      knowClassesAndParams()
    );
    console.log("instructions: ", instructions);

    const template = `${instructions}\n\nBEGIN!\nQ: {input} ||| fhirURL:`;
    console.log("template: ", template);

    const llm = new OpenAI({ temperature: 0 });
    const llmChain = new LLMChain({
      llm,
      prompt: new PromptTemplate({ template, inputVariables: ["input"] }),
    });

    const result = await llmChain.call({ input });
    console.log("FHIR URL result: ", result);
    return result.text as string;
  }
}
export class FhirAPI extends Tool {
  name = "FhirAPI";
  description = `Useful for getting the result of a FHIR URL. The input to this tool should be a valid relative FHIR URL that could be queried on a FHIR server. The output of this tool are the FHIR SearchSet Bundle response object converted to a JSON string.`;

  async _call(input: string): Promise<string> {
    try {
      console.log("input: ", input);
      const response = await getFHIR(input);
      console.log(`getFHIR response: ${JSON.stringify(response, null, 2)}`);

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
