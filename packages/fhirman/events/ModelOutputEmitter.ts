import { EventEmitter } from "node:events";

export const MODEL_OUTPUT_EVENT = "modelOutput";
export class ModelOutputEmitter extends EventEmitter {}

