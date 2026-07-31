---
model_id: "@cf/leonardo/phoenix-1.0"
title: "phoenix-1.0"
task_type: "0 

Text-to-Image"
author: "Leonardo"
pricing: "$0.0058 per 512 by 512 tile, $0.00011 per step"
license_url: "https://leonardo.ai/terms-of-service/"
---

# phoenix-1.0

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/leonardo/phoenix-1.0` |
| **Task Type** | 0 

Text-to-Image |
| **Author** | Leonardo |
| **Pricing** | $0.0058 per 512 by 512 tile, $0.00011 per step |
| **License** | [View License](https://leonardo.ai/terms-of-service/) |

## Description

Phoenix 1.0 is a model by Leonardo.Ai that generates images with exceptional prompt adherence and coherent text.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/leonardo/phoenix-1.0", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/leonardo/phoenix-1.0 \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/phoenix-1.0/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/leonardo/phoenix-1.0)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
