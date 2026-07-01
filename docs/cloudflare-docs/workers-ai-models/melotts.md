---
model_id: "@cf/myshell-ai/melotts"
title: "melotts"
task_type: "melotts 

Text-to-Speech"
author: "MyShell"
pricing: "$0.0002 per audio minute"
---

# melotts

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/myshell-ai/melotts` |
| **Task Type** | melotts 

Text-to-Speech |
| **Author** | MyShell |
| **Pricing** | $0.0002 per audio minute |

## Description

MeloTTS is a high-quality multi-lingual text-to-speech library by MyShell.ai.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/myshell-ai/melotts", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/myshell-ai/melotts \\
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/melotts/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/myshell-ai/melotts)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
