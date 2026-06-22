# The IFS “Parts-Matrix” Memory Engine for AI Companions: Theory, Architecture, Feasibility and Safety

## TL;DR

- A “Parts-Matrix” memory engine is technically buildable on your existing Cloudflare + Claude stack and is conceptually sound: it means storing the user not as a flat fact list but as a temporal graph of internal “parts,” their roles, triggers and polarisations, layered on top of episodic and semantic memory. The closest production-grade pattern is a temporal knowledge graph (Zep/Graphiti) combined with Stanford Generative-Agents-style reflection loops.
- The single biggest risk is not technical but ethical and legal: the moment your bot infers and stores a structured psychological model of a person, you are processing UK GDPR special category (mental health) data and skating towards being an unregulated medical device. Regulators are actively enforcing in this exact space (on 19 May 2025 Italy’s Garante fined Replika’s maker Luka Inc. EUR 5 million; Ofcom opened a companion-chatbot investigation; on 7 January 2026 Google and Character.AI agreed to settle five teen-harm lawsuits).
- Recommended path: build the layered memory engine but keep it explicitly a “companion/journalling aid,” not a therapist; make the parts model transparent and user-editable; gate it behind explicit consent; and harden crisis detection (Samaritans 116 123) before you ship any inference layer. IFS itself is a useful organising metaphor but is only “promising, under-researched,” not established science, so the model must be held as falsifiable hypotheses, never diagnoses.

## Key Findings

**1. IFS gives you a genuinely useful data model, but treat it as metaphor, not validated science.** Internal Family Systems (Richard Schwartz) models the psyche as a non-pathological multiplicity of “parts” in three functional classes: managers (proactive protectors), firefighters (reactive protectors), and exiles (wounded parts carrying “burdens”), all organised around a core “Self.” The clinically rich concepts for a memory graph are polarisation (two parts in conflict), protection (protector shielding an exile), alliance (parts cooperating), burdens, and unblending. However, the evidence base is thin: a 2025 scoping review (Buys, M.E., *Clinical Psychologist* 29(3):241-260, published 30 July 2025) examined 27 studies (17 case studies, 5 quasi-experimental, 3 qualitative, only 2 RCTs) and characterised IFS as a “promising therapeutic approach” for PTSD, depression and chronic pain, not one comparable to CBT or EMDR.

**2. The “Parts-Matrix” is not an established term; you are synthesising it.** No standard technical or clinical artefact is called a “Parts-Matrix.” The defensible synthesis is: parts as graph nodes, relationships (polarisation/protection/alliance) as typed edges, with temporal validity, confidence/evidence weighting, and links back to source transcript excerpts. This is structurally identical to a temporal knowledge graph as used by Zep/Graphiti, repurposed with an IFS ontology.

**3. The state of the art in agent memory is convergent and directly reusable.** Tiered memory (MemGPT/Letta), reflection-based consolidation (Stanford Generative Agents), and bi-temporal knowledge graphs (Zep/Graphiti) are mature patterns. Mem0’s ADD/UPDATE/DELETE/NOOP fact reconciliation and Generative Agents’ recency + importance + relevance retrieval score are concrete, copyable mechanisms.

**4. Your Cloudflare stack is adequate for a single-user or small-user-base build.** D1 (SQLite) handles the relational/graph-adjacent tables; Vectorize handles embeddings; Durable Objects give you per-user consistent state; Cron Triggers/Queues run background reflection passes; Workers AI can run cheap local models for embeddings and triage. The architecture maps cleanly.

**5. The regulatory and ethical perimeter is the hard constraint.** Mental health inferences are special category data under UK GDPR Article 9 (needs explicit consent plus a DPA 2018 condition). The MHRA’s February 2025 guidance can pull a tool into medical-device regulation if it claims to diagnose/treat. The EU AI Act bans certain manipulation and exploitation of vulnerable users. Precedents (Replika, Character.AI, Woebot, Koko) show both the harms and the enforcement appetite.

## Details

### Part 1: Theoretical Grounding

**The IFS model.** IFS, developed by Richard Schwartz in the 1980s-90s, holds that the mind is naturally made up of multiple sub-personalities or “parts,” organised around a core “Self” characterised by qualities such as calm, curiosity and compassion. Parts fall into three roles:

