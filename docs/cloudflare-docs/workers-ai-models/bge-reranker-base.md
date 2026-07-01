---
model_id: "@cf/baai/bge-reranker-base"
title: "bge-reranker-base"
task_type: "bge-reranker-base 

Text Classification"
author: "BAAI"
pricing: "$0.0031 per M input tokens"
---

# bge-reranker-base

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/baai/bge-reranker-base` |
| **Task Type** | bge-reranker-base 

Text Classification |
| **Author** | BAAI |
| **Pricing** | $0.0031 per M input tokens |

## Description

Different from embedding model, reranker uses question and document as input and directly output similarity instead of embedding. You can get a relevance score by inputting query and passage to the reranker. And the score can be mapped to a float value in \

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/baai/bge-reranker-base", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/baai/bge-reranker-base \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/bge-reranker-base/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/baai/bge-reranker-base)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
