# **Cloudflare AI Models — Complete Reference**

*Generated: 2026-05-18 | Total: 137 models (73 Workers AI \+ 64 Catalog/Partner)*

---

## **Part 1: Cloudflare Workers AI Models (80 models)**

Native Cloudflare-hosted models accessible via the Workers AI REST API.

| \# | Model Name | Task | UUID |
| ----- | ----- | ----- | ----- |
| 1 | [@cf/pipecat-ai/smart-turn-v2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pipecat-ai/smart-turn-v2) | Dumb Pipe | `fe8904cf-e20e-4884-b829-ed7cec0a01cb` |
| 2 | [@cf/openai/gpt-oss-120b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-oss-120b) | Text Generation | `f9f2250b-1048-4a52-9910-d0bf976616a1` |
| 3 | [@cf/baai/bge-m3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-m3) | Text Embeddings | `eed32bc1-8775-4985-89ce-dd1405508ad8` |
| 4 | [@cf/huggingface/distilbert-sst-2-int8](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/huggingface/distilbert-sst-2-int8) | Text Classification | `eaf31752-a074-441f-8b70-d593255d2811` |
| 5 | [@cf/google/gemma-2b-it-lora](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-2b-it-lora) | Text Generation | `e8e8abe4-a372-4c13-815f-4688ba655c8e` |
| 6 | [@cf/black-forest-labs/flux-2-klein-9b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-klein-9b) | Text-to-Image | `e580c765-810c-4da3-936c-a2808892f14c` |
| 7 | [@cf/meta/llama-3-8b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3-8b-instruct) | Text Generation | `e11d8f45-7b08-499a-9eeb-71d4d3c8cbf9` |
| 8 | [@cf/meta/llama-3.2-3b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-3b-instruct) | Text Generation | `d9dc8363-66f4-4bb0-8641-464ee7bfc131` |
| 9 | [@cf/moonshotai/kimi-k2.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/moonshotai/kimi-k2.5) | Text Generation | `d7948af7-749a-4fa3-8480-2a9f4215f427` |
| 10 | [@cf/meta/llama-guard-3-8b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-guard-3-8b) | Text Generation | `cc80437b-9a8d-4f1a-9c77-9aaf0d226922` |
| 11 | [@cf/qwen/qwen3-embedding-0.6b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen3-embedding-0.6b) | Text Embeddings | `cb254e3b-372b-4d4e-8526-ada79940427a` |
| 12 | [@cf/meta/llama-2-7b-chat-fp16](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-2-7b-chat-fp16) | Text Generation | `ca54bcd6-0d98-4739-9b3b-5c8b4402193d` |
| 13 | [@cf/mistral/mistral-7b-instruct-v0.1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.1) | Text Generation | `c907d0f9-d69d-4e93-b501-4daeb4fd69eb` |
| 14 | [@cf/myshell-ai/melotts](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/myshell-ai/melotts) | Text-to-Speech | `c837b2ac-4d9b-4d37-8811-34de60f0c44f` |
| 15 | [@cf/mistral/mistral-7b-instruct-v0.2-lora](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.2-lora) | Text Generation | `c58c317b-0c15-4bda-abb6-93e275f282d9` |
| 16 | [@cf/deepgram/aura-2-es](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-2-es) | Text-to-Speech | `c5255b94-2161-4779-bd25-54f061829a2a` |
| 17 | [@cf/openai/whisper](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper) | Automatic Speech Recognition | `c1c12ce4-c36a-4aa6-8da4-f63ba4b8984d` |
| 18 | [@cf/pfnet/plamo-embedding-1b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pfnet/plamo-embedding-1b) | Text Embeddings | `bc2b61f6-7eb3-4cdf-94f5-ffc128bd6aa4` |
| 19 | [@hf/mistral/mistral-7b-instruct-v0.2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.2) | Text Generation | `b97d7069-48d9-461c-80dd-445d20a632eb` |
| 20 | [@cf/llava-hf/llava-1.5-7b-hf](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/llava-hf/llava-1.5-7b-hf) | Image-to-Text | `af274959-cb47-4ba8-9d8e-5a0a58b6b402` |
| 21 | [@cf/deepseek-ai/deepseek-r1-distill-qwen-32b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepseek-ai/deepseek-r1-distill-qwen-32b) | Text Generation | `ad01ab83-baf8-4e7b-8fed-a0a219d4eb45` |
| 22 | [@cf/runwayml/stable-diffusion-v1-5-inpainting](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/stable-diffusion-v1-5-inpainting) | Text-to-Image | `a9abaef0-3031-47ad-8790-d311d8684c6c` |
| 23 | [@cf/deepgram/flux](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/flux) | Automatic Speech Recognition | `a2a2afba-b609-4325-8c41-5791ce962239` |
| 24 | [@cf/deepgram/nova-3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/nova-3) | Automatic Speech Recognition | `a226909f-eef8-4265-a3a0-90db0422762e` |
| 25 | [@cf/black-forest-labs/flux-1-schnell](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-1-schnell) | Text-to-Image | `9e087485-23dc-47fa-997d-f5bfafc0c7cc` |
| 26 | [@cf/meta/llama-2-7b-chat-int8](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-2-7b-chat-int8) | Text Generation | `9c95c39d-45b3-4163-9631-22f0c0dc3b14` |
| 27 | [@cf/meta/llama-3.1-8b-instruct-fp8](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct-fp8) | Text Generation | `9b9c87c6-d4b7-494c-b177-87feab5904db` |
| 28 | [@cf/meta/llama-3.2-1b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-1b-instruct) | Text Generation | `906a57fd-b018-4d6c-a43e-a296d4cc5839` |
| 29 | [@cf/moonshotai/kimi-k2.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/moonshotai/kimi-k2.6) | Text Generation | `8a5d00bd-de28-4a28-b37a-ce46d01ebaeb` |
| 30 | [@cf/zai-org/glm-4.7-flash](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/zai-org/glm-4.7-flash) | Text Generation | `86b3e51a-4b05-43fa-a403-0f27821919d2` |
| 31 | [@cf/microsoft/resnet-50](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/microsoft/resnet-50) | Image Classification | `7f9a76e1-d120-48dd-a565-101d328bbb02` |
| 32 | [@cf/bytedance/stable-diffusion-xl-lightning](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/stable-diffusion-xl-lightning) | Text-to-Image | `7f797b20-3eb0-44fd-b571-6cbbaa3c423b` |
| 33 | [@cf/meta-llama/llama-2-7b-chat-hf-lora](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta-llama/llama-2-7b-chat-hf-lora) | Text Generation | `7ed8d8e8-6040-4680-843a-aef402d6b013` |
| 34 | [@cf/meta/llama-3.3-70b-instruct-fp8-fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.3-70b-instruct-fp8-fast) | Text Generation | `7a143886-c9bb-4a1c-be95-377b1973bc3b` |
| 35 | [@cf/ibm-granite/granite-4.0-h-micro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/ibm-granite/granite-4.0-h-micro) | Text Generation | `7952d0cc-cb00-4e10-be02-667565c2ee0f` |
| 36 | [@cf/lykon/dreamshaper-8-lcm](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/lykon/dreamshaper-8-lcm) | Text-to-Image | `7912c0ab-542e-44b9-b9ee-3113d226a8b5` |
| 37 | [@cf/leonardo/phoenix-1.0](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/leonardo/phoenix-1.0) | Text-to-Image | `724608fa-983e-495d-b95c-340d6b7e78be` |
| 38 | [@cf/stabilityai/stable-diffusion-xl-base-1.0](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/stabilityai/stable-diffusion-xl-base-1.0) | Text-to-Image | `6d52253a-b731-4a03-b203-cde2d4fae871` |
| 39 | [@cf/meta/m2m100-1.2b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/m2m100-1.2b) | Translation | `617e7ec3-bf8d-4088-a863-4f89582d91b5` |
| 40 | [@cf/ai4bharat/indictrans2-en-indic-1B](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/ai4bharat/indictrans2-en-indic-1B) | Translation | `60920ed4-cf72-449a-a0f3-a38456b78262` |
| 41 | [@cf/black-forest-labs/flux-2-klein-4b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-klein-4b) | Text-to-Image | `5cdffa8e-1b1e-48e8-85f1-ab9b943cdd32` |
| 42 | [@cf/baai/bge-small-en-v1.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-small-en-v1.5) | Text Embeddings | `57fbd08a-a4c4-411c-910d-b9459ff36c20` |
| 43 | [@cf/qwen/qwen2.5-coder-32b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen2.5-coder-32b-instruct) | Text Generation | `51b71d5b-8bc0-4489-a107-95e542b69914` |
| 44 | [@hf/nousresearch/hermes-2-pro-mistral-7b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/nousresearch/hermes-2-pro-mistral-7b) | Text Generation | `44774b85-08c8-4bb8-8d2a-b06ebc538a79` |
| 45 | [@cf/nvidia/nemotron-3-120b-a12b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/nvidia/nemotron-3-120b-a12b) | Text Generation | `43dbadb4-2b0a-47e9-8479-34a49b971f1e` |
| 46 | [@cf/baai/bge-base-en-v1.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-base-en-v1.5) | Text Embeddings | `429b9e8b-d99e-44de-91ad-706cf8183658` |
| 47 | [@cf/aisingapore/gemma-sea-lion-v4-27b-it](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/aisingapore/gemma-sea-lion-v4-27b-it) | Text Generation | `41ca173f-72d5-4420-8915-49e835d2676e` |
| 48 | [@cf/qwen/qwen3-30b-a3b-fp8](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen3-30b-a3b-fp8) | Text Generation | `4090e54c-eee4-4221-b410-10c1c0f92f17` |
| 49 | [@cf/meta/llama-3.1-8b-instruct-awq](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct-awq) | Text Generation | `3dcb4f2d-26a8-412b-b6e3-2a368beff66b` |
| 50 | [@cf/unum/uform-gen2-qwen-500m](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/unum/uform-gen2-qwen-500m) | Image-to-Text | `3dca5889-db3e-4973-aa0c-3a4a6bd22d29` |
| 51 | [@cf/black-forest-labs/flux-2-dev](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-dev) | Text-to-Image | `3ae8936e-593e-4fb2-85ee-95dd8a057588` |
| 52 | [@cf/google/gemma-7b-it-lora](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-7b-it-lora) | Text Generation | `337170b7-bd2f-4631-9a57-688b579cf6d3` |
| 53 | [@cf/google/gemma-4-26b-a4b-it](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-4-26b-a4b-it) | Text Generation | `328adb49-4a7d-43e3-a2d5-802ae8100fe7` |
| 54 | [@cf/mistralai/mistral-small-3.1-24b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistralai/mistral-small-3.1-24b-instruct) | Text Generation | `31690291-ebdc-4f98-bcfc-a44844e215b7` |
| 55 | [@cf/meta/llama-3-8b-instruct-awq](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3-8b-instruct-awq) | Text Generation | `31097538-a3ff-4e6e-bb56-ad0e1f428b61` |
| 56 | [@cf/meta/llama-3.2-11b-vision-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-11b-vision-instruct) | Text Generation | `2cbc033b-ded8-4e02-bbb2-47cf05d5cfe5` |
| 57 | [@cf/openai/whisper-tiny-en](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper-tiny-en) | Automatic Speech Recognition | `2169496d-9c0e-4e49-8399-c44ee66bff7d` |
| 58 | [@cf/openai/whisper-large-v3-turbo](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper-large-v3-turbo) | Automatic Speech Recognition | `200f0812-148c-48c1-915d-fb3277a94a08` |
| 59 | [@cf/deepgram/aura-1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-1) | Text-to-Speech | `1f55679f-009e-4456-aa4f-049a62b4b6a0` |
| 60 | [@cf/defog/sqlcoder-7b-2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/defog/sqlcoder-7b-2) | Text Generation | `1dc9e589-df6b-4e66-ac9f-ceff42d64983` |
| 61 | [@cf/microsoft/phi-2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/microsoft/phi-2) | Text Generation | `1d933df3-680f-4280-940d-da87435edb07` |
| 62 | [@cf/facebook/bart-large-cnn](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/facebook/bart-large-cnn) | Summarization | `19bd38eb-bcda-4e53-bec2-704b4689b43a` |
| 63 | [@cf/runwayml/stable-diffusion-v1-5-img2img](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/stable-diffusion-v1-5-img2img) | Text-to-Image | `19547f04-7a6a-4f87-bf2c-f5e32fb12dc5` |
| 64 | [@cf/openai/gpt-oss-20b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-oss-20b) | Text Generation | `188a4e1e-253e-46d0-9616-0bf8c149763f` |
| 65 | [@cf/google/embeddinggemma-300m](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/embeddinggemma-300m) | Text Embeddings | `15631501-2742-4346-a469-22fe202188a2` |
| 66 | [@cf/baai/bge-reranker-base](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-reranker-base) | Text Classification | `145337e7-cec3-4ebb-8e78-16ddfc75e580` |
| 67 | [@hf/google/gemma-7b-it](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-7b-it) | Text Generation | `0f002249-7d86-4698-aabf-8529ed86cefb` |
| 68 | [@cf/leonardo/lucid-origin](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/leonardo/lucid-origin) | Text-to-Image | `0e372c11-8720-46c9-a02d-666188a22dae` |
| 69 | [@cf/meta/llama-4-scout-17b-16e-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-4-scout-17b-16e-instruct) | Text Generation | `06455e78-19f7-487b-93cd-c05a3dd07813` |
| 70 | [@cf/google/gemma-3-12b-it](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-3-12b-it) | Text Generation | `053d5ac0-861b-4d3b-8501-e58d00417ef8` |
| 71 | [@cf/qwen/qwq-32b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwq-32b) | Text Generation | `02c16efa-29f5-4304-8e6c-3d188889f875` |
| 72 | [@cf/baai/bge-large-en-v1.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-large-en-v1.5) | Text Embeddings | `01bc2fb0-4bca-4598-b985-d2584a3f46c0` |
| 73 | [@cf/deepgram/aura-2-en](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-2-en) | Text-to-Speech | `01564c52-8717-47dc-8efd-907a2ca18301` |
| 74 | @cf/moonshotai/kimi-k2.7-code | Text Generation | `N/A` |
| 75 | @cf/zai-org/glm-5.2 | Text Generation | `N/A` |
| 76 | @cf/meta/llama-3.1-8b-instruct | Text Generation | `N/A` |
| 77 | @hf/meta-llama/meta-llama-3-8b-instruct | Text Generation | `N/A` |
| 78 | @cf/facebook/detr-resnet-50 | Object Detection | `N/A` |
| 79 | @cf/meta/llama-3.1-70b-instruct | Text Generation | `N/A` |
| 80 | @cf/meta/llama-3.1-8b-instruct-fast | Text Generation | `N/A` |

---

### **1\. @cf/pipecat-ai/smart-turn-v2**

**ID:** `fe8904cf-e20e-4884-b829-ed7cec0a01cb`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pipecat-ai/smart-turn-v2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pipecat-ai/smart-turn-v2)  
**Task:** Dumb Pipe  
**Description:** An open source, community-driven, native audio turn detection model in 2nd version  
**Created:** 2025-08-04  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per audio minute","price":0.000338,"currency":"USD"}\]  
* `realtime`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `audio` | object | Yes |  | readable stream with audio data and content-type specified for that data |
| `dtype` | string | No |  | type of data PCM data that's sent to the inference server as raw array |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `is_complete` | boolean | if true, end-of-turn was detected |
| `probability` | number | probability of the end-of-turn detection |

---

### **2\. @cf/openai/gpt-oss-120b**

**ID:** `f9f2250b-1048-4a52-9910-d0bf976616a1`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-oss-120b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-oss-120b)  
**Task:** Text Generation  
**Description:** OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-120b is for production, general purpose, high reasoning use-cases.  
**Created:** 2025-08-05  
**Tags:** None

**Configuration Properties:**

* `context_window`: 128000  
* `price`: \[{"unit":"per M input tokens","price":0.35,"currency":"USD"},{"unit":"per M output tokens","price":0.75,"currency":"USD"}\]  
* `function_calling`: true  
* `reasoning`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |
| `input` | any | Yes |  | Responses API Input messages. Refer to OpenAI Responses API docs to learn more about supported conte |
| `reasoning` | object | No |  |  |
| `requests` | array | Yes |  |  |

---

### **3\. @cf/baai/bge-m3**

**ID:** `eed32bc1-8775-4985-89ce-dd1405508ad8`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-m3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-m3)  
**Task:** Text Embeddings  
**Description:** Multi-Functionality, Multi-Linguality, and Multi-Granularity embeddings model.  
**Created:** 2024-05-22  
**Tags:** None

**Configuration Properties:**

* `context_window`: 60000  
* `price`: \[{"unit":"per M input tokens","price":0.0118,"currency":"USD"}\]

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `query` | string | No |  | A query you wish to perform against the provided contexts. If no query is provided the model with re |
| `contexts` | array | Yes |  | List of provided contexts. Note that the index in this array is important, as the response will refe |
| `truncate_inputs` | boolean | No | false | When provided with too long context should the model error out or truncate the context to fit? |
| `text` | any | Yes |  |  |
| `requests` | array | Yes |  | Batch of the embeddings requests to run using async-queue |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | array |  |
| `shape` | array |  |
| `pooling` | string | The pooling method used in the embedding process. |
| `data` | array | Embeddings of the requested text values |
| `request_id` | string | The async request id that can be used to obtain the results. |

---

### **4\. @cf/huggingface/distilbert-sst-2-int8**

**ID:** `eaf31752-a074-441f-8b70-d593255d2811`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/huggingface/distilbert-sst-2-int8](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/huggingface/distilbert-sst-2-int8)  
**Task:** Text Classification  
**Description:** Distilled BERT model that was finetuned on SST-2 for sentiment classification  
**Created:** 2023-09-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.0263,"currency":"USD"}\]  
* `info`: https://huggingface.co/Intel/distilbert-base-uncased-finetuned-sst-2-english-int8-static

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `text` | string | Yes |  | The text that you want to classify |

---

### **5\. @cf/google/gemma-2b-it-lora**

**ID:** `e8e8abe4-a372-4c13-815f-4688ba655c8e`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-2b-it-lora](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-2b-it-lora)  
**Task:** Text Generation  
**Description:** This is a Gemma-2B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.  
**Created:** 2024-04-02  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 8192  
* `lora`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **6\. @cf/black-forest-labs/flux-2-klein-9b**

**ID:** `e580c765-810c-4da3-936c-a2808892f14c`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-klein-9b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-klein-9b)  
**Task:** Text-to-Image  
**Description:** FLUX.2 \[klein\] 9B is a 9 billion parameter model that can generate images from text descriptions and supports multi-reference editing capabilities.  
**Created:** 2026-01-14  
**Tags:** None

**Configuration Properties:**