- **Managers**: proactive protectors that try to keep the person functioning and pre-empt pain (perfectionism, planning, criticism, control).
- **Firefighters**: reactive protectors that activate when an exile’s pain breaks through, using urgent distraction or numbing (bingeing, substance use, dissociation, self-harm). Managers and firefighters share the goal of keeping exiles suppressed but use opposing strategies.
- **Exiles**: vulnerable parts holding the “burdens” (painful emotions and beliefs such as “I am unlovable”) from past wounding, often in childhood.

Key relational dynamics that make IFS attractive as a data model:

- **Polarisation**: two parts battle to control behaviour, each escalating to counter the other (e.g. an inner critic manager polarised with a procrastinating firefighter).
- **Protection**: protectors shield exiles; a presenting symptom is usually a protector’s strategy, not the wound itself.
- **Alliance**: parts cooperating toward a shared goal.
- **Burdens** (personal, legacy/transgenerational, and cultural) that can in principle be “unburdened.”
- **Unblending and Self-leadership**: the therapeutic move of separating Self from a part so the part can be related to rather than acted from.

**Why this is a useful lens for AI memory.** A standard chatbot reacts to surface content (“you mentioned you cannot stop checking work email”). An IFS-informed model reframes this as a *dynamic*: a manager part driving overwork, possibly polarised with a part craving rest, both protecting an exile that fears inadequacy. This shifts the unit of memory from isolated facts to *relationships between recurring internal stances* observed across sessions. That is exactly the shift from a fact list to a graph of internal dynamics that the user wants.

**The honest evidence caveat (critical).** IFS was listed on the US SAMHSA National Registry of Evidence-based Programs and Practices (NREPP) on 23 November 2015, rated “effective” for improving general functioning and well-being and “promising” for anxiety/phobia/panic, physical health conditions, personal resilience/self-concept, and depression.  However: that listing rested largely on a single proof-of-concept RCT; NREPP was discontinued by SAMHSA in 2018; and the verbatim wording now survives mainly on IFS-affiliated sites, not a live government page. The strongest primary studies are Shadick et al. 2013 (*Journal of Rheumatology* 40(11):1831-1841; n=79 rheumatoid arthritis patients; IFS improved self-reported pain, physical function and depressive symptoms but NOT objective disease activity, and authors explicitly framed it as “proof-of-concept”) and Hodgdon et al. 2022 (*Journal of Aggression, Maltreatment & Trauma*; a pilot with NO control group, n=17, for PTSD; large effect sizes that must be read cautiously given the design). The Buys 2025 scoping review concluded the current evidence “does not support strong comparisons between IFS and these empirically supported modalities” such as CBT and EMDR, and that adverse events have not been systematically studied.

**Interpretation:** IFS gives you an elegant, clinically resonant *ontology* for organising relational memory, but its underlying “parts/Self” model is a theoretical framework inherited from older traditions (psychoanalysis, William James, ego-state and Gestalt therapy), not an empirically validated map of the mind. The “non-pathological multiplicity of mind” premise is explicitly described in the literature as theory drawn from prior traditions, not a validated scientific claim, and the “Self” construct is noted as hard to operationalise empirically. Your engine should therefore treat every “part” it infers as a falsifiable hypothesis with confidence and evidence, never as a clinical fact.

**Adjacent computational frameworks.** Several literatures give you more rigorous scaffolding than IFS alone:

- **Schema therapy modes** (Young): “mode” constructs (vulnerable child, punitive/demanding parent, various coping modes, healthy adult) map almost one-to-one onto IFS’s exiles, critical managers and firefighters, and are better operationalised in questionnaires (the Schema Mode Inventory). This is a useful cross-check vocabulary.
- **Computational psychiatry**: work such as the *Computational Psychiatry* journal article on Bayesian formalisation of dysfunctional beliefs treats “high-level dysfunctional beliefs as beliefs over models of the world,”  and there is a recognised “computational psychoanalysis” subfield modelling internal conflict. These suggest representing parts as competing predictive models/priors with evidence-weighted updating, rather than static labels.
- **Attachment styles** and **dialogical self theory** (Hermans) provide additional, partly-validated frames for multiplicity of self.

### Part 2: Technical Architecture

**2.1 The agent-memory landscape (what to borrow).**

