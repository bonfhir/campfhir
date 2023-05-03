import dayjs from "dayjs";

import { Toolkit } from "langchain/agents";
import { Tool } from "langchain/tools";

export class DateToolkit extends Toolkit {
  tools: Tool[];

  constructor() {
    super();

    this.tools = [new DateFormat()];
  }
}

export class DateFormat extends Tool {
  name = "DateFormat";
  description =
    "Useful for formatting a date.  The input to this tool should be a date string.  The output of this tool is a date in the format YYYY-MM-DD.";

  async _call(input: string): Promise<string> {
    return dayjs(input).format("YYYY-MM-DD");
  }
}
