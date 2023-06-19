import { JsonObject } from "langchain/tools";
import { getFHIR, minimizeFhirResponse } from "./fhirApi";

const practitionerId = "36d4fe4e-6f94-4222-95be-ad3420e3e6ee";

export type CurrentUser = {
  resourceType: "Practitioner";
  id: string;
  name: string;
  gender: string;
};

let currentUser: CurrentUser | undefined; // singleton for now

export async function getCurrentUser(): Promise<CurrentUser> {
  // singleton cached, can be called multiple times
  if (currentUser) return currentUser;

  const currentUserResponse = await getFHIR(
    `/Practitioner?_id=${practitionerId}`,
  );
  const minimizedCurrentUser = minimizeFhirResponse(
    "Practitioner",
    currentUserResponse as JsonObject,
  );

  let name = "";
  if (minimizedCurrentUser.name[0].title) {
    name += `${minimizedCurrentUser.name[0].title} `;
  }

  name += `${minimizedCurrentUser.name[0].given[0]} ${
    minimizedCurrentUser.name[0].family
  }`;

  currentUser = {
    resourceType: "Practitioner",
    id: minimizedCurrentUser.id,
    name,
    gender: minimizedCurrentUser.gender,
  };

  return currentUser;
}