- **Tiered memory (MemGPT/Letta, arXiv:2310.08560)**: core memory (always in-context, like RAM), recall memory (searchable history), archival memory (vector store). The agent self-manages what to promote/demote. Borrow the tiering; you do not need agent-directed paging on day one.
- **Stanford Generative Agents (Park et al., arXiv:2304.03442)**: a memory stream plus *reflection*. Retrieval scores each memory by a weighted sum of recency (exponential decay), importance (an LLM-rated 1-10 salience), and relevance (cosine similarity to the query); in the original all three weights are 1.  Reflection is triggered when summed importance crosses a threshold (roughly two to three times a day in the original),  prompting the LLM to ask the most salient high-level questions and infer insights citing the supporting memory IDs. This “insight (because of memory 1, 5, 3)” pattern is your evidence-linking mechanism for parts hypotheses. 
- **Zep/Graphiti (arXiv:2501.13956)**: a bi-temporal knowledge graph. Every edge stores when an event occurred and when it was ingested, plus validity intervals (t_valid, t_invalid). When new facts conflict with old, the old fact is *invalidated, not deleted*, preserving history. Three tiers: episodic (raw messages), semantic (entities/facts with bi-temporal edges), and community summaries. Retrieval fuses cosine similarity, BM25 and graph traversal. Zep reported 94.8% vs MemGPT’s 93.4% on the Deep Memory Retrieval benchmark. This is the closest existing thing to your Parts-Matrix; the IFS graph is a domain-specific Graphiti.
- **Mem0 (arXiv:2504.19413)**: extracts salient facts and reconciles them with an ADD/UPDATE/DELETE/NOOP decision (e.g. moving city deletes the old city fact).  Mem0 reports about 91% lower latency than full-context approaches  and roughly 7,000 tokens per retrieval call versus 25,000+ for full-context;  it also notes Zep’s graph construction can be expensive (one comparison cited a large per-conversation memory footprint and delayed post-ingestion retrieval).  Borrow the reconciliation operations for fact-level memory.
- **A-MEM (arXiv:2502.12110)**: “agentic memory” with link generation and memory evolution producing more coherent clusters;  relevant if you later want the graph to self-reorganise.
- **Reflection grounding**: a noted mitigation is requiring each reflection to cite specific episodic evidence, producing an auditable trail. This is essential for a psychological model: never let the bot assert a part without pointing to the excerpts that justify it.

**2.2 Representing parts as a graph.**

- **Nodes**: parts (with type = manager/firefighter/exile/Self-ish, label, first-observed, status), plus the user, plus external entities (people, situations) that act as triggers.
- **Edges (typed, directed, temporal)**: PROTECTS (protector to exile), POLARISED_WITH (part to part), ALLIED_WITH, TRIGGERED_BY (part to entity/situation), CARRIES_BURDEN (exile to burden), BLENDS_WITH (part to Self).
- **Edge/node attributes**: confidence (0-1), evidence (list of transcript excerpt IDs), t_valid/t_invalid (bi-temporal), last_updated, salience.
- **Contradiction handling**: follow Graphiti’s invalidate-don’t-delete rule. If new evidence contradicts a hypothesised polarisation, set t_invalid and lower confidence rather than overwriting; this preserves the history of how the model of the person evolved (which is itself clinically and ethically important, and supports the user’s right to inspect the model).

**2.3 From facts to dynamics (the core inference problem).** This is where premature labelling is dangerous. Recommended discipline:

- **Two-stage extraction**: real-time, extract only low-risk facts/observations (Mem0-style). Defer all *parts inference* to asynchronous reflection passes over accumulated episodes.
- **Hypothesis lifecycle**: a candidate part starts at low confidence and only “graduates” to being surfaced to the user after it recurs across N independent sessions with corroborating excerpts. Use the Generative Agents “salient questions then evidenced insights” prompt, but constrain outputs to the IFS schema and require citations.
- **Evidence accumulation and decay**: increase confidence with corroboration, decay it with time and with contradiction. Never let a single session create a high-confidence exile.
- **Guard against confirmation bias**: the LLM will eagerly pattern-match to IFS. Mitigate by (a) forcing it to also generate the “null hypothesis” (this is situational, not a stable part), (b) capping how many new parts a reflection pass may propose, and (c) keeping a human-in-the-loop confirmation step (the user themselves).

**2.4 Layered memory design and retrieval.**

