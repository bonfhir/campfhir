export async function loadJSONL(jsonlFilePath: string) {
  const byteArray = await Deno.readFile(jsonlFilePath);
  const decoder = new TextDecoder("utf-8");
  decoder
    .decode(byteArray)
    .split("\n")
    .filter(Boolean)
    .filter((line) => !line.startsWith("//"))
    .map((line) => JSON.parse(line));
}
