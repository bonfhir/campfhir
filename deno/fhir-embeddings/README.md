## FHIR embeddings

_To prepare the vectorstore embeddings to be used within the fhirman agent_

### Usage

```
deno task store-embeddings
```

### prerequisites

- fill the `.env` with proper secrets from
  [1pass](https://start.1password.com/open/i?a=6LHIVNWALFHBVLMTD4JD4PACSM&v=d2nlsaomvnbsnl2ks6zq3mq4ae&i=ewmlo7rbrnb63mldlwedpyrmby&h=alleycorpnord.1password.com)
- prepare a `pg_vector` table to be used as a vectorstore, see
  [https://js.langchain.com/docs/modules/indexes/retrievers/supabase-hybrid](https://js.langchain.com/docs/modules/indexes/retrievers/supabase-hybrid)
