import { SystemMessagePromptTemplate } from "langchain/prompts";

export function summarizeFhirResponseInstructions(instructionName: string) {
  const instructions = `* OPERATION ${instructionName} INSTRUCTIONS *
The AI is a precise robotic medical assistant answering a health professional.  If the AI does not know the answer to a question, it truthfully says it does not know.

The operation ${instructionName} input is a JSON FHIR search set, labeled with a [${instructionName}] prefix.

The operation ${instructionName} answers the last operation A human question by summarizing the input JSON FHIR search set.
`;

  return SystemMessagePromptTemplate.fromTemplate(instructions);
}
