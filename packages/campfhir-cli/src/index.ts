#!/usr/bin/env node

import chalk from "chalk";
import yargs from "yargs";

try {
  yargs()
    .scriptName("campfhir")
    .demand(1, chalk.red("Error: Must provide a valid command"))
    .help("h")
    .alias("h", "help")
    .strictCommands()
    .demandCommand(1)
    .parse(process.argv.slice(2));
} catch (error) {
  console.error(chalk.red(error));
  console.error();
  console.error(chalk.gray((error as Error).stack));
}
