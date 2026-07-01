---
model_id: "@cf/huggingface/distilbert-sst-2-int8"
title: "distilbert-sst-2-int8"
task_type: "distilbert-sst-2-int8 

Text Classification"
author: "HuggingFace"
pricing: "$0.026 per M input tokens"
---

# distilbert-sst-2-int8

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/huggingface/distilbert-sst-2-int8` |
| **Task Type** | distilbert-sst-2-int8 

Text Classification |
| **Author** | HuggingFace |
| **Pricing** | $0.026 per M input tokens |

## Description

Distilled BERT model that was finetuned on SST-2 for sentiment classification

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/huggingface/distilbert-sst-2-int8", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/huggingface/distilbert-sst-2-int8 \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/distilbert-sst-2-int8/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/huggingface/distilbert-sst-2-int8)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
