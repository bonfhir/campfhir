import { FhirRestfulClient } from "@bonfhir/core/r4b";
import { buildFhirRestfulClientAdapter } from "@bonfhir/medplum/r4b";
import { MedplumClient } from "@medplum/core";
import fetch from "npm:node-fetch";

import { type ResourceName, RESOURCE_KEYS } from "./resourceKeys.ts";

type FHIRResource = {
  resourceType: string;
  id: string;
};
type ResponseEntry = {
  resource: FHIRResource;
};
type ResponseBundle = {
  resourceType: string;
  id?: string;
  resource?: FHIRResource;
  entry: ResponseEntry[];
};

let medplum: MedplumClient;
async function medplumClient(): Promise<MedplumClient> {
  if (medplum === undefined) {
    medplum = new MedplumClient({
      baseUrl: "http://medplum:8103",
      fetch: fetch,
    });

    await medplum.startClientLogin(
      Deno.env.get("MEDPLUM_CLIENT_ID") || "",
      Deno.env.get("MEDPLUM_CLIENT_SECRET") || ""
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

export async function getFHIR(urlPath: string): Promise<ResponseBundle> {
  const medplum = await medplumClient();
  const client = fhirClient(medplum);

  const fhirURL = medplum.fhirUrl(urlPath.replace(/^\/+/, ""));

  const searchSet = await client.get(fhirURL);
  return searchSet as ResponseBundle;
}

export function minimizeFhirResponse(
  endpoint: string,
  response: ResponseBundle
): FHIRResource {
  let result: FHIRResource;
  if (response.resourceType == "Bundle" && response.entry?.length === 1) {
    result = filterByResourceKeys(
      response.entry[0].resource,
      endpoint.toLowerCase() as ResourceName
    );
  } else if (response.id) {
    result = filterByResourceKeys(
      response as FHIRResource,
      endpoint.toLowerCase() as ResourceName
    );
  } else {
    result = response as FHIRResource;
  }
  return result;
}

function filterByResourceKeys(
  resource: FHIRResource,
  endpoint: ResourceName
): FHIRResource {
  const resourceKeys = RESOURCE_KEYS[endpoint];
  if (!resourceKeys) {
    throw new Error(`No resource keys for endpoint: ${endpoint}`);
  }

  return Object.fromEntries(
    Object.entries(resource).filter(([key, _value]) =>
      resourceKeys.includes(key)
    )
  ) as FHIRResource;
}
