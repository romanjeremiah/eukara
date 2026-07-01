---
model_id: "@cf/bytedance/stable-diffusion-xl-lightning"
title: "stable-diffusion-xl-lightning"
task_type: "stable-diffusion-xl-lightning Beta 

Text-to-Image"
author: "ByteDance"
pricing: "$0.00 per step"
capabilities:
  - Beta
---

# stable-diffusion-xl-lightning

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/bytedance/stable-diffusion-xl-lightning` |
| **Task Type** | stable-diffusion-xl-lightning Beta 

Text-to-Image |
| **Author** | ByteDance |
| **Pricing** | $0.00 per step |
| **Capabilities** | Beta |

## Description

SDXL-Lightning is a lightning-fast text-to-image generation model. It can generate high-quality 1024px images in a few steps.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/bytedance/stable-diffusion-xl-lightning", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/bytedance/stable-diffusion-xl-lightning \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-lightning/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/bytedance/stable-diffusion-xl-lightning)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
