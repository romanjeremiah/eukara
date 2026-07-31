---
model_id: "@cf/lykon/dreamshaper-8-lcm"
title: "dreamshaper-8-lcm"
task_type: "dreamshaper-8-lcm 

Text-to-Image"
author: "lykon"
---

# dreamshaper-8-lcm

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/lykon/dreamshaper-8-lcm` |
| **Task Type** | dreamshaper-8-lcm 

Text-to-Image |
| **Author** | lykon |

## Description

Stable Diffusion model that has been fine-tuned to be better at photorealism without sacrificing range.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/lykon/dreamshaper-8-lcm", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/lykon/dreamshaper-8-lcm \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/dreamshaper-8-lcm/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/lykon/dreamshaper-8-lcm)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
