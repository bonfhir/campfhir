import { ZeroShotAgentOutputParser } from "langchain/agents";
// @ts-ignore
import { SessionLogger } from "../helpers/sessionLogger.ts";
import {
  MODEL_OUTPUT_EVENT,
  ModelOutputEmitter,
} from "../events/ModelOutputEmitter.ts";

export class EmitterOutputParser extends ZeroShotAgentOutputParser {
  agentName: string;
  emitter: ModelOutputEmitter;

  constructor(agentName: string, emitter: ModelOutputEmitter) {
    super();

    this.agentName = agentName;
    this.emitter = emitter;
  }

  async parse(text: string) {
    try {
      const output = await super.parse(text);

      const toolName = output.tool;
      this.log(this.agentToolTitle(output));

      output.log
        .split("\n")
        .filter((line) => line)
        .forEach((line) => {
          this.emit(line, toolName);
          this.log(this.agentStepLine(line));
        });
      this.log("\n");

      return output;
    } catch (error) {
      this.log("FhirUrlAgentParser error: ", error);
      this.log("FhirUrlAgentParser text: ", text);
      this.log("FhirUrlAgentParser text type: ", typeof text);
      throw error;
    }
  }

  log(message: string, ...extra: any[]) {
    SessionLogger.log(message, ...extra);
    console.log(message, ...extra);
  }

  protected emit(message: string, tool?: string) {
    this.emitter.emit(MODEL_OUTPUT_EVENT, message, this.agentName, tool);
  }

  protected agentToolTitle(output: any) {
    let title = `💠 ${this.agentName} agent`;
    if (output?.tool) {
      title += ` ⚒️ ${output.tool} tool`;
    }
    return title;
  }

  protected agentStepLine(line: string) {
    return `⚙️ ${line.trim()}`;
  }
}
