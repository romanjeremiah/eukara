---
model_id: "@cf/deepgram/flux"
title: "flux"
task_type: "flux 

Automatic Speech Recognition"
author: "Deepgram"
pricing: "$0.0077 per audio minute (websocket)"
license_url: "https://deepgram.com/terms"
capabilities:
  - Real-time
---

# flux

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/deepgram/flux` |
| **Task Type** | flux 

Automatic Speech Recognition |
| **Author** | Deepgram |
| **Pricing** | $0.0077 per audio minute (websocket) |
| **License** | [View License](https://deepgram.com/terms) |
| **Capabilities** | Real-time |

## Description

Flux is the first conversational speech recognition model built specifically for voice agents.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/deepgram/flux", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/deepgram/flux \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/flux/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/deepgram/flux)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
