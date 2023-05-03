import { JsonToolkit, Toolkit } from "langchain/agents";
import { JsonObject, JsonSpec, Tool } from "langchain/tools";

import { FhirAPIServer } from "./FhirAPI";
import { FhirSummarizer } from "./FhirSummarizer";

import { SessionLogger } from "../../helpers/sessionLogger";

export class FhirQueryToolkit extends Toolkit {
  tools: Tool[];

  constructor() {
    super();

    const store = new JSONResponseStore();

    this.tools = [new FhirAPIServer(store), new FhirSummarizer(store)];
  }
}

export class JSONResponseStore {
  jsonToolkit: JsonToolkit;
  jsonSpec: JsonSpec;

  constructor() {
    this.jsonSpec = new JsonSpec({});
    this.jsonToolkit = new JsonToolkit(this.jsonSpec);
  }

  setResponse(json: JsonObject) {
    SessionLogger.separator();
    SessionLogger.log("JSON: ", json);
    SessionLogger.separator();
    this.jsonSpec.obj = json;
  }
}
