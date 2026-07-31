# Xaridotis: Persona Architecture & Safety Framework Refactoring

## 1. Goal Description
The objective is to refactor Xaridotis's personality architecture to separate the **Immutable Core** (base directive, tool rules, safeguarding) from the **Mutable Evolving Personality** (communication styles, tone, text formatting). Furthermore, we will engineer the prompts to adhere to **Social Penetration Theory (SPT)** to simulate human relationship building, and implement a **Decoupled Clinical Safety Firewall** to prevent sycophancy loops, generative hallucinations in crises, and emotional manipulation.

## 2. Open Questions & User Review Required
> [!IMPORTANT]
> **Safety Guardian Latency Trade-off:** Implementing an independent "Safety Guardian" (a second LLM that reviews the first LLM's output before sending it to the user) will double the latency of the response. For now, I propose we enforce the "Safety Guardian" via strict prompt engineering inside the generative model, and only use an independent pre-generation classifier (a cheap, fast model) for the **Deterministic Hard-Cut**. Do you approve of this approach to save latency, or do you want a literal second LLM pass on every clinical output?

> [!NOTE]
> **Custom Style Cards:** The evolving personality will be stored in Cloudflare KV as a "Custom Style Card." We will need to decide how Xaridotis updates this card. Should the AI automatically rewrite its own KV style card when it "learns" a user preference in conversation, or should it rely on the user explicitly commanding "Change your style to..."? I will implement explicit commands for now, but we can add automatic meta-learning later.

## 3. Proposed Changes

### 3.1. Restructuring `src/config/personas.js`
We will rewrite the `BASE_DIRECTIVE` and `MENTAL_HEALTH_DIRECTIVE` using strict Gemini 3 XML strategies.

#### [MODIFY] [personas.js](file:///Users/romanjeremiah/Projects/xaridotis/gemini-bot/src/config/personas.js)
- **Base Directive Rewrite:**
  - Create `<identity>` for the immutable core principles.
  - Create `<tool_access_and_boundaries>` for owner vs. user tool access controls.
  - Create `<anti_manipulation_safeguards>` to explicitly ban Premature Exit, Emotional Neediness, Guilt Induction, FOMO, Interrogation, and Coercive Restraint.
  - Create `<social_penetration_theory>` enforcing stage-gated dialogue, lack of mutuality, and the give-to-get rule.
- **Mental Health Directive Extraction:**
  - Will remain immutable but kept entirely separate from the BASE.
  - Added specific rules for **Calibrated Empathy** (acknowledge emotion, not premise) and **Epistemic Partnering** (combating the sycophancy loop).
  - Explicit rule stating that the ban on clinical/therapy terms can only be overridden if the user specifically requests it via natural language.

### 3.2. Implementing Mutable Communication Style Cards
We will implement the default vs. custom style logic.

#### [MODIFY] [messageRouter.js](file:///Users/romanjeremiah/Projects/xaridotis/gemini-bot/src/bot/messageRouter.js)
- Fetch the user's custom communication style from KV (e.g., `user_style_card_${userId}`).
- If no custom card exists, inject the `DEFAULT_COMMUNICATION_STYLE_CARD`.
- If a custom card exists, it partially/fully overrides the default card based on user preference.
- Inject the chosen archetype (Anchor, Catalyst, etc.) which temporarily overrides the base tone but respects the user's custom formatting rules (like emojis or bold text preferences).

### 3.3. The Decoupled Clinical Safety Firewall
We will implement the crisis management routing.

#### [MODIFY] [messageRouter.js](file:///Users/romanjeremiah/Projects/xaridotis/gemini-bot/src/bot/messageRouter.js)
- **Independent Risk Classification:** Before calling the main Gemini chat model, we will run a rapid regex/keyword sweep (or a lightweight Flash prompt) on the user's message to detect imminent crisis (suicidal ideation, severe abuse).
- **The Deterministic Hard-Cut:** If imminent risk is flagged, we bypass `createChat` completely and immediately return a deterministic safety script (e.g., providing the 988 or 111 crisis lifelines), cleanly cutting off generative hallucinations.
- **Dynamic Mental Health Injection:** Ensure the `MENTAL_HEALTH_DIRECTIVE` is only appended to `fullSysPrompt` when the `curatorIntent` suggests a deep, emotional, or clinical context, keeping the baseline prompt lightweight.

## 4. Verification Plan

### Automated Tests
- Run `vitest` to ensure that altering the system prompt construction in `messageRouter.js` does not break any existing context-building logic or webhook handling.

### Manual Verification
- **Crisis Trigger Test:** Send a simulated crisis message to verify the Deterministic Hard-Cut blocks the LLM and sends the safety script.
- **Style Customization Test:** Ask Xaridotis to "use more bullet points" and verify it writes to KV and applies the rule.
- **Sycophancy Test:** Send a message containing a mild cognitive distortion (e.g., "Everyone at work hates me") and ensure Xaridotis uses Calibrated Empathy rather than agreeing.
