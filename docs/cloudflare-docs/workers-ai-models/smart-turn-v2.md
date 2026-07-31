---
model_id: "@cf/pipecat-ai/smart-turn-v2"
title: "smart-turn-v2"
task_type: "smart-turn-v2 

Voice Activity Detection"
author: "Pipecat"
pricing: "$0.00034 per audio minute"
capabilities:
  - Batch
  - Real-time
---

# smart-turn-v2

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/pipecat-ai/smart-turn-v2` |
| **Task Type** | smart-turn-v2 

Voice Activity Detection |
| **Author** | Pipecat |
| **Pricing** | $0.00034 per audio minute |
| **Capabilities** | Batch, Real-time |

## Description

An open source, community-driven, native audio turn detection model in 2nd version

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/pipecat-ai/smart-turn-v2", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/pipecat-ai/smart-turn-v2 \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/smart-turn-v2/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/pipecat-ai/smart-turn-v2)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
