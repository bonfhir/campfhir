import { Tool } from "langchain/tools";

import { getFHIR } from "../helpers/fhir";

export class FhirAPI extends Tool {
  name = "FhirAPI";
  description = `Useful for getting the result of a FHIR URL. The input to this tool should be a valid relative FHIR URL that could be queried on a FHIR server. The output of this tool are the FHIR SearchSet Bundle response object converted to a JSON string.`;

  async _call(input: string): Promise<string> {
    try {
      //console.log("FhirAPI input: ", input);
      const response = await getFHIR(input);
      //console.log("FhirAPI output resource type: ", response.resourceType);
      //console.log("FhirAPI output total: ", response.total || 0);
      //console.log("FhirAPI output entry: ", response.entry?.length || 0);
      // console.log(`getFHIR response: ${JSON.stringify(response, null, 2)}`);

      return JSON.stringify(response);
    } catch (error) {
      console.error("getFhir error: ", error);

      throw error;
    }
  }
}
