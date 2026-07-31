---
model_id: "@cf/facebook/bart-large-cnn"
title: "bart-large-cnn"
task_type: "bart-large-cnn Beta 

Summarization"
author: "Meta"
deprecated: "5/30/2026"
pricing: "$0.00 per M input tokens"
capabilities:
  - Deprecated
  - Beta
---

# bart-large-cnn

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/facebook/bart-large-cnn` |
| **Task Type** | bart-large-cnn Beta 

Summarization |
| **Author** | Meta |
| **Deprecated** | 5/30/2026 |
| **Pricing** | $0.00 per M input tokens |
| **Capabilities** | Deprecated, Beta |

## Description

BART is a transformer encoder-encoder (seq2seq) model with a bidirectional (BERT-like) encoder and an autoregressive (GPT-like) decoder. You can use this model for text summarization.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/facebook/bart-large-cnn", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/facebook/bart-large-cnn \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/bart-large-cnn/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/facebook/bart-large-cnn)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