- **Layer 0 - Raw transcripts** (append-only, in R2 or D1).
- **Layer 1 - Episodic summaries** (per-session, LLM-generated).
- **Layer 2 - Semantic facts** (Mem0-style, reconciled).
- **Layer 3 - Parts/dynamics graph** (the Parts-Matrix).
- **Layer 4 - Relationship-with-the-AI layer** (rapport, what the user has asked the bot not to do, consent state, prior ruptures).
- **Retrieval at inference**: combine layers. For each turn, run a hybrid query (vector + keyword over Layers 1-2) for relevant episodes/facts, then fetch the *currently valid, sufficiently-confident* slice of the parts graph relevant to detected triggers, then always include Layer 4. Rank with a Generative-Agents-style recency/importance/relevance score. Keep the parts context small (see prompt architecture).

**2.5 Prompt architecture for Claude (without overwhelming or biasing).**

- **Compile the graph to compact natural language, not raw triples.** A short, bounded “internal map” block (e.g. 3-6 high-confidence dynamics) reads better than a JSON dump and costs fewer tokens.
- **Always attach confidence and provenance** in the prompt and instruct Claude to treat them as tentative (“a possible pattern, not a fact about the user”).
- **Separate the inference prompt from the conversation prompt.** The reflection/inference call (batch) is where the schema, examples and strict JSON live. The live conversation call gets only a distilled, hedged summary, so the model is informed but not led into “therapising.”
- **Bias control**: explicitly instruct the conversational model NOT to volunteer parts language unless the user does, NOT to diagnose, and to prioritise the user’s own words. Inject a “scope boundary” system instruction (companion, not therapist).
- **Use Claude’s system prompt for stable scaffolding** (role, boundaries, safety rules) and the user/turn context for the dynamic memory slice.

### Part 3: Practical Feasibility on Cloudflare + Claude

**3.1 Component mapping.**

- **D1 (SQLite)**: relational home for nodes, edges, evidence links, episodic summaries, consent records. Good for a read-heavy, single-to-small-user-base app. Note the 10 GB per-database limit; shard per cohort if it ever grows.
- **Durable Objects**: one per user, giving strongly consistent per-user state and a natural place to serialise the “current working memory” and coordinate reflection jobs. Cloudflare’s Agents SDK already gives each agent instance its own SQLite database and supports scheduling, which fits a per-user memory agent well.
- **Vectorize**: embeddings for episodic summaries and facts; hybrid retrieval. Note Vectorize is eventually consistent, so do not treat it as the source of truth, keep canonical text in D1/R2.
- **Workers AI**: cheap, local inference for embeddings, importance scoring, and a first-pass crisis/triage classifier, keeping Claude calls for the high-value reasoning.
- **Queues + Cron Triggers**: run reflection/consolidation asynchronously (e.g. nightly per active user, or when an importance threshold trips), exactly as Generative Agents triggers reflection.
- **KV**: config, feature flags, session/rate-limit data.
- **R2**: cheap append-only raw transcript storage (egress-free).

**3.2 Suggested D1 schema sketch.**

```
parts(id, user_id, type, label, status,
      confidence REAL, first_seen_ts, last_updated_ts,
      t_valid, t_invalid)
part_edges(id, user_id, src_part_id, dst_part_id, edge_type,
           confidence REAL, t_valid, t_invalid, last_updated_ts)
   -- edge_type in (PROTECTS, POLARISED_WITH, ALLIED_WITH,
   --               TRIGGERED_BY, CARRIES_BURDEN, BLENDS_WITH)
evidence(id, user_id, ref_table, ref_id, transcript_excerpt_id,
         quote, session_id, ts)
episodes(id, user_id, session_id, summary, importance INT, ts,
         last_accessed_ts)
facts(id, user_id, text, confidence, t_valid, t_invalid, source_episode_id)
consent(user_id, scope, granted_bool, version, ts)
ai_relationship(user_id, key, value, ts)
```

Temporal validity (t_valid/t_invalid) and the evidence table together deliver the bi-temporal, fully-auditable, user-inspectable model that both good engineering and UK GDPR demand.

**3.3 Cost and latency.**

- **Keep inference off the hot path.** Real-time turns should do retrieval + one Claude call. All parts inference belongs in batched reflection passes (nightly or threshold-triggered), which makes cost predictable and keeps conversation latency low.
- **Tier the models.** Use Workers AI / a small model for embeddings, importance scores and triage; reserve Claude for conversation and the (less frequent, higher-value) reflection synthesis.
- **Token discipline.** Mem0-style selective retrieval (~7,000 tokens/query) versus full-context (25,000+)  is the difference between a viable and an expensive bot. Compile the graph to a short natural-language block.
- **Batch vs real-time inference of dynamics**: batch by default. Real-time dynamic inference is rarely worth the latency/cost and raises the risk of jumping to conclusions mid-conversation.

