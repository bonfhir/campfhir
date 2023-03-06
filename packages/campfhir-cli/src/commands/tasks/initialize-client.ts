import { FhirRestfulClient } from "@bonfhir/core/r4b";
import { buildFhirRestfulClientAdapter } from "@bonfhir/medplum/r4b";
import { MedplumClient } from "@medplum/core";
import { ListrTask } from "listr";

export interface MedplumClientOptions {
  medplumServerUrl: string;
  medplumClientId: string;
  medplumClientSecret: string;
}

export const InitializeClient: ListrTask<{
  options: MedplumClientOptions;
  client: FhirRestfulClient;
}> = {
  title: "Initialize client",
  task: async (ctx, task) => {
    task.title += `: ${ctx.options.medplumServerUrl}`;
    const medplum = new MedplumClient({
      baseUrl: ctx.options.medplumServerUrl,
      fetch: fetch,
    });
    await medplum.startClientLogin(
      ctx.options.medplumClientId,
      ctx.options.medplumClientSecret
    );

    ctx.client = buildFhirRestfulClientAdapter(medplum);
    await ctx.client.search("Patient");
    return;
  },
};
