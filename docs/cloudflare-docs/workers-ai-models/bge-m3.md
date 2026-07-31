---
model_id: "@cf/baai/bge-m3"
title: "bge-m3"
task_type: "bge-m3 

Text Embeddings"
author: "BAAI"
context_window: "60,000 tokens"
pricing: "$0.012 per M input tokens"
capabilities:
  - Batch
---

# bge-m3

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/baai/bge-m3` |
| **Task Type** | bge-m3 

Text Embeddings |
| **Author** | BAAI |
| **Context Window** | 60,000 tokens |
| **Pricing** | $0.012 per M input tokens |
| **Capabilities** | Batch |

## Description

Multi-Functionality, Multi-Linguality, and Multi-Granularity embeddings model.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/baai/bge-m3", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/baai/bge-m3 \\
  -X POST \\
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \\
  -d '{ /* see input parameters below */ }'
```

## Input Parameters

> **Schema Title:** Input Query and Contexts

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `query` | `string` |  |  | minLength: 1 | A query you wish to perform against the provided contexts. If no query is provided the model with respond with embeddings for contexts |
| `contexts` | `array` | ✅ |  | items: object | List of provided contexts. Note that the index in this array is important, as the response will refer to it. |
| `truncate_inputs` | `boolean` |  | `false` |  | When provided with too long context should the model error out or truncate the context to fit? |

## Output Schema

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `request_id` | `string` |  |  |  | The async request id that can be used to obtain the results. |

## Raw API Schemas

### Synchronous Input Schema

```json
{
  "title": "Input Query and Contexts",
  "properties": {
    "query": {
      "type": "string",
      "minLength": 1,
      "description": "A query you wish to perform against the provided contexts. If no query is provided the model with respond with embeddings for contexts"
    },
    "contexts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "minLength": 1,
            "description": "One of the provided context content"
          }
        }
      },
      "description": "List of provided contexts. Note that the index in this array is important, as the response will refer to it."
    },
    "truncate_inputs": {
      "type": "boolean",
      "default": false,
      "description": "When provided with too long context should the model error out or truncate the context to fit?"
    }
  },
  "required": [
    "contexts"
  ]
}
```

### Synchronous Output Schema

```json
{
  "type": "object",
  "contentType": "application/json",
  "title": "Async response",
  "properties": {
    "request_id": {
      "type": "string",
      "description": "The async request id that can be used to obtain the results."
    }
  }
}
```

## Resources

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/bge-m3/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/baai/bge-m3)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
