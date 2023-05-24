import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  package: {
    name: "@bonfhir/fhirman",
    description: "FHIR first responder agent",
    version: "0.1.0", // TODO extract from version file??
    license: "APACHE-2.0",
  },
  postBuild() {
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
