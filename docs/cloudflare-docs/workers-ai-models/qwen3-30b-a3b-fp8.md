---
model_id: "@cf/qwen/qwen3-30b-a3b-fp8"
title: "qwen3-30b-a3b-fp8"
task_type: "qwen3-30b-a3b-fp8 

Text Generation"
author: "Qwen"
context_window: "32,768 tokens"
pricing: "$0.051 per M input tokens, $0.34 per M output tokens"
capabilities:
  - Function calling
  - Reasoning
  - LoRA
  - Batch
---

# qwen3-30b-a3b-fp8

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/qwen/qwen3-30b-a3b-fp8` |
| **Task Type** | qwen3-30b-a3b-fp8 

Text Generation |
| **Author** | Qwen |
| **Context Window** | 32,768 tokens |
| **Pricing** | $0.051 per M input tokens, $0.34 per M output tokens |
| **Capabilities** | Function calling, Reasoning, LoRA, Batch |

## Description

Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models. Built upon extensive training, Qwen3 delivers groundbreaking advancements in reasoning, instruction-following, agent capabilities, and multilingual support.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/qwen/qwen3-30b-a3b-fp8", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/qwen/qwen3-30b-a3b-fp8 \\
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
| `max_tokens` | `integer` |  | `2000` |  | The maximum number of tokens to generate in the response. |
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
| `id` | `string` |  |  |  | Unique identifier for the completion |
| `object` | `string` |  |  | enum: [chat.completion] | Object type identifier |
| `created` | `number` |  |  |  | Unix timestamp of when the completion was created |
| `model` | `string` |  |  |  | Model used for the completion |
| `choices` | `array` |  |  | items: object | List of completion choices |
| `usage` | `object` |  |  |  | Usage statistics for the inference request |
| `usage.prompt_tokens` | `number` |  | `0` |  | Total number of tokens in input |
| `usage.completion_tokens` | `number` |  | `0` |  | Total number of tokens in output |
| `usage.total_tokens` | `number` |  | `0` |  | Total number of input and output tokens |
| `prompt_logprobs` | `object | null` |  |  |  | Log probabilities for the prompt (if requested) |

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
      "default": 2000,
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
  "contentType": "application/json",
  "title": "Chat Completion Response",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the completion"
    },
    "object": {
      "type": "string",
      "enum": [
        "chat.completion"
      ],
      "description": "Object type identifier"
    },
    "created": {
      "type": "number",
      "description": "Unix timestamp of when the completion was created"
    },
    "model": {
      "type": "string",
      "description": "Model used for the completion"
    },
    "choices": {
      "type": "array",
      "description": "List of completion choices",
      "items": {
        "type": "object",
        "properties": {
          "index": {
            "type": "number",
            "description": "Index of the choice in the list"
          },
          "message": {
            "type": "object",
            "description": "The message generated by the model",
            "properties": {
              "role": {
                "type": "string",
                "description": "Role of the message author"
              },
              "content": {
                "type": "string",
                "description": "The content of the message"
              },
              "reasoning_content": {
                "type": "string",
                "description": "Internal reasoning content (if available)"
              },
              "tool_calls": {
                "type": "array",
                "description": "Tool calls made by the assistant",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "description": "Unique identifier for the tool call"
                    },
                    "type": {
                      "type": "string",
                      "enum": [
                        "function"
                      ],
                      "description": "Type of tool call"
                    },
                    "function": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string",
                          "description": "Name of the function to call"
                        },
                        "arguments": {
                          "type": "string",
                          "description": "JSON string of arguments for the function"
                        }
                      },
                      "required": [
                        "name",
                        "arguments"
                      ]
                    }
                  },
                  "required": [
                    "id",
                    "type",
                    "function"
                  ]
                }
              }
            },
            "required": [
              "role",
              "content"
            ]
          },
          "finish_reason": {
            "type": "string",
            "description": "Reason why the model stopped generating"
          },
          "stop_reason": {
            "type": [
              "string",
              "null"
            ],
            "description": "Stop reason (may be null)"
          },
          "logprobs": {
            "type": [
              "object",
              "null"
            ],
            "description": "Log probabilities (if requested)"
          }
        }
      }
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
    "prompt_logprobs": {
      "type": [
        "object",
        "null"
      ],
      "description": "Log probabilities for the prompt (if requested)"
    }
  }
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
      "default": 2000,
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
  "contentType": "text/event-stream",
  "format": "binary"
}
```

## Resources

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/qwen/qwen3-30b-a3b-fp8)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
