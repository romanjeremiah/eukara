---
model_id: "@cf/runwayml/stable-diffusion-v1-5-inpainting"
title: "stable-diffusion-v1-5-inpainting"
task_type: "stable-diffusion-v1-5-inpainting Beta 

Text-to-Image"
author: "RunwayML"
pricing: "$0.00 per step"
license_url: "https://github.com/runwayml/stable-diffusion/blob/main/LICENSE"
capabilities:
  - Beta
---

# stable-diffusion-v1-5-inpainting

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/runwayml/stable-diffusion-v1-5-inpainting` |
| **Task Type** | stable-diffusion-v1-5-inpainting Beta 

Text-to-Image |
| **Author** | RunwayML |
| **Pricing** | $0.00 per step |
| **License** | [View License](https://github.com/runwayml/stable-diffusion/blob/main/LICENSE) |
| **Capabilities** | Beta |

## Description

Stable Diffusion Inpainting is a latent text-to-image diffusion model capable of generating photo-realistic images given any text input, with the extra capability of inpainting the pictures by using a mask.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/runwayml/stable-diffusion-v1-5-inpainting", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/runwayml/stable-diffusion-v1-5-inpainting \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-inpainting/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/runwayml/stable-diffusion-v1-5-inpainting)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