* `partner`: true  
* `terms`: https://bfl.ai/legal/terms-of-service

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `multipart` | object | Yes |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `image` | string | Generated image as Base64 string. |

---

### **7\. @cf/meta/llama-3-8b-instruct**

**ID:** `e11d8f45-7b08-499a-9eeb-71d4d3c8cbf9`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3-8b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3-8b-instruct)  
**Task:** Text Generation  
**Description:** Generation over generation, Meta Llama 3 demonstrates state-of-the-art performance on a wide range of industry benchmarks and offers new capabilities, including improved reasoning.  
**Created:** 2024-04-18  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.282,"currency":"USD"},{"unit":"per M output tokens","price":0.827,"currency":"USD"}\]  
* `context_window`: 7968  
* `info`: https://llama.meta.com  
* `planned_deprecation_date`: 2026-05-30  
* `terms`: https://llama.meta.com/llama3/license/\#

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **8\. @cf/meta/llama-3.2-3b-instruct**

**ID:** `d9dc8363-66f4-4bb0-8641-464ee7bfc131`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-3b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-3b-instruct)  
**Task:** Text Generation  
**Description:** The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.  
**Created:** 2024-09-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.0509,"currency":"USD"},{"unit":"per M output tokens","price":0.335,"currency":"USD"}\]  
* `context_window`: 80000  
* `terms`: https://github.com/meta-llama/llama-models/blob/main/models/llama3\_2/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **9\. @cf/moonshotai/kimi-k2.5**

**ID:** `d7948af7-749a-4fa3-8480-2a9f4215f427`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/moonshotai/kimi-k2.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/moonshotai/kimi-k2.5)  
**Task:** Text Generation  
**Description:** Kimi K2.5 is a frontier-scale open-source model with a 256k context window, multi-turn tool calling, vision inputs, and structured outputs for agentic workloads.  
**Created:** 2026-02-02  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `context_window`: 256000  
* `price`: \[{"unit":"per M input tokens","price":0.6,"currency":"USD"},{"unit":"per M output tokens","price":3,"currency":"USD"},{"unit":"per M cached input tokens","price":0.1,"currency":"USD"}\]  
* `function_calling`: true  
* `planned_deprecation_date`: 2026-05-30  
* `reasoning`: true  
* `terms`: https://github.com/MoonshotAI/Kimi-K2.5/blob/master/LICENSE  
* `vision`: true

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `id` | string | A unique identifier for the chat completion. |
| `object` | string |  |
| `created` | integer | Unix timestamp (seconds) of when the completion was created. |
| `model` | string | The model used for the chat completion. |
| `choices` | array |  |
| `usage` | any |  |
| `system_fingerprint` | any |  |
| `service_tier` | any |  |

---

### **10\. @cf/meta/llama-guard-3-8b**

**ID:** `cc80437b-9a8d-4f1a-9c77-9aaf0d226922`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-guard-3-8b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-guard-3-8b)  
**Task:** Text Generation  
**Description:** Llama Guard 3 is a Llama-3.1-8B pretrained model, fine-tuned for content safety classification. Similar to previous versions, it can be used to classify content in both LLM inputs (prompt classification) and in LLM responses (response classification). It acts as an LLM – it generates text in its output that indicates whether a given prompt or response is safe or unsafe, and if unsafe, it also lists the content categories violated.  
**Created:** 2025-01-22  
**Tags:** moderation, safety, content-filtering, guardrails

**Configuration Properties:**

* `context_window`: 131072  
* `price`: \[{"unit":"per M input tokens","price":0.484,"currency":"USD"},{"unit":"per M output tokens","price":0.03,"currency":"USD"}\]  
* `lora`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `response_format` | object | No |  | Dictate the output format of the generated response. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | any |  |
| `usage` | object | Usage statistics for the inference request |

---

### **11\. @cf/qwen/qwen3-embedding-0.6b**

**ID:** `cb254e3b-372b-4d4e-8526-ada79940427a`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen3-embedding-0.6b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen3-embedding-0.6b)  
**Task:** Text Embeddings  
**Description:** The Qwen3 Embedding model series is the latest proprietary model of the Qwen family, specifically designed for text embedding and ranking tasks.  
 **Created:** 2025-06-18  
**Tags:** None

**Configuration Properties:**

* `context_window`: 8192  
* `price`: \[{"unit":"per M input tokens","price":0.0118,"currency":"USD"}\]

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `queries` | any | No |  |  |
| `instruction` | string | No | Given a web search query, retrieve relevant passages that answer the query | Optional instruction for the task |
| `documents` | any | No |  |  |
| `text` | any | No |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `data` | array |  |
| `shape` | array |  |

---

### **12\. @cf/meta/llama-2-7b-chat-fp16**

**ID:** `ca54bcd6-0d98-4739-9b3b-5c8b4402193d`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-2-7b-chat-fp16](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-2-7b-chat-fp16)  
**Task:** Text Generation  
**Description:** Full precision (fp16) generative text model with 7 billion parameters from Meta  
**Created:** 2023-11-07  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.556,"currency":"USD"},{"unit":"per M output tokens","price":6.667,"currency":"USD"}\]  
* `context_window`: 4096  
* `info`: https://ai.meta.com/llama/  
* `planned_deprecation_date`: 2026-05-30  
* `terms`: https://ai.meta.com/resources/models-and-libraries/llama-downloads/

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **13\. @cf/mistral/mistral-7b-instruct-v0.1**

**ID:** `c907d0f9-d69d-4e93-b501-4daeb4fd69eb`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.1)  
**Task:** Text Generation  
**Description:** Instruct fine-tuned version of the Mistral-7b generative text model with 7 billion parameters  
**Created:** 2023-11-07  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.11,"currency":"USD"},{"unit":"per M output tokens","price":0.19,"currency":"USD"}\]  
* `context_window`: 2824  
* `info`: https://mistral.ai/news/announcing-mistral-7b/  
* `lora`: true  
* `planned_deprecation_date`: 2026-05-30

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **14\. @cf/myshell-ai/melotts**

**ID:** `c837b2ac-4d9b-4d37-8811-34de60f0c44f`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/myshell-ai/melotts](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/myshell-ai/melotts)  
**Task:** Text-to-Speech  
**Description:** MeloTTS is a high-quality multi-lingual text-to-speech library by MyShell.ai.  
**Created:** 2024-07-19  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per audio minute","price":0.000205,"currency":"USD"}\]

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the audio you want to generate |
| `lang` | string | No | en | The speech language (e.g., 'en' for English, 'fr' for French). Defaults to 'en' if not specified |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `audio` | string | The generated audio in MP3 format, base64-encoded |

---

### **15\. @cf/mistral/mistral-7b-instruct-v0.2-lora**

**ID:** `c58c317b-0c15-4bda-abb6-93e275f282d9`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.2-lora](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.2-lora)  
**Task:** Text Generation  
**Description:** The Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2.  
**Created:** 2024-04-01  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 15000  
* `lora`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **16\. @cf/deepgram/aura-2-es**

**ID:** `c5255b94-2161-4779-bd25-54f061829a2a`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-2-es](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-2-es)  
**Task:** Text-to-Speech  
**Description:** Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.  
**Created:** 2025-10-09  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per 1k characters","price":0.03,"currency":"USD"}\]  
* `partner`: true  
* `terms`: https://deepgram.com/terms  
* `realtime`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `speaker` | string | No | aquila | Speaker used to produce the audio. |
| `encoding` | string | No |  | Encoding of the output audio. |
| `container` | string | No |  | Container specifies the file format wrapper for the output audio. The available options depend on th |
| `text` | string | Yes |  | The text content to be converted to speech |
| `sample_rate` | number | No |  | Sample Rate specifies the sample rate for the output audio. Based on the encoding, different sample |
| `bit_rate` | number | No |  | The bitrate of the audio in bits per second. Choose from predefined ranges or specific values based |

---

### **17\. @cf/openai/whisper**

**ID:** `c1c12ce4-c36a-4aa6-8da4-f63ba4b8984d`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper)  
**Task:** Automatic Speech Recognition  
**Description:** Whisper is a general-purpose speech recognition model. It is trained on a large dataset of diverse audio and is also a multitasking model that can perform multilingual speech recognition, speech translation, and language identification.  
**Created:** 2023-09-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per audio minute","price":0.000453,"currency":"USD"}\]  
* `info`: https://openai.com/research/whisper

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `audio` | array | Yes |  | An array of integers that represent the audio data constrained to 8-bit unsigned integer values |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `text` | string | The transcription |
| `word_count` | number |  |
| `words` | array |  |
| `vtt` | string |  |

---

### **18\. @cf/pfnet/plamo-embedding-1b**

**ID:** `bc2b61f6-7eb3-4cdf-94f5-ffc128bd6aa4`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pfnet/plamo-embedding-1b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pfnet/plamo-embedding-1b)  
**Task:** Text Embeddings  
**Description:** PLaMo-Embedding-1B is a Japanese text embedding model developed by Preferred Networks, Inc. It can convert Japanese text input into numerical vectors and can be used for a wide range of applications, including information retrieval, text classification, and clustering.  
**Created:** 2025-09-24  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.0186,"currency":"USD"}\]

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `text` | any | Yes |  | Input text to embed. Can be a single string or a list of strings. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `data` | array | Embedding vectors, where each vector is a list of floats. |
| `shape` | array | Shape of the embedding data as \[number\_of\_embeddings, embedding\_dimension\]. |

---

### **19\. @hf/mistral/mistral-7b-instruct-v0.2**

**ID:** `b97d7069-48d9-461c-80dd-445d20a632eb`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistral/mistral-7b-instruct-v0.2)  
**Task:** Text Generation  
**Description:** The Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2. Mistral-7B-v0.2 has the following changes compared to Mistral-7B-v0.1: 32k context window (vs 8k context in v0.1), rope-theta \= 1e6, and no Sliding-Window Attention.  
**Created:** 2024-04-02  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 3072  
* `info`: https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2  
* `lora`: true  
* `max_batch_prefill_tokens`: 8192  
* `max_input_length`: 3072  
* `max_total_tokens`: 4096  
* `planned_deprecation_date`: 2026-05-30

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **20\. @cf/llava-hf/llava-1.5-7b-hf**

**ID:** `af274959-cb47-4ba8-9d8e-5a0a58b6b402`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/llava-hf/llava-1.5-7b-hf](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/llava-hf/llava-1.5-7b-hf)  
**Task:** Image-to-Text  
**Description:** LLaVA is an open-source chatbot trained by fine-tuning LLaMA/Vicuna on GPT-generated multimodal instruction-following data. It is an auto-regressive language model, based on the transformer architecture.  
**Created:** 2024-05-01  
**Tags:** None

**Configuration Properties:**

* `beta`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `image` | any | Yes |  |  |
| `temperature` | number | No |  | Controls the randomness of the output; higher values produce more random results. |
| `prompt` | string | No |  | The input text prompt for the model to generate a response. |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `top_p` | number | No |  | Controls the creativity of the AI's responses by adjusting how many possible words it considers. Low |
| `top_k` | number | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | number | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `max_tokens` | integer | No | 512 | The maximum number of tokens to generate in the response. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `description` | string |  |

---

### **21\. @cf/deepseek-ai/deepseek-r1-distill-qwen-32b**

**ID:** `ad01ab83-baf8-4e7b-8fed-a0a219d4eb45`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepseek-ai/deepseek-r1-distill-qwen-32b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepseek-ai/deepseek-r1-distill-qwen-32b)  
**Task:** Text Generation  
**Description:** DeepSeek-R1-Distill-Qwen-32B is a model distilled from DeepSeek-R1 based on Qwen2.5. It outperforms OpenAI-o1-mini across various benchmarks, achieving new state-of-the-art results for dense models.  
**Created:** 2025-01-22  
**Tags:** None

**Configuration Properties:**

* `context_window`: 80000  
* `price`: \[{"unit":"per M input tokens","price":0.497,"currency":"USD"},{"unit":"per M output tokens","price":4.881,"currency":"USD"}\]  
* `reasoning`: true  
* `terms`: https://github.com/deepseek-ai/DeepSeek-R1/blob/main/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **22\. @cf/runwayml/stable-diffusion-v1-5-inpainting**

**ID:** `a9abaef0-3031-47ad-8790-d311d8684c6c`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/stable-diffusion-v1-5-inpainting](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/stable-diffusion-v1-5-inpainting)  
**Task:** Text-to-Image  
**Description:** Stable Diffusion Inpainting is a latent text-to-image diffusion model capable of generating photo-realistic images given any text input, with the extra capability of inpainting the pictures by using a mask.  
**Created:** 2024-02-27  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `price`: \[{"unit":"per step","price":0,"currency":"USD"}\]  
* `info`: https://huggingface.co/runwayml/stable-diffusion-inpainting  
* `terms`: https://github.com/runwayml/stable-diffusion/blob/main/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the image you want to generate |
| `negative_prompt` | string | No |  | Text describing elements to avoid in the generated image |
| `height` | integer | No |  | The height of the generated image in pixels |
| `width` | integer | No |  | The width of the generated image in pixels |
| `image` | array | No |  | For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit |
| `image_b64` | string | No |  | For use with img2img tasks. A base64-encoded string of the input image |
| `mask` | array | No |  | An array representing An array of integers that represent mask image data for inpainting constrained |
| `num_steps` | integer | No | 20 | The number of diffusion steps; higher values can improve quality but take longer |
| `strength` | number | No | 1 | A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lo |
| `guidance` | number | No | 7.5 | Controls how closely the generated image should adhere to the prompt; higher values make the image m |
| `seed` | integer | No |  | Random seed for reproducibility of the image generation |

---

### **23\. @cf/deepgram/flux**

**ID:** `a2a2afba-b609-4325-8c41-5791ce962239`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/flux](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/flux)  
**Task:** Automatic Speech Recognition  
**Description:** Flux is the first conversational speech recognition model built specifically for voice agents.  
**Created:** 2025-09-29  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per audio minute (websocket)","price":0.0077,"currency":"USD"}\]  
* `partner`: true  
* `terms`: https://deepgram.com/terms  
* `realtime`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `encoding` | string | Yes |  | Encoding of the audio stream. Currently only supports raw signed little-endian 16-bit PCM. |
| `sample_rate` | string | Yes |  | Sample rate of the audio stream in Hz. |
| `eager_eot_threshold` | string | No |  | End-of-turn confidence required to fire an eager end-of-turn event. When set, enables EagerEndOfTurn |
| `eot_threshold` | string | No | 0.7 | End-of-turn confidence required to finish a turn. Valid Values 0.5 \- 0.9. |
| `eot_timeout_ms` | string | No | 5000 | A turn will be finished when this much time has passed after speech, regardless of EOT confidence. |
| `keyterm` | string | No |  | Keyterm prompting can improve recognition of specialized terminology. Pass multiple keyterm query pa |
| `mip_opt_out` | string | No | false | Opts out requests from the Deepgram Model Improvement Program. Refer to Deepgram Docs for pricing im |
| `tag` | string | No |  | Label your requests for the purpose of identification during usage reporting |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `request_id` | string | The unique identifier of the request (uuid) |
| `sequence_id` | integer | Starts at 0 and increments for each message the server sends to the client. |
| `event` | string | The type of event being reported. |
| `turn_index` | integer | The index of the current turn |
| `audio_window_start` | number | Start time in seconds of the audio range that was transcribed |
| `audio_window_end` | number | End time in seconds of the audio range that was transcribed |
| `transcript` | string | Text that was said over the course of the current turn |
| `words` | array | The words in the transcript |
| `end_of_turn_confidence` | number | Confidence that no more speech is coming in this turn |

---

### **24\. @cf/deepgram/nova-3**

**ID:** `a226909f-eef8-4265-a3a0-90db0422762e`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/nova-3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/nova-3)  
**Task:** Automatic Speech Recognition  
**Description:** Transcribe audio using Deepgram’s speech-to-text model  
**Created:** 2025-06-05  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per audio minute","price":0.0052,"currency":"USD"},{"unit":"per audio minute (websocket)","price":0.0092,"currency":"USD"}\]  
* `partner`: true  
* `terms`: https://deepgram.com/terms  
* `realtime`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `audio` | object | Yes |  |  |
| `custom_topic_mode` | string | No |  | Sets how the model will interpret strings submitted to the custom\_topic param. When strict, the mode |
| `custom_topic` | string | No |  | Custom topics you want the model to detect within your input audio or text if present Submit up to 1 |
| `custom_intent_mode` | string | No |  | Sets how the model will interpret intents submitted to the custom\_intent param. When strict, the mod |
| `custom_intent` | string | No |  | Custom intents you want the model to detect within your input audio if present |
| `detect_entities` | boolean | No |  | Identifies and extracts key entities from content in submitted audio |
| `detect_language` | boolean | No |  | Identifies the dominant language spoken in submitted audio |
| `diarize` | boolean | No |  | Recognize speaker changes. Each word in the transcript will be assigned a speaker number starting at |
| `dictation` | boolean | No |  | Identify and extract key entities from content in submitted audio |
| `encoding` | string | No |  | Specify the expected encoding of your submitted audio |
| `extra` | string | No |  | Arbitrary key-value pairs that are attached to the API response for usage in downstream processing |
| `filler_words` | boolean | No |  | Filler Words can help transcribe interruptions in your audio, like 'uh' and 'um' |
| `keyterm` | string | No |  | Key term prompting can boost or suppress specialized terminology and brands. |
| `keywords` | string | No |  | Keywords can boost or suppress specialized terminology and brands. |
| `language` | string | No |  | The BCP-47 language tag that hints at the primary spoken language. Depending on the Model and API en |
| `measurements` | boolean | No |  | Spoken measurements will be converted to their corresponding abbreviations. |
| `mip_opt_out` | boolean | No |  | Opts out requests from the Deepgram Model Improvement Program. Refer to our Docs for pricing impacts |
| `mode` | string | No |  | Mode of operation for the model representing broad area of topic that will be talked about in the su |
| `multichannel` | boolean | No |  | Transcribe each audio channel independently. |
| `numerals` | boolean | No |  | Numerals converts numbers from written format to numerical format. |
| `paragraphs` | boolean | No |  | Splits audio into paragraphs to improve transcript readability. |
| `profanity_filter` | boolean | No |  | Profanity Filter looks for recognized profanity and converts it to the nearest recognized non-profan |
| `punctuate` | boolean | No |  | Add punctuation and capitalization to the transcript. |
| `redact` | string | No |  | Redaction removes sensitive information from your transcripts. |
| `replace` | string | No |  | Search for terms or phrases in submitted audio and replaces them. |
| `search` | string | No |  | Search for terms or phrases in submitted audio. |
| `sentiment` | boolean | No |  | Recognizes the sentiment throughout a transcript or text. |
| `smart_format` | boolean | No |  | Apply formatting to transcript output. When set to true, additional formatting will be applied to tr |
| `topics` | boolean | No |  | Detect topics throughout a transcript or text. |
| `utterances` | boolean | No |  | Segments speech into meaningful semantic units. |
| `utt_split` | number | No |  | Seconds to wait before detecting a pause between words in submitted audio. |
| `channels` | number | No |  | The number of channels in the submitted audio |
| `interim_results` | boolean | No |  | Specifies whether the streaming endpoint should provide ongoing transcription updates as more audio |
| `endpointing` | string | No |  | Indicates how long model will wait to detect whether a speaker has finished speaking or pauses for a |
| `vad_events` | boolean | No |  | Indicates that speech has started. You'll begin receiving Speech Started messages upon speech starti |
| `utterance_end_ms` | boolean | No |  | Indicates how long model will wait to send an UtteranceEnd message after a word has been transcribed |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `results` | object |  |

