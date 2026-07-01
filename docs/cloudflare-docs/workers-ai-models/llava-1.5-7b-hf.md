---
model_id: "@cf/llava-hf/llava-1.5-7b-hf"
title: "llava-1.5-7b-hf"
task_type: "5-7b-hf Beta 

Image-to-Text"
author: "llava-hf"
capabilities:
  - Beta
---

# llava-1.5-7b-hf

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/llava-hf/llava-1.5-7b-hf` |
| **Task Type** | 5-7b-hf Beta 

Image-to-Text |
| **Author** | llava-hf |
| **Capabilities** | Beta |

## Description

LLaVA is an open-source chatbot trained by fine-tuning LLaMA/Vicuna on GPT-generated multimodal instruction-following data. It is an auto-regressive language model, based on the transformer architecture.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/llava-hf/llava-1.5-7b-hf \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/llava-1.5-7b-hf/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/llava-hf/llava-1.5-7b-hf)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
