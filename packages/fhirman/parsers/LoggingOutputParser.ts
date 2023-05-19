import { ZeroShotAgentOutputParser } from "langchain/agents";
import { SessionLogger } from "../helpers/sessionLogger.ts";

export class LoggingOutputParser extends ZeroShotAgentOutputParser {
  agentName: string;

  constructor(agentName: string) {
    super();

    this.agentName = agentName;
  }

  async parse(text: string) {
    try {
      const output = await super.parse(text);

      this.log(this.agentToolTitle(output));

      output.log
        .split("\n")
        .filter((line) => line)
        .forEach((line) => {
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
