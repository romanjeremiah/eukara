---
model_id: "@cf/black-forest-labs/flux-2-klein-4b"
title: "flux-2-klein-4b"
task_type: "flux-2-klein-4b 

Text-to-Image"
author: "Black Forest Labs"
pricing: "$0.000059 per input 512x512 tile, $0.000287 per output 512x512 tile"
license_url: "https://bfl.ai/legal/terms-of-service"
---

# flux-2-klein-4b

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/black-forest-labs/flux-2-klein-4b` |
| **Task Type** | flux-2-klein-4b 

Text-to-Image |
| **Author** | Black Forest Labs |
| **Pricing** | $0.000059 per input 512x512 tile, $0.000287 per output 512x512 tile |
| **License** | [View License](https://bfl.ai/legal/terms-of-service) |

## Description

FLUX.2 \

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/black-forest-labs/flux-2-klein-4b", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-2-klein-4b \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/black-forest-labs/flux-2-klein-4b)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
