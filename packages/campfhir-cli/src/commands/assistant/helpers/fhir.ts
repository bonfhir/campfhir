import { FhirRestfulClient } from "@bonfhir/core/r4b";
import { buildFhirRestfulClientAdapter } from "@bonfhir/medplum/r4b";
import { MedplumClient } from "@medplum/core";

let medplum: MedplumClient;
async function medplumClient(): Promise<MedplumClient> {
  if (medplum === undefined) {
    medplum = new MedplumClient({
      baseUrl: "http://medplum:8103",
      fetch: fetch,
    });

    await medplum.startClientLogin(
      process.env.MEDPLUM_CLIENT_ID!,
      process.env.MEDPLUM_CLIENT_SECRET!
    );
  }

  return medplum;
}

let client: FhirRestfulClient;
function fhirClient(medplum: MedplumClient): FhirRestfulClient {
  if (client === undefined) {
    client = buildFhirRestfulClientAdapter(medplum);
  }

  return client;
}

export async function getFHIR(urlPath: string) {
  const medplum = await medplumClient();
  const client = fhirClient(medplum);

  const fhirURL = medplum.fhirUrl(urlPath.replace(/^\/+/, ""));

  const searchSet = await client.get(fhirURL);
  return searchSet;
}
