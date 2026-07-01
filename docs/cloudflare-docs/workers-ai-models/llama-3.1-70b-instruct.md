---
model_id: "@cf/meta/llama-3.1-70b-instruct"
title: "llama-3.1-70b-instruct"
task_type: "1-70b-instruct 

Text Generation"
author: "Meta"
deprecated: "5/30/2026"
context_window: "24,000 tokens"
license_url: "https://github.com/meta-llama/llama-models/blob/main/models/llama3%5F1/LICENSE"
capabilities:
  - LoRA
  - Deprecated
---

# llama-3.1-70b-instruct

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/meta/llama-3.1-70b-instruct` |
| **Task Type** | 1-70b-instruct 

Text Generation |
| **Author** | Meta |
| **Deprecated** | 5/30/2026 |
| **Context Window** | 24,000 tokens |
| **License** | [View License](https://github.com/meta-llama/llama-models/blob/main/models/llama3%5F1/LICENSE) |
| **Capabilities** | LoRA, Deprecated |

## Description

The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models. The Llama 3.1 instruction tuned text only models are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/meta/llama-3.1-70b-instruct", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/meta/llama-3.1-70b-instruct \\
  -X POST \\
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \\
  -d '{ /* see input parameters below */ }'
```

## Input Parameters

> **Schema Title:** Prompt

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `frequency_penalty` | `number` |  |  | min: 0; max: 2 | Decreases the likelihood of the model repeating the same lines verbatim. |
| `image` | `object` |  |  |  |  |
| `lora` | `string` |  |  |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `max_tokens` | `integer` |  | `256` |  | The maximum number of tokens to generate in the response. |
| `presence_penalty` | `number` |  |  | min: 0; max: 2 | Increases the likelihood of the model introducing new topics. |
| `prompt` | `string` | ✅ |  | minLength: 1; maxLength: 131072 | The input text prompt for the model to generate a response. |
| `raw` | `boolean` |  | `false` |  | If true, a chat template is not applied and you must adhere to the specific model's expected formatting. |
| `repetition_penalty` | `number` |  |  | min: 0; max: 2 | Penalty for repeated tokens; higher values discourage repetition. |
| `seed` | `integer` |  |  | min: 1; max: 9999999999 | Random seed for reproducibility of the generation. |
| `stream` | `boolean` |  | `false` |  | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `temperature` | `number` |  | `0.6` | min: 0; max: 5 | Controls the randomness of the output; higher values produce more random results. |
| `top_k` | `integer` |  |  | min: 1; max: 50 | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises. |
| `top_p` | `number` |  |  | min: 0; max: 2 | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses. |

## Output Schema

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `response` | `string` |  |  |  | The generated text response from the model |
| `tool_calls` | `array` |  |  | items: object | An array of tool calls requests made during the response generation |

## Raw API Schemas

### Synchronous Input Schema

```json
{
  "properties": {
    "frequency_penalty": {
      "description": "Decreases the likelihood of the model repeating the same lines verbatim.",
      "maximum": 2,
      "minimum": 0,
      "type": "number"
    },
    "image": {
      "oneOf": [
        {
          "description": "An array of integers that represent the image data constrained to 8-bit unsigned integer values",
          "items": {
            "description": "A value between 0 and 255",
            "type": "number"
          },
          "type": "array"
        },
        {
          "description": "Binary string representing the image contents.",
          "format": "binary",
          "type": "string"
        }
      ]
    },
    "lora": {
      "description": "Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model.",
      "type": "string"
    },
    "max_tokens": {
      "default": 256,
      "description": "The maximum number of tokens to generate in the response.",
      "type": "integer"
    },
    "presence_penalty": {
      "description": "Increases the likelihood of the model introducing new topics.",
      "maximum": 2,
      "minimum": 0,
      "type": "number"
    },
    "prompt": {
      "description": "The input text prompt for the model to generate a response.",
      "maxLength": 131072,
      "minLength": 1,
      "type": "string"
    },
    "raw": {
      "default": false,
      "description": "If true, a chat template is not applied and you must adhere to the specific model's expected formatting.",
      "type": "boolean"
    },
    "repetition_penalty": {
      "description": "Penalty for repeated tokens; higher values discourage repetition.",
      "maximum": 2,
      "minimum": 0,
      "type": "number"
    },
    "seed": {
      "description": "Random seed for reproducibility of the generation.",
      "maximum": 9999999999,
      "minimum": 1,
      "type": "integer"
    },
    "stream": {
      "default": false,
      "description": "If true, the response will be streamed back incrementally using SSE, Server Sent Events.",
      "type": "boolean"
    },
    "temperature": {
      "default": 0.6,
      "description": "Controls the randomness of the output; higher values produce more random results.",
      "maximum": 5,
      "minimum": 0,
      "type": "number"
    },
    "top_k": {
      "description": "Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises.",
      "maximum": 50,
      "minimum": 1,
      "type": "integer"
    },
    "top_p": {
      "description": "Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses.",
      "maximum": 2,
      "minimum": 0,
      "type": "number"
    }
  },
  "required": [
    "prompt"
  ],
  "title": "Prompt"
}
```

