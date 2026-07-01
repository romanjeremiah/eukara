---
model_id: "@cf/facebook/detr-resnet-50"
title: "detr-resnet-50"
task_type: "detr-resnet-50 Beta 

Object Detection"
author: "Meta"
pricing: "$0.0000075 per inference request"
capabilities:
  - Beta
---

# detr-resnet-50

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/facebook/detr-resnet-50` |
| **Task Type** | detr-resnet-50 Beta 

Object Detection |
| **Author** | Meta |
| **Pricing** | $0.0000075 per inference request |
| **Capabilities** | Beta |

## Description

DEtection TRansformer (DETR) model trained end-to-end on COCO 2017 object detection (118k annotated images).

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/facebook/detr-resnet-50", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/facebook/detr-resnet-50 \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/detr-resnet-50/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/facebook/detr-resnet-50)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
