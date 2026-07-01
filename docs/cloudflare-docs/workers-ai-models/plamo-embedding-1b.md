---
model_id: "@cf/pfnet/plamo-embedding-1b"
title: "plamo-embedding-1b"
task_type: "plamo-embedding-1b 

Text Embeddings"
author: "pfnet"
pricing: "$0.019 per M input tokens"
---

# plamo-embedding-1b

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/pfnet/plamo-embedding-1b` |
| **Task Type** | plamo-embedding-1b 

Text Embeddings |
| **Author** | pfnet |
| **Pricing** | $0.019 per M input tokens |

## Description

PLaMo-Embedding-1B is a Japanese text embedding model developed by Preferred Networks, Inc. It can convert Japanese text input into numerical vectors and can be used for a wide range of applications, including information retrieval, text classification, and clustering.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/pfnet/plamo-embedding-1b", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/pfnet/plamo-embedding-1b \\
  -X POST \\
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \\
  -d '{ /* see input parameters below */ }'
```

## Input Parameters

No input schema available.

## Output Schema

No output schema available.

## Raw API Schemas

## Resources

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/plamo-embedding-1b/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/pfnet/plamo-embedding-1b)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