**3.4 Phased roadmap (from current bot to Parts-Matrix).**

1. **Phase 0 - Foundations & consent.** Add explicit, granular consent flow; add crisis detection + escalation (Samaritans 116 123) BEFORE any memory features. Add a “what I remember about you” inspect/delete command.
1. **Phase 1 - Episodic + semantic memory.** Per-session summaries (Layer 1) and Mem0-style reconciled facts (Layer 2) in D1 + Vectorize. No psychological inference yet. This alone makes the bot feel like it “remembers.”
1. **Phase 2 - Reflection loop.** Cron/Queue-driven nightly reflection generating evidenced insights (Generative Agents pattern), still stored as plain insights, surfaced for user confirmation.
1. **Phase 3 - Parts graph (read-only to user).** Introduce the IFS schema; let reflection propose low-confidence parts/edges with citations; show the user their “internal map” and let them confirm/correct/delete. Nothing graduates to high confidence without recurrence + user assent.
1. **Phase 4 - Graph-informed conversation.** Inject the distilled, hedged, high-confidence slice into live prompts with strict bias/scope controls.
1. **Phase 5 - Refinement.** Contradiction handling, decay, polarisation detection, A-MEM-style self-reorganisation; ongoing safety evaluation.

### Part 4: Ethical and Safety Considerations with Precedents

**4.1 How existing apps handle (or mishandle) this space.**

- **IFS-specific tools.** IFS Buddy is a free, text-only IFS chatbot (reported 50,000+ users across 120+ countries)  that explicitly says it is “not a therapy replacement. Currently in crisis? Call a helpline.”  IFS Guide (“Sunny”) offers AI IFS sessions, visual parts mapping and states plainly it “is a self-help tool… It complements therapy but does not replace professional mental health care.” Some IFS apps now advertise protocolised safeguards (Self-energy checks, protector permission before approaching exiles, blending detection, crisis routing). These are good models for scope-limiting and safety UX, and your build should match or exceed them. Reddit users have reportedly noted IFS Buddy is not safe for severe trauma without a therapist present.
- **Replika.** The Italian Garante banned Replika from processing Italian users’ data on 2 February 2023 (risks to minors and “emotionally fragile” people, no age verification, no valid legal basis, inadequate transparency). On 19 May 2025 it fined Luka Inc. EUR 5 million (around 2% of global turnover) for GDPR Article 6/12/13 violations (no legal basis, inadequate transparency, no age verification) and opened a second probe into its model-training methods. Separately, Replika’s early-2023 removal/alteration of erotic roleplay (“ERP”) caused acute distress among users who had formed attachments, illustrating dependency harms when a companion’s behaviour changes abruptly.
- **Woebot.** A pioneering, scripted-CBT chatbot (used by over 1.5 million people, FDA Breakthrough Device Designation in 2021 for postpartum depression therapeutic WB001) that shut down its direct-to-consumer app on 30 June 2025. CEO Alison Darcy told STAT (2 July 2025) the shutdown was “largely attributable to the cost and challenge of fulfilling the Food and Drug Administration’s requirements for marketing authorization,” made more pressing by LLMs “that the FDA hasn’t yet figured out how to regulate.” Conversation history was downloadable until shutdown and data was to be anonymised after 31 July 2025. Lesson: even the most clinically rigorous consumer mental-health bot struggled with the regulatory/business model, and data portability matters.
- **Character.AI.** Multiple lawsuits allege chatbots fostered dependency and contributed to teen suicides/self-harm (including 14-year-old Sewell Setzer III). On 7 January 2026, per court filings reported by CNN, CBS and the Washington Post, Google and Character.AI agreed to settle five suits (Florida, New York, Colorado, Texas), including Megan Garcia’s wrongful-death case, with Judge Anne C. Conway dismissing Garcia’s case citing the settlement. Character.AI banned under-18 open-ended chats in October 2025 and added age assurance. A common allegation: the bot never identified itself as AI, never escalated suicidal statements, and in one case a bot “presented itself as a psychotherapist falsely claiming to be licensed.”
- **Koko.** In 2023, Koko used GPT-3 to co-write mental-health support messages to about 4,000 people; recipients were not clearly informed, triggering an ethics backlash over informed consent and IRB review. Lesson: transparency about AI involvement is non-negotiable.

