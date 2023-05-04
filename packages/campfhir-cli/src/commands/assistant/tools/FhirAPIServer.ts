import { JsonObject, Tool } from "langchain/tools";

import querystring from "querystring";
import { getFHIR } from "../helpers/fhir";

import { SessionLogger } from "../helpers/sessionLogger";

const RESOURCE_KEYS = [
  "resourceType",
  "id",
  "name",
  "telecom",
  "gender",
  "birthDate",
  "deceasedDateTime",
  "address",
  "maritalStatus",
];

export class FhirAPIServer extends Tool {
  name = "FhirAPIServer";
  description = `Useful for querying a FHIR RESTFul API server. The input to this tool should be a valid JSON string query.  The format of the JSON input query is {{"endpoint": <ENDPOINT>, "params": {{"<PARAMETER code>": "<PARAMETER value>"}}}}.  The output is the FHIR API server JSON response.`;

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      console.log("FhirAPIServer input: ", input);
      const query = JSON.parse(input);
      console.log("FhirAPIServer query: ", query);
      const url = this.buildUrl(query.endpoint, query.params);
      console.log("FhirAPIServer url: ", url);

      const response = (await getFHIR(url)) as JsonObject;
      this.logResponse(response as JsonObject);
      //console.log("FhirAPI output resource type: ", response.resourceType);
      //console.log("FhirAPI output total: ", response.total || 0);
      //console.log("FhirAPI output entry: ", response.entry?.length || 0);
      // console.log(`getFHIR response: ${JSON.stringify(response, null, 2)}`);

      let result: any;
      if (response.entry?.length > 1) {
        // The sane strategy, for now, is to only accept single results
        result = {
          error:
            "The response is too large and has multiple pages.  The query should be refined to return a smaller result set.",
        };
      } else {
        result = this.minimizeResponse(response as JsonObject);
      }

      console.log(`getFHIR result: ${JSON.stringify(result, null, 2)}`);

      return JSON.stringify(result);
    } catch (error) {
      console.error("getFhir error: ", error);

      throw error;
    }
  }

  buildUrl(endpoint: string, params: any[]) {
    const paramQuery = querystring.stringify(params);
    console.log("FhirAPIServer paramQuery: ", paramQuery);

    return `/${endpoint}?${paramQuery}`;
  }

  minimizeResponse(response: JsonObject) {
    let result: any;
    if (response.entry?.length === 1) {
      result = Object.fromEntries(
        Object.entries(response.entry[0].resource).filter(([key, _value]) =>
          RESOURCE_KEYS.includes(key)
        )
      );
    } else {
      result = response;
    }
    return result;
  }

  logResponse(json: JsonObject) {
    SessionLogger.separator();
    SessionLogger.log("JSON: ", json);
    SessionLogger.separator();
  }
}
