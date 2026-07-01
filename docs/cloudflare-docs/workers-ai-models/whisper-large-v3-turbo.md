---
model_id: "@cf/openai/whisper-large-v3-turbo"
title: "whisper-large-v3-turbo"
task_type: "whisper-large-v3-turbo 

Automatic Speech Recognition"
author: "OpenAI"
pricing: "$0.00051 per audio minute"
capabilities:
  - Batch
---

# whisper-large-v3-turbo

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/openai/whisper-large-v3-turbo` |
| **Task Type** | whisper-large-v3-turbo 

Automatic Speech Recognition |
| **Author** | OpenAI |
| **Pricing** | $0.00051 per audio minute |
| **Capabilities** | Batch |

## Description

Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/openai/whisper-large-v3-turbo \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/openai/whisper-large-v3-turbo)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
