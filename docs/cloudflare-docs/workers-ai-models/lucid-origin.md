---
model_id: "@cf/leonardo/lucid-origin"
title: "lucid-origin"
task_type: "lucid-origin 

Text-to-Image"
author: "Leonardo"
pricing: "$0.007 per 512 by 512 tile, $0.00013 per step"
license_url: "https://leonardo.ai/terms-of-service/"
---

# lucid-origin

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/leonardo/lucid-origin` |
| **Task Type** | lucid-origin 

Text-to-Image |
| **Author** | Leonardo |
| **Pricing** | $0.007 per 512 by 512 tile, $0.00013 per step |
| **License** | [View License](https://leonardo.ai/terms-of-service/) |

## Description

Lucid Origin from Leonardo.AI is their most adaptable and prompt-responsive model to date. Whether you're generating images with sharp graphic design, stunning full-HD renders, or highly specific creative direction, it adheres closely to your prompts, renders text with accuracy, and supports a wide array of visual styles and aesthetics – from stylized concept art to crisp product mockups.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/leonardo/lucid-origin", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/leonardo/lucid-origin \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/lucid-origin/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/leonardo/lucid-origin)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
