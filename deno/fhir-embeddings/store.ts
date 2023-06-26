import * as fs from "fs";
import "https://deno.land/std@0.192.0/dotenv/load.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

import { Document } from "https://esm.sh/langchain/document";
import { OpenAIEmbeddings } from "https://esm.sh/langchain/embeddings/openai";
import { SupabaseVectorStore } from "https://esm.sh/langchain/vectorstores/supabase";

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

console.log("Loading FHIR search parameters spec...");
const jsonText = fs.readFileSync(
  "/workspace/data/fhir-r4b-search-parameters.json",
  "utf8"
);
const searchParamsSpec = JSON.parse(jsonText);

const client = createClient(
  Deno.env.get("PUBLIC_SUPABASE_URL") || "",
  Deno.env.get("PUBLIC_SUPABASE_ANON_KEY") || ""
);

const docs = compileSearchParamsDocuments(searchParamsSpec);
console.log("Loaded ${docs.length} documents.");
console.log(docs);

console.log("Creating embeddings...");

const result = await createEmbeddings(
  client,
  docs,
  "documents",
  "match_documents"
);
console.log("CREATED: ", result);
