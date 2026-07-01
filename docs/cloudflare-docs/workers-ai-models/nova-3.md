---
model_id: "@cf/deepgram/nova-3"
title: "nova-3"
task_type: "nova-3 

Automatic Speech Recognition"
author: "Deepgram"
pricing: "$0.0052 per audio minute, $0.0092 per audio minute (websocket)"
license_url: "https://deepgram.com/terms"
capabilities:
  - Batch
  - Real-time
---

# nova-3

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/deepgram/nova-3` |
| **Task Type** | nova-3 

Automatic Speech Recognition |
| **Author** | Deepgram |
| **Pricing** | $0.0052 per audio minute, $0.0092 per audio minute (websocket) |
| **License** | [View License](https://deepgram.com/terms) |
| **Capabilities** | Batch, Real-time |

## Description

Transcribe audio using Deepgram’s speech-to-text model

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/deepgram/nova-3", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/deepgram/nova-3 \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/nova-3/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/deepgram/nova-3)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
