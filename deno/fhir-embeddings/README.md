## FHIR embeddings

_To prepare the vectorstore embeddings to be used within the fhirman agent_

### Usage

```
deno task store-embeddings
```

### prerequisites

- fill the `.env` with proper secrets from 1pass
- prepare a `pg_vector` table to be used as a vectorstore, see [https://js.langchain.com/docs/modules/indexes/retrievers/supabase-hybrid](https://js.langchain.com/docs/modules/indexes/retrievers/supabase-hybrid)
