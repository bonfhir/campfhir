import { AgentExecutor } from "langchain/agents";

import { type ChainValues } from "langchain/schema";
import { Tool } from "langchain/tools";

import { CurrentUser } from "../helpers/currentUser.ts";

import { createFhirAgent } from "../agents/fhir.ts";
//@ts-ignore
import { ModelOutputEmitter } from "../events/ModelOutputEmitter.ts"

export class FhirQuestion extends Tool {
  name = "FhirQuestion";
  description =
    "Useful for answering questions about medical data stored on a FHIR RESTful API server.  The input to this tool should be a natural language query about some FHIR resource.  The output of this tool is the summarized Fhir RESTFul API server response.";

  executor: AgentExecutor | undefined;
  currentUser: CurrentUser;
  emitter: ModelOutputEmitter;

  constructor(currentUser: CurrentUser, emitter: ModelOutputEmitter) {
    super();

    this.currentUser = currentUser;
    this.emitter = emitter;
  }

  async _call(input: string): Promise<string> {
    if (!this.executor) {
      this.executor = await createFhirAgent(this.currentUser, this.emitter);
    }

    try {
      const response: ChainValues = await this.executor.call({
        input,
      });

      return response.output;
    } catch (error) {
      console.log("error: ", error);
      return `Sorry I don't know about: ${input}`;
    }
  }
}
