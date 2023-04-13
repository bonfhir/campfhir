import { JsonToolkit } from "langchain/agents";
import { JsonObject, JsonSpec, Tool } from "langchain/tools";

import { getFHIR } from "../helpers/fhir";
// tslint:disable-next-line
import medplumOpenAPI from "/workspace/data/medplum-openapi.json" assert { type: "json" };

export class FhirAPI extends Tool {
  name = "FhirAPI";
  description = `Useful for getting the result of a FHIR URL. The input to this tool should be a valid FHIR URL that could be queried on a FHIR server. The output of this tool are the FHIR SearchSet Bundle entries resource converted to a JSON string.`;

  async _call(input: string): Promise<string> {
    try {
      console.log("input: ", input);
      const response = await getFHIR(input);
      console.log("getFhir response: ", response);
      return JSON.stringify(response.entry?.map((entry) => entry.resource));
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
