import dotenv from "dotenv";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { type ChainValues } from "langchain/schema";

import { SessionLogger } from "./helpers/sessionLogger";

import { createAssistantAgent } from "./agents/assistant";

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    dotenv.config();
    SessionLogger.init({});

    const executor = await createAssistantAgent();

    for (;;) {
      // loop until exit/quit
      const query = await prompts({
        type: "text",
        name: "question",
        message: "💬",
      });

      if (["quit", "exit"].includes(query.question)) {
        console.log("\nbye-bye 👋\n");
        process.exit(0); // exit on exit or quit
      }

      SessionLogger.logQuestion(query.question);

      try {
        const response: ChainValues = await executor.call({
          input: query.question,
        });

        const answer = `🔰 ${response.output}\n`;
        SessionLogger.logAnswer(answer);
        console.log(answer);
      } catch (error) {
        console.log("error response: ", error);
        SessionLogger.log("error", error);
      }
    }
  },
};
