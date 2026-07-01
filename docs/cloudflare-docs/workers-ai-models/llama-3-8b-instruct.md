---
model_id: "@cf/meta/llama-3-8b-instruct"
title: "llama-3-8b-instruct"
task_type: "llama-3-8b-instruct 

Text Generation"
author: "Meta"
deprecated: "5/30/2026"
context_window: "7,968 tokens"
pricing: "$0.28 per M input tokens, $0.83 per M output tokens"
license_url: "https://llama.meta.com/llama3/license/#"
capabilities:
  - LoRA
  - Deprecated
---

# llama-3-8b-instruct

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/meta/llama-3-8b-instruct` |
| **Task Type** | llama-3-8b-instruct 

Text Generation |
| **Author** | Meta |
| **Deprecated** | 5/30/2026 |
| **Context Window** | 7,968 tokens |
| **Pricing** | $0.28 per M input tokens, $0.83 per M output tokens |
| **License** | [View License](https://llama.meta.com/llama3/license/#) |
| **Capabilities** | LoRA, Deprecated |

## Description

Generation over generation, Meta Llama 3 demonstrates state-of-the-art performance on a wide range of industry benchmarks and offers new capabilities, including improved reasoning.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/meta/llama-3-8b-instruct \\
  -X POST \\
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \\
  -d '{ /* see input parameters below */ }'
```

## Input Parameters

> **Schema Title:** Prompt

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `prompt` | `string` | ✅ |  | minLength: 1 | The input text prompt for the model to generate a response. |
| `lora` | `string` |  |  |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | `object` |  |  |  | JSON Mode |
| `response_format.type` | `string` |  |  | enum: [json_object, json_schema] |  |
| `response_format.json_schema` | `object` |  |  |  |  |
| `raw` | `boolean` |  | `false` |  | If true, a chat template is not applied and you must adhere to the specific model's expected formatting. |
| `stream` | `boolean` |  | `false` |  | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | `integer` |  | `256` |  | The maximum number of tokens to generate in the response. |
| `temperature` | `number` |  | `0.6` | min: 0; max: 5 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | `number` |  |  | min: 0.001; max: 1 | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses. |
| `top_k` | `integer` |  |  | min: 1; max: 50 | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises. |
| `seed` | `integer` |  |  | min: 1; max: 9999999999 | Random seed for reproducibility of the generation. |
| `repetition_penalty` | `number` |  |  | min: 0; max: 2 | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | `number` |  |  | min: -2; max: 2 | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | `number` |  |  | min: -2; max: 2 | Increases the likelihood of the model introducing new topics. |

## Output Schema

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `response` | `string` | ✅ |  |  | The generated text response from the model |
| `usage` | `object` |  |  |  | Usage statistics for the inference request |
| `usage.prompt_tokens` | `number` |  | `0` |  | Total number of tokens in input |
| `usage.completion_tokens` | `number` |  | `0` |  | Total number of tokens in output |
| `usage.total_tokens` | `number` |  | `0` |  | Total number of input and output tokens |
| `tool_calls` | `array` |  |  | items: object | An array of tool calls requests made during the response generation |

## Raw API Schemas

### Synchronous Input Schema

