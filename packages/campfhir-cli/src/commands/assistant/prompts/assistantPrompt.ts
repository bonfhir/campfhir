import { ZeroShotAgent } from "langchain/agents";

import { PromptTemplate } from "langchain/prompts";
import { Tool } from "langchain/tools";
import { type CurrentUser } from "../helpers/currentUser";

const INSTRUCTIONS = `** INSTRUCTIONS **
You are a medical assistant answering questions about medical data stored in a FHIR RESTful API server.
All questions should be answered in the context of the medical data stored in the FHIR RESTful API server.

The human asking the questions is:
name: {name}
gender: {gender}
resourceType: {resourceType}
id: {id}

You must use the FhirQuestion tool to answer questions about medical data stored in a FHIR RESTful API server.
For the Final Answer, You must summarize the FhirQuestion tool's response in the context of the users question.

The question input to the FhirQuestion tool should be the exact unmodified question from the user.
When going back & repeating any question, you must mention in the tools question input that the previous answer was wrong.

You have access to the following tools:`;
const ASSISTANT_PROMPT_SUFFIX = `{chat_history}

Question: {input}

Think before answering.  Only use the tools output as answers.  If the tools has no answer, then say "I don't know".
This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`;

export async function assistantPrompt(currentUser: CurrentUser, tools: Tool[]) {
  const instructionPrompt = new PromptTemplate({
    template: INSTRUCTIONS,
    inputVariables: ["name", "gender", "resourceType", "id"],
  });
  const prefix = await instructionPrompt.format(currentUser);

  return ZeroShotAgent.createPrompt(tools, {
    prefix,
    suffix: ASSISTANT_PROMPT_SUFFIX,
    inputVariables: ["input", "chat_history", "agent_scratchpad"],
  });
}
