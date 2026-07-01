---
model_id: "@cf/google/embeddinggemma-300m"
title: "embeddinggemma-300m"
task_type: "embeddinggemma-300m 

Text Embeddings"
author: "Google"
---

# embeddinggemma-300m

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/google/embeddinggemma-300m` |
| **Task Type** | embeddinggemma-300m 

Text Embeddings |
| **Author** | Google |

## Description

EmbeddingGemma is a 300M parameter, state-of-the-art for its size, open embedding model from Google, built from Gemma 3 (with T5Gemma initialization) and the same research and technology used to create Gemini models. EmbeddingGemma produces vector representations of text, making it well-suited for search and retrieval tasks, including classification, clustering, and semantic similarity search. This model was trained with data in 100+ spoken languages.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/google/embeddinggemma-300m", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/google/embeddinggemma-300m \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/embeddinggemma-300m/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/google/embeddinggemma-300m)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
