#!/usr/bin/env node

import chalk from "chalk";
import yargs from "yargs";
import assistant from "./commands/assistant";
import importCmd from "./commands/import";
import verifyPrompts from "./commands/verify-prompts";

try {
  yargs()
    .scriptName("campfhir")
    .demand(1, chalk.red("Error: Must provide a valid command"))
    .command(importCmd)
    .command(verifyPrompts)
    .command(assistant)
    .help("h")
    .alias("h", "help")
    .strictCommands()
    .demandCommand(1)
    .env()
    .parse(process.argv.slice(2));
} catch (error) {
  console.error(chalk.red(error));
  console.error();
  console.error(chalk.gray((error as Error).stack));
}
