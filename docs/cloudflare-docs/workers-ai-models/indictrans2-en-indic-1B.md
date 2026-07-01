---
model_id: "@cf/ai4bharat/indictrans2-en-indic-1B"
title: "indictrans2-en-indic-1B"
task_type: "indictrans2-en-indic-1B 

Translation"
author: "ai4bharat"
pricing: "$0.34 per M input tokens, $0.34 per M output tokens"
---

# indictrans2-en-indic-1B

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/ai4bharat/indictrans2-en-indic-1B` |
| **Task Type** | indictrans2-en-indic-1B 

Translation |
| **Author** | ai4bharat |
| **Pricing** | $0.34 per M input tokens, $0.34 per M output tokens |

## Description

IndicTrans2 is the first open-source transformer-based multilingual NMT model that supports high-quality translations across all the 22 scheduled Indic languages

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/ai4bharat/indictrans2-en-indic-1B", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/ai4bharat/indictrans2-en-indic-1B \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/indictrans2-en-indic-1B/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/ai4bharat/indictrans2-en-indic-1B)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
