import { FhirRestfulClient } from "@bonfhir/core/r4b";
import { buildFhirRestfulClientAdapter } from "@bonfhir/medplum/r4b";
import { MedplumClient } from "@medplum/core";

import { JsonObject } from "langchain/tools";

const RESOURCE_KEYS = {
  patient: [
    "resourceType",
    "id",
    "name",
    "telecom",
    "gender",
    "birthDate",
    "deceasedDateTime",
    "address",
    "maritalStatus",
  ],
  practitioner: [
    "resourceType",
    "id",
    "active",
    "name",
    "telecom",
    "gender",
    "address",
  ],
};

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

export function minimizeFhirResponse(endpoint: string, response: JsonObject) {
  let result: any;
  if (response.resourceType == "Bundle" && response.entry?.length === 1) {
    result = filterByResourceKeys(response.entry[0].resource, endpoint);
  } else if (response.id) {
    result = filterByResourceKeys(response, endpoint);
  } else {
    result = response;
  }
  return result;
}

function filterByResourceKeys(
  resource: JsonObject,
  endpoint: string
): JsonObject {
  const resourceKeys = RESOURCE_KEYS[endpoint.toLowerCase()];
  if (!resourceKeys) {
    throw new Error(`No resource keys for endpoint: ${endpoint}`);
  }

  return Object.fromEntries(
    Object.entries(resource).filter(([key, _value]) =>
      resourceKeys.includes(key)
    )
  );
}
