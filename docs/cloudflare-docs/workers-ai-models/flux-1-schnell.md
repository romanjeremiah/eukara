---
model_id: "@cf/black-forest-labs/flux-1-schnell"
title: "flux-1-schnell"
task_type: "flux-1-schnell 

Text-to-Image"
author: "Black Forest Labs"
pricing: "$0.000053 per 512 by 512 tile, $0.00011 per step"
license_url: "https://bfl.ai/legal/terms-of-service"
---

# flux-1-schnell

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/black-forest-labs/flux-1-schnell` |
| **Task Type** | flux-1-schnell 

Text-to-Image |
| **Author** | Black Forest Labs |
| **Pricing** | $0.000053 per 512 by 512 tile, $0.00011 per step |
| **License** | [View License](https://bfl.ai/legal/terms-of-service) |

## Description

FLUX.1 \

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-1-schnell \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/black-forest-labs/flux-1-schnell)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
