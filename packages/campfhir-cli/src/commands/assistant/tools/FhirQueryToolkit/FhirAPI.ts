import { JsonObject, Tool } from "langchain/tools";

import { getFHIR } from "../../helpers/fhir";
import { JSONResponseStore } from "./index";

export class FhirAPI extends Tool {
  name = "FhirAPI";
  description = `Useful for getting the result of a FHIR URL. The input to this tool should be a valid relative FHIR URL that could be queried on a FHIR server.  The FHIR server response blob is automatically available to the FhirSummarizer tool. The output of this tool is a response hint providing the number of returned entries or the summarization total.`;

  store: JSONResponseStore;

  constructor(store: JSONResponseStore) {
    super();

    this.store = store;
  }

  async _call(input: string): Promise<string> {
    try {
      //console.log("FhirAPI input: ", input);
      const response = await getFHIR(input);
      //console.log("FhirAPI output resource type: ", response.resourceType);
      //console.log("FhirAPI output total: ", response.total || 0);
      //console.log("FhirAPI output entry: ", response.entry?.length || 0);
      console.log(`getFHIR response: ${JSON.stringify(response, null, 2)}`);

      this.store.setResponse(response as JsonObject);

      const hints = { entries: 0, total: 0 };
      if (response.type === "searchset") {
        if (response.total) {
          hints["total"] = response.total;
        } else if (response.entry?.length) {
          hints["entries"] = response.entry.length;
        }
      } else if (response.class !== undefined) {
        hints["entries"] = 1;
      }

      console.log(`getFHIR hints: ${JSON.stringify(hints, null, 2)}`);

      return JSON.stringify(hints);
    } catch (error) {
      console.error("getFhir error: ", error);

      throw error;
    }
  }
}