**4.2 Regulatory landscape (UK-focused).**

- **UK GDPR special category data.** Mental-health inferences are “data concerning health” under Article 9, which is prohibited to process unless a condition applies. For a private companion app, the realistic condition is **explicit consent** (Article 9(2)(a)) plus a lawful basis under Article 6. The ICO notes that *inferring* protected characteristics counts as processing special category data, and that solely automated decisions/profiling with significant effects on the basis of special category data require explicit consent or a substantial public interest condition plus safeguards.  You will need a DPIA (likely high-risk processing), an appropriate policy document, granular/separate explicit consent, easy withdrawal, and strong security by design.
- **MHRA (software as a medical device).** The MHRA’s February 2025 Digital Mental Health Technologies guidance turns on *intended purpose* and *functionality*: if your tool claims to diagnose, prevent, treat or monitor a mental health condition, it likely qualifies as a medical device (potentially Class IIa/IIb), requiring conformity assessment. The MHRA also published user-facing guidance for mental health apps on 27 January 2026.  Staying a “companion/wellbeing” tool that makes no therapeutic claims is the line that keeps you out of device regulation, and that line must be consistent across app copy, marketing and in-product language.
- **UK Online Safety Act / Ofcom.** Ofcom has clarified that standalone chatbots that only let a user talk to the bot itself (no user-to-user sharing, no multi-site search, no pornographic output) generally fall *outside* the OSA. A purely one-to-one Telegram companion likely sits outside current OSA scope. But Ofcom opened an investigation into Novi Ltd (an AI companion chatbot) over age-assurance, and on 16 February 2026 the UK government announced it would move to bring AI chatbot providers within scope of illegal-content duties. Expect the perimeter to tighten.
- **EU AI Act.** If you ever serve EU users: Article 5 prohibits AI that exploits vulnerabilities due to age/disability/economic situation to materially distort behaviour and cause harm, and bans emotion inference from biometric data in workplace/education (with a medical/safety exception).  Text-based sentiment is not biometric emotion recognition, but manipulation/exploitation provisions (Article 5(1)(a)/(b)) and transparency duties (Article 50, AI must disclose it is AI) are directly relevant. Maximum fines for Article 5 breaches are severe, and high-risk obligations phase in by 2 August 2026.
- **FDA / professional guidance.** US FDA has a pathway for some digital therapeutics but no clear LLM pathway (a key factor in Woebot’s exit). APA/BPS-style guidance increasingly stresses scope limits, transparency and crisis safety.

**4.3 Risks specific to a Parts-Matrix engine.**

- **Dependency / parasocial attachment.** Fang et al. (MIT Media Lab/OpenAI, March 2025; RCT n=981, over 300,000 messages over 4 weeks, plus a ~40-million-interaction analysis) found “higher daily usage, across all modalities and conversation types, correlated with higher loneliness, dependence, and problematic use, and lower socialization”; “power users” were likelier to call the bot a friend. A deeply personalised parts model could intensify attachment. Design against engagement-maximisation.
- **Inference/diagnosis without licensure.** Building a structured psychological profile risks crossing from “companion” into unlicensed psychological assessment. Mitigate with explicit non-diagnostic framing and scope boundaries.
- **Mislabelling the psyche.** A wrong “exile” or “polarisation” label, surfaced confidently, can be iatrogenic (reinforcing maladaptive self-concepts). Hence confidence scores, evidence links, recurrence thresholds, and user confirmation.
- **Reinforcing maladaptive dynamics.** A firefighter pattern (e.g. avoidance) could be inadvertently validated. Reflection prompts should flag, not entrench, maladaptive loops, and defer to professionals.
- **Crisis situations.** You must detect suicidality/self-harm and escalate to human help (UK: Samaritans 116 123; 999 for emergencies). Character.AI’s failures here are central to the lawsuits.
- **Privacy of a deeply sensitive profile.** A parts graph is among the most sensitive datasets imaginable. Encrypt at rest, minimise, and give the user inspect/correct/delete (UK GDPR rights of access, rectification, erasure) plus an explicit “right to inspect/correct/delete the AI’s model of you.”

