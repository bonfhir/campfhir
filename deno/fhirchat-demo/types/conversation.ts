export enum Sender {
  User = "User",
  Assistant = "Assistant",
}

export type Message = {
  id: string;
  sender: Sender;
  message: string;
  iconPath: string | null;
};

export type Interaction = {
  userMessage: Message;
  agentMessage?: Message;
};

export type Thought = {
  source: string;
  thoughtsActions: Array<string>;
};
