---
model_id: "@cf/qwen/qwen3-embedding-0.6b"
title: "qwen3-embedding-0.6b"
task_type: "6b 

Text Embeddings"
author: "Qwen"
context_window: "8,192 tokens"
pricing: "$0.012 per M input tokens"
---

# qwen3-embedding-0.6b

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/qwen/qwen3-embedding-0.6b` |
| **Task Type** | 6b 

Text Embeddings |
| **Author** | Qwen |
| **Context Window** | 8,192 tokens |
| **Pricing** | $0.012 per M input tokens |

## Description

The Qwen3 Embedding model series is the latest proprietary model of the Qwen family, specifically designed for text embedding and ranking tasks.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/qwen/qwen3-embedding-0.6b", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/qwen/qwen3-embedding-0.6b \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/qwen3-embedding-0.6b/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/qwen/qwen3-embedding-0.6b)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
