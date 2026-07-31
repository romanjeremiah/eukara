---
model_id: "@cf/openai/whisper"
title: "whisper"
task_type: "whisper 

Automatic Speech Recognition"
author: "OpenAI"
pricing: "$0.00045 per audio minute"
---

# whisper

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/openai/whisper` |
| **Task Type** | whisper 

Automatic Speech Recognition |
| **Author** | OpenAI |
| **Pricing** | $0.00045 per audio minute |

## Description

Whisper is a general-purpose speech recognition model. It is trained on a large dataset of diverse audio and is also a multitasking model that can perform multilingual speech recognition, speech translation, and language identification.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/openai/whisper", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/openai/whisper \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/whisper/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/openai/whisper)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
