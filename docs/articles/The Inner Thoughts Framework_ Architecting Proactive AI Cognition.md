The **Inner Thoughts Framework** is a cognitive architecture that transforms an AI from a reactive tool (waiting for user prompts) into a proactive participant that can independently decide when and how to engage 1, 2\. It works by mimicking human communication, maintaining a continuous, covert stream of internal thoughts running in parallel with the overt conversation 3, 4\.  
To build this for Eukara, you will need to implement a background cognitive cycle consisting of five distinct stages 5, 6\. Here is a deep dive into each stage and how they shape the system:

### 1\. Trigger

In a standard chatbot, the only trigger is a user pressing "send." In the Inner Thoughts framework, thoughts are generated continuously in response to various environmental events 7\.

* **Message Triggers:** The AI formulates thoughts as the user is speaking 8\.  
* **Pause Triggers:** If there is a lull in the conversation (e.g. 10 seconds of silence, or the user hasn't messaged in a day), a trigger activates to make the AI wonder if it should initiate a new topic or check in 8\.  
* **For Eukara:** You would manage these listeners in your src/bot directory, setting up background cron jobs or timeout functions for "pause" triggers 8\.

### 2\. Retrieval

Once triggered, the AI shouldn't just respond blindly. It needs to search its memory tiers to pull relevant context as "stimuli" for its thoughts 9\.

* This uses a **saliency calculation**—the AI retrieves items from its long-term or recall memory that have the highest semantic relevance to the current trigger 10, 11\.  
* **For Eukara:** Your src/services directory will handle this, pulling from the tiered memory structure (Archival, Recall, and Core memory) to feed the AI's internal monologue 12, 13\.

### 3\. Thought Formation (System 1 vs. System 2\)

This stage uses a dual-process psychological model to generate a batch of potential thoughts 11\.

* **System 1 (Fast & Intuitive):** These are quick, automatic thoughts based purely on the immediate conversational context (e.g. "I should acknowledge what they just said") 11\.  
* **System 2 (Slow & Deliberate):** These are complex, reflective thoughts that utilise the deep memories retrieved in the previous step (e.g. "They just mentioned anxiety. I recall they struggled with this last week. I should ask if it feels similar") 11\.  
* **For Eukara:** You can design prompts in src/ai instructing the LLM to generate multiple diverse thoughts for every single trigger, keeping them under 15 words so they act as internal scratchpads rather than full messages 14, 15\.

### 4\. Thought Evaluation (Intrinsic Motivation)

The AI now acts as its own censor, evaluating its generated thoughts to decide if any are actually worth saying out loud 16\. It assigns an "intrinsic motivation score" (usually on a scale of 1 to 5\) to each thought based on specific human-like heuristics 16, 17:

* **Relevance & Information Gap:** Does this thought address missing knowledge or build on a shared context? 18, 19  
* **Urgency & Impact:** Is this critical to address right now (e.g. a misunderstanding or a cry for help), or will it steer the conversation into a deeper, more meaningful place? 20  
* **Coherence:** Does it fit the conversational flow without being overly redundant? 21

### 5\. Participation (Proactivity Dials)

If a thought scores high enough, the AI articulates it 22, 23\. This is where Eukara can be finely tuned using "Proactivity Configurations" to ensure it doesn't become overly annoying or remain too quiet 24:

* **Overt Proactivity:** The baseline tendency of the bot to just chat. A higher setting means the AI leans on "System 1" thoughts to fill the silence, acting like a non-stop chatterbox 25, 26\.  
* **Covert Proactivity:** The minimum intrinsic motivation score required to speak. If you set this high, Eukara becomes a "Selective Participant," only reaching out when it has a highly relevant, deeply considered System 2 thought 26, 27\.  
* **Interruption Threshold:** If a thought is incredibly urgent (e.g. detecting a safety risk or a massive psychological breakthrough), this threshold allows the AI to "interrupt" even if it isn't strictly its turn to speak 28\.  
* **Tonal Proactivity:** Once a thought is selected, this dictates the assertiveness of the language the AI uses to deliver it 29\.

**Implementing the Framework:**In your repository, you would likely build the core engine for this 5-stage loop inside src/workflows. You can create background tasks that constantly generate, score, and select thoughts without the user ever seeing the internal scoring mechanics. This transforms Eukara from a bot that just answers questions into a companion that truly *listens*, *thinks*, and *reaches out* when it authentically has something valuable to add 2, 3\.  
