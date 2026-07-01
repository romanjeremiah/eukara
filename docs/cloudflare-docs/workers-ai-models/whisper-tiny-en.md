---
model_id: "@cf/openai/whisper-tiny-en"
title: "whisper-tiny-en"
task_type: "whisper-tiny-en Beta 

Automatic Speech Recognition"
author: "OpenAI"
capabilities:
  - Beta
---

# whisper-tiny-en

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/openai/whisper-tiny-en` |
| **Task Type** | whisper-tiny-en Beta 

Automatic Speech Recognition |
| **Author** | OpenAI |
| **Capabilities** | Beta |

## Description

Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. Trained on 680k hours of labelled data, Whisper models demonstrate a strong ability to generalize to many datasets and domains without the need for fine-tuning. This is the English-only version of the Whisper Tiny model which was trained on the task of speech recognition.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/openai/whisper-tiny-en", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/openai/whisper-tiny-en \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/whisper-tiny-en/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/openai/whisper-tiny-en)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
