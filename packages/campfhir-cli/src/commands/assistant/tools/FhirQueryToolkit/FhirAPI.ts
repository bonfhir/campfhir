import { JsonObject, Tool } from "langchain/tools";

import querystring from "querystring";
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
      // console.log(`getFHIR response: ${JSON.stringify(response, null, 2)}`);

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

export class FhirAPIServer extends Tool {
  name = "FhirAPIServer";
  description = `Useful for querying a FHIR RESTFul API server. The input to this tool should be a valid JSON string query.  The format of the JSON input query is {{"endpoint": <ENDPOINT>, "params": {{"<PARAMETER code>": "<PARAMETER value>"}}}}.  The FHIR server response blob is automatically available to the FhirSummarizer tool. The output of this tool is a response hint providing the number of returned entries or the summarization total.`;

  store: JSONResponseStore;

  constructor(store: JSONResponseStore) {
    super();

    this.store = store;
  }

  async _call(input: string): Promise<string> {
    try {
      console.log("FhirAPIServer input: ", input);
      const query = JSON.parse(input);
      console.log("FhirAPIServer query: ", query);
      const url = this.buildUrl(query.endpoint, query.params);
      console.log("FhirAPIServer url: ", url);

      const response = await getFHIR(url);
      //console.log("FhirAPI output resource type: ", response.resourceType);
      //console.log("FhirAPI output total: ", response.total || 0);
      //console.log("FhirAPI output entry: ", response.entry?.length || 0);
      // console.log(`getFHIR response: ${JSON.stringify(response, null, 2)}`);

      this.store.setResponse(response as JsonObject);

      const hints = { entries: 0, total: 0 };
      if (
        response.link?.length &&
        response.link.find((link) => link.relation == "next")
      ) {
        hints["error"] =
          "The response is too large and has multiple pages.  The query should be refined to return a smaller result set.";
      }

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

  buildUrl(endpoint: string, params: any[]) {
    const paramQuery = querystring.stringify(params);
    console.log("FhirAPIServer paramQuery: ", paramQuery);

    return `/${endpoint}?${paramQuery}`;
  }
}

export class FhirAPIServer2 extends Tool {
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

      const response = await getFHIR(url);
      //console.log("FhirAPI output resource type: ", response.resourceType);
      //console.log("FhirAPI output total: ", response.total || 0);
      //console.log("FhirAPI output entry: ", response.entry?.length || 0);
      // console.log(`getFHIR response: ${JSON.stringify(response, null, 2)}`);

      let result: string;
      if (response.entry?.length > 1) {
        result = JSON.stringify({
          error:
            "The response is too large and has multiple pages.  The query should be refined to return a smaller result set.",
        });
      } else {
        result = JSON.stringify(response);
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
}
