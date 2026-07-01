---
model_id: "@cf/baai/bge-large-en-v1.5"
title: "bge-large-en-v1.5"
task_type: "5 

Text Embeddings"
author: "BAAI"
pricing: "$0.20 per M input tokens"
capabilities:
  - Batch
---

# bge-large-en-v1.5

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/baai/bge-large-en-v1.5` |
| **Task Type** | 5 

Text Embeddings |
| **Author** | BAAI |
| **Pricing** | $0.20 per M input tokens |
| **Capabilities** | Batch |

## Description

BAAI general embedding (Large) model that transforms any given text into a 1024-dimensional vector

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/baai/bge-large-en-v1.5", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/baai/bge-large-en-v1.5 \\
  -X POST \\
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \\
  -d '{ /* see input parameters below */ }'
```

## Input Parameters

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `text` | `object` | ✅ |  |  |  |
| `pooling` | `string` |  | `"mean"` | enum: [mean, cls] | The pooling method used in the embedding process. `cls` pooling will generate more accurate embeddings on larger inputs - however, embeddings created with cls pooling are not compatible with embeddings generated with mean pooling. The default pooling method is `mean` in order for this to not be a breaking change, but we highly suggest using the new `cls` pooling for better accuracy. |

## Output Schema

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `shape` | `array` |  |  | items: number |  |
| `data` | `array` |  |  | items: array | Embeddings of the requested text values |
| `pooling` | `string` |  |  | enum: [mean, cls] | The pooling method used in the embedding process. |

## Raw API Schemas

### Synchronous Input Schema

```json
{
  "properties": {
    "text": {
      "oneOf": [
        {
          "type": "string",
          "description": "The text to embed",
          "minLength": 1
        },
        {
          "type": "array",
          "description": "Batch of text values to embed",
          "items": {
            "type": "string",
            "description": "The text to embed",
            "minLength": 1
          },
          "maxItems": 100
        }
      ]
    },
    "pooling": {
      "type": "string",
      "enum": [
        "mean",
        "cls"
      ],
      "default": "mean",
      "description": "The pooling method used in the embedding process. `cls` pooling will generate more accurate embeddings on larger inputs - however, embeddings created with cls pooling are not compatible with embeddings generated with mean pooling. The default pooling method is `mean` in order for this to not be a breaking change, but we highly suggest using the new `cls` pooling for better accuracy."
    }
  },
  "required": [
    "text"
  ]
}
```

### Synchronous Output Schema

```json
{
  "type": "object",
  "contentType": "application/json",
  "properties": {
    "shape": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "data": {
      "type": "array",
      "description": "Embeddings of the requested text values",
      "items": {
        "type": "array",
        "description": "Floating point embedding representation shaped by the embedding model",
        "items": {
          "type": "number"
        }
      }
    },
    "pooling": {
      "type": "string",
      "enum": [
        "mean",
        "cls"
      ],
      "description": "The pooling method used in the embedding process."
    }
  }
}
```

## Resources

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/bge-large-en-v1.5/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/baai/bge-large-en-v1.5)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
