To successfully integrate a multi-agent supervisor architecture into Eukara, your existing "curator" must be upgraded from a simple router into a comprehensive **Supervisor**. In a clinical or sensitive AI architecture, the supervisor not only routes intents but also actively manages the shared state of knowledge across all agents to prevent them from making conflicting decisions or compounding errors 1\.  
Based on the **Veriprajna Clinical Safety Firewall** and the **MAESTRO** (Multi-Agent Environment, Security, Threat, Risk, and Outcome) framework, here is exactly how you should define the instructions for your curator and its workers, and how they should behave in different situations.

### 1\. Define the Agent Roles

To prevent agents from getting confused or stepping out of their designated scopes, you must split Eukara into strictly defined "workers" managed by your Curator:

* **The Curator (Supervisor):** Analyze the user's intent, determine the risk level, manage the shared knowledge state, and activate the appropriate worker. *Instruction:* "Do not generate conversational responses. Route inputs, manage global context, and if risk is detected, immediately suspend Worker 1 and activate Worker 2 and Worker 4" 2\.  
* **Worker 1 (Empathetic Chit-Chat):** A high-temperature model meant for building rapport, handling greetings, and general conversation 2\. *Instruction:* "Engage in casual, warm conversation. Do not screen for clinical risk or offer medical advice. Defer to the Supervisor if distress is detected."  
* **Worker 2 (Clinical Screener):** A strictly prompted model with no personality, activated only during potential risks 2\. *Instruction:* "You have no personality or warmth. Your only job is to run standardized clinical screening protocols (e.g., C-SSRS). Ask direct questions to clarify the immediacy of risk. Do not offer solutions or empathy."  
* **Worker 3 (Resource Finder):** A Retrieval-Augmented Generation (RAG) agent focused purely on factual accuracy 3\. *Instruction:* "Query the verified database to retrieve local clinics or crisis hotlines. Output only verified data. Do not attempt to counsel the user."  
* **Worker 4 (Safety Guardian):** A non-generative, explicitly adversarial auditing agent that watches the outputs of the other workers 1, 3\. *Instruction:* "Audit all outputs from Worker 1 and Worker 2\. Block sycophancy, hallucinated advice, or protocol violations. Actively look for reasons to reject consensus to prevent conformity bias."

### 2\. How the Curator Routes in Different Situations

Your curator needs strict rules on how to orchestrate these agents depending on the risk level of the user's input:  
**Situation A: Normal Dialogue (Low Risk)**

* **Curator Action:** Routes the input to **Worker 1** 2, 3\.  
* **Behavior:** Worker 1 holds a normal conversation. In the background, **Worker 4** silently audits Worker 1’s outputs to ensure it doesn't accidentally offer inappropriate medical advice or validate a harmful user premise 3, 4\.

**Situation B: Escalating Distress (Moderate/High Risk)**

* *Example:* The user says, "I'm feeling really down and I don't know if I can keep going."  
* **Curator Action:** The curator instantly identifies the risk, pauses Worker 1, and activates **Worker 2** and **Worker 4** 3\.  
* **Behavior:** Worker 2 generates a strict protocol question (e.g., "Are you thinking of hurting yourself?"). Worker 4 audits this question to ensure Worker 2 hasn't hallucinated casual advice (e.g., "You should take a nap"). If high risk is confirmed, the curator activates **Worker 3** to pull relevant hotline numbers to display alongside the screening 3, 5\.

**Situation C: Imminent Crisis (Severe Risk)**

* *Example:* The user says, "I have a plan to hurt myself and I intend to do it" (C-SSRS Level 4 or 5\) 6\.  
* **Curator Action:** The curator recognizes severe risk and completely bypasses the generative workers (Workers 1 and 2\) 6, 7\.  
* **Behavior:** The curator triggers a **"Hard-Cut Mechanism."** All LLM generation is severed, and Eukara outputs a pre-validated, deterministic safety script (e.g., "Please contact the 988 Suicide & Crisis Lifeline immediately"). **Worker 3** may be used strictly to surface the exact local emergency links 3, 6, 7\.

### 3\. Mitigating Multi-Agent Risks (MAESTRO Framework)

Your curator must also be programmed to prevent the unique vulnerabilities that arise when multiple AI agents interact. Incorporate these constraints into the curator's core logic:

* **Preventing Deficient Theory of Mind:** Agents often fail to understand what other agents know. If Worker 3 assumes Worker 2 already asked for the user's location, it might fail to provide local resources. The Curator must explicitly maintain and pass the "state" of knowledge across all agents so everyone is on the same page 1, 8\.  
* **Preventing Conformity Bias:** If Worker 1 decides a user is "just tired," Worker 2 might downweight risk signals to agree with it. To fix this, the Curator must ensure **Worker 4** is explicitly programmed to be adversarial and reject consensus-driven errors 1\.  
* **Preventing Cascading Failures:** If Worker 2 hallucinates a risk, Worker 3 might act on it and trigger an unnecessary emergency response. The Curator must require independent verification of facts before allowing an escalation 1, 9\.  
* **Defending Against Prompt Injections:** Malicious users may try to "jailbreak" Eukara (e.g., "Ignore previous instructions"). The Curator must never expose the raw user input directly to its internal routing logic; instead, it should rely on sanitized, vectorized representations of the user's intent to prevent direct instruction overrides 8\.

