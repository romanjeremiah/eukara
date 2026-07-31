---
model_id: "@cf/zai-org/glm-4.7-flash"
title: "glm-4.7-flash"
task_type: "7-flash 

Text Generation"
author: "Zhipu AI"
context_window: "131,072 tokens"
pricing: "$0.06 per M input tokens, $0.40 per M output tokens"
capabilities:
  - Function calling
  - Reasoning
  - Deprecated
---

# glm-4.7-flash

## Overview

| Property | Value |
|----------|-------|
| **Model ID** | `@cf/zai-org/glm-4.7-flash` |
| **Task Type** | 7-flash 

Text Generation |
| **Author** | Zhipu AI |
| **Context Window** | 131,072 tokens |
| **Pricing** | $0.06 per M input tokens, $0.40 per M output tokens |
| **Capabilities** | Function calling, Reasoning, Deprecated |

## Description

GLM-4.7-Flash is a fast and efficient multilingual text generation model with a 131,072 token context window. Optimized for dialogue, instruction-following, and multi-turn tool calling across 100+ languages.

## Usage

### Workers AI Binding (TypeScript)

```typescript
export interface Env {
  AI: Ai;
}

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
      // see input parameters below
    });
    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
```

### REST API (curl)

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/zai-org/glm-4.7-flash \\
  -X POST \\
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \\
  -d '{ /* see input parameters below */ }'
