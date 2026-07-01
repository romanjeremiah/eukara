---
model_id: "@cf/mistralai/mistral-small-3.1-24b-instruct"
title: "mistral-small-3.1-24b-instruct"
task_type: "1-24b-instruct 

Text Generation"
author: "MistralAI"
context_window: "128,000 tokens"
pricing: "$0.35 per M input tokens, $0.56 per M output tokens"
capabilities:
  - Function calling
---

# mistral-small-3.1-24b-instruct

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/mistralai/mistral-small-3.1-24b-instruct` |
| **Task Type** | 1-24b-instruct 

Text Generation |
| **Author** | MistralAI |
| **Context Window** | 128,000 tokens |
| **Pricing** | $0.35 per M input tokens, $0.56 per M output tokens |
| **Capabilities** | Function calling |

## Description

Building upon Mistral Small 3 (2501), Mistral Small 3.1 (2503) adds state-of-the-art vision understanding and enhances long context capabilities up to 128k tokens without compromising text performance. With 24 billion parameters, this model achieves top-tier capabilities in both text and vision tasks.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/mistralai/mistral-small-3.1-24b-instruct \\
  -X POST \\
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \\
  -d '{ /* see input parameters below */ }'
```

## Input Parameters

> **Schema Title:** Prompt

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `prompt` | `string` | ✅ |  | minLength: 1 | The input text prompt for the model to generate a response. |
| `guided_json` | `object` |  |  |  | JSON schema that should be fulfilled for the response. |
| `raw` | `boolean` |  | `false` |  | If true, a chat template is not applied and you must adhere to the specific model's expected formatting. |
| `stream` | `boolean` |  | `false` |  | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | `integer` |  | `256` |  | The maximum number of tokens to generate in the response. |
| `temperature` | `number` |  | `0.15` | min: 0; max: 5 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | `number` |  |  | min: 0; max: 2 | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lower values make outputs more predictable; higher values allow for more varied and creative responses. |
| `top_k` | `integer` |  |  | min: 1; max: 50 | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focused; higher values introduce more variety and potential surprises. |
| `seed` | `integer` |  |  | min: 1; max: 9999999999 | Random seed for reproducibility of the generation. |
| `repetition_penalty` | `number` |  |  | min: 0; max: 2 | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | `number` |  |  | min: 0; max: 2 | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | `number` |  |  | min: 0; max: 2 | Increases the likelihood of the model introducing new topics. |

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
    "guided_json": {
      "type": "object",
      "description": "JSON schema that should be fulfilled for the response."
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
      "default": 0.15,
      "minimum": 0,
      "maximum": 5,
      "description": "Controls the randomness of the output; higher values produce more random results."
    },
    "top_p": {
      "type": "number",
      "minimum": 0,
      "maximum": 2,
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
      "minimum": 0,
      "maximum": 2,
      "description": "Decreases the likelihood of the model repeating the same lines verbatim."
    },
    "presence_penalty": {
      "type": "number",
      "minimum": 0,
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
  "contentType": "application/json",
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
    "guided_json": {
      "type": "object",
      "description": "JSON schema that should be fulfilled for the response."
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
      "default": 0.15,
      "minimum": 0,
      "maximum": 5,
      "description": "Controls the randomness of the output; higher values produce more random results."
    },
    "top_p": {
      "type": "number",
      "minimum": 0,
      "maximum": 2,
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
      "minimum": 0,
      "maximum": 2,
      "description": "Decreases the likelihood of the model repeating the same lines verbatim."
    },
    "presence_penalty": {
      "type": "number",
      "minimum": 0,
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
  "contentType": "text/event-stream",
  "format": "binary"
}
```

## Resources

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/mistralai/mistral-small-3.1-24b-instruct)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
