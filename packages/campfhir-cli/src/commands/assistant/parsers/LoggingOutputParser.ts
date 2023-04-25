import { ZeroShotAgentOutputParser } from "langchain/agents";

export class LoggingOutputParser extends ZeroShotAgentOutputParser {
  agentName: string;

  constructor(agentName: string) {
    super();

    this.agentName = agentName;
  }

  async parse(text: string) {
    // console.log("FhirUrlAgentParser text: ", text);
    try {
      const output = await super.parse(text);

      console.log(this.agentToolTitle(output));

      output.log
        .split("\n")
        .filter((line) => line)
        .forEach((line) => {
          console.log(this.agentStepLine(line));
        });
      console.log("\n");

      return output;
    } catch (error) {
      console.log("FhirUrlAgentParser error: ", error);
      console.log("FhirUrlAgentParser text: ", text);
      throw error;
    }
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