```json
{
  "title": "Prompt",
  "properties": {
    "prompt": {
      "type": "string",
      "minLength": 1,
      "description": "The input text prompt for the model to generate a response."
    },
    "lora": {
      "type": "string",
      "description": "Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model."
    },
    "response_format": {
      "title": "JSON Mode",
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "json_object",
            "json_schema"
          ]
        },
        "json_schema": {}
      }
    },
    "raw": {
      "type": "boolean",
      "default": false,
      "description": "If true, a chat template is not applied and you must adhere to the specific model's expected formatting."
    },
    "stream": {
      "type": "boolean",
      "default": false,
      "description": "If true, the response will be streamed back incrementally using SSE, Server Sent Events."
    },
    "max_tokens": {
      "type": "integer",
      "default": 256,
      "description": "The maximum number of tokens to generate in the response."
    },
    "temperature": {
      "type": "number",
      "default": 0.6,
      "minimum": 0,
      "maximum": 5,
      "description": "Controls the randomness of the output; higher values produce more random results."
    },
    "top_p": {
      "type": "number",
      "minimum": 0.001,
      "maximum": 1,
      "description": "Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses."
    },
    "top_k": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "description": "Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises."
    },
    "seed": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9999999999,
      "description": "Random seed for reproducibility of the generation."
    },
    "repetition_penalty": {
      "type": "number",
      "minimum": 0,
      "maximum": 2,
      "description": "Penalty for repeated tokens; higher values discourage repetition."
    },
    "frequency_penalty": {
      "type": "number",
      "minimum": -2,
      "maximum": 2,
      "description": "Decreases the likelihood of the model repeating the same lines verbatim."
    },
    "presence_penalty": {
      "type": "number",
      "minimum": -2,
      "maximum": 2,
      "description": "Increases the likelihood of the model introducing new topics."
    }
  },
  "required": [
    "prompt"
  ]
}
```

### Synchronous Output Schema

```json
{
  "type": "object",
  "properties": {
    "response": {
      "type": "string",
      "description": "The generated text response from the model"
    },
    "usage": {
      "type": "object",
      "description": "Usage statistics for the inference request",
      "properties": {
        "prompt_tokens": {
          "type": "number",
          "description": "Total number of tokens in input",
          "default": 0
        },
        "completion_tokens": {
          "type": "number",
          "description": "Total number of tokens in output",
          "default": 0
        },
        "total_tokens": {
          "type": "number",
          "description": "Total number of input and output tokens",
          "default": 0
        }
      }
    },
    "tool_calls": {
      "type": "array",
      "description": "An array of tool calls requests made during the response generation",
      "items": {
        "type": "object",
        "properties": {
          "arguments": {
            "type": "object",
            "description": "The arguments passed to be passed to the tool call request"
          },
          "name": {
            "type": "string",
            "description": "The name of the tool to be called"
          }
        }
      }
    }
  },
  "required": [
    "response"
  ]
}
```

### Streaming Input Schema

```json
{
  "title": "Prompt",
  "properties": {
    "prompt": {
      "type": "string",
      "minLength": 1,
      "description": "The input text prompt for the model to generate a response."
    },
    "lora": {
      "type": "string",
      "description": "Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model."
    },
    "response_format": {
      "title": "JSON Mode",
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "json_object",
            "json_schema"
          ]
        },
        "json_schema": {}
      }
    },
    "raw": {
      "type": "boolean",
      "default": false,
      "description": "If true, a chat template is not applied and you must adhere to the specific model's expected formatting."
    },
    "stream": {
      "type": "boolean",
      "default": false,
      "description": "If true, the response will be streamed back incrementally using SSE, Server Sent Events."
    },
    "max_tokens": {
      "type": "integer",
      "default": 256,
      "description": "The maximum number of tokens to generate in the response."
    },
    "temperature": {
      "type": "number",
      "default": 0.6,
      "minimum": 0,
      "maximum": 5,
      "description": "Controls the randomness of the output; higher values produce more random results."
    },
    "top_p": {
      "type": "number",
      "minimum": 0.001,
      "maximum": 1,
      "description": "Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses."
    },
    "top_k": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "description": "Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises."
    },
    "seed": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9999999999,
      "description": "Random seed for reproducibility of the generation."
    },
    "repetition_penalty": {
      "type": "number",
      "minimum": 0,
      "maximum": 2,
      "description": "Penalty for repeated tokens; higher values discourage repetition."
    },
    "frequency_penalty": {
      "type": "number",
      "minimum": -2,
      "maximum": 2,
      "description": "Decreases the likelihood of the model repeating the same lines verbatim."
    },
    "presence_penalty": {
      "type": "number",
      "minimum": -2,
      "maximum": 2,
      "description": "Increases the likelihood of the model introducing new topics."
    }
  },
  "required": [
    "prompt"
  ]
}
```

### Streaming Output Schema

```json
{
  "type": "string",
  "format": "binary"
}
```

## Resources

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/llama-3-8b-instruct/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/meta/llama-3-8b-instruct)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
