export const MOCK_THOUGHT_ACTIONS = [
  {
    source: "FHIR Assistant agent x FhirQuestion tool",
    thoughtsActions: [
      "Thought: I need to use the FhirQuestion tool to answer this question",
      "Action: FhirQuestion",
      "Action Input: How many female patients were born before 1977",
    ],
  },
  {
    source: "FhirQuestion agent x KnownEndpoints tool",
    thoughtsActions: [
      "Thought: I need to find the ENDPOINT & PARAMETERs that would be used to query FHIR API Server to answer the question.",
      "Action: KnownEndpoints",
      "Action Input: How many female patients were born before 1977",
    ],
  },
  {
    source: "FhirQuestion agent x EndpointParams tool",
    thoughtsActions: [
      "I need to find the ENDPOINT that is most relevant to the question.",
      "Action: EndpointParams",
      "Action Input: Patient",
    ],
  },
  {
    source: "FhirQuestion agent x EndpointParams tool",
    thoughtsActions: [
      "I need to find the ENDPOINT that is most relevant to the question.",
      "Action: EndpointParams",
      "Action Input: Patient",
    ],
  },
  {
    source: "FhirQuestion agent x EndpointParams tool",
    thoughtsActions: [
      "I need to compare the FhirAPIExamples tool examples to find the input to the FhirAPIServer tool.",
      "Action: FhirAPIExamples",
      "Action Input: Patient",
    ],
  },
  {
    source: "FhirQuestion agent x CurrentDateTime tool",
    thoughtsActions: [
      "I need to use the CurrentDateTime tool to find the current date & time if needed.",
      "Action: CurrentDateTime",
      "Action Input: N/A",
    ],
  },
  {
    source: "FhirQuestion agent x DateFormat tool",
    thoughtsActions: [
      "I need to format any date PARAMETER value using the DateFormat tool.",
      "Action: DateFormat",
      "Action Input: 1977-01-01",
    ],
  },
  {
    source: "FhirQuestion agent x FhirAPIServer tool",
    thoughtsActions: [
      "I need to use the FhirAPIServer tool with the ENDPOINT & PARAMETERS to get the API resources.",
      "Action: FhirAPIServer",
      `Action Input: {"endpoint":"Patient","params":{"_summary":"count","gender":"female","birthdate":"lt1977-01-01"}}`,
    ],
  },
  {
    source: "FhirQuestion agent",
    thoughtsActions: [
      "I now know the final answer",
      "Final Answer: There are 287 female patients born before 1977.",
    ],
  },
  {
    source: "FHIR Assistant agent",
    thoughtsActions: [
      "I now know the final answer",
      "Final Answer: There are 287 female patients born before 1977.",
    ],
  },
];
