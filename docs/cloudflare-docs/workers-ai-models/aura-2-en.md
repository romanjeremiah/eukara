---
model_id: "@cf/deepgram/aura-2-en"
title: "aura-2-en"
task_type: "aura-2-en 

Text-to-Speech"
author: "Deepgram"
pricing: "$0.03 per 1k characters"
license_url: "https://deepgram.com/terms"
capabilities:
  - Batch
  - Real-time
---

# aura-2-en

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/deepgram/aura-2-en` |
| **Task Type** | aura-2-en 

Text-to-Speech |
| **Author** | Deepgram |
| **Pricing** | $0.03 per 1k characters |
| **License** | [View License](https://deepgram.com/terms) |
| **Capabilities** | Batch, Real-time |

## Description

Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/deepgram/aura-2-en", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/deepgram/aura-2-en \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/aura-2-en/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/deepgram/aura-2-en)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
