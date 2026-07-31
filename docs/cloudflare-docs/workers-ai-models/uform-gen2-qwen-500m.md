---
model_id: "@cf/unum/uform-gen2-qwen-500m"
title: "uform-gen2-qwen-500m"
task_type: "uform-gen2-qwen-500m Beta 

Image-to-Text"
author: "Unum"
deprecated: "5/30/2026"
capabilities:
  - Deprecated
  - Beta
---

# uform-gen2-qwen-500m

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/unum/uform-gen2-qwen-500m` |
| **Task Type** | uform-gen2-qwen-500m Beta 

Image-to-Text |
| **Author** | Unum |
| **Deprecated** | 5/30/2026 |
| **Capabilities** | Deprecated, Beta |

## Description

UForm-Gen is a small generative vision-language model primarily designed for Image Captioning and Visual Question Answering. The model was pre-trained on the internal image captioning dataset and fine-tuned on public instructions datasets: SVIT, LVIS, VQAs datasets.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/unum/uform-gen2-qwen-500m", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/unum/uform-gen2-qwen-500m \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/uform-gen2-qwen-500m/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/unum/uform-gen2-qwen-500m)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
