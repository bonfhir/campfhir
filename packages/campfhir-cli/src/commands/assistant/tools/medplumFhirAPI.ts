import { createJsonAgent, JsonToolkit } from "langchain/agents";
import { DynamicTool, JsonObject, JsonSpec, Tool } from "langchain/tools";
import { JSON_EXPLORER_DESCRIPTION } from "../prompts/jsonExplorer";

import { getFHIR } from "../helpers/fhir";
// tslint:disable-next-line
import { OpenAI } from "langchain";
import medplumOpenAPI from "/workspace/data/medplum-openapi.json" assert { type: "json" };

export class FhirAPI extends Tool {
  name = "FhirAPI";
  description = `Useful for getting the result of a FHIR URL. The input to this tool should be a valid FHIR URL that could be queried on a FHIR server. The output of this tool are the FHIR SearchSet Bundle response object converted to a JSON string.`;

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
      new DynamicTool({
        name: "json_explorer",
        func: async (input: string) => {
          console.log("JSON EXPLORER INPUT: ", input);
          const result = await jsonAgent.call({ input });
          console.log("JSON EXPLORER RESULT: ", result);
          return result.output as string;
        },
        description: JSON_EXPLORER_DESCRIPTION,
      }),
    ];
  }
}
