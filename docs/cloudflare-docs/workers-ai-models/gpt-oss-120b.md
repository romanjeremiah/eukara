---
model_id: "@cf/openai/gpt-oss-120b"
title: "gpt-oss-120b"
task_type: "gpt-oss-120b 

Text Generation"
author: "OpenAI"
context_window: "128,000 tokens"
pricing: "$0.35 per M input tokens, $0.75 per M output tokens"
capabilities:
  - Function calling
  - Reasoning
  - LoRA
  - Batch
---

# gpt-oss-120b

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/openai/gpt-oss-120b` |
| **Task Type** | gpt-oss-120b 

Text Generation |
| **Author** | OpenAI |
| **Context Window** | 128,000 tokens |
| **Pricing** | $0.35 per M input tokens, $0.75 per M output tokens |
| **Capabilities** | Function calling, Reasoning, LoRA, Batch |

## Description

OpenAI's open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-120b is for production, general purpose, high reasoning use-cases.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/openai/gpt-oss-120b", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/openai/gpt-oss-120b \\
  -X POST \\
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \\
  -d '{ /* see input parameters below */ }'
```

## Input Parameters

No parameters defined.

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
  "type": "object",
  "oneOf": [
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
    },
    {
      "title": "Messages",
      "properties": {
        "messages": {
          "type": "array",
          "description": "An array of message objects representing the conversation history.",
          "items": {
            "type": "object",
            "properties": {
              "role": {
                "type": "string",
                "description": "The role of the message sender (e.g., 'user', 'assistant', 'system', 'tool')."
              },
              "content": {
                "oneOf": [
                  {
                    "type": "string",
                    "description": "The content of the message as a string."
                  },
                  {
                    "type": "array",
                    "description": "Array of text content parts.",
                    "items": {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "description": "Type of the content (text)"
                        },
                        "text": {
                          "type": "string",
                          "description": "Text content"
                        }
                      }
                    }
                  }
                ]
              }
            },
            "required": [
              "role",
              "content"
            ]
          }
        },
        "functions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "code": {
                "type": "string"
              }
            },
            "required": [
              "name",
              "code"
            ]
          }
        },
        "tools": {
          "type": "array",
          "description": "A list of tools available for the assistant to use.",
          "items": {
            "type": "object",
            "oneOf": [
              {
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "The name of the tool. More descriptive the better."
                  },
                  "description": {
                    "type": "string",
                    "description": "A brief description of what the tool does."
                  },
                  "parameters": {
                    "type": "object",
                    "description": "Schema defining the parameters accepted by the tool.",
                    "properties": {
                      "type": {
                        "type": "string",
                        "description": "The type of the parameters object (usually 'object')."
                      },
                      "required": {
                        "type": "array",
                        "description": "List of required parameter names.",
                        "items": {
                          "type": "string"
                        }
                      },
                      "properties": {
                        "type": "object",
                        "description": "Definitions of each parameter.",
                        "additionalProperties": {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "description": "The data type of the parameter."
                            },
                            "description": {
                              "type": "string",
                              "description": "A description of the expected parameter."
                            }
                          },
                          "required": [
                            "type",
                            "description"
                          ]
                        }
                      }
                    },
                    "required": [
                      "type",
                      "properties"
                    ]
                  }
                },
                "required": [
                  "name",
                  "description",
                  "parameters"
                ]
              },
              {
                "properties": {
                  "type": {
                    "type": "string",
                    "description": "Specifies the type of tool (e.g., 'function')."
                  },
                  "function": {
                    "type": "object",
                    "description": "Details of the function tool.",
                    "properties": {
                      "name": {
                        "type": "string",
                        "description": "The name of the function."
                      },
                      "description": {
                        "type": "string",
                        "description": "A brief description of what the function does."
                      },
                      "parameters": {
                        "type": "object",
                        "description": "Schema defining the parameters accepted by the function.",
                        "properties": {
                          "type": {
                            "type": "string",
                            "description": "The type of the parameters object (usually 'object')."
                          },
                          "required": {
                            "type": "array",
                            "description": "List of required parameter names.",
                            "items": {
                              "type": "string"
                            }
                          },
                          "properties": {
                            "type": "object",
                            "description": "Definitions of each parameter.",
                            "additionalProperties": {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "description": "The data type of the parameter."
                                },
                                "description": {
                                  "type": "string",
                                  "description": "A description of the expected parameter."
                                }
                              },
                              "required": [
                                "type",
                                "description"
                              ]
                            }
                          }
                        },
                        "required": [
                          "type",
                          "properties"
                        ]
                      }
                    },
                    "required": [
                      "name",
                      "description",
                      "parameters"
                    ]
                  }
                },
                "required": [
                  "type",
                  "function"
                ]
              }
            ]
          }
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
        "messages"
      ]
    }
  ]
}
```

### Synchronous Output Schema

```json
{
  "type": "object",
  "title": "Prompt_Output",
  "description": "Output when using the Prompt input format",
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
            "description": "The arguments to be passed to the tool call request"
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
  "type": "object",
  "oneOf": [
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
    },
    {
      "title": "Messages",
      "properties": {
        "messages": {
          "type": "array",
          "description": "An array of message objects representing the conversation history.",
          "items": {
            "type": "object",
            "properties": {
              "role": {
                "type": "string",
                "description": "The role of the message sender (e.g., 'user', 'assistant', 'system', 'tool')."
              },
              "content": {
                "oneOf": [
                  {
                    "type": "string",
                    "description": "The content of the message as a string."
                  },
                  {
                    "type": "array",
                    "description": "Array of text content parts.",
                    "items": {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string",
                          "description": "Type of the content (text)"
                        },
                        "text": {
                          "type": "string",
                          "description": "Text content"
                        }
                      }
                    }
                  }
                ]
              }
            },
            "required": [
              "role",
              "content"
            ]
          }
        },
        "functions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "code": {
                "type": "string"
              }
            },
            "required": [
              "name",
              "code"
            ]
          }
        },
        "tools": {
          "type": "array",
          "description": "A list of tools available for the assistant to use.",
          "items": {
            "type": "object",
            "oneOf": [
              {
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "The name of the tool. More descriptive the better."
                  },
                  "description": {
                    "type": "string",
                    "description": "A brief description of what the tool does."
                  },
                  "parameters": {
                    "type": "object",
                    "description": "Schema defining the parameters accepted by the tool.",
                    "properties": {
                      "type": {
                        "type": "string",
                        "description": "The type of the parameters object (usually 'object')."
                      },
                      "required": {
                        "type": "array",
                        "description": "List of required parameter names.",
                        "items": {
                          "type": "string"
                        }
                      },
                      "properties": {
                        "type": "object",
                        "description": "Definitions of each parameter.",
                        "additionalProperties": {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "description": "The data type of the parameter."
                            },
                            "description": {
                              "type": "string",
                              "description": "A description of the expected parameter."
                            }
                          },
                          "required": [
                            "type",
                            "description"
                          ]
                        }
                      }
                    },
                    "required": [
                      "type",
                      "properties"
                    ]
                  }
                },
                "required": [
                  "name",
                  "description",
                  "parameters"
                ]
              },
              {
                "properties": {
                  "type": {
                    "type": "string",
                    "description": "Specifies the type of tool (e.g., 'function')."
                  },
                  "function": {
                    "type": "object",
                    "description": "Details of the function tool.",
                    "properties": {
                      "name": {
                        "type": "string",
                        "description": "The name of the function."
                      },
                      "description": {
                        "type": "string",
                        "description": "A brief description of what the function does."
                      },
                      "parameters": {
                        "type": "object",
                        "description": "Schema defining the parameters accepted by the function.",
                        "properties": {
                          "type": {
                            "type": "string",
                            "description": "The type of the parameters object (usually 'object')."
                          },
                          "required": {
                            "type": "array",
                            "description": "List of required parameter names.",
                            "items": {
                              "type": "string"
                            }
                          },
                          "properties": {
                            "type": "object",
                            "description": "Definitions of each parameter.",
                            "additionalProperties": {
                              "type": "object",
                              "properties": {
                                "type": {
                                  "type": "string",
                                  "description": "The data type of the parameter."
                                },
                                "description": {
                                  "type": "string",
                                  "description": "A description of the expected parameter."
                                }
                              },
                              "required": [
                                "type",
                                "description"
                              ]
                            }
                          }
                        },
                        "required": [
                          "type",
                          "properties"
                        ]
                      }
                    },
                    "required": [
                      "name",
                      "description",
                      "parameters"
                    ]
                  }
                },
                "required": [
                  "type",
                  "function"
                ]
              }
            ]
          }
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
        "messages"
      ]
    }
  ]
}
```

### Streaming Output Schema

```json
{
  "type": "string",
  "title": "Stream_Output",
  "description": "Server-Sent Events stream when streaming is enabled",
  "contentType": "text/event-stream",
  "format": "binary"
}
```

## Resources

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/openai/gpt-oss-120b)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