### Synchronous Output Schema

```json
{
  "contentType": "application/json",
  "properties": {
    "response": {
      "description": "The generated text response from the model",
      "type": "string"
    },
    "tool_calls": {
      "description": "An array of tool calls requests made during the response generation",
      "items": {
        "properties": {
          "arguments": {
            "description": "The arguments passed to be passed to the tool call request",
            "type": "object"
          },
          "name": {
            "description": "The name of the tool to be called",
            "type": "string"
          }
        },
        "type": "object"
      },
      "type": "array"
    }
  },
  "type": "object"
}
```

### Streaming Input Schema

```json
{
  "properties": {
    "frequency_penalty": {
      "description": "Decreases the likelihood of the model repeating the same lines verbatim.",
      "maximum": 2,
      "minimum": 0,
      "type": "number"
    },
    "image": {
      "oneOf": [
        {
          "description": "An array of integers that represent the image data constrained to 8-bit unsigned integer values",
          "items": {
            "description": "A value between 0 and 255",
            "type": "number"
          },
          "type": "array"
        },
        {
          "description": "Binary string representing the image contents.",
          "format": "binary",
          "type": "string"
        }
      ]
    },
    "lora": {
      "description": "Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model.",
      "type": "string"
    },
    "max_tokens": {
      "default": 256,
      "description": "The maximum number of tokens to generate in the response.",
      "type": "integer"
    },
    "presence_penalty": {
      "description": "Increases the likelihood of the model introducing new topics.",
      "maximum": 2,
      "minimum": 0,
      "type": "number"
    },
    "prompt": {
      "description": "The input text prompt for the model to generate a response.",
      "maxLength": 131072,
      "minLength": 1,
      "type": "string"
    },
    "raw": {
      "default": false,
      "description": "If true, a chat template is not applied and you must adhere to the specific model's expected formatting.",
      "type": "boolean"
    },
    "repetition_penalty": {
      "description": "Penalty for repeated tokens; higher values discourage repetition.",
      "maximum": 2,
      "minimum": 0,
      "type": "number"
    },
    "seed": {
      "description": "Random seed for reproducibility of the generation.",
      "maximum": 9999999999,
      "minimum": 1,
      "type": "integer"
    },
    "stream": {
      "default": false,
      "description": "If true, the response will be streamed back incrementally using SSE, Server Sent Events.",
      "type": "boolean"
    },
    "temperature": {
      "default": 0.6,
      "description": "Controls the randomness of the output; higher values produce more random results.",
      "maximum": 5,
      "minimum": 0,
      "type": "number"
    },
    "top_k": {
      "description": "Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises.",
      "maximum": 50,
      "minimum": 1,
      "type": "integer"
    },
    "top_p": {
      "description": "Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses.",
      "maximum": 2,
      "minimum": 0,
      "type": "number"
    }
  },
  "required": [
    "prompt"
  ],
  "title": "Prompt"
}
```

### Streaming Output Schema

```json
{
  "contentType": "text/event-stream",
  "format": "binary",
  "type": "string"
}
```

## Resources

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/llama-3.1-70b-instruct/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/meta/llama-3.1-70b-instruct)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