```

## Input Parameters

> **Schema Title:** Prompt

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `prompt` | `string` | ✅ |  | minLength: 1 | The input text prompt for the model to generate a response. |
| `model` | `string` |  |  |  | ID of the model to use (e.g. '@cf/zai-org/glm-4.7-flash, etc'). |
| `audio` | `anyOf` |  |  |  |  |
| `frequency_penalty` | `anyOf` |  | `0` |  | Penalizes new tokens based on their existing frequency in the text so far. |
| `logit_bias` | `anyOf` |  |  |  | Modify the likelihood of specified tokens appearing in the completion. Maps token IDs to bias values from -100 to 100. |
| `logprobs` | `anyOf` |  | `false` |  | Whether to return log probabilities of the output tokens. |
| `top_logprobs` | `anyOf` |  |  |  | How many top log probabilities to return at each token position (0-20). Requires logprobs=true. |
| `max_tokens` | `anyOf` |  |  |  | Deprecated in favor of max_completion_tokens. The maximum number of tokens to generate. |
| `max_completion_tokens` | `anyOf` |  |  |  | An upper bound for the number of tokens that can be generated for a completion. |
| `metadata` | `anyOf` |  |  |  | Set of 16 key-value pairs that can be attached to the object. |
| `modalities` | `anyOf` |  |  |  | Output types requested from the model (e.g. ['text'] or ['text', 'audio']). |
| `n` | `anyOf` |  | `1` |  | How many chat completion choices to generate for each input message. |
| `parallel_tool_calls` | `boolean` |  | `true` |  | Whether to enable parallel function calling during tool use. |
| `prediction` | `anyOf` |  |  |  |  |
| `presence_penalty` | `anyOf` |  | `0` |  | Penalizes new tokens based on whether they appear in the text so far. |
| `reasoning_effort` | `anyOf` |  |  |  | Constrains effort on reasoning for reasoning models (o1, o3-mini, etc.). |
| `chat_template_kwargs` | `object` |  |  |  |  |
| `chat_template_kwargs.enable_thinking` | `boolean` |  | `true` |  | Whether to enable reasoning, enabled by default. |
| `chat_template_kwargs.clear_thinking` | `boolean` |  | `false` |  | If false, preserves reasoning context between turns. |
| `response_format` | `anyOf` |  |  |  |  |
| `seed` | `anyOf` |  |  |  | If specified, the system will make a best effort to sample deterministically. |
| `service_tier` | `anyOf` |  | `"auto"` |  | Specifies the processing type used for serving the request. |
| `stop` | `anyOf` |  |  |  | Up to 4 sequences where the API will stop generating further tokens. |
| `store` | `anyOf` |  | `false` |  | Whether to store the output for model distillation / evals. |
| `stream` | `anyOf` |  | `false` |  | If true, partial message deltas will be sent as server-sent events. |
| `stream_options` | `anyOf` |  |  |  |  |
| `temperature` | `anyOf` |  | `1` |  | Sampling temperature between 0 and 2. |
| `tool_choice` | `anyOf` |  |  |  |  |
| `tools` | `array` |  |  |  | A list of tools the model may call. |
| `top_p` | `anyOf` |  | `1` |  | Nucleus sampling: considers the results of the tokens with top_p probability mass. |
| `user` | `string` |  |  |  | A unique identifier representing your end-user, for abuse monitoring. |
| `web_search_options` | `anyOf` |  |  |  |  |
| `function_call` | `anyOf` |  |  |  |  |
| `functions` | `array` |  |  | items: object |  |

## Output Schema

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|:--------:|---------|-------------|-------------|
| `id` | `string` | ✅ |  |  | A unique identifier for the chat completion. |
| `object` | `string` | ✅ |  |  |  |
| `created` | `integer` | ✅ |  |  | Unix timestamp (seconds) of when the completion was created. |
| `model` | `string` | ✅ |  |  | The model used for the chat completion. |
| `choices` | `array` | ✅ |  |  |  |
| `usage` | `anyOf` |  |  |  |  |
| `system_fingerprint` | `anyOf` |  |  |  |  |
| `service_tier` | `anyOf` |  |  |  |  |

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
    "model": {
      "type": "string",
      "description": "ID of the model to use (e.g. '@cf/zai-org/glm-4.7-flash, etc')."
    },
    "audio": {
      "anyOf": [
        {
          "type": "object",
          "description": "Parameters for audio output. Required when modalities includes 'audio'.",
          "properties": {
            "voice": {
              "oneOf": [
                {
                  "type": "string"
                },
                {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "id"
                  ]
                }
              ]
            },
            "format": {
              "type": "string",
              "enum": [
                "wav",
                "aac",
                "mp3",
                "flac",
                "opus",
                "pcm16"
              ]
            }
          },
          "required": [
            "voice",
            "format"
          ]
        }
      ]
    },
    "frequency_penalty": {
      "anyOf": [
        {
          "type": "number",
          "minimum": -2,
          "maximum": 2
        },
        {
          "type": "null"
        }
      ],
      "default": 0,
      "description": "Penalizes new tokens based on their existing frequency in the text so far."
    },
    "logit_bias": {
      "anyOf": [
        {
          "type": "object"
        },
        {
          "type": "null"
        }
      ],
      "description": "Modify the likelihood of specified tokens appearing in the completion. Maps token IDs to bias values from -100 to 100."
    },
    "logprobs": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ],
      "default": false,
      "description": "Whether to return log probabilities of the output tokens."
    },
    "top_logprobs": {
      "anyOf": [
        {
          "type": "integer",
          "minimum": 0,
          "maximum": 20
        },
        {
          "type": "null"
        }
      ],
      "description": "How many top log probabilities to return at each token position (0-20). Requires logprobs=true."
    },
    "max_tokens": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "description": "Deprecated in favor of max_completion_tokens. The maximum number of tokens to generate."
    },
    "max_completion_tokens": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "description": "An upper bound for the number of tokens that can be generated for a completion."
    },
    "metadata": {
      "anyOf": [
        {
          "type": "object"
        },
        {
          "type": "null"
        }
      ],
      "description": "Set of 16 key-value pairs that can be attached to the object."
    },
    "modalities": {
      "anyOf": [
        {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "text",
              "audio"
            ]
          }
        },
        {
          "type": "null"
        }
      ],
      "description": "Output types requested from the model (e.g. ['text'] or ['text', 'audio'])."
    },
    "n": {
      "anyOf": [
        {
          "type": "integer",
          "minimum": 1,
          "maximum": 128
        },
        {
          "type": "null"
        }
      ],
      "default": 1,
      "description": "How many chat completion choices to generate for each input message."
    },
    "parallel_tool_calls": {
      "type": "boolean",
      "default": true,
      "description": "Whether to enable parallel function calling during tool use."
    },
    "prediction": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": [
                "content"
              ]
            },
            "content": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "type": {
                        "type": "string",
                        "enum": [
                          "text"
                        ]
                      },
                      "text": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "type",
                      "text"
                    ]
                  }
                }
              ]
            }
          },
          "required": [
            "type",
            "content"
          ]
        }
      ]
    },
    "presence_penalty": {
      "anyOf": [
        {
          "type": "number",
          "minimum": -2,
          "maximum": 2
        },
        {
          "type": "null"
        }
      ],
      "default": 0,
      "description": "Penalizes new tokens based on whether they appear in the text so far."
    },
    "reasoning_effort": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high"
          ]
        },
        {
          "type": "null"
        }
      ],
      "description": "Constrains effort on reasoning for reasoning models (o1, o3-mini, etc.)."
    },
    "chat_template_kwargs": {
      "type": "object",
      "properties": {
        "enable_thinking": {
          "type": "boolean",
          "default": true,
          "description": "Whether to enable reasoning, enabled by default."
        },
        "clear_thinking": {
          "type": "boolean",
          "default": false,
          "description": "If false, preserves reasoning context between turns."
        }
      }
    },
    "response_format": {
      "anyOf": [
        {
          "description": "Specifies the format the model must output.",
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "text"
                  ]
                }
              },
              "required": [
                "type"
              ]
            },
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "json_object"
                  ]
                }
              },
              "required": [
                "type"
              ]
            },
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "json_schema"
                  ]
                },
                "json_schema": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    },
                    "schema": {
                      "type": "object"
                    },
                    "strict": {
                      "anyOf": [
                        {
                          "type": "boolean"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    }
                  },
                  "required": [
                    "name"
                  ]
                }
              },
              "required": [
                "type",
                "json_schema"
              ]
            }
          ]
        }
      ]
    },
    "seed": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "description": "If specified, the system will make a best effort to sample deterministically."
    },
    "service_tier": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "auto",
            "default",
            "flex",
            "scale",
            "priority"
          ]
        },
        {
          "type": "null"
        }
      ],
      "default": "auto",
      "description": "Specifies the processing type used for serving the request."
    },
    "stop": {
      "description": "Up to 4 sequences where the API will stop generating further tokens.",
      "anyOf": [
        {
          "type": "null"
        },
        {
          "type": "string"
        },
        {
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 1,
          "maxItems": 4
        }
      ]
    },
    "store": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ],
      "default": false,
      "description": "Whether to store the output for model distillation / evals."
    },
    "stream": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ],
      "default": false,
      "description": "If true, partial message deltas will be sent as server-sent events."
    },
    "stream_options": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "include_usage": {
              "type": "boolean"
            },
            "include_obfuscation": {
              "type": "boolean"
            }
          }
        }
      ]
    },
    "temperature": {
      "anyOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 2
        },
        {
          "type": "null"
        }
      ],
      "default": 1,
      "description": "Sampling temperature between 0 and 2."
    },
    "tool_choice": {
      "anyOf": [
        {
          "description": "Controls which (if any) tool is called by the model. 'none' = no tools, 'auto' = model decides, 'required' = must call a tool.",
          "oneOf": [
            {
              "type": "string",
              "enum": [
                "none",
                "auto",
                "required"
              ]
            },
            {
              "type": "object",
              "description": "Force a specific function tool.",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "function"
                  ]
                },
                "function": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "name"
                  ]
                }
              },
              "required": [
                "type",
                "function"
              ]
            },
            {
              "type": "object",
              "description": "Force a specific custom tool.",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "custom"
                  ]
                },
                "custom": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "name"
                  ]
                }
              },
              "required": [
                "type",
                "custom"
              ]
            },
            {
              "type": "object",
              "description": "Constrain to an allowed subset of tools.",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "allowed_tools"
                  ]
                },
                "allowed_tools": {
                  "type": "object",
                  "properties": {
                    "mode": {
                      "type": "string",
                      "enum": [
                        "auto",
                        "required"
                      ]
                    },
                    "tools": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  },
                  "required": [
                    "mode",
                    "tools"
                  ]
                }
              },
              "required": [
                "type",
                "allowed_tools"
              ]
            }
          ]
        }
      ]
    },
    "tools": {
      "type": "array",
      "description": "A list of tools the model may call.",
      "items": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "function"
                ]
              },
              "function": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "The name of the function to be called."
                  },
                  "description": {
                    "type": "string",
                    "description": "A description of what the function does."
                  },
                  "parameters": {
                    "type": "object",
                    "description": "The parameters the function accepts, described as a JSON Schema object."
                  },
                  "strict": {
                    "anyOf": [
                      {
                        "type": "boolean"
                      },
                      {
                        "type": "null"
                      }
                    ],
                    "default": false,
                    "description": "Whether to enable strict schema adherence."
                  }
                },
                "required": [
                  "name"
                ]
              }
            },
            "required": [
              "type",
              "function"
            ]
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "custom"
                ]
              },
              "custom": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "format": {
                    "oneOf": [
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": [
                              "text"
                            ]
                          }
                        },
                        "required": [
                          "type"
                        ]
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": [
                              "grammar"
                            ]
                          },
                          "grammar": {
                            "type": "object",
                            "properties": {
                              "definition": {
                                "type": "string"
                              },
                              "syntax": {
                                "type": "string",
                                "enum": [
                                  "lark",
                                  "regex"
                                ]
                              }
                            },
                            "required": [
                              "definition",
                              "syntax"
                            ]
                          }
                        },
                        "required": [
                          "type",
                          "grammar"
                        ]
                      }
                    ]
                  }
                },
                "required": [
                  "name"
                ]
              }
            },
            "required": [
              "type",
              "custom"
            ]
          }
        ]
      }
    },
    "top_p": {
      "anyOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        {
          "type": "null"
        }
      ],
      "default": 1,
      "description": "Nucleus sampling: considers the results of the tokens with top_p probability mass."
    },
    "user": {
      "type": "string",
      "description": "A unique identifier representing your end-user, for abuse monitoring."
    },
    "web_search_options": {
      "anyOf": [
        {
          "type": "object",
          "description": "Options for the web search tool (when using built-in web search).",
          "properties": {
            "search_context_size": {
              "type": "string",
              "enum": [
                "low",
                "medium",
                "high"
              ],
              "default": "medium"
            },
            "user_location": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "approximate"
                  ]
                },
                "approximate": {
                  "type": "object",
                  "properties": {
                    "city": {
                      "type": "string"
                    },
                    "country": {
                      "type": "string"
                    },
                    "region": {
                      "type": "string"
                    },
                    "timezone": {
                      "type": "string"
                    }
                  }
                }
              },
              "required": [
                "type",
                "approximate"
              ]
            }
          }
        }
      ]
    },
    "function_call": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "none",
            "auto"
          ]
        },
        {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            }
          },
          "required": [
            "name"
          ]
        }
      ]
    },
    "functions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "The name of the function to be called."
          },
          "description": {
            "type": "string",
            "description": "A description of what the function does."
          },
          "parameters": {
            "type": "object",
            "description": "The parameters the function accepts, described as a JSON Schema object."
          },
          "strict": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "null"
              }
            ],
            "default": false,
            "description": "Whether to enable strict schema adherence."
          }
        },
        "required": [
          "name"
        ]
      },
      "minItems": 1,
      "maxItems": 128
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
    "id": {
      "type": "string",
      "description": "A unique identifier for the chat completion."
    },
    "object": {
      "type": "string"
    },
    "created": {
      "type": "integer",
      "description": "Unix timestamp (seconds) of when the completion was created."
    },
    "model": {
      "type": "string",
      "description": "The model used for the chat completion."
    },
    "choices": {
      "type": "array",
      "items": {
        "anyOf": [
          {
            "type": "object",
            "properties": {
              "index": {
                "type": "integer"
              },
              "message": {
                "anyOf": [
                  {
                    "type": "object",
                    "properties": {
                      "role": {
                        "type": "string",
                        "enum": [
                          "assistant"
                        ]
                      },
                      "content": {
                        "anyOf": [
                          {
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "refusal": {
                        "anyOf": [
                          {
                            "type": "string"
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "annotations": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "enum": [
                                "url_citation"
                              ]
                            },
                            "url_citation": {
                              "type": "object",
                              "properties": {
                                "url": {
                                  "type": "string"
                                },
                                "title": {
                                  "type": "string"
                                },
                                "start_index": {
                                  "type": "integer"
                                },
                                "end_index": {
                                  "type": "integer"
                                }
                              },
                              "required": [
                                "url",
                                "title",
                                "start_index",
                                "end_index"
                              ]
                            }
                          },
                          "required": [
                            "type",
                            "url_citation"
                          ]
                        }
                      },
                      "audio": {
                        "anyOf": [
                          {
                            "type": "object",
                            "properties": {
                              "id": {
                                "type": "string"
                              },
                              "data": {
                                "type": "string",
                                "description": "Base64 encoded audio bytes."
                              },
                              "expires_at": {
                                "type": "integer"
                              },
                              "transcript": {
                                "type": "string"
                              }
                            },
                            "required": [
                              "id",
                              "data",
                              "expires_at",
                              "transcript"
                            ]
                          }
                        ]
                      },
                      "tool_calls": {
                        "type": "array",
                        "items": {
                          "oneOf": [
                            {
                              "type": "object",
                              "properties": {
                                "id": {
                                  "type": "string"
                                },
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "function"
                                  ]
                                },
                                "function": {
                                  "type": "object",
                                  "properties": {
                                    "name": {
                                      "type": "string"
                                    },
                                    "arguments": {
                                      "type": "string",
                                      "description": "JSON-encoded arguments string."
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
                            },
                            {
                              "type": "object",
                              "properties": {
                                "id": {
                                  "type": "string"
                                },
                                "type": {
                                  "type": "string",
                                  "enum": [
                                    "custom"
                                  ]
                                },
                                "custom": {
                                  "type": "object",
                                  "properties": {
                                    "name": {
                                      "type": "string"
                                    },
                                    "input": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "name",
                                    "input"
                                  ]
                                }
                              },
                              "required": [
                                "id",
                                "type",
                                "custom"
                              ]
                            }
                          ]
                        }
                      },
                      "function_call": {
                        "anyOf": [
                          {
                            "type": "object",
                            "properties": {
                              "name": {
                                "type": "string"
                              },
                              "arguments": {
                                "type": "string"
                              }
                            },
                            "required": [
                              "name",
                              "arguments"
                            ]
                          },
                          {
                            "type": "null"
                          }
                        ]
                      }
                    },
                    "required": [
                      "role",
                      "content",
                      "refusal"
                    ]
                  }
                ]
              },
              "finish_reason": {
                "type": "string",
                "enum": [
                  "stop",
                  "length",
                  "tool_calls",
                  "content_filter",
                  "function_call"
                ]
              },
              "logprobs": {
                "anyOf": [
                  {
                    "type": "object",
                    "properties": {
                      "content": {
                        "anyOf": [
                          {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "token": {
                                  "type": "string"
                                },
                                "logprob": {
                                  "type": "number"
                                },
                                "bytes": {
                                  "anyOf": [
                                    {
                                      "type": "array",
                                      "items": {
                                        "type": "integer"
                                      }
                                    },
                                    {
                                      "type": "null"
                                    }
                                  ]
                                },
                                "top_logprobs": {
                                  "type": "array",
                                  "items": {
                                    "type": "object",
                                    "properties": {
                                      "token": {
                                        "type": "string"
                                      },
                                      "logprob": {
                                        "type": "number"
                                      },
                                      "bytes": {
                                        "anyOf": [
                                          {
                                            "type": "array",
                                            "items": {
                                              "type": "integer"
                                            }
                                          },
                                          {
                                            "type": "null"
                                          }
                                        ]
                                      }
                                    },
                                    "required": [
                                      "token",
                                      "logprob",
                                      "bytes"
                                    ]
                                  }
                                }
                              },
                              "required": [
                                "token",
                                "logprob",
                                "bytes",
                                "top_logprobs"
                              ]
                            }
                          },
                          {
                            "type": "null"
                          }
                        ]
                      },
                      "refusal": {
                        "anyOf": [
                          {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "token": {
                                  "type": "string"
                                },
                                "logprob": {
                                  "type": "number"
                                },
                                "bytes": {
                                  "anyOf": [
                                    {
                                      "type": "array",
                                      "items": {
                                        "type": "integer"
                                      }
                                    },
                                    {
                                      "type": "null"
                                    }
                                  ]
                                },
                                "top_logprobs": {
                                  "type": "array",
                                  "items": {
                                    "type": "object",
                                    "properties": {
                                      "token": {
                                        "type": "string"
                                      },
                                      "logprob": {
                                        "type": "number"
                                      },
                                      "bytes": {
                                        "anyOf": [
                                          {
                                            "type": "array",
                                            "items": {
                                              "type": "integer"
                                            }
                                          },
                                          {
                                            "type": "null"
                                          }
                                        ]
                                      }
                                    },
                                    "required": [
                                      "token",
                                      "logprob",
                                      "bytes"
                                    ]
                                  }
                                }
                              },
                              "required": [
                                "token",
                                "logprob",
                                "bytes",
                                "top_logprobs"
                              ]
                            }
                          },
                          {
                            "type": "null"
                          }
                        ]
                      }
                    }
                  },
                  {
                    "type": "null"
                  }
                ]
              }
            },
            "required": [
              "index",
              "message",
              "finish_reason",
              "logprobs"
            ]
          }
        ]
      },
      "minItems": 1
    },
    "usage": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "prompt_tokens": {
              "type": "integer"
            },
            "completion_tokens": {
              "type": "integer"
            },
            "total_tokens": {
              "type": "integer"
            },
            "prompt_tokens_details": {
              "type": "object",
              "properties": {
                "cached_tokens": {
                  "type": "integer"
                },
                "audio_tokens": {
                  "type": "integer"
                }
              }
            },
            "completion_tokens_details": {
              "type": "object",
              "properties": {
                "reasoning_tokens": {
                  "type": "integer"
                },
                "audio_tokens": {
                  "type": "integer"
                },
                "accepted_prediction_tokens": {
                  "type": "integer"
                },
                "rejected_prediction_tokens": {
                  "type": "integer"
                }
              }
            }
          },
          "required": [
            "prompt_tokens",
            "completion_tokens",
            "total_tokens"
          ]
        }
      ]
    },
    "system_fingerprint": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ]
    },
    "service_tier": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "auto",
            "default",
            "flex",
            "scale",
            "priority"
          ]
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "id",
    "object",
    "created",
    "model",
    "choices"
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
    "model": {
      "type": "string",
      "description": "ID of the model to use (e.g. '@cf/zai-org/glm-4.7-flash, etc')."
    },
    "audio": {
      "anyOf": [
        {
          "type": "object",
          "description": "Parameters for audio output. Required when modalities includes 'audio'.",
          "properties": {
            "voice": {
              "oneOf": [
                {
                  "type": "string"
                },
                {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "id"
                  ]
                }
              ]
            },
            "format": {
              "type": "string",
              "enum": [
                "wav",
                "aac",
                "mp3",
                "flac",
                "opus",
                "pcm16"
              ]
            }
          },
          "required": [
            "voice",
            "format"
          ]
        }
      ]
    },
    "frequency_penalty": {
      "anyOf": [
        {
          "type": "number",
          "minimum": -2,
          "maximum": 2
        },
        {
          "type": "null"
        }
      ],
      "default": 0,
      "description": "Penalizes new tokens based on their existing frequency in the text so far."
    },
    "logit_bias": {
      "anyOf": [
        {
          "type": "object"
        },
        {
          "type": "null"
        }
      ],
      "description": "Modify the likelihood of specified tokens appearing in the completion. Maps token IDs to bias values from -100 to 100."
    },
    "logprobs": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ],
      "default": false,
      "description": "Whether to return log probabilities of the output tokens."
    },
    "top_logprobs": {
      "anyOf": [
        {
          "type": "integer",
          "minimum": 0,
          "maximum": 20
        },
        {
          "type": "null"
        }
      ],
      "description": "How many top log probabilities to return at each token position (0-20). Requires logprobs=true."
    },
    "max_tokens": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "description": "Deprecated in favor of max_completion_tokens. The maximum number of tokens to generate."
    },
    "max_completion_tokens": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "description": "An upper bound for the number of tokens that can be generated for a completion."
    },
    "metadata": {
      "anyOf": [
        {
          "type": "object"
        },
        {
          "type": "null"
        }
      ],
      "description": "Set of 16 key-value pairs that can be attached to the object."
    },
    "modalities": {
      "anyOf": [
        {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "text",
              "audio"
            ]
          }
        },
        {
          "type": "null"
        }
      ],
      "description": "Output types requested from the model (e.g. ['text'] or ['text', 'audio'])."
    },
    "n": {
      "anyOf": [
        {
          "type": "integer",
          "minimum": 1,
          "maximum": 128
        },
        {
          "type": "null"
        }
      ],
      "default": 1,
      "description": "How many chat completion choices to generate for each input message."
    },
    "parallel_tool_calls": {
      "type": "boolean",
      "default": true,
      "description": "Whether to enable parallel function calling during tool use."
    },
    "prediction": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": [
                "content"
              ]
            },
            "content": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "type": {
                        "type": "string",
                        "enum": [
                          "text"
                        ]
                      },
                      "text": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "type",
                      "text"
                    ]
                  }
                }
              ]
            }
          },
          "required": [
            "type",
            "content"
          ]
        }
      ]
    },
    "presence_penalty": {
      "anyOf": [
        {
          "type": "number",
          "minimum": -2,
          "maximum": 2
        },
        {
          "type": "null"
        }
      ],
      "default": 0,
      "description": "Penalizes new tokens based on whether they appear in the text so far."
    },
    "reasoning_effort": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high"
          ]
        },
        {
          "type": "null"
        }
      ],
      "description": "Constrains effort on reasoning for reasoning models (o1, o3-mini, etc.)."
    },
    "chat_template_kwargs": {
      "type": "object",
      "properties": {
        "enable_thinking": {
          "type": "boolean",
          "default": true,
          "description": "Whether to enable reasoning, enabled by default."
        },
        "clear_thinking": {
          "type": "boolean",
          "default": false,
          "description": "If false, preserves reasoning context between turns."
        }
      }
    },
    "response_format": {
      "anyOf": [
        {
          "description": "Specifies the format the model must output.",
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "text"
                  ]
                }
              },
              "required": [
                "type"
              ]
            },
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "json_object"
                  ]
                }
              },
              "required": [
                "type"
              ]
            },
            {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "json_schema"
                  ]
                },
                "json_schema": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    },
                    "schema": {
                      "type": "object"
                    },
                    "strict": {
                      "anyOf": [
                        {
                          "type": "boolean"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    }
                  },
                  "required": [
                    "name"
                  ]
                }
              },
              "required": [
                "type",
                "json_schema"
              ]
            }
          ]
        }
      ]
    },
    "seed": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "description": "If specified, the system will make a best effort to sample deterministically."
    },
    "service_tier": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "auto",
            "default",
            "flex",
            "scale",
            "priority"
          ]
        },
        {
          "type": "null"
        }
      ],
      "default": "auto",
      "description": "Specifies the processing type used for serving the request."
    },
    "stop": {
      "description": "Up to 4 sequences where the API will stop generating further tokens.",
      "anyOf": [
        {
          "type": "null"
        },
        {
          "type": "string"
        },
        {
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 1,
          "maxItems": 4
        }
      ]
    },
    "store": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ],
      "default": false,
      "description": "Whether to store the output for model distillation / evals."
    },
    "stream": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ],
      "default": false,
      "description": "If true, partial message deltas will be sent as server-sent events."
    },
    "stream_options": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "include_usage": {
              "type": "boolean"
            },
            "include_obfuscation": {
              "type": "boolean"
            }
          }
        }
      ]
    },
    "temperature": {
      "anyOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 2
        },
        {
          "type": "null"
        }
      ],
      "default": 1,
      "description": "Sampling temperature between 0 and 2."
    },
    "tool_choice": {
      "anyOf": [
        {
          "description": "Controls which (if any) tool is called by the model. 'none' = no tools, 'auto' = model decides, 'required' = must call a tool.",
          "oneOf": [
            {
              "type": "string",
              "enum": [
                "none",
                "auto",
                "required"
              ]
            },
            {
              "type": "object",
              "description": "Force a specific function tool.",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "function"
                  ]
                },
                "function": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "name"
                  ]
                }
              },
              "required": [
                "type",
                "function"
              ]
            },
            {
              "type": "object",
              "description": "Force a specific custom tool.",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "custom"
                  ]
                },
                "custom": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "name"
                  ]
                }
              },
              "required": [
                "type",
                "custom"
              ]
            },
            {
              "type": "object",
              "description": "Constrain to an allowed subset of tools.",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "allowed_tools"
                  ]
                },
                "allowed_tools": {
                  "type": "object",
                  "properties": {
                    "mode": {
                      "type": "string",
                      "enum": [
                        "auto",
                        "required"
                      ]
                    },
                    "tools": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  },
                  "required": [
                    "mode",
                    "tools"
                  ]
                }
              },
              "required": [
                "type",
                "allowed_tools"
              ]
            }
          ]
        }
      ]
    },
    "tools": {
      "type": "array",
      "description": "A list of tools the model may call.",
      "items": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "function"
                ]
              },
              "function": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "The name of the function to be called."
                  },
                  "description": {
                    "type": "string",
                    "description": "A description of what the function does."
                  },
                  "parameters": {
                    "type": "object",
                    "description": "The parameters the function accepts, described as a JSON Schema object."
                  },
                  "strict": {
                    "anyOf": [
                      {
                        "type": "boolean"
                      },
                      {
                        "type": "null"
                      }
                    ],
                    "default": false,
                    "description": "Whether to enable strict schema adherence."
                  }
                },
                "required": [
                  "name"
                ]
              }
            },
            "required": [
              "type",
              "function"
            ]
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": [
                  "custom"
                ]
              },
              "custom": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "format": {
                    "oneOf": [
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": [
                              "text"
                            ]
                          }
                        },
                        "required": [
                          "type"
                        ]
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": [
                              "grammar"
                            ]
                          },
                          "grammar": {
                            "type": "object",
                            "properties": {
                              "definition": {
                                "type": "string"
                              },
                              "syntax": {
                                "type": "string",
                                "enum": [
                                  "lark",
                                  "regex"
                                ]
                              }
                            },
                            "required": [
                              "definition",
                              "syntax"
                            ]
                          }
                        },
                        "required": [
                          "type",
                          "grammar"
                        ]
                      }
                    ]
                  }
                },
                "required": [
                  "name"
                ]
              }
            },
            "required": [
              "type",
              "custom"
            ]
          }
        ]
      }
    },
    "top_p": {
      "anyOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        {
          "type": "null"
        }
      ],
      "default": 1,
      "description": "Nucleus sampling: considers the results of the tokens with top_p probability mass."
    },
    "user": {
      "type": "string",
      "description": "A unique identifier representing your end-user, for abuse monitoring."
    },
    "web_search_options": {
      "anyOf": [
        {
          "type": "object",
          "description": "Options for the web search tool (when using built-in web search).",
          "properties": {
            "search_context_size": {
              "type": "string",
              "enum": [
                "low",
                "medium",
                "high"
              ],
              "default": "medium"
            },
            "user_location": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "approximate"
                  ]
                },
                "approximate": {
                  "type": "object",
                  "properties": {
                    "city": {
                      "type": "string"
                    },
                    "country": {
                      "type": "string"
                    },
                    "region": {
                      "type": "string"
                    },
                    "timezone": {
                      "type": "string"
                    }
                  }
                }
              },
              "required": [
                "type",
                "approximate"
              ]
            }
          }
        }
      ]
    },
    "function_call": {
      "anyOf": [
        {
          "type": "string",
          "enum": [
            "none",
            "auto"
          ]
        },
        {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            }
          },
          "required": [
            "name"
          ]
        }
      ]
    },
    "functions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "The name of the function to be called."
          },
          "description": {
            "type": "string",
            "description": "A description of what the function does."
          },
          "parameters": {
            "type": "object",
            "description": "The parameters the function accepts, described as a JSON Schema object."
          },
          "strict": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "null"
              }
            ],
            "default": false,
            "description": "Whether to enable strict schema adherence."
          }
        },
        "required": [
          "name"
        ]
      },
      "minItems": 1,
      "maxItems": 128
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

- [Official Documentation](https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/)
- [Workers AI Overview](https://developers.cloudflare.com/workers-ai/)
- [LLM Playground](https://playground.ai.cloudflare.com/?model=@cf/zai-org/glm-4.7-flash)
- [Cloudflare AI Models Catalog](https://developers.cloudflare.com/workers-ai/models/)
