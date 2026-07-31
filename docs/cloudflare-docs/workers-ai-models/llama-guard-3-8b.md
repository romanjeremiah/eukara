---
model_id: "@cf/meta/llama-guard-3-8b"
title: "llama-guard-3-8b"
task_type: "llama-guard-3-8b 

Text Generation"
author: "Meta"
context_window: "131,072 tokens"
pricing: "$0.48 per M input tokens, $0.03 per M output tokens"
capabilities:
  - LoRA
---

# llama-guard-3-8b

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/meta/llama-guard-3-8b` |
| **Task Type** | llama-guard-3-8b 

Text Generation |
| **Author** | Meta |
| **Context Window** | 131,072 tokens |
| **Pricing** | $0.48 per M input tokens, $0.03 per M output tokens |
| **Capabilities** | LoRA |

## Description

Llama Guard 3 is a Llama-3.1-8B pretrained model, fine-tuned for content safety classification. Similar to previous versions, it can be used to classify content in both LLM inputs (prompt classification) and in LLM responses (response classification). It acts as an LLM – it generates text in its output that indicates whether a given prompt or response is safe or unsafe, and if unsafe, it also lists the content categories violated.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/meta/llama-guard-3-8b", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/meta/llama-guard-3-8b \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/llama-guard-3-8b/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/meta/llama-guard-3-8b)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
