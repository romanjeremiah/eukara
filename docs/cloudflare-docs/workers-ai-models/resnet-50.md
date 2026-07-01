---
model_id: "@cf/microsoft/resnet-50"
title: "resnet-50"
task_type: "resnet-50 

Image Classification"
author: "Microsoft"
pricing: "$0.0000025 per inference request"
---

# resnet-50

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/microsoft/resnet-50` |
| **Task Type** | resnet-50 

Image Classification |
| **Author** | Microsoft |
| **Pricing** | $0.0000025 per inference request |

## Description

50 layers deep image classification CNN trained on more than 1M images from ImageNet

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/microsoft/resnet-50", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/microsoft/resnet-50 \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/resnet-50/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/microsoft/resnet-50)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