---

### **25\. @cf/black-forest-labs/flux-1-schnell**

**ID:** `9e087485-23dc-47fa-997d-f5bfafc0c7cc`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-1-schnell](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-1-schnell)  
**Task:** Text-to-Image  
**Description:** FLUX.1 \[schnell\] is a 12 billion parameter rectified flow transformer capable of generating images from text descriptions.  
 **Created:** 2024-08-29  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per 512 by 512 tile","price":0.0000528,"currency":"USD"},{"unit":"per step","price":0.000106,"currency":"USD"}\]  
* `terms`: https://bfl.ai/legal/terms-of-service

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the image you want to generate. |
| `steps` | integer | No | 4 | The number of diffusion steps; higher values can improve quality but take longer. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `image` | string | The generated image in Base64 format. |

---

### **26\. @cf/meta/llama-2-7b-chat-int8**

**ID:** `9c95c39d-45b3-4163-9631-22f0c0dc3b14`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-2-7b-chat-int8](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-2-7b-chat-int8)  
**Task:** Text Generation  
**Description:** Quantized (int8) generative text model with 7 billion parameters from Meta  
**Created:** 2023-09-25  
**Tags:** None

**Configuration Properties:**

* `context_window`: 8192  
* `planned_deprecation_date`: 2026-05-30

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **27\. @cf/meta/llama-3.1-8b-instruct-fp8**

**ID:** `9b9c87c6-d4b7-494c-b177-87feab5904db`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct-fp8](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct-fp8)  
**Task:** Text Generation  
**Description:** Llama 3.1 8B quantized to FP8 precision  
**Created:** 2024-07-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.152,"currency":"USD"},{"unit":"per M output tokens","price":0.287,"currency":"USD"}\]  
* `context_window`: 32000  
* `terms`: https://github.com/meta-llama/llama-models/blob/main/models/llama3\_1/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **28\. @cf/meta/llama-3.2-1b-instruct**

**ID:** `906a57fd-b018-4d6c-a43e-a296d4cc5839`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-1b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-1b-instruct)  
**Task:** Text Generation  
**Description:** The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.  
**Created:** 2024-09-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.027,"currency":"USD"},{"unit":"per M output tokens","price":0.201,"currency":"USD"}\]  
* `context_window`: 60000  
* `terms`: https://github.com/meta-llama/llama-models/blob/main/models/llama3\_2/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **29\. @cf/moonshotai/kimi-k2.6**

**ID:** `8a5d00bd-de28-4a28-b37a-ce46d01ebaeb`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/moonshotai/kimi-k2.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/moonshotai/kimi-k2.6)  
**Task:** Text Generation  
**Description:** Kimi K2.6 is a frontier-scale open-source 1T parameter model with a 262.1k context window, multi-turn tool calling, vision inputs, and structured outputs for agentic workloads.  
**Created:** 2026-04-20  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `context_window`: 262144  
* `price`: \[{"unit":"per M input tokens","price":0.95,"currency":"USD"},{"unit":"per M output tokens","price":4,"currency":"USD"},{"unit":"per M cached input tokens","price":0.16,"currency":"USD"}\]  
* `function_calling`: true  
* `reasoning`: true  
* `terms`: https://huggingface.co/moonshotai/Kimi-K2.6/blob/main/LICENSE  
* `vision`: true

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `id` | string | A unique identifier for the chat completion. |
| `object` | string |  |
| `created` | integer | Unix timestamp (seconds) of when the completion was created. |
| `model` | string | The model used for the chat completion. |
| `choices` | array |  |
| `usage` | any |  |
| `system_fingerprint` | any |  |
| `service_tier` | any |  |

---

### **30\. @cf/zai-org/glm-4.7-flash**

**ID:** `86b3e51a-4b05-43fa-a403-0f27821919d2`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/zai-org/glm-4.7-flash](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/zai-org/glm-4.7-flash)  
**Task:** Text Generation  
**Description:** GLM-4.7-Flash is a fast and efficient multilingual text generation model with a 131,072 token context window. Optimized for dialogue, instruction-following, and multi-turn tool calling across 100+ languages.  
**Created:** 2026-01-28  
**Tags:** None

**Configuration Properties:**

* `context_window`: 131072  
* `price`: \[{"unit":"per M input tokens","price":0.0605,"currency":"USD"},{"unit":"per M output tokens","price":0.4,"currency":"USD"}\]  
* `function_calling`: true  
* `reasoning`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `model` | string | No |  | ID of the model to use (e.g. '@cf/zai-org/glm-4.7-flash, etc'). |
| `audio` | any | No |  |  |
| `frequency_penalty` | any | No | 0 | Penalizes new tokens based on their existing frequency in the text so far. |
| `logit_bias` | any | No |  | Modify the likelihood of specified tokens appearing in the completion. Maps token IDs to bias values |
| `logprobs` | any | No | false | Whether to return log probabilities of the output tokens. |
| `top_logprobs` | any | No |  | How many top log probabilities to return at each token position (0-20). Requires logprobs=true. |
| `max_tokens` | any | No |  | Deprecated in favor of max\_completion\_tokens. The maximum number of tokens to generate. |
| `max_completion_tokens` | any | No |  | An upper bound for the number of tokens that can be generated for a completion. |
| `metadata` | any | No |  | Set of 16 key-value pairs that can be attached to the object. |
| `modalities` | any | No |  | Output types requested from the model (e.g. \['text'\] or \['text', 'audio'\]). |
| `n` | any | No | 1 | How many chat completion choices to generate for each input message. |
| `parallel_tool_calls` | boolean | No | true | Whether to enable parallel function calling during tool use. |
| `prediction` | any | No |  |  |
| `presence_penalty` | any | No | 0 | Penalizes new tokens based on whether they appear in the text so far. |
| `reasoning_effort` | any | No |  | Constrains effort on reasoning for reasoning models (o1, o3-mini, etc.). |
| `chat_template_kwargs` | object | No |  |  |
| `response_format` | any | No |  |  |
| `seed` | any | No |  | If specified, the system will make a best effort to sample deterministically. |
| `service_tier` | any | No | auto | Specifies the processing type used for serving the request. |
| `stop` | any | No |  | Up to 4 sequences where the API will stop generating further tokens. |
| `store` | any | No | false | Whether to store the output for model distillation / evals. |
| `stream` | any | No | false | If true, partial message deltas will be sent as server-sent events. |
| `stream_options` | any | No |  |  |
| `temperature` | any | No | 1 | Sampling temperature between 0 and 2\. |
| `tool_choice` | any | No |  |  |
| `tools` | array | No |  | A list of tools the model may call. |
| `top_p` | any | No | 1 | Nucleus sampling: considers the results of the tokens with top\_p probability mass. |
| `user` | string | No |  | A unique identifier representing your end-user, for abuse monitoring. |
| `web_search_options` | any | No |  |  |
| `function_call` | any | No |  |  |
| `functions` | array | No |  |  |
| `messages` | array | Yes |  | A list of messages comprising the conversation so far. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `id` | string | A unique identifier for the chat completion. |
| `object` | string |  |
| `created` | integer | Unix timestamp (seconds) of when the completion was created. |
| `model` | string | The model used for the chat completion. |
| `choices` | array |  |
| `usage` | any |  |
| `system_fingerprint` | any |  |
| `service_tier` | any |  |

---

### **31\. @cf/microsoft/resnet-50**

**ID:** `7f9a76e1-d120-48dd-a565-101d328bbb02`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/microsoft/resnet-50](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/microsoft/resnet-50)  
**Task:** Image Classification  
**Description:** 50 layers deep image classification CNN trained on more than 1M images from ImageNet  
**Created:** 2023-09-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per inference request","price":0.00000251,"currency":"USD"}\]  
* `info`: https://www.microsoft.com/en-us/research/blog/microsoft-vision-model-resnet-50-combines-web-scale-data-and-multi-task-learning-to-achieve-state-of-the-art/

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `image` | array | Yes |  | An array of integers that represent the image data constrained to 8-bit unsigned integer values |

---

### **32\. @cf/bytedance/stable-diffusion-xl-lightning**

**ID:** `7f797b20-3eb0-44fd-b571-6cbbaa3c423b`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/stable-diffusion-xl-lightning](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/stable-diffusion-xl-lightning)  
**Task:** Text-to-Image  
**Description:** SDXL-Lightning is a lightning-fast text-to-image generation model. It can generate high-quality 1024px images in a few steps.  
**Created:** 2024-02-27  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `price`: \[{"unit":"per step","price":0,"currency":"USD"}\]  
* `info`: https://huggingface.co/ByteDance/SDXL-Lightning

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the image you want to generate |
| `negative_prompt` | string | No |  | Text describing elements to avoid in the generated image |
| `height` | integer | No |  | The height of the generated image in pixels |
| `width` | integer | No |  | The width of the generated image in pixels |
| `image` | array | No |  | For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit |
| `image_b64` | string | No |  | For use with img2img tasks. A base64-encoded string of the input image |
| `mask` | array | No |  | An array representing An array of integers that represent mask image data for inpainting constrained |
| `num_steps` | integer | No | 20 | The number of diffusion steps; higher values can improve quality but take longer |
| `strength` | number | No | 1 | A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lo |
| `guidance` | number | No | 7.5 | Controls how closely the generated image should adhere to the prompt; higher values make the image m |
| `seed` | integer | No |  | Random seed for reproducibility of the image generation |

---

### **33\. @cf/meta-llama/llama-2-7b-chat-hf-lora**

**ID:** `7ed8d8e8-6040-4680-843a-aef402d6b013`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta-llama/llama-2-7b-chat-hf-lora](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta-llama/llama-2-7b-chat-hf-lora)  
**Task:** Text Generation  
**Description:** This is a Llama2 base model that Cloudflare dedicated for inference with LoRA adapters. Llama 2 is a collection of pretrained and fine-tuned generative text models ranging in scale from 7 billion to 70 billion parameters. This is the repository for the 7B fine-tuned model, optimized for dialogue use cases and converted for the Hugging Face Transformers format.  
 **Created:** 2024-04-02  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 8192  
* `lora`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **34\. @cf/meta/llama-3.3-70b-instruct-fp8-fast**

**ID:** `7a143886-c9bb-4a1c-be95-377b1973bc3b`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.3-70b-instruct-fp8-fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.3-70b-instruct-fp8-fast)  
**Task:** Text Generation  
**Description:** Llama 3.3 70B quantized to fp8 precision, optimized to be faster.  
**Created:** 2024-12-06  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `context_window`: 24000  
* `price`: \[{"unit":"per M input tokens","price":0.293,"currency":"USD"},{"unit":"per M output tokens","price":2.253,"currency":"USD"}\]  
* `function_calling`: true  
* `terms`: https://github.com/meta-llama/llama-models/blob/main/models/llama3\_3/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |
| `requests` | array | No |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |
| `request_id` | string | The async request id that can be used to obtain the results. |

---

### **35\. @cf/ibm-granite/granite-4.0-h-micro**

**ID:** `7952d0cc-cb00-4e10-be02-667565c2ee0f`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/ibm-granite/granite-4.0-h-micro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/ibm-granite/granite-4.0-h-micro)  
**Task:** Text Generation  
**Description:** Granite 4.0 instruct models deliver strong performance across benchmarks, achieving industry-leading results in key agentic tasks like instruction following and function calling. These efficiencies make the models well-suited for a wide range of use cases like retrieval-augmented generation (RAG), multi-agent workflows, and edge deployments.  
**Created:** 2025-10-07  
**Tags:** None

**Configuration Properties:**

* `context_window`: 131000  
* `price`: \[{"unit":"per M input tokens","price":0.017,"currency":"USD"},{"unit":"per M output tokens","price":0.112,"currency":"USD"}\]  
* `function_calling`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **36\. @cf/lykon/dreamshaper-8-lcm**

**ID:** `7912c0ab-542e-44b9-b9ee-3113d226a8b5`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/lykon/dreamshaper-8-lcm](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/lykon/dreamshaper-8-lcm)  
**Task:** Text-to-Image  
**Description:** Stable Diffusion model that has been fine-tuned to be better at photorealism without sacrificing range.  
**Created:** 2024-02-27  
**Tags:** None

**Configuration Properties:**

* `info`: https://huggingface.co/Lykon/DreamShaper

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the image you want to generate |
| `negative_prompt` | string | No |  | Text describing elements to avoid in the generated image |
| `height` | integer | No |  | The height of the generated image in pixels |
| `width` | integer | No |  | The width of the generated image in pixels |
| `image` | array | No |  | For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit |
| `image_b64` | string | No |  | For use with img2img tasks. A base64-encoded string of the input image |
| `mask` | array | No |  | An array representing An array of integers that represent mask image data for inpainting constrained |
| `num_steps` | integer | No | 20 | The number of diffusion steps; higher values can improve quality but take longer |
| `strength` | number | No | 1 | A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lo |
| `guidance` | number | No | 7.5 | Controls how closely the generated image should adhere to the prompt; higher values make the image m |
| `seed` | integer | No |  | Random seed for reproducibility of the image generation |

---

### **37\. @cf/leonardo/phoenix-1.0**

**ID:** `724608fa-983e-495d-b95c-340d6b7e78be`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/leonardo/phoenix-1.0](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/leonardo/phoenix-1.0)  
**Task:** Text-to-Image  
**Description:** Phoenix 1.0 is a model by Leonardo.Ai that generates images with exceptional prompt adherence and coherent text.  
**Created:** 2025-08-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per 512 by 512 tile","price":0.00583,"currency":"USD"},{"unit":"per step","price":0.00011,"currency":"USD"}\]  
* `partner`: true  
* `terms`: https://leonardo.ai/terms-of-service/

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the image you want to generate. |
| `guidance` | number | No | 2 | Controls how closely the generated image should adhere to the prompt; higher values make the image m |
| `seed` | integer | No |  | Random seed for reproducibility of the image generation |
| `height` | integer | No | 1024 | The height of the generated image in pixels |
| `width` | integer | No | 1024 | The width of the generated image in pixels |
| `num_steps` | integer | No | 25 | The number of diffusion steps; higher values can improve quality but take longer |
| `negative_prompt` | string | No |  | Specify what to exclude from the generated images |

---

### **38\. @cf/stabilityai/stable-diffusion-xl-base-1.0**

**ID:** `6d52253a-b731-4a03-b203-cde2d4fae871`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/stabilityai/stable-diffusion-xl-base-1.0](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/stabilityai/stable-diffusion-xl-base-1.0)  
**Task:** Text-to-Image  
**Description:** Diffusion-based text-to-image generative model by Stability AI. Generates and modify images based on text prompts.  
**Created:** 2023-11-10  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `price`: \[{"unit":"per step","price":0,"currency":"USD"}\]  
* `info`: https://stability.ai/stable-diffusion  
* `terms`: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the image you want to generate |
| `negative_prompt` | string | No |  | Text describing elements to avoid in the generated image |
| `height` | integer | No |  | The height of the generated image in pixels |
| `width` | integer | No |  | The width of the generated image in pixels |
| `image` | array | No |  | For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit |
| `image_b64` | string | No |  | For use with img2img tasks. A base64-encoded string of the input image |
| `mask` | array | No |  | An array representing An array of integers that represent mask image data for inpainting constrained |
| `num_steps` | integer | No | 20 | The number of diffusion steps; higher values can improve quality but take longer |
| `strength` | number | No | 1 | A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lo |
| `guidance` | number | No | 7.5 | Controls how closely the generated image should adhere to the prompt; higher values make the image m |
| `seed` | integer | No |  | Random seed for reproducibility of the image generation |

---

### **39\. @cf/meta/m2m100-1.2b**

**ID:** `617e7ec3-bf8d-4088-a863-4f89582d91b5`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/m2m100-1.2b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/m2m100-1.2b)  
**Task:** Translation  
**Description:** Multilingual encoder-decoder (seq-to-seq) model trained for Many-to-Many multilingual translation  
**Created:** 2023-09-25  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per M input tokens","price":0.342,"currency":"USD"},{"unit":"per M output tokens","price":0.342,"currency":"USD"}\]  
* `info`: https://github.com/facebookresearch/fairseq/tree/main/examples/m2m\_100  
* `languages`: english, chinese, french, spanish, arabic, russian, german, japanese, portuguese, hindi  
* `terms`: https://github.com/facebookresearch/fairseq/blob/main/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `text` | string | Yes |  | The text to be translated |
| `source_lang` | string | No | en | The language code of the source text (e.g., 'en' for English). Defaults to 'en' if not specified |
| `target_lang` | string | Yes |  | The language code to translate the text into (e.g., 'es' for Spanish) |
| `requests` | array | Yes |  | Batch of the embeddings requests to run using async-queue |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `translated_text` | string | The translated text in the target language |
| `request_id` | string | The async request id that can be used to obtain the results. |

---

### **40\. @cf/ai4bharat/indictrans2-en-indic-1B**

**ID:** `60920ed4-cf72-449a-a0f3-a38456b78262`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/ai4bharat/indictrans2-en-indic-1B](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/ai4bharat/indictrans2-en-indic-1B)  
**Task:** Translation  
**Description:** IndicTrans2 is the first open-source transformer-based multilingual NMT model that supports high-quality translations across all the 22 scheduled Indic languages  
**Created:** 2025-09-23  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.342,"currency":"USD"},{"unit":"per M output tokens","price":0.342,"currency":"USD"}\]

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `text` | any | Yes |  | Input text to translate. Can be a single string or a list of strings. |
| `target_language` | string | Yes | hin\_Deva | Target langauge to translate to |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `translations` | array | Translated texts |

---

### **41\. @cf/black-forest-labs/flux-2-klein-4b**

**ID:** `5cdffa8e-1b1e-48e8-85f1-ab9b943cdd32`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-klein-4b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-klein-4b)  
**Task:** Text-to-Image  
**Description:** FLUX.2 \[klein\] is an ultra-fast, distilled image model. It unifies image generation and editing in a single model, delivering state-of-the-art quality enabling interactive workflows, real-time previews, and latency-critical applications.  
**Created:** 2026-01-14  
**Tags:** None

