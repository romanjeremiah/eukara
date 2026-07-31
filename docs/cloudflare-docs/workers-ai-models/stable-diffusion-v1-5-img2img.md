---
model_id: "@cf/runwayml/stable-diffusion-v1-5-img2img"
title: "stable-diffusion-v1-5-img2img"
task_type: "stable-diffusion-v1-5-img2img Beta 

Text-to-Image"
author: "RunwayML"
pricing: "$0.00 per step"
license_url: "https://github.com/runwayml/stable-diffusion/blob/main/LICENSE"
capabilities:
  - Beta
---

# stable-diffusion-v1-5-img2img

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/runwayml/stable-diffusion-v1-5-img2img` |
| **Task Type** | stable-diffusion-v1-5-img2img Beta 

Text-to-Image |
| **Author** | RunwayML |
| **Pricing** | $0.00 per step |
| **License** | [View License](https://github.com/runwayml/stable-diffusion/blob/main/LICENSE) |
| **Capabilities** | Beta |

## Description

Stable Diffusion is a latent text-to-image diffusion model capable of generating photo-realistic images. Img2img generate a new image from an input image with Stable Diffusion.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/runwayml/stable-diffusion-v1-5-img2img", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-img2img/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/runwayml/stable-diffusion-v1-5-img2img)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
