---
model_id: "@cf/stabilityai/stable-diffusion-xl-base-1.0"
title: "stable-diffusion-xl-base-1.0"
task_type: "0 Beta 

Text-to-Image"
author: "Stability.ai"
pricing: "$0.00 per step"
license_url: "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md"
capabilities:
  - Beta
---

# stable-diffusion-xl-base-1.0

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/stabilityai/stable-diffusion-xl-base-1.0` |
| **Task Type** | 0 Beta 

Text-to-Image |
| **Author** | Stability.ai |
| **Pricing** | $0.00 per step |
| **License** | [View License](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md) |
| **Capabilities** | Beta |

## Description

Diffusion-based text-to-image generative model by Stability AI. Generates and modify images based on text prompts.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0 \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-base-1.0/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/stabilityai/stable-diffusion-xl-base-1.0)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