**Configuration Properties:**

* `partner`: true  
* `terms`: https://bfl.ai/legal/terms-of-service

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `multipart` | object | Yes |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `image` | string | Generated image as Base64 string. |

---

### **42\. @cf/baai/bge-small-en-v1.5**

**ID:** `57fbd08a-a4c4-411c-910d-b9459ff36c20`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-small-en-v1.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-small-en-v1.5)  
**Task:** Text Embeddings  
**Description:** BAAI general embedding (Small) model that transforms any given text into a 384-dimensional vector  
**Created:** 2023-11-07  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per M input tokens","price":0.0202,"currency":"USD"}\]  
* `info`: https://huggingface.co/BAAI/bge-small-en-v1.5  
* `max_input_tokens`: 512  
* `output_dimensions`: 384

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `text` | any | Yes |  |  |
| `pooling` | string | No | mean | The pooling method used in the embedding process. \`cls\` pooling will generate more accurate embeddin |
| `requests` | array | Yes |  | Batch of the embeddings requests to run using async-queue |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `shape` | array |  |
| `data` | array | Embeddings of the requested text values |
| `pooling` | string | The pooling method used in the embedding process. |
| `request_id` | string | The async request id that can be used to obtain the results. |

---

### **43\. @cf/qwen/qwen2.5-coder-32b-instruct**

**ID:** `51b71d5b-8bc0-4489-a107-95e542b69914`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen2.5-coder-32b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen2.5-coder-32b-instruct)  
**Task:** Text Generation  
**Description:** Qwen2.5-Coder is the latest series of Code-Specific Qwen large language models (formerly known as CodeQwen). As of now, Qwen2.5-Coder has covered six mainstream model sizes, 0.5, 1.5, 3, 7, 14, 32 billion parameters, to meet the needs of different developers. Qwen2.5-Coder brings the following improvements upon CodeQwen1.5:  
**Created:** 2025-02-27  
**Tags:** None

**Configuration Properties:**

* `context_window`: 32768  
* `price`: \[{"unit":"per M input tokens","price":0.66,"currency":"USD"},{"unit":"per M output tokens","price":1,"currency":"USD"}\]  
* `lora`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **44\. @hf/nousresearch/hermes-2-pro-mistral-7b**

**ID:** `44774b85-08c8-4bb8-8d2a-b06ebc538a79`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/nousresearch/hermes-2-pro-mistral-7b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/nousresearch/hermes-2-pro-mistral-7b)  
**Task:** Text Generation  
**Description:** Hermes 2 Pro on Mistral 7B is the new flagship 7B Hermes\! Hermes 2 Pro is an upgraded, retrained version of Nous Hermes 2, consisting of an updated and cleaned version of the OpenHermes 2.5 Dataset, as well as a newly introduced Function Calling and JSON Mode dataset developed in-house.  
**Created:** 2024-04-01  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 24000  
* `function_calling`: true  
* `info`: https://huggingface.co/NousResearch/Hermes-2-Pro-Mistral-7B  
* `planned_deprecation_date`: 2026-05-30

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **45\. @cf/nvidia/nemotron-3-120b-a12b**

**ID:** `43dbadb4-2b0a-47e9-8479-34a49b971f1e`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/nvidia/nemotron-3-120b-a12b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/nvidia/nemotron-3-120b-a12b)  
**Task:** Text Generation  
**Description:** NVIDIA Nemotron 3 Super is a hybrid MoE model with leading accuracy for multi-agent applications and specialized agentic AI systems.  
**Created:** 2026-02-24  
**Tags:** None

**Configuration Properties:**

* `context_window`: 256000  
* `price`: \[{"unit":"per M input tokens","price":0.5,"currency":"USD"},{"unit":"per M output tokens","price":1.5,"currency":"USD"}\]  
* `function_calling`: true  
* `reasoning`: true  
* `terms`: https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-nemotron-open-model-license/

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `model` | string | No |  | ID of the model to use (e.g. '@cf/zai-org/glm-4.7-flash, etc'). |
| `audio` | any | No |  |  |
| `frequency_penalty` | any | No | 0 | Penalizes new tokens based on their existing frequency in the text so far. |
| `logit_bias` | any | No |  | Modify the likelihood of specified tokens appearing in the completion. Maps token IDs to bias values |
| `logprobs` | any | No | false | Whether to return log probabilities of the output tokens. |
| `top_logprobs` | any | No |  | How many top log probabilities to return at each token position (0-20). Requires logprobs=true. |
| `max_tokens` | any | No |  | Deprecated in favor of max\_completion\_tokens. The maximum number of tokens to generate. |
| `max_completion_tokens` | any | No |  | An upper bound for the number of tokens that can be generated for a completion. |
| `metadata` | any | No |  | Set of 16 key-value pairs that can be attached to the object. |
| `modalities` | any | No |  | Output types requested from the model (e.g. \['text'\] or \['text', 'audio'\]). |
| `n` | any | No | 1 | How many chat completion choices to generate for each input message. |
| `parallel_tool_calls` | boolean | No | true | Whether to enable parallel function calling during tool use. |
| `prediction` | any | No |  |  |
| `presence_penalty` | any | No | 0 | Penalizes new tokens based on whether they appear in the text so far. |
| `reasoning_effort` | any | No |  | Constrains effort on reasoning for reasoning models (o1, o3-mini, etc.). |
| `chat_template_kwargs` | object | No |  |  |
| `response_format` | any | No |  |  |
| `seed` | any | No |  | If specified, the system will make a best effort to sample deterministically. |
| `service_tier` | any | No | auto | Specifies the processing type used for serving the request. |
| `stop` | any | No |  | Up to 4 sequences where the API will stop generating further tokens. |
| `store` | any | No | false | Whether to store the output for model distillation / evals. |
| `stream` | any | No | false | If true, partial message deltas will be sent as server-sent events. |
| `stream_options` | any | No |  |  |
| `temperature` | any | No | 1 | Sampling temperature between 0 and 2\. |
| `tool_choice` | any | No |  |  |
| `tools` | array | No |  | A list of tools the model may call. |
| `top_p` | any | No | 1 | Nucleus sampling: considers the results of the tokens with top\_p probability mass. |
| `user` | string | No |  | A unique identifier representing your end-user, for abuse monitoring. |
| `web_search_options` | any | No |  |  |
| `function_call` | any | No |  |  |
| `functions` | array | No |  |  |
| `messages` | array | Yes |  | A list of messages comprising the conversation so far. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `id` | string | A unique identifier for the chat completion. |
| `object` | string |  |
| `created` | integer | Unix timestamp (seconds) of when the completion was created. |
| `model` | string | The model used for the chat completion. |
| `choices` | array |  |
| `usage` | any |  |
| `system_fingerprint` | any |  |
| `service_tier` | any |  |

---

### **46\. @cf/baai/bge-base-en-v1.5**

**ID:** `429b9e8b-d99e-44de-91ad-706cf8183658`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-base-en-v1.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-base-en-v1.5)  
**Task:** Text Embeddings  
**Description:** BAAI general embedding (Base) model that transforms any given text into a 768-dimensional vector  
**Created:** 2023-09-25  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `context_window`: 153600  
* `price`: \[{"unit":"per M input tokens","price":0.0666,"currency":"USD"}\]  
* `info`: https://huggingface.co/BAAI/bge-base-en-v1.5  
* `max_input_tokens`: 512  
* `output_dimensions`: 768

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `text` | any | Yes |  |  |
| `pooling` | string | No | mean | The pooling method used in the embedding process. \`cls\` pooling will generate more accurate embeddin |
| `requests` | array | Yes |  | Batch of the embeddings requests to run using async-queue |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `shape` | array |  |
| `data` | array | Embeddings of the requested text values |
| `pooling` | string | The pooling method used in the embedding process. |
| `request_id` | string | The async request id that can be used to obtain the results. |

---

### **47\. @cf/aisingapore/gemma-sea-lion-v4-27b-it**

**ID:** `41ca173f-72d5-4420-8915-49e835d2676e`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/aisingapore/gemma-sea-lion-v4-27b-it](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/aisingapore/gemma-sea-lion-v4-27b-it)  
**Task:** Text Generation  
**Description:** SEA-LION stands for Southeast Asian Languages In One Network, which is a collection of Large Language Models (LLMs) which have been pretrained and instruct-tuned for the Southeast Asia (SEA) region.  
**Created:** 2025-09-23  
**Tags:** None

**Configuration Properties:**

* `context_window`: 128000  
* `price`: \[{"unit":"per M input tokens","price":0.351,"currency":"USD"},{"unit":"per M output tokens","price":0.555,"currency":"USD"}\]

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 2000 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |
| `requests` | array | Yes |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `id` | string | Unique identifier for the completion |
| `object` | string | Object type identifier |
| `created` | number | Unix timestamp of when the completion was created |
| `model` | string | Model used for the completion |
| `choices` | array | List of completion choices |
| `usage` | object | Usage statistics for the inference request |
| `prompt_logprobs` | object,null | Log probabilities for the prompt (if requested) |
| `request_id` | string | The async request id that can be used to obtain the results. |

---

### **48\. @cf/qwen/qwen3-30b-a3b-fp8**

**ID:** `4090e54c-eee4-4221-b410-10c1c0f92f17`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen3-30b-a3b-fp8](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwen3-30b-a3b-fp8)  
**Task:** Text Generation  
**Description:** Qwen3 is the latest generation of large language models in Qwen series, offering a comprehensive suite of dense and mixture-of-experts (MoE) models. Built upon extensive training, Qwen3 delivers groundbreaking advancements in reasoning, instruction-following, agent capabilities, and multilingual support.  
**Created:** 2025-04-30  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `context_window`: 32768  
* `price`: \[{"unit":"per M input tokens","price":0.0509,"currency":"USD"},{"unit":"per M output tokens","price":0.335,"currency":"USD"}\]  
* `function_calling`: true  
* `reasoning`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 2000 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |
| `requests` | array | Yes |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `id` | string | Unique identifier for the completion |
| `object` | string | Object type identifier |
| `created` | number | Unix timestamp of when the completion was created |
| `model` | string | Model used for the completion |
| `choices` | array | List of completion choices |
| `usage` | object | Usage statistics for the inference request |
| `prompt_logprobs` | object,null | Log probabilities for the prompt (if requested) |
| `request_id` | string | The async request id that can be used to obtain the results. |

---

### **49\. @cf/meta/llama-3.1-8b-instruct-awq**

**ID:** `3dcb4f2d-26a8-412b-b6e3-2a368beff66b`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct-awq](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct-awq)  
**Task:** Text Generation  
**Description:** Quantized (int4) generative text model with 8 billion parameters from Meta.  
 **Created:** 2024-07-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.123,"currency":"USD"},{"unit":"per M output tokens","price":0.266,"currency":"USD"}\]  
* `context_window`: 8192  
* `planned_deprecation_date`: 2026-05-30  
* `terms`: https://github.com/meta-llama/llama-models/blob/main/models/llama3\_1/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **50\. @cf/unum/uform-gen2-qwen-500m**

**ID:** `3dca5889-db3e-4973-aa0c-3a4a6bd22d29`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/unum/uform-gen2-qwen-500m](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/unum/uform-gen2-qwen-500m)  
**Task:** Image-to-Text  
**Description:** UForm-Gen is a small generative vision-language model primarily designed for Image Captioning and Visual Question Answering. The model was pre-trained on the internal image captioning dataset and fine-tuned on public instructions datasets: SVIT, LVIS, VQAs datasets.  
**Created:** 2024-02-27  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `info`: https://www.unum.cloud/  
* `planned_deprecation_date`: 2026-05-30

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | No |  | The input text prompt for the model to generate a response. |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `top_p` | number | No |  | Controls the creativity of the AI's responses by adjusting how many possible words it considers. Low |
| `top_k` | number | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | number | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `image` | any | Yes |  |  |
| `max_tokens` | integer | No | 512 | The maximum number of tokens to generate in the response. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `description` | string |  |

---

### **51\. @cf/black-forest-labs/flux-2-dev**

**ID:** `3ae8936e-593e-4fb2-85ee-95dd8a057588`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-dev](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/black-forest-labs/flux-2-dev)  
**Task:** Text-to-Image  
**Description:** FLUX.2 \[dev\] is an image model from Black Forest Labs where you can generate highly realistic and detailed images, with multi-reference support.  
**Created:** 2025-11-24  
**Tags:** None

**Configuration Properties:**

* `partner`: true  
* `terms`: https://bfl.ai/legal/terms-of-service

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `multipart` | object | Yes |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `image` | string | Generated image as Base64 string. |

---

### **52\. @cf/google/gemma-7b-it-lora**

**ID:** `337170b7-bd2f-4631-9a57-688b579cf6d3`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-7b-it-lora](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-7b-it-lora)  
**Task:** Text Generation  
**Description:** This is a Gemma-7B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.  
**Created:** 2024-04-02  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 3500  
* `lora`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **53\. @cf/google/gemma-4-26b-a4b-it**

**ID:** `328adb49-4a7d-43e3-a2d5-802ae8100fe7`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-4-26b-a4b-it](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-4-26b-a4b-it)  
**Task:** Text Generation  
**Description:** Gemma 4 is Google's most intelligent family of open models, built from Gemini 3 research to maximize intelligence-per-parameter.  
**Created:** 2026-04-02  
**Tags:** None

**Configuration Properties:**

* `context_window`: 256000  
* `price`: \[{"unit":"per M input tokens","price":0.1,"currency":"USD"},{"unit":"per M output tokens","price":0.3,"currency":"USD"}\]  
* `function_calling`: true  
* `reasoning`: true  
* `terms`: https://ai.google.dev/gemma/docs/gemma\_4\_license  
* `vision`: true

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `id` | string | A unique identifier for the chat completion. |
| `object` | string |  |
| `created` | integer | Unix timestamp (seconds) of when the completion was created. |
| `model` | string | The model used for the chat completion. |
| `choices` | array |  |
| `usage` | any |  |
| `system_fingerprint` | any |  |
| `service_tier` | any |  |

---

### **54\. @cf/mistralai/mistral-small-3.1-24b-instruct**

**ID:** `31690291-ebdc-4f98-bcfc-a44844e215b7`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistralai/mistral-small-3.1-24b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/mistralai/mistral-small-3.1-24b-instruct)  
**Task:** Text Generation  
**Description:** Building upon Mistral Small 3 (2501), Mistral Small 3.1 (2503) adds state-of-the-art vision understanding and enhances long context capabilities up to 128k tokens without compromising text performance. With 24 billion parameters, this model achieves top-tier capabilities in both text and vision tasks.  
**Created:** 2025-03-18  
**Tags:** None

**Configuration Properties:**

* `context_window`: 128000  
* `price`: \[{"unit":"per M input tokens","price":0.351,"currency":"USD"},{"unit":"per M output tokens","price":0.555,"currency":"USD"}\]  
* `function_calling`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `guided_json` | object | No |  | JSON schema that should be fulfilled for the response. |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.15 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **55\. @cf/meta/llama-3-8b-instruct-awq**

**ID:** `31097538-a3ff-4e6e-bb56-ad0e1f428b61`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3-8b-instruct-awq](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3-8b-instruct-awq)  
**Task:** Text Generation  
**Description:** Quantized (int4) generative text model with 8 billion parameters from Meta.  
**Created:** 2024-05-09  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.123,"currency":"USD"},{"unit":"per M output tokens","price":0.266,"currency":"USD"}\]  
* `context_window`: 8192  
* `info`: https://llama.meta.com  
* `planned_deprecation_date`: 2026-05-30  
* `terms`: https://llama.meta.com/llama3/license/\#

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **56\. @cf/meta/llama-3.2-11b-vision-instruct**

**ID:** `2cbc033b-ded8-4e02-bbb2-47cf05d5cfe5`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-11b-vision-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.2-11b-vision-instruct)  
**Task:** Text Generation  
**Description:** The Llama 3.2-Vision instruction-tuned models are optimized for visual recognition, image reasoning, captioning, and answering general questions about an image.  
**Created:** 2024-09-25  
**Tags:** None

**Configuration Properties:**

* `context_window`: 128000  
* `price`: \[{"unit":"per M input tokens","price":0.0485,"currency":"USD"},{"unit":"per M output tokens","price":0.676,"currency":"USD"}\]  
* `lora`: true  
* `terms`: https://github.com/meta-llama/llama-models/blob/main/models/llama3\_2/LICENSE  
* `vision`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `image` | any | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **57\. @cf/openai/whisper-tiny-en**

**ID:** `2169496d-9c0e-4e49-8399-c44ee66bff7d`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper-tiny-en](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper-tiny-en)  
**Task:** Automatic Speech Recognition  
**Description:** Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. Trained on 680k hours of labelled data, Whisper models demonstrate a strong ability to generalize to many datasets and domains without the need for fine-tuning. This is the English-only version of the Whisper Tiny model which was trained on the task of speech recognition.  
**Created:** 2024-04-22  
**Tags:** None

**Configuration Properties:**

* `beta`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `audio` | array | Yes |  | An array of integers that represent the audio data constrained to 8-bit unsigned integer values |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `text` | string | The transcription |
| `word_count` | number |  |
| `words` | array |  |
| `vtt` | string |  |

---

### **58\. @cf/openai/whisper-large-v3-turbo**

**ID:** `200f0812-148c-48c1-915d-fb3277a94a08`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper-large-v3-turbo](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/whisper-large-v3-turbo)  
**Task:** Automatic Speech Recognition  
**Description:** Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation.  
 **Created:** 2024-05-22  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per audio minute","price":0.000513,"currency":"USD"}\]

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `audio` | any | Yes |  |  |
| `task` | string | No | transcribe | Supported tasks are 'translate' or 'transcribe'. |
| `language` | string | No |  | The language of the audio being transcribed or translated. |
| `vad_filter` | boolean | No | false | Preprocess the audio with a voice activity detection model. |
| `initial_prompt` | string | No |  | A text prompt to help provide context to the model on the contents of the audio. |
| `prefix` | string | No |  | The prefix appended to the beginning of the output of the transcription and can guide the transcript |
| `beam_size` | integer | No | 5 | The number of beams to use in beam search decoding. Higher values may improve accuracy at the cost o |
| `condition_on_previous_text` | boolean | No | true | Whether to condition on previous text during transcription. Setting to false may help prevent halluc |
| `no_speech_threshold` | number | No | 0.6 | Threshold for detecting no-speech segments. Segments with no-speech probability above this value are |
| `compression_ratio_threshold` | number | No | 2.4 | Threshold for filtering out segments with high compression ratio, which often indicate repetitive or |
| `log_prob_threshold` | number | No | \-1 | Threshold for filtering out segments with low average log probability, indicating low confidence. |
| `hallucination_silence_threshold` | number | No |  | Optional threshold (in seconds) to skip silent periods that may cause hallucinations. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `transcription_info` | object |  |
| `text` | string | The complete transcription of the audio. |
| `word_count` | number | The total number of words in the transcription. |
| `segments` | array |  |
| `vtt` | string | The transcription in WebVTT format, which includes timing and text information for use in subtitles. |

---

### **59\. @cf/deepgram/aura-1**

**ID:** `1f55679f-009e-4456-aa4f-049a62b4b6a0`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-1)  
**Task:** Text-to-Speech  
**Description:** Aura is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.  
**Created:** 2025-08-27  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per 1k characters","price":0.015,"currency":"USD"}\]  
* `partner`: true  
* `terms`: https://deepgram.com/terms  
* `realtime`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `speaker` | string | No | angus | Speaker used to produce the audio. |
| `encoding` | string | No |  | Encoding of the output audio. |
| `container` | string | No |  | Container specifies the file format wrapper for the output audio. The available options depend on th |
| `text` | string | Yes |  | The text content to be converted to speech |
| `sample_rate` | number | No |  | Sample Rate specifies the sample rate for the output audio. Based on the encoding, different sample |
| `bit_rate` | number | No |  | The bitrate of the audio in bits per second. Choose from predefined ranges or specific values based |

---

### **60\. @cf/defog/sqlcoder-7b-2**

**ID:** `1dc9e589-df6b-4e66-ac9f-ceff42d64983`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/defog/sqlcoder-7b-2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/defog/sqlcoder-7b-2)  
**Task:** Text Generation  
**Description:** This model is intended to be used by non-technical users to understand data inside their SQL databases.  
 **Created:** 2024-02-27  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 10000  
* `info`: https://huggingface.co/defog/sqlcoder-7b-2  
* `planned_deprecation_date`: 2026-05-30  
* `terms`: https://creativecommons.org/licenses/by-sa/4.0/deed.en

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **61\. @cf/microsoft/phi-2**

**ID:** `1d933df3-680f-4280-940d-da87435edb07`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/microsoft/phi-2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/microsoft/phi-2)  
**Task:** Text Generation  
**Description:** Phi-2 is a Transformer-based model with a next-word prediction objective, trained on 1.4T tokens from multiple passes on a mixture of Synthetic and Web datasets for NLP and coding.  
**Created:** 2024-02-27  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 2048  
* `info`: https://huggingface.co/microsoft/phi-2  
* `planned_deprecation_date`: 2026-05-30

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **62\. @cf/facebook/bart-large-cnn**

**ID:** `19bd38eb-bcda-4e53-bec2-704b4689b43a`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/facebook/bart-large-cnn](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/facebook/bart-large-cnn)  
**Task:** Summarization  
**Description:** BART is a transformer encoder-encoder (seq2seq) model with a bidirectional (BERT-like) encoder and an autoregressive (GPT-like) decoder. You can use this model for text summarization.  
**Created:** 2024-02-27  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `price`: \[{"unit":"per M input tokens","price":0,"currency":"USD"}\]  
* `planned_deprecation_date`: 2026-05-30

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `input_text` | string | Yes |  | The text that you want the model to summarize |
| `max_length` | integer | No | 1024 | The maximum length of the generated summary in tokens |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `summary` | string | The summarized version of the input text |

---

### **63\. @cf/runwayml/stable-diffusion-v1-5-img2img**

**ID:** `19547f04-7a6a-4f87-bf2c-f5e32fb12dc5`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/stable-diffusion-v1-5-img2img](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/stable-diffusion-v1-5-img2img)  
**Task:** Text-to-Image  
**Description:** Stable Diffusion is a latent text-to-image diffusion model capable of generating photo-realistic images. Img2img generate a new image from an input image with Stable Diffusion.  
 **Created:** 2024-02-27  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `price`: \[{"unit":"per step","price":0,"currency":"USD"}\]  
* `info`: https://huggingface.co/runwayml/stable-diffusion-v1-5  
* `terms`: https://github.com/runwayml/stable-diffusion/blob/main/LICENSE

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the image you want to generate |
| `negative_prompt` | string | No |  | Text describing elements to avoid in the generated image |
| `height` | integer | No |  | The height of the generated image in pixels |
| `width` | integer | No |  | The width of the generated image in pixels |
| `image` | array | No |  | For use with img2img tasks. An array of integers that represent the image data constrained to 8-bit |
| `image_b64` | string | No |  | For use with img2img tasks. A base64-encoded string of the input image |
| `mask` | array | No |  | An array representing An array of integers that represent mask image data for inpainting constrained |
| `num_steps` | integer | No | 20 | The number of diffusion steps; higher values can improve quality but take longer |
| `strength` | number | No | 1 | A value between 0 and 1 indicating how strongly to apply the transformation during img2img tasks; lo |
| `guidance` | number | No | 7.5 | Controls how closely the generated image should adhere to the prompt; higher values make the image m |
| `seed` | integer | No |  | Random seed for reproducibility of the image generation |

---

### **64\. @cf/openai/gpt-oss-20b**

**ID:** `188a4e1e-253e-46d0-9616-0bf8c149763f`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-oss-20b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-oss-20b)  
**Task:** Text Generation  
**Description:** OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-20b is for lower latency, and local or specialized use-cases.  
**Created:** 2025-08-05  
**Tags:** None

**Configuration Properties:**

* `context_window`: 128000  
* `price`: \[{"unit":"per M input tokens","price":0.2,"currency":"USD"},{"unit":"per M output tokens","price":0.3,"currency":"USD"}\]  
* `function_calling`: true  
* `reasoning`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |
| `input` | any | Yes |  | Responses API Input messages. Refer to OpenAI Responses API docs to learn more about supported conte |
| `reasoning` | object | No |  |  |
| `requests` | array | Yes |  |  |

---

### **65\. @cf/google/embeddinggemma-300m**

**ID:** `15631501-2742-4346-a469-22fe202188a2`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/embeddinggemma-300m](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/embeddinggemma-300m)  
**Task:** Text Embeddings  
**Description:** EmbeddingGemma is a 300M parameter, state-of-the-art for its size, open embedding model from Google, built from Gemma 3 (with T5Gemma initialization) and the same research and technology used to create Gemini models. EmbeddingGemma produces vector representations of text, making it well-suited for search and retrieval tasks, including classification, clustering, and semantic similarity search. This model was trained with data in 100+ spoken languages.  
**Created:** 2025-09-04  
**Tags:** None

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `text` | any | Yes |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `shape` | array |  |
| `data` | array | Embeddings of the requested text values |

---

### **66\. @cf/baai/bge-reranker-base**

**ID:** `145337e7-cec3-4ebb-8e78-16ddfc75e580`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-reranker-base](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-reranker-base)  
**Task:** Text Classification  
**Description:** Different from embedding model, reranker uses question and document as input and directly output similarity instead of embedding. You can get a relevance score by inputting query and passage to the reranker. And the score can be mapped to a float value in \[0,1\] by sigmoid function.  
 **Created:** 2025-02-14  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per M input tokens","price":0.00311,"currency":"USD"}\]

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `query` | string | Yes |  | A query you wish to perform against the provided contexts. |
| `top_k` | integer | No |  | Number of returned results starting with the best score. |
| `contexts` | array | Yes |  | List of provided contexts. Note that the index in this array is important, as the response will refe |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | array |  |

---

### **67\. @hf/google/gemma-7b-it**

**ID:** `0f002249-7d86-4698-aabf-8529ed86cefb`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-7b-it](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-7b-it)  
**Task:** Text Generation  
**Description:** Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models. They are text-to-text, decoder-only large language models, available in English, with open weights, pre-trained variants, and instruction-tuned variants.  
**Created:** 2024-04-01  
**Tags:** None

**Configuration Properties:**

* `beta`: true  
* `context_window`: 8192  
* `info`: https://ai.google.dev/gemma/docs  
* `lora`: true  
* `planned_deprecation_date`: 2026-05-30  
* `terms`: https://ai.google.dev/gemma/terms

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `lora` | string | No |  | Name of the LoRA (Low-Rank Adaptation) model to fine-tune the base model. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **68\. @cf/leonardo/lucid-origin**

**ID:** `0e372c11-8720-46c9-a02d-666188a22dae`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/leonardo/lucid-origin](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/leonardo/lucid-origin)  
**Task:** Text-to-Image  
**Description:** Lucid Origin from Leonardo.AI is their most adaptable and prompt-responsive model to date. Whether you're generating images with sharp graphic design, stunning full-HD renders, or highly specific creative direction, it adheres closely to your prompts, renders text with accuracy, and supports a wide array of visual styles and aesthetics – from stylized concept art to crisp product mockups.  
 **Created:** 2025-08-25  
**Tags:** None

**Configuration Properties:**

* `price`: \[{"unit":"per 512 by 512 tile","price":0.007,"currency":"USD"},{"unit":"per step","price":0.000132,"currency":"USD"}\]  
* `partner`: true  
* `terms`: https://leonardo.ai/terms-of-service/

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | A text description of the image you want to generate. |
| `guidance` | number | No | 4.5 | Controls how closely the generated image should adhere to the prompt; higher values make the image m |
| `seed` | integer | No |  | Random seed for reproducibility of the image generation |
| `height` | integer | No | 1120 | The height of the generated image in pixels |
| `width` | integer | No | 1120 | The width of the generated image in pixels |
| `num_steps` | integer | No |  | The number of diffusion steps; higher values can improve quality but take longer |
| `steps` | integer | No |  | The number of diffusion steps; higher values can improve quality but take longer |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `image` | string | The generated image in Base64 format. |

---

### **69\. @cf/meta/llama-4-scout-17b-16e-instruct**

**ID:** `06455e78-19f7-487b-93cd-c05a3dd07813`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-4-scout-17b-16e-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-4-scout-17b-16e-instruct)  
**Task:** Text Generation  
**Description:** Meta's Llama 4 Scout is a 17 billion parameter model with 16 experts that is natively multimodal. These models leverage a mixture-of-experts architecture to offer industry-leading performance in text and image understanding.  
**Created:** 2025-04-05  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `context_window`: 131000  
* `price`: \[{"unit":"per M input tokens","price":0.27,"currency":"USD"},{"unit":"per M output tokens","price":0.85,"currency":"USD"}\]  
* `function_calling`: true  
* `terms`: https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE  
* `vision`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `guided_json` | object | No |  | JSON schema that should be fulfilled for the response. |
| `response_format` | object | No |  |  |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.15 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |
| `requests` | array | Yes |  |  |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **70\. @cf/google/gemma-3-12b-it**

**ID:** `053d5ac0-861b-4d3b-8501-e58d00417ef8`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-3-12b-it](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemma-3-12b-it)  
**Task:** Text Generation  
**Description:** Gemma 3 models are well-suited for a variety of text generation and image understanding tasks, including question answering, summarization, and reasoning. Gemma 3 models are multimodal, handling text and image input and generating text output, with a large, 128K context window, multilingual support in over 140 languages, and is available in more sizes than previous versions.  
**Created:** 2025-03-18  
**Tags:** None

**Configuration Properties:**

* `context_window`: 80000  
* `price`: \[{"unit":"per M input tokens","price":0.345,"currency":"USD"},{"unit":"per M output tokens","price":0.556,"currency":"USD"}\]  
* `lora`: true  
* `planned_deprecation_date`: 2026-05-30

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `guided_json` | object | No |  | JSON schema that should be fufilled for the response. |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.6 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **71\. @cf/qwen/qwq-32b**

**ID:** `02c16efa-29f5-4304-8e6c-3d188889f875`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwq-32b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/qwen/qwq-32b)  
**Task:** Text Generation  
**Description:** QwQ is the reasoning model of the Qwen series. Compared with conventional instruction-tuned models, QwQ, which is capable of thinking and reasoning, can achieve significantly enhanced performance in downstream tasks, especially hard problems. QwQ-32B is the medium-sized reasoning model, which is capable of achieving competitive performance against state-of-the-art reasoning models, e.g., DeepSeek-R1, o1-mini.  
**Created:** 2025-03-05  
**Tags:** None

**Configuration Properties:**

* `context_window`: 24000  
* `price`: \[{"unit":"per M input tokens","price":0.66,"currency":"USD"},{"unit":"per M output tokens","price":1,"currency":"USD"}\]  
* `lora`: true  
* `reasoning`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `prompt` | string | Yes |  | The input text prompt for the model to generate a response. |
| `guided_json` | object | No |  | JSON schema that should be fulfilled for the response. |
| `raw` | boolean | No | false | If true, a chat template is not applied and you must adhere to the specific model's expected formatt |
| `stream` | boolean | No | false | If true, the response will be streamed back incrementally using SSE, Server Sent Events. |
| `max_tokens` | integer | No | 256 | The maximum number of tokens to generate in the response. |
| `temperature` | number | No | 0.15 | Controls the randomness of the output; higher values produce more random results. |
| `top_p` | number | No |  | Adjusts the creativity of the AI's responses by controlling how many possible words it considers. Lo |
| `top_k` | integer | No |  | Limits the AI to choose from the top 'k' most probable words. Lower values make responses more focus |
| `seed` | integer | No |  | Random seed for reproducibility of the generation. |
| `repetition_penalty` | number | No |  | Penalty for repeated tokens; higher values discourage repetition. |
| `frequency_penalty` | number | No |  | Decreases the likelihood of the model repeating the same lines verbatim. |
| `presence_penalty` | number | No |  | Increases the likelihood of the model introducing new topics. |
| `messages` | array | Yes |  | An array of message objects representing the conversation history. |
| `functions` | array | No |  |  |
| `tools` | array | No |  | A list of tools available for the assistant to use. |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `response` | string | The generated text response from the model |
| `usage` | object | Usage statistics for the inference request |
| `tool_calls` | array | An array of tool calls requests made during the response generation |

---

### **72\. @cf/baai/bge-large-en-v1.5**

**ID:** `01bc2fb0-4bca-4598-b985-d2584a3f46c0`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-large-en-v1.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/baai/bge-large-en-v1.5)  
**Task:** Text Embeddings  
**Description:** BAAI general embedding (Large) model that transforms any given text into a 1024-dimensional vector  
**Created:** 2023-11-07  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per M input tokens","price":0.204,"currency":"USD"}\]  
* `info`: https://huggingface.co/BAAI/bge-large-en-v1.5  
* `max_input_tokens`: 512  
* `output_dimensions`: 1024

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `text` | any | Yes |  |  |
| `pooling` | string | No | mean | The pooling method used in the embedding process. \`cls\` pooling will generate more accurate embeddin |
| `requests` | array | Yes |  | Batch of the embeddings requests to run using async-queue |

**Output:**

| Field | Type | Description |
| ----- | ----- | ----- |
| `shape` | array |  |
| `data` | array | Embeddings of the requested text values |
| `pooling` | string | The pooling method used in the embedding process. |
| `request_id` | string | The async request id that can be used to obtain the results. |

---

### **73\. @cf/deepgram/aura-2-en**

**ID:** `01564c52-8717-47dc-8efd-907a2ca18301`  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-2-en](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/deepgram/aura-2-en)  
**Task:** Text-to-Speech  
**Description:** Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.  
**Created:** 2025-10-09  
**Tags:** None

**Configuration Properties:**

* `async_queue`: true  
* `price`: \[{"unit":"per 1k characters","price":0.03,"currency":"USD"}\]  
* `partner`: true  
* `terms`: https://deepgram.com/terms  
* `realtime`: true

**Input Parameters:**

| Parameter | Type | Required | Default | Description |
| ----- | ----- | ----- | ----- | ----- |
| `speaker` | string | No | luna | Speaker used to produce the audio. |
| `encoding` | string | No |  | Encoding of the output audio. |
| `container` | string | No |  | Container specifies the file format wrapper for the output audio. The available options depend on th |
| `text` | string | Yes |  | The text content to be converted to speech |
| `sample_rate` | number | No |  | Sample Rate specifies the sample rate for the output audio. Based on the encoding, different sample |
| `bit_rate` | number | No |  | The bitrate of the audio in bits per second. Choose from predefined ranges or specific values based |

---

### 74\. @cf/moonshotai/kimi-k2.7-code

**ID:** N/A  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/moonshotai/kimi-k2.7-code](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/moonshotai/kimi-k2.7-code)  
**Task:** Text Generation  
**Description:** Kimi K2.7 is a frontier-scale open-source 1T parameter model with a 262.1k context window, multi-turn tool calling, vision inputs, and structured outputs for agentic workloads.  
**Created:** N/A  
**Tags:** None

**Configuration Properties:**

* **Context\_window: 262144**  
* **Function\_calling: true**  
* **Price: \[{“unit”:”per M input tokens”,”price”:0.95,”currency”:”USD”},{“unit”:”per M output tokens”,”price”:4.00,”currency”:”USD”},{“unit”:”per M cached input tokens”,”price”:0.19,”currency”:”USD”}\]**  
* **Reasoning: true**  
* **Vision: true**

Input Parameters:  
**Standard text generation parameters (prompt, messages, stream, max\_tokens, temperature, top\_p, top\_k, seed, etc.) — see Cloudflare Workers AI documentation for full schema.**

Output:  
**Standard text generation output (response object with id, object, created, model, choices, usage fields).**

### 75\. @cf/zai-org/glm-5.2

**ID:** N/A  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/zai-org/glm-5.2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/zai-org/glm-5.2)  
**Task:** Text Generation  
**Description:** [Z.ai](http://Z.ai)’s flagship agentic coding model.  
**Created:** N/A  
**Tags:** None

**Configuration Properties:**

* Context\_window: 262144  
* Function\_calling: true  
* Reasoning: true  
* Price: \[{“unit”:”per M input tokens”,”price”:1.40,”currency”:”USD”},{“unit”:”per M output tokens”,”price”:4.40,”currency”:”USD”},{“unit”:”per M cached input tokens”,”price”:0.26,”currency”:”USD”}\]

**Input Parameters:**  
Standard text generation parameters (prompt, messages, stream, max\_tokens, temperature, top\_p, top\_k, seed, etc.)

**Output:**  
Standard text generation output (response object with id, object, created, model, choices, usage fields).

### 76\. @cf/meta/llama-3.1-8b-instruct

**ID:** N/A  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct)  
**Task:** Text Generation  
**Description:** The Meta Llama 3.1 collection of multilingual large language models. The Llama 3.1 instruction tuned text only models are optimized for multilingual dialogue use cases. Deprecated 5/30/2026.  
**Created:** N/A  
**Tags:** Deprecated

**Configuration Properties:**

* Context\_window: 7968  
* Price: \[{“unit”:”per M input tokens”,”price”:0.28,”currency”:”USD”},{“unit”:”per M output tokens”,”price”:0.83,”currency”:”USD”}\]  
* Planned\_deprecation\_date: 2026-05-30

**Input Parameters:**  
Standard text generation parameters (prompt, messages, stream, max\_tokens, temperature, top\_p, top\_k, seed, lora, etc.)

**Output:**  
Standard text generation output (response object with id, object, created, model, choices, usage fields).

### 77\. @hf/meta-llama/meta-llama-3-8b-instruct

**ID:** N/A  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta-llama/meta-llama-3-8b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta-llama/meta-llama-3-8b-instruct)  
**Task:** Text Generation  
**Description:** Generation over generation, Meta Llama 3 demonstrates state-of-the-art performance on a wide range of industry benchmarks. Deprecated 5/30/2026.  
**Created:** N/A  
**Tags:** Deprecated

**Configuration Properties:**

* Context\_window: 8192  
* Planned\_deprecation\_date: 2026-05-30

**Input Parameters:**  
Standard text generation parameters (prompt, messages, stream, max\_tokens, temperature, top\_p, top\_k, seed, lora, etc.)

**Output:**  
Standard text generation output.

### 78\. @cf/facebook/detr-resnet-50

**ID:** N/A  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/facebook/detr-resnet-50](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/facebook/detr-resnet-50)  
**Task:** Object Detection  
**Description:** DEtection TRansformer (DETR) model trained end-to-end on COCO 2017 object detection (118k annotated images). Beta model.  
**Created:** N/A  
**Tags:** Beta

**Configuration Properties:**

* Price: \[{“unit”:”per inference request”,”price”:0.0000075,”currency”:”USD”}\]

**Input Parameters:**  
Image (binary or object) \- The image to use for detection.

**Output:**  
Array of detected objects with labels, scores, and bounding boxes.

### 79\. @cf/meta/llama-3.1-70b-instruct

**ID:** N/A  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-70b-instruct](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-70b-instruct)  
**Task:** Text Generation  
**Description:** The Meta Llama 3.1 collection of multilingual large language models. Optimized for multilingual dialogue use cases. Deprecated 5/30/2026.  
**Created:** N/A  
**Tags:** Deprecated

**Configuration Properties:**

* Context\_window: 24000  
* Planned\_deprecation\_date: 2026-05-30

**Input Parameters:**  
Standard text generation parameters (prompt, messages, stream, max\_tokens, temperature, top\_p, top\_k, seed, lora, etc.)

**Output:**  
Standard text generation output.

### 80\. @cf/meta/llama-3.1-8b-instruct-fast

**ID:** N/A  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct-fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/meta/llama-3.1-8b-instruct-fast)  
**Task:** Text Generation  
**Description:** \[Fast version\] The Meta Llama 3.1 collection of multilingual large language models. Optimized for multilingual dialogue use cases with faster inference.  
**Created:** N/A  
**Tags:** None

**Configuration Properties:**

* Context\_window: 128000

**Input Parameters:**  
Standard text generation parameters (prompt, messages, stream, max\_tokens, temperature, top\_p, top\_k, seed, lora, etc.)

**Output:**  
Standard text generation output.

## **Part 2: Catalog / Partner Models (64 models)**

External provider models (Anthropic, OpenAI, Google, Mistral, etc.) accessible via Cloudflare AI Gateway.

| \# | Model Name | Provider | Task | Model ID |
| ----- | ----- | ----- | ----- | ----- |
| 1 | [Claude Haiku 4.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-haiku-4.5) | anthropic | Text Generation | `anthropic/claude-haiku-4.5` |
| 2 | [Claude Opus 4.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-opus-4.6) | anthropic | Text Generation | `anthropic/claude-opus-4.6` |
| 3 | [Claude Opus 4.7](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-opus-4.7) | anthropic | Text Generation | `anthropic/claude-opus-4.7` |
| 4 | [Claude Sonnet 4](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4) | anthropic | Text Generation | `anthropic/claude-sonnet-4` |
| 5 | [Claude Sonnet 4.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4.5) | anthropic | Text Generation | `anthropic/claude-sonnet-4.5` |
| 6 | [Claude Sonnet 4.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4.6) | anthropic | Text Generation | `anthropic/claude-sonnet-4.6` |
| 7 | [GPT Image 1.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-image-1.5) | openai | Text-to-Image | `openai/gpt-image-1.5` |
| 8 | [GPT-4.1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4.1) | openai | Text Generation | `openai/gpt-4.1` |
| 9 | [GPT-4.1 Mini](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4.1-mini) | openai | Text Generation | `openai/gpt-4.1-mini` |
| 10 | [GPT-4o Transcribe](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4o-transcribe) | openai | Automatic Speech Recognition | `openai/gpt-4o-transcribe` |
| 11 | [GPT-5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5) | openai | Text Generation | `openai/gpt-5` |
| 12 | [GPT-5.4](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4) | openai | Text Generation | `openai/gpt-5.4` |
| 13 | [GPT-5.4 Mini](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-mini) | openai | Text Generation | `openai/gpt-5.4-mini` |
| 14 | [GPT-5.4 Nano](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-nano) | openai | Text Generation | `openai/gpt-5.4-nano` |
| 15 | [GPT-5.4 Pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-pro) | openai | Text Generation | `openai/gpt-5.4-pro` |
| 16 | [GPT-5.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.5) | openai | Text Generation | `openai/gpt-5.5` |
| 17 | [GPT-5.5 Pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.5-pro) | openai | Text Generation | `openai/gpt-5.5-pro` |
| 18 | [Gemini 3 Flash](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3-flash) | google | Text Generation | `google/gemini-3-flash` |
| 19 | [Gemini 3.1 Flash Lite](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3.1-flash-lite) | google | Text Generation | `google/gemini-3.1-flash-lite` |
| 20 | [Gemini 3.1 Pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3.1-pro) | google | Text Generation | `google/gemini-3.1-pro` |
| 21 | [Grok Imagine Image](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/xai/grok-imagine-image) | xai | Text-to-Image | `xai/grok-imagine-image` |
| 22 | [Grok Imagine Video](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/xai/grok-imagine-video) | xai | Text-to-Video | `xai/grok-imagine-video` |
| 23 | [Hailuo 2.3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/hailuo-2.3) | minimax | Text-to-Video | `minimax/hailuo-2.3` |
| 24 | [Hailuo 2.3 Fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/hailuo-2.3-fast) | minimax | Text-to-Video | `minimax/hailuo-2.3-fast` |
| 25 | [HappyHorse 1.0 I2V](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/hh1-i2v) | alibaba | Image-to-Video | `alibaba/hh1-i2v` |
| 26 | [HappyHorse 1.0 T2V](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/hh1-t2v) | alibaba | Text-to-Video | `alibaba/hh1-t2v` |
| 27 | [Imagen 4](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/imagen-4) | google | Text-to-Image | `google/imagen-4` |
| 28 | [Inworld TTS 2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-2) | inworld | Text-to-Speech | `inworld/tts-2` |
| 29 | [M2.7](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/m2.7) | minimax | Text Generation | `minimax/m2.7` |
| 30 | [MiniMax Music 2.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/music-2.6) | minimax | Music Generation | `minimax/music-2.6` |
| 31 | [Nano Banana](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana) | google | Text-to-Image | `google/nano-banana` |
| 32 | [Nano Banana 2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana-2) | google | Text-to-Image | `google/nano-banana-2` |
| 33 | [Nano Banana Pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana-pro) | google | Text-to-Image | `google/nano-banana-pro` |
| 34 | [OpenAI GPT Image 2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-image-2) | openai | Text-to-Image | `openai/gpt-image-2` |
| 35 | [Pixverse v5.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pixverse/v5.6) | pixverse | Text-to-Video | `pixverse/v5.6` |
| 36 | [Pixverse v6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pixverse/v6) | pixverse | Text-to-Video | `pixverse/v6` |
| 37 | [Qwen 3 Max](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/qwen3-max) | alibaba | Text Generation | `alibaba/qwen3-max` |
| 38 | [Qwen 3.5 397B A17B](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/qwen3.5-397b-a17b) | alibaba | Text Generation | `alibaba/qwen3.5-397b-a17b` |
| 39 | [Recraft V3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv3) | recraft | Text-to-Image | `recraft/recraftv3` |
| 40 | [Recraft V4](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4) | recraft | Text-to-Image | `recraft/recraftv4` |
| 41 | [Recraft V4 Pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-pro) | recraft | Text-to-Image | `recraft/recraftv4-pro` |
| 42 | [Recraft V4 Pro Vector](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-pro-vector) | recraft | Text-to-Image | `recraft/recraftv4-pro-vector` |
| 43 | [Recraft V4 Vector](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-vector) | recraft | Text-to-Image | `recraft/recraftv4-vector` |
| 44 | [RunwayML Gen-4.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/gen-4.5) | runwayml | Text-to-Video | `runwayml/gen-4.5` |
| 45 | [Seedance 2.0](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedance-2.0) | bytedance | Text-to-Video | `bytedance/seedance-2.0` |
| 46 | [Seedance 2.0 Fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedance-2.0-fast) | bytedance | Text-to-Video | `bytedance/seedance-2.0-fast` |
| 47 | [Seedream 4.0](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-4.0) | bytedance | Text-to-Image | `bytedance/seedream-4.0` |
| 48 | [Seedream 4.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-4.5) | bytedance | Text-to-Image | `bytedance/seedream-4.5` |
| 49 | [Seedream 5 Lite](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-5-lite) | bytedance | Text-to-Image | `bytedance/seedream-5-lite` |
| 50 | [Speech 2.8 HD](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/speech-2.8-hd) | minimax | Text-to-Speech | `minimax/speech-2.8-hd` |
| 51 | [Speech 2.8 Turbo](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/speech-2.8-turbo) | minimax | Text-to-Speech | `minimax/speech-2.8-turbo` |
| 52 | [TTS 1.5 Max](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-1.5-max) | inworld | Text-to-Speech | `inworld/tts-1.5-max` |
| 53 | [TTS 1.5 Mini](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-1.5-mini) | inworld | Text-to-Speech | `inworld/tts-1.5-mini` |
| 54 | [TTS-1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/tts-1) | openai | Text-to-Speech | `openai/tts-1` |
| 55 | [TTS-1 HD](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/tts-1-hd) | openai | Text-to-Speech | `openai/tts-1-hd` |
| 56 | [Universal 3 Pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/assemblyai/universal-3-pro) | assemblyai | Automatic Speech Recognition | `assemblyai/universal-3-pro` |
| 57 | [Veo 3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3) | google | Text-to-Video | `google/veo-3` |
| 58 | [Veo 3 Fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3-fast) | google | Text-to-Video | `google/veo-3-fast` |
| 59 | [Veo 3.1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3.1) | google | Text-to-Video | `google/veo-3.1` |
| 60 | [Veo 3.1 Fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3.1-fast) | google | Text-to-Video | `google/veo-3.1-fast` |
| 61 | [Vidu Q3 Pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/vidu/q3-pro) | vidu | Text-to-Video | `vidu/q3-pro` |
| 62 | [Vidu Q3 Turbo](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/vidu/q3-turbo) | vidu | Text-to-Video | `vidu/q3-turbo` |
| 63 | [Wan 2.6 Image](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/wan-2.6-image) | alibaba | Text-to-Image | `alibaba/wan-2.6-image` |
| 64 | [o4-mini](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/o4-mini) | openai | Text Generation | `openai/o4-mini` |

---

### **1\. Claude Haiku 4.5**

**Model ID:** `anthropic/claude-haiku-4.5`  
**Provider:** anthropic  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-haiku-4.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-haiku-4.5)  
**Task:** Text Generation  
**Description:** Claude Haiku 4.5 delivers similar levels of coding performance at one-third the cost and more than twice the speed of larger models.  
**Created:** 2026-04-13  
**Tags:** LLM, Coding, Fast, Cost-Efficient  
**Context Length:** 200,000 tokens  
**Max Output Tokens:** 8,192  
**Supports Async:** false  
**External Info:** [https://www.anthropic.com/claude/haiku](https://www.anthropic.com/claude/haiku)  
**Terms:** [https://www.anthropic.com/legal/commercial-terms](https://www.anthropic.com/legal/commercial-terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $1 |
| Output tokens (per 1M) | $5 |
| Cached input tokens (per 1M) | $0.1 |
| Cache creation tokens (per 1M) | $1.25 |

---

### **2\. Claude Opus 4.6**

**Model ID:** `anthropic/claude-opus-4.6`  
**Provider:** anthropic  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-opus-4.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-opus-4.6)  
**Task:** Text Generation  
**Description:** Claude Opus 4.6 is Anthropic's flagship language model built for complex, multi-step work in coding, financial analysis, and legal reasoning. It uses extended thinking to work through complex problems carefully and features a one million token context window.  
**Created:** 2026-04-13  
**Tags:** LLM, Coding, Reasoning, Enterprise, Agentic, Financial Analysis, Legal  
**Context Length:** 1,000,000 tokens  
**Max Output Tokens:** 128,000  
**Supports Async:** false  
**External Info:** [https://www.anthropic.com/claude/opus](https://www.anthropic.com/claude/opus)  
**Terms:** [https://www.anthropic.com/legal/commercial-terms](https://www.anthropic.com/legal/commercial-terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $5 |
| Output tokens (per 1M) | $25 |
| Cached input tokens (per 1M) | $0.5 |
| Cache creation tokens (per 1M) | $6.25 |

---

### **3\. Claude Opus 4.7**

**Model ID:** `anthropic/claude-opus-4.7`  
**Provider:** anthropic  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-opus-4.7](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-opus-4.7)  
**Task:** Text Generation  
**Description:** Claude Opus 4.7 is Anthropic's most capable generally available model to date. It is highly autonomous and performs exceptionally well on long-horizon agentic work, knowledge work, vision tasks, and memory tasks.  
**Created:** 2026-04-16  
**Tags:** LLM, Coding, Reasoning, Enterprise, Agentic, Financial Analysis, Legal  
**Context Length:** 1,000,000 tokens  
**Max Output Tokens:** 128,000  
**Supports Async:** false  
**External Info:** [https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7)  
**Terms:** [https://www.anthropic.com/legal/commercial-terms](https://www.anthropic.com/legal/commercial-terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $5 |
| Output tokens (per 1M) | $25 |
| Cached input tokens (per 1M) | $0.5 |
| Cache creation tokens (per 1M) | $6.25 |

---

### **4\. Claude Sonnet 4**

**Model ID:** `anthropic/claude-sonnet-4`  
**Provider:** anthropic  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4)  
**Task:** Text Generation  
**Description:** Claude Sonnet 4 delivers superior coding and reasoning while responding more precisely to instructions, a significant upgrade over previous versions.  
**Created:** 2026-04-13  
**Tags:** LLM, Coding, Reasoning, Agentic  
**Context Length:** 200,000 tokens  
**Max Output Tokens:** 16,000  
**Supports Async:** false  
**External Info:** [https://www.anthropic.com/claude/sonnet](https://www.anthropic.com/claude/sonnet)  
**Terms:** [https://www.anthropic.com/legal/commercial-terms](https://www.anthropic.com/legal/commercial-terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $3 |
| Output tokens (per 1M) | $15 |
| Cached input tokens (per 1M) | $0.3 |
| Cache creation tokens (per 1M) | $3.75 |

---

### **5\. Claude Sonnet 4.5**

**Model ID:** `anthropic/claude-sonnet-4.5`  
**Provider:** anthropic  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4.5)  
**Task:** Text Generation  
**Description:** Claude Sonnet 4.5 is the best coding model to date, with significant improvements across the entire development lifecycle.  
**Created:** 2026-04-13  
**Tags:** LLM, Coding, Reasoning, Agentic  
**Context Length:** 200,000 tokens  
**Max Output Tokens:** 8,192  
**Supports Async:** false  
**External Info:** [https://www.anthropic.com/claude/sonnet](https://www.anthropic.com/claude/sonnet)  
**Terms:** [https://www.anthropic.com/legal/commercial-terms](https://www.anthropic.com/legal/commercial-terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $3 |
| Output tokens (per 1M) | $15 |
| Cached input tokens (per 1M) | $0.3 |
| Cache creation tokens (per 1M) | $3.75 |

---

### **6\. Claude Sonnet 4.6**

**Model ID:** `anthropic/claude-sonnet-4.6`  
**Provider:** anthropic  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/anthropic/claude-sonnet-4.6)  
**Task:** Text Generation  
**Description:** Claude Sonnet 4.6 is Anthropic's latest balanced model offering strong coding, reasoning, and agentic capabilities with improved instruction following.  
**Created:** 2026-04-13  
**Tags:** LLM, Coding, Reasoning, Agentic  
**Context Length:** 200,000 tokens  
**Max Output Tokens:** 128,000  
**Supports Async:** false  
**External Info:** [https://www.anthropic.com/claude/sonnet](https://www.anthropic.com/claude/sonnet)  
**Terms:** [https://www.anthropic.com/legal/commercial-terms](https://www.anthropic.com/legal/commercial-terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $3 |
| Output tokens (per 1M) | $15 |
| Cached input tokens (per 1M) | $0.3 |
| Cache creation tokens (per 1M) | $3.75 |

---

### **7\. GPT Image 1.5**

**Model ID:** `openai/gpt-image-1.5`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-image-1.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-image-1.5)  
**Task:** Text-to-Image  
**Description:** OpenAI's image generation model that creates and edits images from text prompts, supporting multiple quality levels and output sizes.  
**Created:** 2026-04-14  
**Tags:** Image Generation, Image Editing, Multimodal  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $5 |
| Input image tokens (per 1M) | $8 |
| Cached input tokens (per 1M) | $1.25 |
| Cached input image tokens (per 1M) | $2 |
| Output image tokens (per 1M) | $32 |
| Output tokens (per 1M) | $10 |

---

### **8\. GPT-4.1**

**Model ID:** `openai/gpt-4.1`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4.1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4.1)  
**Task:** Text Generation  
**Description:** OpenAI's flagship GPT model for complex tasks with a million-token context window.  
**Created:** 2026-04-13  
**Tags:** LLM, Coding, Reasoning  
**Context Length:** 1,047,576 tokens  
**Max Output Tokens:** 32,768  
**Supports Async:** false  
**External Info:** [https://openai.com/index/gpt-4-1/](https://openai.com/index/gpt-4-1/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $2 |
| Output tokens (per 1M) | $8 |
| Cached input tokens (per 1M) | $0.5 |

---

### **9\. GPT-4.1 Mini**

**Model ID:** `openai/gpt-4.1-mini`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4.1-mini](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4.1-mini)  
**Task:** Text Generation  
**Description:** Fast, affordable version of GPT-4.1 with a million-token context window.  
**Created:** 2026-04-13  
**Tags:** LLM, Fast, Cost-Efficient  
**Context Length:** 1,047,576 tokens  
**Max Output Tokens:** 32,768  
**Supports Async:** false  
**External Info:** [https://openai.com/index/gpt-4-1/](https://openai.com/index/gpt-4-1/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $0.4 |
| Output tokens (per 1M) | $1.6 |
| Cached input tokens (per 1M) | $0.1 |

---

### **10\. GPT-4o Transcribe**

**Model ID:** `openai/gpt-4o-transcribe`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4o-transcribe](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-4o-transcribe)  
**Task:** Automatic Speech Recognition  
**Description:** A speech-to-text model that uses GPT-4o to transcribe audio with improved word error rate and better language recognition compared to original Whisper models.  
**Created:** 2026-04-13  
**Tags:** Speech-to-Text, Transcription, Multilingual  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per audio minute | $0.006 |

---

### **11\. GPT-5**

**Model ID:** `openai/gpt-5`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5)  
**Task:** Text Generation  
**Description:** OpenAI's model excelling at coding, writing, and reasoning.  
**Created:** 2026-04-13  
**Tags:** LLM, Coding, Reasoning, Writing  
**Context Length:** 128,000 tokens  
**Max Output Tokens:** 16,384  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $1.25 |
| Output tokens (per 1M) | $10 |
| Cached input tokens (per 1M) | $0.125 |

---

### **12\. GPT-5.4**

**Model ID:** `openai/gpt-5.4`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4)  
**Task:** Text Generation  
**Description:** GPT-5.4 is OpenAI's flagship model with strong coding, reasoning, and multimodal capabilities.  
**Created:** 2026-04-08  
**Tags:** LLM, Coding, Reasoning, Multimodal  
**Context Length:** 128,000 tokens  
**Max Output Tokens:** 16,384  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $2.5 |
| Output tokens (per 1M) | $15 |
| Cached input tokens (per 1M) | $0.25 |

---

### **13\. GPT-5.4 Mini**

**Model ID:** `openai/gpt-5.4-mini`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-mini](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-mini)  
**Task:** Text Generation  
**Description:** GPT-5.4 Mini is a smaller, faster, and more cost-efficient version of GPT-5.4 for lightweight tasks.  
**Created:** 2026-04-13  
**Tags:** LLM, Fast, Cost-Efficient  
**Context Length:** 128,000 tokens  
**Max Output Tokens:** 16,384  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $0.75 |
| Output tokens (per 1M) | $4.5 |
| Cached input tokens (per 1M) | $0.075 |

---

### **14\. GPT-5.4 Nano**

**Model ID:** `openai/gpt-5.4-nano`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-nano](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-nano)  
**Task:** Text Generation  
**Description:** GPT-5.4 Nano is OpenAI's smallest and fastest model, optimized for edge and low-latency use cases.  
**Created:** 2026-04-13  
**Tags:** LLM, Fast, Cost-Efficient, Edge  
**Context Length:** 128,000 tokens  
**Max Output Tokens:** 16,384  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $0.2 |
| Output tokens (per 1M) | $1.25 |
| Cached input tokens (per 1M) | $0.02 |

---

### **15\. GPT-5.4 Pro**

**Model ID:** `openai/gpt-5.4-pro`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.4-pro)  
**Task:** Text Generation  
**Description:** GPT-5.4 Pro uses OpenAI's Responses API with built-in tools, improved reasoning, and stateful context management.  
**Created:** 2026-04-24  
**Tags:** LLM, Coding, Reasoning, Multimodal, Responses API  
**Context Length:** 1,000,000 tokens  
**Max Output Tokens:** 16,384  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $30 |
| Output tokens (per 1M) | $180 |

---

### **16\. GPT-5.5**

**Model ID:** `openai/gpt-5.5`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.5)  
**Task:** Text Generation  
**Description:** GPT-5.5 is OpenAI's flagship model with strong coding, reasoning, and multimodal capabilities.  
**Created:** 2026-04-24  
**Tags:** LLM, Coding, Reasoning, Multimodal  
**Context Length:** 1,000,000 tokens  
**Max Output Tokens:** 16,384  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $5 |
| Output tokens (per 1M) | $30 |

---

### **17\. GPT-5.5 Pro**

**Model ID:** `openai/gpt-5.5-pro`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.5-pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-5.5-pro)  
**Task:** Text Generation  
**Description:** GPT-5.5 Pro uses OpenAI's Responses API with built-in tools, improved reasoning, and stateful context management.  
**Created:** 2026-04-24  
**Tags:** LLM, Coding, Reasoning, Multimodal, Responses API  
**Context Length:** 1,000,000 tokens  
**Max Output Tokens:** 16,384  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $30 |
| Output tokens (per 1M) | $180 |

---

### **18\. Gemini 3 Flash**

**Model ID:** `google/gemini-3-flash`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3-flash](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3-flash)  
**Task:** Text Generation  
**Description:** Gemini 3 Flash is Google's fast multimodal model with frontier intelligence, superior search, and grounding capabilities.  
**Created:** 2026-04-13  
**Tags:** LLM, Fast, Multimodal, Reasoning  
**Context Length:** 1,000,000 tokens  
**Max Output Tokens:** 8,192  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/gemini/](https://deepmind.google/technologies/gemini/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input \<=200k (per 1M) | $0.5 |
| Output \<=200k (per 1M) | $3 |
| Cached input \<=200k (per 1M) | $0.05 |
| Input \>200k (per 1M) | $0.5 |
| Output \>200k (per 1M) | $3 |
| Cached input \>200k (per 1M) | $0.05 |

---

### **19\. Gemini 3.1 Flash Lite**

**Model ID:** `google/gemini-3.1-flash-lite`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3.1-flash-lite](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3.1-flash-lite)  
**Task:** Text Generation  
**Description:** Google's lightest and most cost-efficient Gemini model for high-throughput tasks.  
**Created:** 2026-04-13  
**Tags:** LLM, Fast, Cost-Efficient, Multimodal  
**Context Length:** 1,000,000 tokens  
**Max Output Tokens:** 8,192  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/gemini/](https://deepmind.google/technologies/gemini/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input \<=200k (per 1M) | $0.25 |
| Output \<=200k (per 1M) | $1.5 |
| Cached input \<=200k (per 1M) | $0.03 |
| Input \>200k (per 1M) | $0.25 |
| Output \>200k (per 1M) | $1.5 |
| Cached input \>200k (per 1M) | $0.03 |

---

### **20\. Gemini 3.1 Pro**

**Model ID:** `google/gemini-3.1-pro`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3.1-pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/gemini-3.1-pro)  
**Task:** Text Generation  
**Description:** Google's most intelligent Gemini model with improved reasoning, a medium thinking level, and a 1M token context window.  
**Created:** 2026-04-13  
**Tags:** LLM, Reasoning, Multimodal, Thinking  
**Context Length:** 1,000,000 tokens  
**Max Output Tokens:** 65,536  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/gemini/](https://deepmind.google/technologies/gemini/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input \<=200k (per 1M) | $2 |
| Output \<=200k (per 1M) | $12 |
| Cached input \<=200k (per 1M) | $0.2 |
| Input \>200k (per 1M) | $4 |
| Output \>200k (per 1M) | $18 |
| Cached input \>200k (per 1M) | $0.4 |

---

### **21\. Grok Imagine Image**

**Model ID:** `xai/grok-imagine-image`  
**Provider:** xai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/xai/grok-imagine-image](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/xai/grok-imagine-image)  
**Task:** Text-to-Image  
**Description:** xAI's Grok Imagine image model. Generates and edits images from text and reference-image inputs with configurable aspect ratio and resolution.  
**Created:** 2026-05-17  
**Tags:** Image Generation, Image Editing, Multimodal  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://docs.x.ai/developers/models/grok-imagine-image](https://docs.x.ai/developers/models/grok-imagine-image)  
**Terms:** [https://x.ai/legal/terms-of-service](https://x.ai/legal/terms-of-service)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per input image | $0.002 |
| Per image | $0.02 |

---

### **22\. Grok Imagine Video**

**Model ID:** `xai/grok-imagine-video`  
**Provider:** xai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/xai/grok-imagine-video](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/xai/grok-imagine-video)  
**Task:** Text-to-Video  
**Description:** xAI's video generation model. Generates, edits, and extends videos from text and image inputs with native synchronized audio including dialogue, sound effects, and music. Supports multiple creative modes (normal, fun, custom).  
**Created:** 2026-05-17  
**Tags:** Video Generation, Image-to-Video, Multimodal  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://docs.x.ai/developers/models/grok-imagine-video](https://docs.x.ai/developers/models/grok-imagine-video)  
**Terms:** [https://x.ai/legal/terms-of-service](https://x.ai/legal/terms-of-service)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Default (per second) | $0.05 |

---

### **23\. Hailuo 2.3**

**Model ID:** `minimax/hailuo-2.3`  
**Provider:** minimax  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/hailuo-2.3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/hailuo-2.3)  
**Task:** Text-to-Video  
**Description:** A high-fidelity video generation model optimized for realistic human motion, cinematic VFX, expressive characters, and strong prompt and style adherence across text-to-video and image-to-video workflows.  
**Created:** 2026-04-13  
**Tags:** Video Generation, Cinematic, Image-to-Video  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://hailuoai.com/](https://hailuoai.com/)  
**Terms:** [https://hailuoai.com/terms](https://hailuoai.com/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| 6s @768p | $0.28 |
| 10s @768p | $0.56 |
| 6s @1080p | $0.49 |
| Default (per second) | $0.047 |

---

### **24\. Hailuo 2.3 Fast**

**Model ID:** `minimax/hailuo-2.3-fast`  
**Provider:** minimax  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/hailuo-2.3-fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/hailuo-2.3-fast)  
**Task:** Text-to-Video  
**Description:** A lower-latency version of Hailuo 2.3 that preserves core motion quality, visual consistency, and stylization while enabling faster iteration.  
**Created:** 2026-04-13  
**Tags:** Video Generation, Image-to-Video, Fast  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://hailuoai.com/](https://hailuoai.com/)  
**Terms:** [https://hailuoai.com/terms](https://hailuoai.com/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| 6s @768p | $0.19 |
| 10s @768p | $0.32 |
| 6s @1080p | $0.33 |
| Default (per second) | $0.032 |

---

### **25\. HappyHorse 1.0 I2V**

**Model ID:** `alibaba/hh1-i2v`  
**Provider:** alibaba  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/hh1-i2v](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/hh1-i2v)  
**Task:** Image-to-Video  
**Description:** Alibaba's HappyHorse 1.0 image-to-video model. Animates a reference image with an optional text prompt. Supports 720P and 1080P output with durations from 3 to 15 seconds.  
**Created:** 2026-04-27  
**Tags:** Image-to-Video, Video Generation  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://modelstudio.console.alibabacloud.com/](https://modelstudio.console.alibabacloud.com/)  
**Terms:** [https://www.alibabacloud.com/help/en/legal](https://www.alibabacloud.com/help/en/legal)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p (per second) | $0.14 |
| @1080p (per second) | $0.28 |
| Default (per second) | $0.28 |

---

### **26\. HappyHorse 1.0 T2V**

**Model ID:** `alibaba/hh1-t2v`  
**Provider:** alibaba  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/hh1-t2v](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/hh1-t2v)  
**Task:** Text-to-Video  
**Description:** Alibaba's HappyHorse 1.0 text-to-video model. Generates videos from a text prompt with configurable resolution, aspect ratio, and duration (3-15s).  
**Created:** 2026-04-27  
**Tags:** Text-to-Video, Video Generation  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://modelstudio.console.alibabacloud.com/](https://modelstudio.console.alibabacloud.com/)  
**Terms:** [https://www.alibabacloud.com/help/en/legal](https://www.alibabacloud.com/help/en/legal)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p (per second) | $0.14 |
| @1080p (per second) | $0.28 |
| Default (per second) | $0.28 |

---

### **27\. Imagen 4**

**Model ID:** `google/imagen-4`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/imagen-4](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/imagen-4)  
**Task:** Text-to-Image  
**Description:** Google's latest image generation model producing high-quality, photorealistic images from text prompts with support for multiple aspect ratios.  
**Created:** 2026-04-14  
**Tags:** Image Generation, High Quality, Photorealistic  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/imagen/](https://deepmind.google/technologies/imagen/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.04 |

---

### **28\. Inworld TTS 2**

**Model ID:** `inworld/tts-2`  
**Provider:** inworld  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-2)  
**Task:** Text-to-Speech  
**Description:** Inworld's most powerful and expressive text-to-speech model. Builds on TTS 1.5 with rich expressive speech, real-time latency, natural language steering (e.g. \[whisper\], \[say excitedly\]), and stronger multilingual support across 15 production languages plus 90+ experimental languages.  
**Created:** 2026-05-05  
**Tags:** TTS, Speech Synthesis, Low Latency, Multilingual, Natural Language Steering, Expressive  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://docs.inworld.ai/tts/realtime-tts-2-preview](https://docs.inworld.ai/tts/realtime-tts-2-preview)  
**Terms:** [https://inworld.ai/terms](https://inworld.ai/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per character | $0.000035 |

---

### **29\. M2.7**

**Model ID:** `minimax/m2.7`  
**Provider:** minimax  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/m2.7](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/m2.7)  
**Task:** Text Generation  
**Description:** MiniMax's M2.7 language model with multilingual capabilities.  
**Created:** 2026-04-13  
**Tags:** LLM, Multilingual  
**Context Length:** 128,000 tokens  
**Max Output Tokens:** 4,096  
**Supports Async:** false  
**External Info:** [https://www.minimaxi.com/](https://www.minimaxi.com/)  
**Terms:** [https://www.minimaxi.com/terms](https://www.minimaxi.com/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $0.3 |
| Output tokens (per 1M) | $1.2 |
| Cache write tokens (per 1M) | $0.375 |
| Cache read tokens (per 1M) | $0.06 |

---

### **30\. MiniMax Music 2.6**

**Model ID:** `minimax/music-2.6`  
**Provider:** minimax  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/music-2.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/music-2.6)  
**Task:** Music Generation  
**Description:** MiniMax's music generation model that creates full-length songs with vocals from text prompts and lyrics, or instrumental tracks. Supports BPM/key control and auto-generated lyrics.  
**Created:** 2026-04-14  
**Tags:** Music, Audio Generation, Vocals, Instrumental  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.minimaxi.com/](https://www.minimaxi.com/)  
**Terms:** [https://www.minimaxi.com/terms](https://www.minimaxi.com/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per lyrics generation | $0.01 |
| Per track | $0.15 |

---

### **31\. Nano Banana**

**Model ID:** `google/nano-banana`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana)  
**Task:** Text-to-Image  
**Description:** Google's fast image generation model producing high-quality images from text prompts.  
**Created:** 2026-04-08  
**Tags:** Image Generation, Fast  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/imagen/](https://deepmind.google/technologies/imagen/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $0.3 |
| Output tokens (per 1M) | $30 |
| Cached input tokens (per 1M) | $0.03 |
| Cache creation tokens (per 1M) | $0.083333 |

---

### **32\. Nano Banana 2**

**Model ID:** `google/nano-banana-2`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana-2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana-2)  
**Task:** Text-to-Image  
**Description:** Google's second-generation image generation model with improved quality and speed.  
**Created:** 2026-04-08  
**Tags:** Image Generation, Fast, High Quality  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/imagen/](https://deepmind.google/technologies/imagen/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $0.5 |
| Output tokens (per 1M) | $60 |

---

### **33\. Nano Banana Pro**

**Model ID:** `google/nano-banana-pro`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana-pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/nano-banana-pro)  
**Task:** Text-to-Image  
**Description:** Google's higher-quality image generation model with improved detail and prompt adherence.  
**Created:** 2026-04-08  
**Tags:** Image Generation, High Quality  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/imagen/](https://deepmind.google/technologies/imagen/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $2 |
| Output tokens (per 1M) | $120 |

---

### **34\. OpenAI GPT Image 2**

**Model ID:** `openai/gpt-image-2`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-image-2](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/gpt-image-2)  
**Task:** Text-to-Image  
**Description:** OpenAI's next-generation image model that creates and edits images from text prompts, with support for multiple quality levels, sizes, and output formats. Note: transparent backgrounds are not supported — use openai/gpt-image-1.5 for transparent PNGs.  
**Created:** 2026-04-23  
**Tags:** Image Generation, Image Editing, Multimodal  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $5 |
| Input image tokens (per 1M) | $8 |
| Cached input tokens (per 1M) | $1.25 |
| Cached input image tokens (per 1M) | $2 |
| Output image tokens (per 1M) | $30 |
| Output tokens (per 1M) | $10 |

---

### **35\. Pixverse v5.6**

**Model ID:** `pixverse/v5.6`  
**Provider:** pixverse  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pixverse/v5.6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pixverse/v5.6)  
**Task:** Text-to-Video  
**Description:** Pixverse v5.6 is a video generation model supporting text-to-video and image-to-video with audio generation, customizable aspect ratios, and up to 1080p output.  
**Created:** 2026-04-15  
**Tags:** Video Generation, Image-to-Video, Audio  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://pixverse.ai/](https://pixverse.ai/)  
**Terms:** [https://pixverse.ai/en/terms-of-service/](https://pixverse.ai/en/terms-of-service/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| 5s @360p | $0.175 |
| 5s @360p w/ audio | $0.4 |
| 8s @360p | $0.35 |
| 8s @360p w/ audio | $0.575 |
| 10s @360p | $0.385 |
| 10s @360p w/ audio | $0.61 |
| 5s @540p | $0.175 |
| 5s @540p w/ audio | $0.45 |
| 8s @540p | $0.35 |
| 8s @540p w/ audio | $0.575 |
| 10s @540p | $0.385 |
| 10s @540p w/ audio | $0.61 |
| 5s @720p | $0.225 |
| 5s @720p w/ audio | $0.4 |
| 8s @720p | $0.45 |
| 8s @720p w/ audio | $0.675 |
| 10s @720p | $0.495 |
| 10s @720p w/ audio | $0.72 |
| 5s @1080p | $0.375 |
| 5s @1080p w/ audio | $0.75 |
| 8s @1080p | $0.75 |
| 8s @1080p w/ audio | $0.975 |
| Default (per second) | $0.08 |

---

### **36\. Pixverse v6**

**Model ID:** `pixverse/v6`  
**Provider:** pixverse  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pixverse/v6](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/pixverse/v6)  
**Task:** Text-to-Video  
**Description:** Pixverse v6 is the latest Pixverse video model with support for up to 15-second videos, customizable duration from 1 to 15 seconds, and audio generation.  
**Created:** 2026-04-15  
**Tags:** Video Generation, Image-to-Video, Audio, Long Form  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://pixverse.ai/](https://pixverse.ai/)  
**Terms:** [https://pixverse.ai/en/terms-of-service/](https://pixverse.ai/en/terms-of-service/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p w/ audio (per second) | $0.06 |
| @540p w/ audio (per second) | $0.045 |
| @360p w/ audio (per second) | $0.035 |
| @1080p w/ audio (per second) | $0.115 |
| @720p (per second) | $0.045 |
| @1080p (per second) | $0.09 |
| @540p (per second) | $0.035 |
| @360p (per second) | $0.025 |
| Default (per second) | $0.06 |

---

### **37\. Qwen 3 Max**

**Model ID:** `alibaba/qwen3-max`  
**Provider:** alibaba  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/qwen3-max](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/qwen3-max)  
**Task:** Text Generation  
**Description:** Alibaba's Qwen 3 Max is a large language model with strong coding, reasoning, and multilingual capabilities, served via DashScope's OpenAI-compatible endpoint.  
**Created:** 2026-04-15  
**Tags:** LLM, Coding, Reasoning, Multilingual  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.alibabacloud.com/en/solutions/generative-ai/qwen](https://www.alibabacloud.com/en/solutions/generative-ai/qwen)  
**Terms:** [https://www.alibabacloud.com/help/en/legal](https://www.alibabacloud.com/help/en/legal)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $1.2 |
| Output tokens (per 1M) | $6 |

---

### **38\. Qwen 3.5 397B A17B**

**Model ID:** `alibaba/qwen3.5-397b-a17b`  
**Provider:** alibaba  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/qwen3.5-397b-a17b](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/qwen3.5-397b-a17b)  
**Task:** Text Generation  
**Description:** Alibaba's Qwen 3.5 is a 397B-parameter mixture-of-experts model with 17B active parameters, offering strong reasoning capabilities with efficient inference.  
**Created:** 2026-04-15  
**Tags:** LLM, Coding, Reasoning, MoE  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.alibabacloud.com/en/solutions/generative-ai/qwen](https://www.alibabacloud.com/en/solutions/generative-ai/qwen)  
**Terms:** [https://www.alibabacloud.com/help/en/legal](https://www.alibabacloud.com/help/en/legal)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $0.6 |
| Output tokens (per 1M) | $3.6 |

---

### **39\. Recraft V3**

**Model ID:** `recraft/recraftv3`  
**Provider:** recraft  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv3)  
**Task:** Text-to-Image  
**Description:** Recraft V3 is the previous-generation text-to-image model from Recraft, well-suited to design-quality compositions, brand-aware imagery, and accurate text rendering.  
**Created:** 2026-05-17  
**Tags:** Image Generation, Design, Text Rendering  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.recraft.ai/](https://www.recraft.ai/)  
**Terms:** [https://www.recraft.ai/terms](https://www.recraft.ai/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.04 |

---

### **40\. Recraft V4**

**Model ID:** `recraft/recraftv4`  
**Provider:** recraft  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4)  
**Task:** Text-to-Image  
**Description:** Recraft V4 generates art-directed images with strong composition, accurate text rendering, and design taste built in. Fast and cost-efficient at standard resolution.  
**Created:** 2026-04-13  
**Tags:** Image Generation, Design, Text Rendering  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.recraft.ai/](https://www.recraft.ai/)  
**Terms:** [https://www.recraft.ai/terms](https://www.recraft.ai/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.04 |

---

### **41\. Recraft V4 Pro**

**Model ID:** `recraft/recraftv4-pro`  
**Provider:** recraft  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-pro)  
**Task:** Text-to-Image  
**Description:** Recraft V4 Pro generates high-resolution, art-directed images at 2048px+ with strong composition, text rendering, and design taste. Built for print and production work.  
**Created:** 2026-04-13  
**Tags:** Image Generation, Design, Text Rendering, High Resolution  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.recraft.ai/](https://www.recraft.ai/)  
**Terms:** [https://www.recraft.ai/terms](https://www.recraft.ai/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.25 |

---

### **42\. Recraft V4 Pro Vector**

**Model ID:** `recraft/recraftv4-pro-vector`  
**Provider:** recraft  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-pro-vector](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-pro-vector)  
**Task:** Text-to-Image  
**Description:** Generate detailed, production-ready SVG vector graphics from text prompts with fine geometry, scalable to any size for print and design work.  
**Created:** 2026-04-13  
**Tags:** Image Generation, SVG, Vector, Design, High Resolution  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.recraft.ai/](https://www.recraft.ai/)  
**Terms:** [https://www.recraft.ai/terms](https://www.recraft.ai/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.3 |

---

### **43\. Recraft V4 Vector**

**Model ID:** `recraft/recraftv4-vector`  
**Provider:** recraft  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-vector](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/recraft/recraftv4-vector)  
**Task:** Text-to-Image  
**Description:** Generate production-ready SVG vector graphics from text prompts with clean geometry, structured layers, and editable paths.  
**Created:** 2026-04-13  
**Tags:** Image Generation, SVG, Vector, Design  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.recraft.ai/](https://www.recraft.ai/)  
**Terms:** [https://www.recraft.ai/terms](https://www.recraft.ai/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.08 |

---

### **44\. RunwayML Gen-4.5**

**Model ID:** `runwayml/gen-4.5`  
**Provider:** runwayml  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/gen-4.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/runwayml/gen-4.5)  
**Task:** Text-to-Video  
**Description:** RunwayML's video generation model supporting both text-to-video and image-to-video with customizable duration, aspect ratio, and content moderation controls.  
**Created:** 2026-04-14  
**Tags:** Video Generation, Image-to-Video, Cinematic  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://runwayml.com/](https://runwayml.com/)  
**Terms:** [https://runwayml.com/terms-of-use](https://runwayml.com/terms-of-use)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Default (per second) | $0.12 |

---

### **45\. Seedance 2.0**

**Model ID:** `bytedance/seedance-2.0`  
**Provider:** bytedance  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedance-2.0](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedance-2.0)  
**Task:** Text-to-Video  
**Description:** ByteDance's next-generation video model with a unified multimodal architecture. Generates high-quality video with synchronized audio from text, images, video clips, and audio inputs. Supports multimodal references (up to 9 images, 3 videos, 3 audio files), native audio generation, video editing, video extension, intelligent duration, and adaptive aspect ratio.  
**Created:** 2026-05-17  
**Tags:** Video Generation, Image-to-Video, Audio Generation, Multimodal  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://seed.bytedance.com/en/seedance2\_0](https://seed.bytedance.com/en/seedance2_0)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Default (per second) | $0.22 |
| @720p (per second) | $0.22 |
| @1080p (per second) | $0.55 |

---

### **46\. Seedance 2.0 Fast**

**Model ID:** `bytedance/seedance-2.0-fast`  
**Provider:** bytedance  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedance-2.0-fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedance-2.0-fast)  
**Task:** Text-to-Video  
**Description:** Faster variant of ByteDance's Seedance 2.0 video model. Trades some quality for speed while sharing the same multimodal architecture. Supports text-to-video, image-to-video, native audio generation, multimodal references (images, videos, audio), video editing, and video extension.  
**Created:** 2026-05-17  
**Tags:** Video Generation, Image-to-Video, Fast, Multimodal  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://seed.bytedance.com/en/seedance](https://seed.bytedance.com/en/seedance)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @1080p (per second) | $0.17 |
| @720p (per second) | $0.08 |
| Default (per second) | $0.08 |

---

### **47\. Seedream 4.0**

**Model ID:** `bytedance/seedream-4.0`  
**Provider:** bytedance  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-4.0](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-4.0)  
**Task:** Text-to-Image  
**Description:** Seedream 4.0 is ByteDance's image creation model that combines text-to-image generation and image editing into a single architecture, offering fast, high-resolution output up to 4K.  
**Created:** 2026-04-08  
**Tags:** Image Generation, Image Editing, High Resolution  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://seed.bytedance.com/en/seedream4\_0](https://seed.bytedance.com/en/seedream4_0)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.03 |

---

### **48\. Seedream 4.5**

**Model ID:** `bytedance/seedream-4.5`  
**Provider:** bytedance  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-4.5](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-4.5)  
**Task:** Text-to-Image  
**Description:** Seedream 4.5 builds on 4.0 with multi-reference image support, batch generation, and sequential image generation.  
**Created:** 2026-04-08  
**Tags:** Image Generation, Multi-Reference, Batch  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://seed.bytedance.com/en/seedream4\_5](https://seed.bytedance.com/en/seedream4_5)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.04 |

---

### **49\. Seedream 5 Lite**

**Model ID:** `bytedance/seedream-5-lite`  
**Provider:** bytedance  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-5-lite](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/bytedance/seedream-5-lite)  
**Task:** Text-to-Image  
**Description:** Seedream 5 Lite is a lighter, faster version of the Seedream 5 family with multi-reference and batch generation support.  
**Created:** 2026-04-08  
**Tags:** Image Generation, Multi-Reference, Batch, Fast  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://seed.bytedance.com/en/seedream5\_0\_lite](https://seed.bytedance.com/en/seedream5_0_lite)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.035 |

---

### **50\. Speech 2.8 HD**

**Model ID:** `minimax/speech-2.8-hd`  
**Provider:** minimax  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/speech-2.8-hd](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/speech-2.8-hd)  
**Task:** Text-to-Speech  
**Description:** MiniMax Speech 2.8 HD focuses on studio-grade audio generation with emotion control, multilingual support (40+ languages), and voice cloning.  
**Created:** 2026-04-13  
**Tags:** TTS, Speech Synthesis, Voice Cloning, Multilingual, High Quality  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.minimaxi.com/](https://www.minimaxi.com/)  
**Terms:** [https://www.minimaxi.com/terms](https://www.minimaxi.com/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per character | $0.0001 |

---

### **51\. Speech 2.8 Turbo**

**Model ID:** `minimax/speech-2.8-turbo`  
**Provider:** minimax  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/speech-2.8-turbo](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/minimax/speech-2.8-turbo)  
**Task:** Text-to-Speech  
**Description:** MiniMax Speech 2.8 Turbo turns text into natural, expressive speech with voice cloning, emotion control, and 40+ language support at faster speeds.  
**Created:** 2026-04-13  
**Tags:** TTS, Speech Synthesis, Voice Cloning, Multilingual, Fast  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.minimaxi.com/](https://www.minimaxi.com/)  
**Terms:** [https://www.minimaxi.com/terms](https://www.minimaxi.com/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per character | $0.00006 |

---

### **52\. TTS 1.5 Max**

**Model ID:** `inworld/tts-1.5-max`  
**Provider:** inworld  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-1.5-max](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-1.5-max)  
**Task:** Text-to-Speech  
**Description:** Highest-quality text-to-speech with under 200ms latency, emotion control, and 15-language support.  
**Created:** 2026-04-13  
**Tags:** TTS, Speech Synthesis, Low Latency, Multilingual, Emotion Control  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://inworld.ai/](https://inworld.ai/)  
**Terms:** [https://inworld.ai/terms](https://inworld.ai/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per character | $0.00005 |

---

### **53\. TTS 1.5 Mini**

**Model ID:** `inworld/tts-1.5-mini`  
**Provider:** inworld  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-1.5-mini](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/inworld/tts-1.5-mini)  
**Task:** Text-to-Speech  
**Description:** Ultra-fast, cost-efficient text-to-speech with approximately 120ms latency and 15-language support.  
**Created:** 2026-04-13  
**Tags:** TTS, Speech Synthesis, Ultra-Low Latency, Multilingual, Cost-Efficient  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://inworld.ai/](https://inworld.ai/)  
**Terms:** [https://inworld.ai/terms](https://inworld.ai/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per character | $0.000025 |

---

### **54\. TTS-1**

**Model ID:** `openai/tts-1`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/tts-1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/tts-1)  
**Task:** Text-to-Speech  
**Description:** OpenAI's text-to-speech model optimized for real-time use with low latency.  
**Created:** 2026-04-13  
**Tags:** TTS, Speech Synthesis  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://platform.openai.com/docs/guides/text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per character | $0.000015 |

---

### **55\. TTS-1 HD**

**Model ID:** `openai/tts-1-hd`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/tts-1-hd](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/tts-1-hd)  
**Task:** Text-to-Speech  
**Description:** OpenAI's high-definition text-to-speech model producing higher quality audio output.  
**Created:** 2026-04-13  
**Tags:** TTS, Speech Synthesis, High Quality  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://platform.openai.com/docs/guides/text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per character | $0.00003 |

---

### **56\. Universal 3 Pro**

**Model ID:** `assemblyai/universal-3-pro`  
**Provider:** assemblyai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/assemblyai/universal-3-pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/assemblyai/universal-3-pro)  
**Task:** Automatic Speech Recognition  
**Description:** AssemblyAI's Universal 3 Pro speech recognition model for high-accuracy transcription.  
**Created:** 2026-04-13  
**Tags:** Speech-to-Text, Transcription, Multilingual  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.assemblyai.com/](https://www.assemblyai.com/)  
**Terms:** [https://www.assemblyai.com/legal/terms-of-service](https://www.assemblyai.com/legal/terms-of-service)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per audio minute | $0.0035 |

---

### **57\. Veo 3**

**Model ID:** `google/veo-3`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3)  
**Task:** Text-to-Video  
**Description:** Google's video generation model capable of producing high-quality videos with optional audio from text prompts.  
**Created:** 2026-04-08  
**Tags:** Video Generation, Audio  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/veo/](https://deepmind.google/technologies/veo/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p (per second) | $0.2 |
| @1080p (per second) | $0.2 |
| Default (per second) | $0.2 |
| @720p w/ audio (per second) | $0.4 |
| @1080p w/ audio (per second) | $0.4 |

---

### **58\. Veo 3 Fast**

**Model ID:** `google/veo-3-fast`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3-fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3-fast)  
**Task:** Text-to-Video  
**Description:** A faster version of Veo 3 optimized for lower latency video generation with audio support.  
**Created:** 2026-04-08  
**Tags:** Video Generation, Audio, Fast  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/veo/](https://deepmind.google/technologies/veo/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p w/ audio (per second) | $0.1 |
| @1080p w/ audio (per second) | $0.12 |
| @4k w/ audio (per second) | $0.3 |
| Default (per second) | $0.1 |
| @720p (per second) | $0.08 |
| @1080p (per second) | $0.1 |

---

### **59\. Veo 3.1**

**Model ID:** `google/veo-3.1`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3.1](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3.1)  
**Task:** Text-to-Video  
**Description:** Google's latest video generation model with improved quality, motion, and audio generation.  
**Created:** 2026-04-08  
**Tags:** Video Generation, Audio, High Quality  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/veo/](https://deepmind.google/technologies/veo/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p w/ audio (per second) | $0.4 |
| @1080p w/ audio (per second) | $0.4 |
| @4k w/ audio (per second) | $0.6 |
| Default (per second) | $0.4 |
| @720p (per second) | $0.2 |
| @1080p (per second) | $0.2 |
| @4k (per second) | $0.4 |

---

### **60\. Veo 3.1 Fast**

**Model ID:** `google/veo-3.1-fast`  
**Provider:** google  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3.1-fast](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/google/veo-3.1-fast)  
**Task:** Text-to-Video  
**Description:** A faster version of Veo 3.1 optimized for lower latency while maintaining high-quality video and audio output.  
**Created:** 2026-04-08  
**Tags:** Video Generation, Audio, Fast  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://deepmind.google/technologies/veo/](https://deepmind.google/technologies/veo/)  
**Terms:** [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p (per second) | $0.08 |
| @1080p (per second) | $0.1 |
| @4k (per second) | $0.25 |
| @720p w/ audio (per second) | $0.1 |
| @1080p w/ audio (per second) | $0.12 |
| @4k w/ audio (per second) | $0.3 |
| Default (per second) | $0.08 |

---

### **61\. Vidu Q3 Pro**

**Model ID:** `vidu/q3-pro`  
**Provider:** vidu  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/vidu/q3-pro](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/vidu/q3-pro)  
**Task:** Text-to-Video  
**Description:** Vidu Q3 Pro is a high-quality video generation model supporting text-to-video, image-to-video, and start/end-frame-to-video workflows with audio and up to 16-second clips.  
**Created:** 2026-04-15  
**Tags:** Video Generation, Image-to-Video, Audio  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.vidu.com/](https://www.vidu.com/)  
**Terms:** [https://www.vidu.com/terms](https://www.vidu.com/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p (per second) | $0.125 |
| @1080p (per second) | $0.15 |
| Default (per second) | $0.125 |
| @540p (per second) | $0.05 |

---

### **62\. Vidu Q3 Turbo**

**Model ID:** `vidu/q3-turbo`  
**Provider:** vidu  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/vidu/q3-turbo](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/vidu/q3-turbo)  
**Task:** Text-to-Video  
**Description:** Vidu Q3 Turbo is a faster version of Vidu Q3 optimized for lower latency video generation while maintaining audio support and up to 16-second clips.  
**Created:** 2026-04-15  
**Tags:** Video Generation, Image-to-Video, Audio, Fast  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://www.vidu.com/](https://www.vidu.com/)  
**Terms:** [https://www.vidu.com/terms](https://www.vidu.com/terms)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| @720p (per second) | $0.06 |
| @1080p (per second) | $0.07 |
| @540p (per second) | $0.04 |
| Default (per second) | $0.06 |

---

### **63\. Wan 2.6 Image**

**Model ID:** `alibaba/wan-2.6-image`  
**Provider:** alibaba  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/wan-2.6-image](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/alibaba/wan-2.6-image)  
**Task:** Text-to-Image  
**Description:** Alibaba's Wan 2.6 text-to-image model generating images from text prompts with optional negative prompts and customizable dimensions.  
**Created:** 2026-04-14  
**Tags:** Image Generation, Negative Prompt  
**Context Length:** N/A  
**Max Output Tokens:** N/A  
**Supports Async:** false  
**External Info:** [https://wan.video/](https://wan.video/)  
**Terms:** [https://www.alibabacloud.com/help/en/legal](https://www.alibabacloud.com/help/en/legal)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Per image | $0.03 |

---

### **64\. o4-mini**

**Model ID:** `openai/o4-mini`  
**Provider:** openai  
**Page:** [https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/o4-mini](https://dash.cloudflare.com/bc6018c200086c59663c8ff798e689fa/ai/models/openai/o4-mini)  
**Task:** Text Generation  
**Description:** OpenAI's fast, lightweight reasoning model optimized for multi-step problem solving at lower cost.  
**Created:** 2026-04-13  
**Tags:** LLM, Reasoning, Fast, Cost-Efficient  
**Context Length:** 200,000 tokens  
**Max Output Tokens:** 100,000  
**Supports Async:** false  
**External Info:** [https://openai.com/](https://openai.com/)  
**Terms:** [https://openai.com/policies/](https://openai.com/policies/)

**Pricing:**

| Metric | Price (USD) |
| ----- | ----- |
| Input tokens (per 1M) | $1.1 |
| Output tokens (per 1M) | $4.4 |
| Cached input tokens (per 1M) | $0.275 |

---

