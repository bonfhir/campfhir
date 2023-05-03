import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseHybridSearch } from "langchain/retrievers/supabase";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import prompts from "prompts";

import * as fs from "fs";

import { CommandModule } from "yargs";

function compileSearchParamsByResources(searchParamsSpec: any) {
  const searchParamsByResources: any = {};
  searchParamsSpec.entry.forEach((entry: any) => {
    const resource = entry.resource;
    [...resource.base, ...(resource.target || [])].forEach(
      (resourceType: string) => {
        if (!searchParamsByResources[resourceType]) {
          searchParamsByResources[resourceType] = [];
        }
        const {
          code,
          type,
          expression,
          description,
          xpath,
          xpathUsage,
          base,
          comparator,
          target,
        } = resource;

        const searchParams = {
          code,
          type,
          expression,
          description,
          xpath,
          xpathUsage,
          base,
        };
        if (comparator) searchParams["comparator"] = comparator;
        if (target && target.includes(resourceType))
          searchParams["target"] = [resourceType];

        searchParamsByResources[resourceType].push(searchParams);
      }
    );
  });

  console.log(searchParamsByResources["Patient"]);
  console.log(JSON.stringify(searchParamsByResources["Patient"]).length);
  return searchParamsByResources;
}

function compileSearchParamsByBase(searchParamsSpec: any) {
  const searchParamsByBase: any = {};
  searchParamsSpec.entry.forEach((entry: any) => {
    const resource = entry.resource;
    resource.base.forEach((resourceType: string) => {
      if (!searchParamsByBase[resourceType]) {
        searchParamsByBase[resourceType] = {};
      }
      const {
        id,
        code,
        type,
        expression,
        description,
        xpath,
        xpathUsage,
        base,
        comparator,
        target,
      } = resource;

      const searchParams = {
        id,
        code,
        type,
        expression,
        description,
        xpath,
        xpathUsage,
        base,
      };

      if (comparator) searchParams["comparator"] = comparator;
      if (target) searchParams["target"] = target;

      searchParamsByBase[resourceType][code] = searchParams;
    });
  });

  return searchParamsByBase;
}

function compileSearchParamsById(searchParamsSpec: any) {
  const searchParamsById: any = {};
  searchParamsSpec.entry.forEach((entry: any) => {
    const resource = entry.resource;

    const {
      id,
      code,
      type,
      expression,
      description,
      xpath,
      xpathUsage,
      base,
      comparator,
      target, // skipped, too many chars, not useful?
    } = resource;

    const searchParams = {
      code,
      type,
      expression,
      description,
      xpath,
      xpathUsage,
      base,
    };

    if (comparator) searchParams["comparator"] = comparator;

    searchParamsById[id] = searchParams;
  });

  return searchParamsById;
}

function compileSearchParamsDocuments(searchParamsSpec: any): Document[] {
  const docs: Document[] = [];
  searchParamsSpec.entry.forEach((entry: any) => {
    const resource = entry.resource;
    [...resource.base, ...(resource.target || [])].forEach((resourceType) => {
      const base = resource.base[0];
      const target = base == resourceType ? null : resourceType;
      if (target === null && resource.target) return; // this param works with targets, skip

      const targetString = target === null ? "" : ` (${target})`;
      const param: string = resource.code;
      docs.push(
        new Document({
          pageContent: `[${base}:${param}${targetString}]: ${resource.description}`,
          metadata: {
            id: resource.id,
            target,
            base,
            param,
          },
        })
      );
    });
  });
  return docs;
}

async function newRetriever(client: SupabaseClient) {
  return new SupabaseHybridSearch(new OpenAIEmbeddings(), {
    client,
    tableName: "documents",
    similarityQueryName: "match_documents",
    keywordQueryName: "kw_match_documents",
    similarityK: 10,
    keywordK: 10,
  });
}

async function createEmbeddings(
  client: SupabaseClient,
  docs: Document[],
  tableName: string,
  queryName: string
) {
  await SupabaseVectorStore.fromDocuments(docs, new OpenAIEmbeddings(), {
    client,
    tableName,
    queryName,
  });
}

export default <CommandModule>{
  command: "embed",
  describe: "Creates ML embeddings for a FHIR API",
  handler: async (_options) => {
    dotenv.config(); // OpenAI + Medplum config from .env file

    const jsonText = fs.readFileSync(
      "/workspace/data/fhir-r4b-search-parameters.json",
      "utf8"
    );
    const searchParamsSpec = JSON.parse(jsonText);

    const client = createClient(
      process.env.PUBLIC_SUPABASE_URL || "",
      process.env.PUBLIC_SUPABASE_ANON_KEY || ""
    );

    const byId = compileSearchParamsById(searchParamsSpec);
    const byBase = compileSearchParamsByBase(searchParamsSpec);

    const docs = compileSearchParamsDocuments(searchParamsSpec);
    //console.log(docs);
    //await createEmbeddings(client, docs, "documents", "match_documents");

    // const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    // const response = await chain.call({
    //   query: "What are the search filters for FHIR Patient?",
    // });

    // const response = await prompts({
    //   type: "text",
    //   name: "input",
    //   message: "Enter a FHIR URL",
    // });

    const retriever = await newRetriever(client);
    for (;;) {
      // loop until exit/quit
      const prompt = await prompts({
        type: "text",
        name: "question",
        message: "💬",
      });

      if (["quit", "exit"].includes(prompt.question)) {
        console.log("\nbye-bye 👋\n");
        process.exit(0); // exit on exit or quit
      }

      try {
        // const chain = await newRetrievalChain(client);
        // const response = await chain.call({
        //   query: prompt.question,
        // });

        console.log("retriever: ", retriever);
        console.log("question: ", prompt.question);
        const response = await retriever.getRelevantDocuments(prompt.question);

        console.log({ response });

        response.forEach((doc: Document) => {
          console.log(doc.metadata.id);
          console.log(doc.pageContent);
          console.log(byId[doc.metadata.id]);
        });

        const classes = [
          ...new Set(
            response
              .map((doc: Document) => {
                const { base, target } = doc.metadata;
                return [base, target];
              })
              .flat()
              .filter((x: any) => x)
          ),
        ];
        console.log("classes: ", classes);

        classes.forEach((resourceType: string) => {
          console.log(resourceType);
          const searchParams = byBase[resourceType];
          console.log(Object.keys(searchParams));
        });
      } catch (error) {
        console.log("error response: ", error);
        // return;
      }
    }
  },
};

// TODO:
// put the json store in a toolkit with store using tools
// move the FHIR API tool to the FHIR URL tool with response testing logic
// log session automatically to a file
// current user tool
// feed the prompt
// instruct the summarizer on FHIR bundle basics