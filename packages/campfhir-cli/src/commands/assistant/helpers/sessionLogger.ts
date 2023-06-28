// this helper function is used to log the session to a file
// when initialized. the logger opens a file, named to the current timestamp and write to it
// it is implemented using the singleton pattern

import { createWriteStream, WriteStream } from "fs";

const projectRoot = Deno.env.get("PROJECT_CWD");
const basePath = `${projectRoot}/sessions/`;

export class SessionLogger {
  private static instance: SessionLogger;
  private stream: WriteStream;

  private constructor(sessionParams: Record<string, unknown>) {
    const fileName = `${basePath}FhirAssistant_${new Date().getTime()}.log`;
    this.stream = createWriteStream(fileName);

    this.log("Session started at: " + new Date().toISOString());
    this.log("Session params:");
    this.log(JSON.stringify(sessionParams, null, 2));
    this.separator();
  }

  public log(message: string, ...extra: any[]) {
    let text = message;
    if (extra.length > 0) {
      text += " " + JSON.stringify(extra, null, 2);
    }
    this.stream.write(text + "\n");
  }

  public separator() {
    this.log("----------------------------------------------------");
  }

  public static init(sessionParams: object) {
    SessionLogger.instance = new SessionLogger(sessionParams);
  }

  public static log(message: string, ...extra: any[]) {
    SessionLogger.instance.log(message, ...extra);
  }

  public static logQuestion(question: string) {
    SessionLogger.instance.log("Question: " + question);
    SessionLogger.instance.separator();
  }

  public static logAnswer(answer: string) {
    SessionLogger.instance.separator();
    SessionLogger.instance.log("Answer: " + answer);
  }

  public static separator() {
    SessionLogger.instance.separator();
  }
}
