/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  buildReferenceFromResource,
  FhirRestfulClient,
  fhirSearch,
} from "@bonfhir/core/r4b";
import { MedplumClientOptions } from "@medplum/core";
import chalk from "chalk";
import fg from "fast-glob";
import { Bundle } from "fhir/r4";
import Listr from "listr";
import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import { readFile } from "node:fs/promises";
import { parse } from "node:path";
import { CommandModule } from "yargs";
import { InitializeClient } from "./tasks/initialize-client";

interface ImportOptions extends MedplumClientOptions {
  files: string;
}

interface ImportContext {
  options: ImportOptions;
  client: FhirRestfulClient;
}

export default <CommandModule<unknown, ImportOptions>> {
  command: "import",
  describe: "Import FHIR bundles withe deduplication",
  builder: {
    files: {
      alias: "f",
      type: "string",
      demandOption: true,
      describe: "Files to import",
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
      await new Listr<ImportContext>([
        InitializeClient as any,
        {
          title: "Import files",
          task: async (ctx, task) => {
            const importFiles = await fg(options.files);
            for (const [index, file] of importFiles.entries()) {
              task.title = `Import ${parse(file).base} (${
                index + 1
              }/${importFiles.length})`;
              try {
                const originalBundleContent = await readFile(file, {
                  encoding: "utf8",
                  flag: "r",
                });
                const bundle = JSON.parse(originalBundleContent) as Bundle;
                const searchBatch = buildSearchBatchByIdentifier(bundle);
                const existingResourcesResponse = (await ctx.client.batch(
                  buildSearchBatchByIdentifier(bundle),
                )) as Bundle<Bundle>;

                const substitutionMapping = buildSubstitutionMapping(
                  searchBatch,
                  existingResourcesResponse,
                );

                bundle.entry = (bundle.entry || []).filter(
                  (entry) => !substitutionMapping[entry.fullUrl!],
                );
                updateBundleReferences(bundle, substitutionMapping);

                await ctx.client.batch(bundle);
              } catch (error) {
                console.error({ error });
              }
            }
          },
        },
      ]).run({ options } as unknown as ImportContext);
    } catch (error) {
      console.log({ error });
      console.error(chalk.red(error));
      console.error();
      console.error(chalk.gray((error as Error).stack));
    }
  },
};

function buildSearchBatchByIdentifier(bundle: Bundle): Bundle {
  return {
    resourceType: "Bundle",
    type: "batch",
    entry: (bundle.entry || [])
      .filter((entry) => !!(entry.resource as any)?.identifier?.length)
      .map((entry) => ({
        request: {
          method: "GET",
          url: `/${entry.resource!.resourceType}?${
            fhirSearch()
              .token("identifier", (entry.resource as any).identifier)
              .number("_count", 1).href
          }`,
        },
        id: entry.fullUrl,
      })),
  };
}

function buildSubstitutionMapping(
  search: Bundle,
  response: Bundle<Bundle>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [index, entry] of (search.entry || []).entries()) {
    const resource = response.entry?.[index]?.resource?.entry?.[0]?.resource;
    if (resource) {
      result[entry.id!] = buildReferenceFromResource(resource).reference;
    }
  }

  return result;
}

function updateBundleReferences(
  value: any,
  substitutionMapping: Record<string, string>,
) {
  if (isObject(value) || isArray(value)) {
    for (const entry of Object.entries(value)) {
      if (entry[0] !== "fullUrl" && substitutionMapping[entry[1]]) {
        (value as any)[entry[0]] = substitutionMapping[entry[1]];
        continue;
      }

      if (isObject(entry[1])) {
        updateBundleReferences(entry[1], substitutionMapping);
        continue;
      }

      if (isArray(entry[1])) {
        updateBundleReferences(entry[1], substitutionMapping);
      }
    }

    return;
  }
}
