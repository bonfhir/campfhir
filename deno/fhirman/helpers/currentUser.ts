import { getFHIR, minimizeFhirResponse } from "./fhirApi/index.ts";

const practitionerId = "36d4fe4e-6f94-4222-95be-ad3420e3e6ee";

export type CurrentUser = {
  resourceType: "Practitioner";
  id: string;
  name: string;
  gender: string;
};

type UserResponseBundle = {
  resourceType: "Practitioner";
  id: string;
  gender: string;
  name: UserName[];
};

type UserName = {
  title: string;
  family: string;
  given: string[];
};

let currentUser: CurrentUser | undefined; // singleton for now

export async function getCurrentUser(): Promise<CurrentUser> {
  // singleton cached, can be called multiple times
  if (currentUser) return currentUser;

  const currentUserResponse = await getFHIR(
    `/Practitioner?_id=${practitionerId}`
  );
  const minimizedCurrentUser = minimizeFhirResponse(
    "Practitioner",
    currentUserResponse
  ) as UserResponseBundle;

  let name = "";
  const currentUserName = minimizedCurrentUser.name;

  if (currentUserName) {
    if (currentUserName[0].title) {
      name += `${currentUserName[0].title} `;
    }

    name += `${currentUserName[0].given[0]} ${currentUserName[0].family}`;
  }

  currentUser = {
    resourceType: "Practitioner",
    id: minimizedCurrentUser.id,
    name,
    gender: minimizedCurrentUser.gender,
  };

  return currentUser;
}
