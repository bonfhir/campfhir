import { Interaction, Message, Sender } from "../types/conversation.ts";

/*
 * An interaction represents a pair of messages: the message from the user, and the last message returned
 * by the agent. We need to extract interactions because we don't want to show every message from the
 * agent, but instead just the final message.
 */
export function extractInteractions(
  conversation: Array<Message>,
): Array<Interaction> {
  let currentUserMessage: Message | undefined;
  let currentAgentMessage: Message | undefined;
  const interactions: Array<Interaction> = [];

  conversation.forEach((message: Message) => {
    if (message.sender === Sender.Assistant) {
      currentAgentMessage = message;
      return;
    }

    if (message.sender !== Sender.User) {
      throw Error(
        "Invalid state - the only possible Sender type should be User",
      );
    }

    if (currentUserMessage) {
      interactions.push({
        userMessage: currentUserMessage,
        agentMessage: currentAgentMessage,
      });
      currentAgentMessage = undefined;
      currentUserMessage = undefined;
    }

    currentUserMessage = message;
  });

  if (currentUserMessage) {
    interactions.push({
      userMessage: currentUserMessage,
      agentMessage: currentAgentMessage,
    });
  }

  return interactions;
}
