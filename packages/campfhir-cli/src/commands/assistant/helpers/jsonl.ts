import { readFile } from "fs/promises";

export async function loadJSONL(jsonlFilePath: string) {
  return (await readFile(jsonlFilePath, { encoding: "utf8", flag: "r" }))
    .split("\n")
    .filter(Boolean)
    .filter((line) => !line.startsWith("//"))
    .map((line) => JSON.parse(line));
}
