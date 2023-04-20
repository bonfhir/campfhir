import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { OpenAI } from "langchain";
import { RetrievalQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { SupabaseVectorStore } from "langchain/vectorstores";

import * as fs from "fs";

import { CommandModule } from "yargs";

export default <CommandModule>{
  command: "embed",
  describe: "Creates ML embeddings for a FHIR API",
  handler: async (_options) => {
    dotenv.config(); // OpenAI + Medplum config from .env file

    const client = createClient(
      process.env.PUBLIC_SUPABASE_URL,
      process.env.PUBLIC_SUPABASE_ANON_KEY
    );
    const model = new OpenAI({ temperature: 0 });
    const text = fs.readFileSync("/workspace/data/fhirsearch.txt", "utf8");

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });
    const docs = await textSplitter.createDocuments([text]);

    const vectorStore = await SupabaseVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      }
    );

    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    const response = await chain.call({
      query: "What are the search filters for FHIR Patient?",
    });

    // const response = await prompts({
    //   type: "text",
    //   name: "input",
    //   message: "Enter a FHIR URL",
    // });

    console.log({ response });
  },
};
