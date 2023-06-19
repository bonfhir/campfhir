/* eslint-disable @typescript-eslint/no-explicit-any */
import { FhirRestfulClient } from "@bonfhir/core/r4b";
import chalk from "chalk";
import { readFile } from "fs/promises";
import Listr from "listr";
import { CommandModule } from "yargs";
import {
  InitializeClient,
  MedplumClientOptions,
} from "./tasks/initialize-client";

interface VerifyPromptsOptions extends MedplumClientOptions {
  file: string;
}

interface VerifyPromptsContext {
  options: VerifyPromptsOptions;
  client: FhirRestfulClient;
}

export default <CommandModule<unknown, VerifyPromptsOptions>> {
  command: "verify",
  describe: "Verify a prompts JSONL file.",
  builder: {
    file: {
      alias: "f",
      type: "string",
      demandOption: true,
      describe: "Prompt file (JSONL) format",
    },
    "medplum-server-url": {
      type: "string",
      demandOption: true,
      describe: "The base url for the medplum server",
    },
    "medplum-client-id": {
      type: "string",
      demandOption: true,
      describe: "The client id for the medplum server",
    },
    "medplum-client-secret": {
      type: "string",
      demandOption: true,
      describe: "The client secret for the medplum server",
    },
  },
  handler: async (options) => {
    try {
      await new Listr<VerifyPromptsContext>([
        InitializeClient as any,
        {
          title: "Verify prompts",
          task: async (ctx, task) => {
            const prompts = (
              await readFile(ctx.options.file, { encoding: "utf8", flag: "r" })
            )
              .split("\n")
              .filter(Boolean)
              .filter((x) => !x.startsWith("//"))
              .map((x) => JSON.parse(x));
            for (const prompt of prompts) {
              task.title = `Verify ${prompt.prompt}`;
              try {
                await ctx.client.search(prompt.completion);
              } catch (error) {
                console.error(error);
              }
            }
          },
        },
      ]).run({
        options,
      } as unknown as VerifyPromptsContext);
    } catch (error) {
      console.log({ error });
      console.error(chalk.red(error));
      console.error();
      console.error(chalk.gray((error as Error).stack));
    }
  },
};