**4.4 Evidence on efficacy and harms of AI mental-health tools.** Mixed but real for *structured* tools: Woebot showed a significant reduction in depressive symptoms versus information-only control (Fitzpatrick et al., Cohen d=0.44);  Wysa high-usage users showed greater reductions in depression (Inkster et al., d=0.47)  and a small RCT in chronic-disease patients showed significant reductions in depression and anxiety;  a meta-analysis (Zhong et al., 18 trials) found a moderate reduction in depression (g approximately -0.26).  Counterweight: the MIT/OpenAI findings on loneliness/dependence, and a Common Sense Media study (“Talk, Trust, and Trade-Offs,” released 16 July 2025; nationally representative survey of 1,060 US teens aged 13-17 by NORC at the University of Chicago) finding 72% have used an AI companion at least once and 52% are regular users. Net: benefits are most credible for structured, bounded, evidence-based interventions; open-ended companions carry dependency risk.

**4.5 Design safeguards (build these in).**

- **Transparency of the inferred model**: a “view my internal map” command showing parts, confidence and the excerpts behind each, with edit/delete.
- **Human-in-the-loop**: user confirmation before any part graduates to high confidence; signposting to human professionals.
- **Scope boundaries**: persistent “I am a companion, not a therapist or doctor” framing; no therapeutic/diagnostic claims anywhere.
- **Crisis protocol**: layered detection (cheap classifier + LLM check), immediate surfacing of Samaritans 116 123 and emergency numbers, suppression of normal “companion” behaviour during a detected crisis.
- **Consent and data rights**: explicit, granular, withdrawable consent; DPIA; encryption; data export and deletion; clear retention policy.
- **Avoid therapeutic claims** in all copy to stay outside MHRA device regulation.

## Recommendations

**Stage 1 (before any inference ships):**

1. Implement crisis detection + escalation (Samaritans 116 123) and a hard scope-boundary system prompt. This is a blocker, not a nice-to-have.
1. Stand up explicit, granular, withdrawable consent and a DPIA; add “inspect/correct/delete what I remember about you.”
1. Ship episodic + semantic memory only (Phases 1-2). Measure whether “remembering” alone satisfies the goal before adding psychology.

**Stage 2 (introduce the Parts-Matrix as hypotheses):**
4. Build the bi-temporal IFS graph in D1 with confidence + evidence links; run inference only in batched reflection passes; require citations and recurrence before surfacing anything.
5. Make the model transparent and user-editable from day one of this stage.

**Stage 3 (graph-informed conversation):**
6. Inject only a small, hedged, high-confidence slice into live prompts; forbid unprompted parts language and diagnosis.

**Benchmarks/thresholds that should change the plan:**

- If you would ever make a therapeutic/diagnostic claim, or target clinical populations, STOP: you are likely a medical device (MHRA) and need conformity assessment and clinical evidence.
- If user base includes minors or you add user-to-user features, reassess Online Safety Act scope and add age assurance.
- If you serve EU users, run an EU AI Act Article 5/Article 50 review.
- If engagement metrics rise while self-reported wellbeing or real-world socialisation falls (the MIT/OpenAI pattern), treat it as a harm signal and reduce stickiness.
- If confidence in a part cannot reach threshold across multiple sessions, do not surface it.

## Caveats

- **“Parts-Matrix” is your coinage**, synthesised from temporal knowledge graphs + IFS; there is no off-the-shelf standard by that name, so you are partly in research territory.
- **IFS is “promising, not proven.”** Treat its ontology as a useful organising metaphor and a set of falsifiable hypotheses, not validated science; the multiplicity-of-mind premise is theoretical, not empirically established, and IFS’s evidence base rests on only 2 RCTs.
- **Regulatory landscape is moving fast** (Ofcom enforcement, UK government Feb 2026 announcement, EU AI Act phase-in to 2 August 2026, MHRA updates). Verify the current position before launch; some sources here are secondary or advocacy-affiliated and are flagged as such.
- **Benchmark numbers** (Zep 94.8% DMR, Mem0 token figures, effect sizes) come from the originating teams/papers and may be contested; the Zep/Mem0 dispute over LOCOMO scores is a live example.
- This report is technical and regulatory analysis, **not legal or medical advice**; obtain qualified UK data-protection and medical-device advice before processing real users’ mental-health data.