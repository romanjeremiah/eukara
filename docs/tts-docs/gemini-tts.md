- <a href="https://docs.cloud.google.com/" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="1" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="1" data-track-metadata-eventdetail="Google Cloud Documentation">Home</a>

- 

  <a href="https://docs.cloud.google.com/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="2" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="2" data-track-metadata-eventdetail="Documentation">Documentation</a>

- 

  <a href="https://docs.cloud.google.com/docs/ai-ml" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="3" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="3" data-track-metadata-eventdetail="AI and ML">AI and ML</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="4" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="4" data-track-metadata-eventdetail="Cloud Text-to-Speech">Cloud Text-to-Speech</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs/create-audio-text-client-libraries" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="5" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="5" data-track-metadata-eventdetail="">Guides</a>

Send feedback

# Gemini-TTS <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

<a href="https://console.cloud.google.com/agent-platform/studio/media/speech" class="button button-primary" target="console" data-track-name="consoleLink">Try Gemini-TTS in Vertex AI Studio</a> <a href="https://colab.research.google.com/github/GoogleCloudPlatform/generative-ai/blob/main/audio/speech/getting-started/gemini_3_1_flash_tts.ipynb" class="button" target="_blank" data-track-type="notebookTutorial" data-track-name="colabLink">Try in Colab</a> <a href="https://github.com/GoogleCloudPlatform/generative-ai/blob/main/audio/speech/getting-started/gemini_3_1_flash_tts.ipynb" class="button" target="_blank" data-track-type="notebookTutorial" data-track-name="gitHubLink">View notebook on GitHub</a>

Gemini-TTS is the latest evolution of our Cloud TTS technology that moves beyond natural-sounding speech and provides granular control over generated audio using text-based prompts. Using Gemini-TTS, you can synthesize single or multi-speaker speech from short snippets to long-form narratives, precisely dictating style, accent, pace, tone, and even emotional expression, all steerable through natural-language prompts.

## Available models

Gemini-TTS includes the following available models:

## Gemini 3.1 Flash TTS (Preview)

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr>
<th style="width: 25%">Model ID</th>
<td><code translate="no" dir="ltr">gemini-3.1-flash-tts-preview</code></td>
</tr>
<tr>
<th>Optimized for</th>
<td>Low latency, controllable, single- and multi-speaker Cloud TTS audio generation for cost-efficient everyday applications</td>
</tr>
<tr>
<th>Input and output modalities</th>
<td><ul>
<li><strong>Input</strong>: Text</li>
<li><strong>Output</strong>: Audio</li>
</ul></td>
</tr>
<tr>
<th>Token limits</th>
<td><ul>
<li><strong>Input</strong>: 8,192</li>
<li><strong>Output</strong>: 16,384</li>
</ul></td>
</tr>
<tr>
<th>Speaker number support</th>
<td>Single, multi-speaker (dialogue)</td>
</tr>
<tr>
<th>Supported output audio formats</th>
<td><ul>
<li><strong>Unary</strong>: <code translate="no" dir="ltr">LINEAR16</code> (default), <code translate="no" dir="ltr">ALAW</code>, <code translate="no" dir="ltr">MULAW</code>, <code translate="no" dir="ltr">MP3</code>, <code translate="no" dir="ltr">OGG_OPUS</code>, <code translate="no" dir="ltr">PCM</code></li>
<li><strong>Streaming</strong>: <code translate="no" dir="ltr">PCM</code> (default), <code translate="no" dir="ltr">ALAW</code>, <code translate="no" dir="ltr">MULAW</code>, <code translate="no" dir="ltr">OGG_OPUS</code></li>
</ul></td>
</tr>
<tr>
<th>Region support</th>
<td>See <a href="#available_regions">Available regions</a>.</td>
</tr>
<tr>
<th>Voice options</th>
<td>See <a href="#voice_options">Voice options</a>.</td>
</tr>
<tr>
<th>Voice options</th>
<td>See <a href="#voice_options">Voice options</a>. Note that all voices for Gemini 3.1 Flash TTS are in <a href="https://cloud.google.com/products#product-launch-stages">Preview</a>.</td>
</tr>
<tr>
<th>Consumption options</th>
<td>See <a href="/vertex-ai/generative-ai/docs/standard-paygo">Standard Paygo</a>.</td>
</tr>
<tr>
<th>Example</th>
<td><div>
&#10;</div>
<pre style="max-width:100%" translate="no" dir="ltr" data-is-upgraded=""><code>
model: &quot;gemini-3.1-flash-tts-preview&quot;
prompt: &quot;You are having a casual conversation with a friend.
         Say the following in a friendly and amused way.&quot;
text: &quot;[laughs] I did NOT expect that. [sigh] Can you believe it!&quot;
speaker: &quot;Callirrhoe&quot;
            </code></pre>
Your browser doesn't support the audio element.</td>
</tr>
</tbody>
</table>

## Gemini 2.5 Flash TTS

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr>
<th style="width: 25%">Model ID</th>
<td><code translate="no" dir="ltr">gemini-2.5-flash-tts</code></td>
</tr>
<tr>
<th>Optimized for</th>
<td>Low latency, controllable, single- and multi-speaker Cloud TTS audio generation for cost-efficient everyday applications</td>
</tr>
<tr>
<th>Input and output modalities</th>
<td><ul>
<li><strong>Input</strong>: Text</li>
<li><strong>Output</strong>: Audio</li>
</ul></td>
</tr>
<tr>
<th>Token limits</th>
<td><ul>
<li><strong>Input</strong>: 8,192</li>
<li><strong>Output</strong>: 16,384</li>
</ul></td>
</tr>
<tr>
<th>Speaker number support</th>
<td>Single, multi-speaker</td>
</tr>
<tr>
<th>Supported output audio formats</th>
<td><ul>
<li><strong>Unary</strong>: <code translate="no" dir="ltr">LINEAR16</code> (default), <code translate="no" dir="ltr">ALAW</code>, <code translate="no" dir="ltr">MULAW</code>, <code translate="no" dir="ltr">MP3</code>, <code translate="no" dir="ltr">OGG_OPUS</code>, <code translate="no" dir="ltr">PCM</code></li>
<li><strong>Streaming</strong>: <code translate="no" dir="ltr">PCM</code> (default), <code translate="no" dir="ltr">ALAW</code>, <code translate="no" dir="ltr">MULAW</code>, <code translate="no" dir="ltr">OGG_OPUS</code></li>
</ul></td>
</tr>
<tr>
<th>Region support</th>
<td>See <a href="#available_regions">Available regions</a>.</td>
</tr>
<tr>
<th>Voice options</th>
<td>See <a href="#voice_options">Voice options</a>.</td>
</tr>
<tr>
<th>Available languages</th>
<td>See <a href="#available_languages">Available languages</a>.</td>
</tr>
<tr>
<th>Example</th>
<td><div>
&#10;</div>
<pre style="max-width:100%" translate="no" dir="ltr" data-is-upgraded=""><code>
model: &quot;gemini-2.5-flash-tts&quot;
prompt: &quot;Say the following.&quot;
text: &quot;[extremely fast] Availability and terms may vary.
       Check our website or your local store for complete
       details and restrictions.&quot;
speaker: &quot;Kore&quot;
            </code></pre>
Your browser doesn't support the audio element.</td>
</tr>
</tbody>
</table>

## Gemini 2.5 Flash Lite TTS (Preview)

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr>
<th style="width: 25%">Model ID</th>
<td><code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<th>Optimized for</th>
<td>Low latency, controllable, single-speaker Cloud TTS audio generation for cost-efficient everyday applications. Note that this model is in <a href="/products#product-launch-stages">Preview</a>.</td>
</tr>
<tr>
<th>Input and output modalities</th>
<td><ul>
<li><strong>Input</strong>: Text</li>
<li><strong>Output</strong>: Audio</li>
</ul></td>
</tr>
<tr>
<th>Token limits</th>
<td><ul>
<li><strong>Input</strong>: 8,192</li>
<li><strong>Output</strong>: 16,384</li>
</ul></td>
</tr>
<tr>
<th>Speaker number support</th>
<td>Single</td>
</tr>
<tr>
<th>Supported output audio formats</th>
<td><ul>
<li><strong>Unary</strong>: <code translate="no" dir="ltr">LINEAR16</code> (default), <code translate="no" dir="ltr">ALAW</code>, <code translate="no" dir="ltr">MULAW</code>, <code translate="no" dir="ltr">MP3</code>, <code translate="no" dir="ltr">OGG_OPUS</code>, <code translate="no" dir="ltr">PCM</code></li>
<li><strong>Streaming</strong>: <code translate="no" dir="ltr">PCM</code> (default), <code translate="no" dir="ltr">ALAW</code>, <code translate="no" dir="ltr">MULAW</code>, <code translate="no" dir="ltr">OGG_OPUS</code></li>
</ul></td>
</tr>
<tr>
<th>Region support</th>
<td>See <a href="#available_regions">Available regions</a>.</td>
</tr>
<tr>
<th>Voice options</th>
<td>See <a href="#voice_options">Voice options</a>.</td>
</tr>
<tr>
<th>Available languages</th>
<td>See <a href="#available_languages">Available languages</a>.</td>
</tr>
<tr>
<th>Example</th>
<td><div>
&#10;</div>
<pre style="max-width:100%" translate="no" dir="ltr" data-is-upgraded=""><code>
model: &quot;gemini-2.5-flash-lite-preview-tts&quot;
prompt: &quot;Say the following in an elated way.&quot;
text: &quot;Congratulations on the recent achievements!&quot;
speaker: &quot;Aoede&quot;
            </code></pre>
Your browser doesn't support the audio element.</td>
</tr>
</tbody>
</table>

## Gemini 2.5 Pro TTS

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<tbody>
<tr>
<th style="width: 25%">Model ID</th>
<td><code translate="no" dir="ltr">gemini-2.5-pro-tts</code></td>
</tr>
<tr>
<th>Optimized for</th>
<td>High control for structured workflows like podcast generation, audiobooks, customer support, and more</td>
</tr>
<tr>
<th>Input and output modalities</th>
<td><ul>
<li><strong>Input</strong>: Text</li>
<li><strong>Output</strong>: Audio</li>
</ul></td>
</tr>
<tr>
<th>Token limits</th>
<td><ul>
<li><strong>Input</strong>: 8,192</li>
<li><strong>Output</strong>: 16,384</li>
</ul></td>
</tr>
<tr>
<th>Speaker number support</th>
<td>Single, multi-speaker</td>
</tr>
<tr>
<th>Supported output audio formats</th>
<td><ul>
<li><strong>Unary</strong>: <code translate="no" dir="ltr">LINEAR16</code> (default), <code translate="no" dir="ltr">ALAW</code>, <code translate="no" dir="ltr">MULAW</code>, <code translate="no" dir="ltr">MP3</code>, <code translate="no" dir="ltr">OGG_OPUS</code>, <code translate="no" dir="ltr">PCM</code></li>
<li><strong>Streaming</strong>: <code translate="no" dir="ltr">PCM</code> (default), <code translate="no" dir="ltr">ALAW</code>, <code translate="no" dir="ltr">MULAW</code>, <code translate="no" dir="ltr">OGG_OPUS</code></li>
</ul></td>
</tr>
<tr>
<th>Region support</th>
<td>See <a href="#available_regions">Available regions</a>.</td>
</tr>
<tr>
<th>Voice options</th>
<td>See <a href="#voice_options">Voice options</a>.</td>
</tr>
<tr>
<th>Available languages</th>
<td>See <a href="#available_languages">Available languages</a>.</td>
</tr>
<tr>
<th>Example</th>
<td><div>
&#10;</div>
<pre style="max-width:100%" translate="no" dir="ltr" data-is-upgraded=""><code>
model: &quot;gemini-2.5-pro-tts&quot;
prompt: &quot;You are having a casual conversation with a friend.
         Say the following in a friendly and amused way.&quot;
text: &quot;hahah I did NOT expect that. Can you believe it!&quot;
speaker: &quot;Callirrhoe&quot;
            </code></pre>
Your browser doesn't support the audio element.</td>
</tr>
</tbody>
</table>

## Additional controls

Additional controls and capabilities include the following:

1.  **Natural conversation**: Voice interactions of remarkable quality, more appropriate expressivity, and patterns of rhythm are delivered with very low latency so you can converse fluidly.

2.  **Style control**: Using natural language prompts, you can adapt the delivery within the conversation by steering it to adopt specific accents and produce a range of tones and expressions including a whisper.

3.  **Dynamic performance**: These models can bring text to life for expressive readings of poetry, newscasts, and engaging storytelling. They can also perform with specific emotions and produce accents when requested.

4.  **Enhanced pace and pronunciation control**: Controlling delivery speed helps to ensure more accuracy in pronunciation including specific words.

For information on how to choose the right API to use these voices in your application, see [Choose the right API](#choose-the-right-api).

## Voice options

Gemini-TTS offers a wide range of voice options similar to our existing Chirp 3: HD Voices, each with distinct characteristics:

Select voice type Female Male

| Name          | Gender | Demo                                            |
|---------------|--------|-------------------------------------------------|
| Achernar      | Female | Your browser doesn't support the audio element. |
| Achird        | Male   | Your browser doesn't support the audio element. |
| Algenib       | Male   | Your browser doesn't support the audio element. |
| Algieba       | Male   | Your browser doesn't support the audio element. |
| Alnilam       | Male   | Your browser doesn't support the audio element. |
| Aoede         | Female | Your browser doesn't support the audio element. |
| Autonoe       | Female | Your browser doesn't support the audio element. |
| Callirrhoe    | Female | Your browser doesn't support the audio element. |
| Charon        | Male   | Your browser doesn't support the audio element. |
| Despina       | Female | Your browser doesn't support the audio element. |
| Enceladus     | Male   | Your browser doesn't support the audio element. |
| Erinome       | Female | Your browser doesn't support the audio element. |
| Fenrir        | Male   | Your browser doesn't support the audio element. |
| Gacrux        | Female | Your browser doesn't support the audio element. |
| Iapetus       | Male   | Your browser doesn't support the audio element. |
| Kore          | Female | Your browser doesn't support the audio element. |
| Laomedeia     | Female | Your browser doesn't support the audio element. |
| Leda          | Female | Your browser doesn't support the audio element. |
| Orus          | Male   | Your browser doesn't support the audio element. |
| Pulcherrima   | Female | Your browser doesn't support the audio element. |
| Puck          | Male   | Your browser doesn't support the audio element. |
| Rasalgethi    | Male   | Your browser doesn't support the audio element. |
| Sadachbia     | Male   | Your browser doesn't support the audio element. |
| Sadaltager    | Male   | Your browser doesn't support the audio element. |
| Schedar       | Male   | Your browser doesn't support the audio element. |
| Sulafat       | Female | Your browser doesn't support the audio element. |
| Umbriel       | Male   | Your browser doesn't support the audio element. |
| Vindemiatrix  | Female | Your browser doesn't support the audio element. |
| Zephyr        | Female | Your browser doesn't support the audio element. |
| Zubenelgenubi | Male   | Your browser doesn't support the audio element. |

## Available languages

Gemini-TTS supports the following languages:

Select launch stage GA Preview

| Language                     | BCP-47 code | Launch readiness |
|------------------------------|-------------|------------------|
| Arabic (Egypt)               | ar-EG       | GA               |
| Bangla (Bangladesh)          | bn-BD       | GA               |
| Dutch (Netherlands)          | nl-NL       | GA               |
| English (India)              | en-IN       | GA               |
| English (United States)      | en-US       | GA               |
| French (France)              | fr-FR       | GA               |
| German (Germany)             | de-DE       | GA               |
| Hindi (India)                | hi-IN       | GA               |
| Indonesian (Indonesia)       | id-ID       | GA               |
| Italian (Italy)              | it-IT       | GA               |
| Japanese (Japan)             | ja-JP       | GA               |
| Korean (South Korea)         | ko-KR       | GA               |
| Marathi (India)              | mr-IN       | GA               |
| Polish (Poland)              | pl-PL       | GA               |
| Portuguese (Brazil)          | pt-BR       | GA               |
| Romanian (Romania)           | ro-RO       | GA               |
| Russian (Russia)             | ru-RU       | GA               |
| Spanish (Spain)              | es-ES       | GA               |
| Tamil (India)                | ta-IN       | GA               |
| Telugu (India)               | te-IN       | GA               |
| Thai (Thailand)              | th-TH       | GA               |
| Turkish (Turkey)             | tr-TR       | GA               |
| Ukrainian (Ukraine)          | uk-UA       | GA               |
| Vietnamese (Vietnam)         | vi-VN       | GA               |
| Afrikaans (South Africa)     | af-ZA       | Preview          |
| Albanian (Albania)           | sq-AL       | Preview          |
| Amharic (Ethiopia)           | am-ET       | Preview          |
| Arabic (World)               | ar-001      | Preview          |
| Armenian (Armenia)           | hy-AM       | Preview          |
| Azerbaijani (Azerbaijan)     | az-AZ       | Preview          |
| Basque (Spain)               | eu-ES       | Preview          |
| Belarusian (Belarus)         | be-BY       | Preview          |
| Bulgarian (Bulgaria)         | bg-BG       | Preview          |
| Burmese (Myanmar)            | my-MM       | Preview          |
| Catalan (Spain)              | ca-ES       | Preview          |
| Cebuano (Philippines)        | ceb-PH      | Preview          |
| Chinese, Mandarin (China)    | cmn-CN      | Preview          |
| Chinese, Mandarin (Taiwan)   | cmn-tw      | Preview          |
| Croatian (Croatia)           | hr-HR       | Preview          |
| Czech (Czech Republic)       | cs-CZ       | Preview          |
| Danish (Denmark)             | da-DK       | Preview          |
| English (Australia)          | en-AU       | Preview          |
| English (United Kingdom)     | en-GB       | Preview          |
| Estonian (Estonia)           | et-EE       | Preview          |
| Filipino (Philippines)       | fil-PH      | Preview          |
| Finnish (Finland)            | fi-FI       | Preview          |
| French (Canada)              | fr-CA       | Preview          |
| Galician (Spain)             | gl-ES       | Preview          |
| Georgian (Georgia)           | ka-GE       | Preview          |
| Greek (Greece)               | el-GR       | Preview          |
| Gujarati (India)             | gu-IN       | Preview          |
| Haitian Creole (Haiti)       | ht-HT       | Preview          |
| Hebrew (Israel)              | he-IL       | Preview          |
| Hungarian (Hungary)          | hu-HU       | Preview          |
| Icelandic (Iceland)          | is-IS       | Preview          |
| Javanese (Java)              | jv-JV       | Preview          |
| Kannada (India)              | kn-IN       | Preview          |
| Konkani (India)              | kok-IN      | Preview          |
| Lao (Laos)                   | lo-LA       | Preview          |
| Latin (Vatican City)         | la-VA       | Preview          |
| Latvian (Latvia)             | lv-LV       | Preview          |
| Lithuanian (Lithuania)       | lt-LT       | Preview          |
| Luxembourgish (Luxembourg)   | lb-LU       | Preview          |
| Macedonian (North Macedonia) | mk-MK       | Preview          |
| Maithili (India)             | mai-IN      | Preview          |
| Malagasy (Madagascar)        | mg-MG       | Preview          |
| Malay (Malaysia)             | ms-MY       | Preview          |
| Malayalam (India)            | ml-IN       | Preview          |
| Mongolian (Mongolia)         | mn-MN       | Preview          |
| Nepali (Nepal)               | ne-NP       | Preview          |
| Norwegian, Bokmål (Norway)   | nb-NO       | Preview          |
| Norwegian, Nynorsk (Norway)  | nn-NO       | Preview          |
| Odia (India)                 | or-IN       | Preview          |
| Pashto (Afghanistan)         | ps-AF       | Preview          |
| Persian (Iran)               | fa-IR       | Preview          |
| Portuguese (Portugal)        | pt-PT       | Preview          |
| Punjabi (India)              | pa-IN       | Preview          |
| Serbian (Serbia)             | sr-RS       | Preview          |
| Sindhi (India)               | sd-IN       | Preview          |
| Sinhala (Sri Lanka)          | si-LK       | Preview          |
| Slovak (Slovakia)            | sk-SK       | Preview          |
| Slovenian (Slovenia)         | sl-SI       | Preview          |
| Spanish (Latin America)      | es-419      | Preview          |
| Spanish (Mexico)             | es-MX       | Preview          |
| Swahili (Kenya)              | sw-KE       | Preview          |
| Swedish (Sweden)             | sv-SE       | Preview          |
| Urdu (Pakistan)              | ur-PK       | Preview          |

## Available regions

Gemini-TTS is available multiple regions, through Cloud Text-to-Speech API or Vertex AI API.

The ML processing for these models occurs within the specific region or multi-region where the request is made. For more information , see [Data residency](/vertex-ai/generative-ai/docs/learn/data-residency).

For Cloud Text-to-Speech API, the following regions are supported:

<table>
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left;">Region</th>
<th style="text-align: left;">Country or Jurisdiction</th>
<th style="text-align: left;">Available models</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">global</code></td>
<td style="text-align: left;">Global (Non-DRZ)</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-3.1-flash-tts-preview</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">us</code></td>
<td style="text-align: left;">United States</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">eu</code></td>
<td style="text-align: left;">European Union</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">northamerica-northeast1</code></td>
<td style="text-align: left;">Canada</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
</tbody>
</table>

These regions can be accessed using the following API endpoints: `<REGION>-texttospeech.googleapis.com`. Note the `global` region doesn't have a prefix: `texttospeech.googleapis.com`.

For Vertex AI API, the following regions are supported:

<table>
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left;">Region</th>
<th style="text-align: left;">Country or Jurisdiction</th>
<th style="text-align: left;">Available models</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">global</code></td>
<td style="text-align: left;">Global (Non-DRZ)</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-3.1-flash-tts-preview</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">europe-central2</code></td>
<td style="text-align: left;">European Union</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">europe-north1</code></td>
<td style="text-align: left;">European Union</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">europe-southwest1</code></td>
<td style="text-align: left;">European Union</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">europe-west1</code></td>
<td style="text-align: left;">European Union</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">europe-west4</code></td>
<td style="text-align: left;">European Union</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">northamerica-northeast1</code></td>
<td style="text-align: left;">Canada</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">us-central1</code></td>
<td style="text-align: left;">United States</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">us-east1</code></td>
<td style="text-align: left;">United States</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">us-east4</code></td>
<td style="text-align: left;">United States</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">us-east5</code></td>
<td style="text-align: left;">United States</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">us-south1</code></td>
<td style="text-align: left;">United States</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">us-west1</code></td>
<td style="text-align: left;">United States</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
<tr>
<td style="text-align: left;"><code translate="no" dir="ltr">us-west4</code></td>
<td style="text-align: left;">United States</td>
<td style="text-align: left;"><code translate="no" dir="ltr">gemini-2.5-flash-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-pro-tts</code><br />
<code translate="no" dir="ltr">gemini-2.5-flash-lite-preview-tts</code></td>
</tr>
</tbody>
</table>

These regions can be accessed using the following API endpoints: `<REGION>-aiplatform.googleapis.com`. Note the `global` region doesn't have a prefix: `aiplatform.googleapis.com`.

## Choose the right API

Discover how to use Gemini-TTS models to synthesize single-speaker and multi-speaker speech using Cloud Text-to-Speech API or [Vertex AI API](/vertex-ai/generative-ai/docs/sdks/overview).

Gemini-TTS is available through two APIs to help simplify the integration process for clients. Cloud Text-to-Speech API and Vertex AI API, with REST endpoints and SDKs in multiple programming languages.

Here are some guidelines to help you choose the right API.

If the following applies, choose Cloud Text-to-Speech API:

1.  If you are using Chirp 3 HD or other voices, then you can continue to use the same Cloud Text-to-Speech API with minimal incremental updates.
2.  If you need specific output encoding types, Cloud Text-to-Speech API can specify audio encoding. In Vertex AI API, the output is PCM 16bit 24k audio data, and doesn't have WAV headers. If you want to convert to another audio format, then the conversion needs to be handled from the client side.
3.  If you must stream text in multiple chunks, Cloud Text-to-Speech API supports multiple requests and multiple responses interaction. In contrast, Vertex AI API supports single request and multiple responses.
4.  If you want to apply [text normalization](/python/docs/reference/texttospeech/latest/google.cloud.texttospeech_v1.types.AdvancedVoiceOptions) by default. This is particularly useful for transcripts that include date and monetary values.

If the following applies, choose Vertex AI API:

1.  If you are already using Gemini-TTS from AI Studio, you can switch to Vertex AI seamlessly to take advantage of the scalability and compliance of Google Cloud.
2.  If you are using Vertex AI API for other models, then the unified api structure makes it easier to start using Gemini-TTS by specifying the model name and voice selection options.

## Use Cloud Text-to-Speech API

**Note:** The size of the text field and the prompt field individually can be at most 4,000 bytes. While the total size of the prompt and text fields can be up to 8,000 bytes, each field must be a maximum of 4000 bytes. The output audio can at most be around 655 seconds. If the input text amounts to audio longer than this limit, the audio will be truncated.

Optionally specify audio formats and sampling rates in "audioConfig" field if non-default options are needed.

| Description | Limit | Type |
|:---|:---|:---|
| Text field | Less than or equal to 4,000 bytes. | Input |
| Prompt field | Less than or equal to 4,000 bytes. | Input |
| Text and prompt fields | Less than or equal to 8,000 bytes. | Input |
| Duration for the output audio | Approximately 655 seconds. If the input text results in the audio exceeding 655 seconds, the audio is truncated. | Output |

**Note:** To be able to use Gemini-TTS, `aiplatform.endpoints.predict` permission is required for the model endpoint. This permission can be granted with the [roles/aiplatform.user role](/vertex-ai/docs/general/access-control#aiplatform.user).

### Before you begin

Before you can begin using Cloud Text-to-Speech, you must enable the API in the Google Cloud console by following steps:

1.  Enable Cloud Text-to-Speech on a project.
2.  Make sure billing is enabled for Cloud Text-to-Speech.
3.  Set up authentication for your development environment.
4.  Assign `aiplatform.endpoints.predict` permission for the authenticated user. This permission can be granted with the [roles/aiplatform.user role](/vertex-ai/docs/general/access-control#aiplatform.user).
5.  Select the correct API endpoint based on [Available regions](#available_regions).

#### Set up your Google Cloud project

1.  <a href="https://console.cloud.google.com/" class="button button-primary" target="console" data-track-type="tasks" data-track-name="console Link" data-track-metadata-position="body">Sign in to Google Cloud console</a>

2.  <a href="https://console.cloud.google.com/projectselector2/home/dashboard" class="button button-primary" target="console" data-track-type="commonIncludes" data-track-name="consoleLink" data-track-metadata-end-goal="createProject">Go to the project selector page</a>

    You can either choose an existing project or create a new one. For more details about creating a project, see the <a href="/resource-manager/docs/creating-managing-projects" target="_blank">Google Cloud documentation</a>.

3.  If you create a new project, a message appears informing you to link a billing account. If you are using a pre-existing project, make sure to enable billing

    <a href="/billing/docs/how-to/modify-project" class="button button-primary" target="_blank" data-track-type="commonIncludes" data-track-name="supportLink" data-track-metadata-end-goal="enableBilling">Learn how to confirm that billing is enabled for your project</a>

    **Note:** You must enable billing to use Cloud Text-to-Speech API, however, you won't be be charged unless you exceed the free quota. For more information about pricing, see the [pricing](https://cloud.google.com/text-to-speech/pricing) page.

4.  After you've selected a project and linked it to a billing account, you can enable the Cloud Text-to-Speech API. Go to the **Search products and resources** bar at the top of the page, and type in **"speech"**. Select the **Cloud Text-to-Speech API** from the list of results.

5.  To try Cloud Text-to-Speech without linking it to your project, choose the **Try this API** option. To enable the Cloud Text-to-Speech API for use with your project, click **Enable**.

6.  Set up authentication for your development environment. For instructions, see [Set up authentication for Cloud Text-to-Speech](/text-to-speech/docs/authentication#authn-how-to).

### Setting API endpoint for preferred region

You can pick an endpoint based on [Available regions](#available_regions).

### Python

``` devsite-click-to-copy
import os
from google.cloud import texttospeech

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
TTS_LOCATION = os.getenv("GOOGLE_CLOUD_REGION")

API_ENDPOINT = (
    f"{TTS_LOCATION}-texttospeech.googleapis.com"
    if TTS_LOCATION != "global"
    else "texttospeech.googleapis.com"
)
client = texttospeech.TextToSpeechClient(
    client_options=ClientOptions(api_endpoint=API_ENDPOINT)
)
```

### CURL

``` devsite-click-to-copy
GLOBAL_API_ENDPOINT=https://texttospeech.googleapis.com
REGIONAL_API_ENDPOINT=https://YOUR_REGION-texttospeech.googleapis.com
```

### Perform synchronous single-speaker synthesis

### Python

``` devsite-click-to-copy
# google-cloud-texttospeech minimum version 2.29.0 is required.

import os
from google.cloud import texttospeech

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")

def synthesize(prompt: str, text: str, output_filepath: str = "output.mp3"):
    """Synthesizes speech from the input text and saves it to an MP3 file.

    Args:
        prompt: Styling instructions on how to synthesize the content in
          the text field.
        text: The text to synthesize.
        output_filepath: The path to save the generated audio file.
          Defaults to "output.mp3".
    """
    client = texttospeech.TextToSpeechClient()

    synthesis_input = texttospeech.SynthesisInput(text=text, prompt=prompt)

    # Select the voice you want to use.
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="Charon",  # Example voice, adjust as needed
        model_name="gemini-3.1-flash-tts-preview"
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type.
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    # The response's audio_content is binary.
    with open(output_filepath, "wb") as out:
        out.write(response.audio_content)
        print(f"Audio content written to file: {output_filepath}")
```

### CURL

``` devsite-click-to-copy
# Make sure to install gcloud cli, and sign in to your project.
# Make sure to use your PROJECT_ID value.
# The available models are gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts, gemini-2.5-flash-lite-preview-tts, and gemini-2.5-pro-tts.
# To parse the JSON output and use it directly see the last line of the command.
# Requires JQ and ffplay library to be installed.
PROJECT_ID=YOUR_PROJECT_ID
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "x-goog-user-project: $PROJECT_ID" \
  -H "Content-Type: application/json" \
-d '{
  "input": {
    "prompt": "Say the following in a curious way.",
    "text": "OK, so... tell me about this [uhm] AI thing."
  },
  "voice": {
    "languageCode": "en-us",
    "name": "Kore",
    "model_name": "gemini-3.1-flash-tts-preview"
  },
  "audioConfig": {
    "audioEncoding": "LINEAR16"
  }
}' \
  "https://texttospeech.googleapis.com/v1/text:synthesize" \
  | jq -r '.audioContent' | base64 -d | ffplay - -autoexit
```

### Perform streaming single-speaker synthesis

Streaming synthesis is suitable for real-time applications where fast response is critical for the user experience. In streaming connection, the API returns audio as it becomes available in small chunks.

As the caller of the API, make sure to consume the audio chunks, passing them down to your clients as they arrive (for example, using socketio for web apps).

Cloud Text-to-Speech API supports `multiple request multiple response` type streaming. While it's possible to send the input chunks to the API asynchronously as shown in the `request_generator`, the API only starts synthesizing when the client sends `Half-Close` as a signal that it won't send any more data to the API.

The `prompt` field must be set in the first input chunk, because it's ignored in consecutive chunks.

### Python

``` devsite-click-to-copy
# google-cloud-texttospeech minimum version 2.29.0 is required.

import datetime
import os
import numpy as np
from google.cloud import texttospeech

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")

def synthesize(prompt: str, text_chunks: list[str], model: str, voice: str, locale: str):
    """Synthesizes speech from the input text.

    Args:
        prompt: Styling instructions on how to synthesize the content in
          the text field.
        text_chunks: Text chunks to synthesize. Note that The synthesis will 
          start when the client initiates half-close. 
        model: gemini tts model name. gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts, gemini-2.5-flash-lite-preview-tts, and gemini-2.5-pro-tts.
        voice: voice name. Example: leda, kore. Refer to available voices.
        locale: locale name. Example: en-us. Refer to available locales. 
    """
    client = texttospeech.TextToSpeechClient()

    config_request = texttospeech.StreamingSynthesizeRequest(
        streaming_config=texttospeech.StreamingSynthesizeConfig(
            voice=texttospeech.VoiceSelectionParams(
                name=voice,
                language_code=locale,
                model_name=model
            )
        )
    )

    # Example request generator. A function like this can be linked to an LLM
    # text generator and the text can be passed to the TTS API asynchronously.
    def request_generator():
      yield config_request

      for i, text in enumerate(text_chunks):
        yield texttospeech.StreamingSynthesizeRequest(
            input=texttospeech.StreamingSynthesisInput(
              text=text, 
              # Prompt is only supported in the first input chunk.
              prompt=prompt if i == 0 else None,
            )
        )

    request_start_time = datetime.datetime.now()
    streaming_responses = client.streaming_synthesize(request_generator())

    is_first_chunk_received = False
    final_audio_data = np.array([])
    num_chunks_received = 0
    for response in streaming_responses:
        # just a simple progress indicator
        num_chunks_received += 1
        print(".", end="")
        if num_chunks_received % 40 == 0:
            print("")

        # measuring time to first audio
        if not is_first_chunk_received:
            is_first_chunk_received = True
            first_chunk_received_time = datetime.datetime.now()

        # accumulating audio. In a web-server scenario, you would want to 
        # "emit" audio to the frontend as soon as it arrives.
        #
        # For example using flask socketio, you could do the following
        # from flask_socketio import SocketIO, emit
        # emit("audio", response.audio_content)
        # socketio.sleep(0)
        audio_data = np.frombuffer(response.audio_content, dtype=np.int16)
        final_audio_data = np.concatenate((final_audio_data, audio_data))

    time_to_first_audio = first_chunk_received_time - request_start_time
    time_to_completion = datetime.datetime.now() - request_start_time
    audio_duration = len(final_audio_data) / 24_000  # default sampling rate.

    print("\n")
    print(f"Time to first audio: {time_to_first_audio.total_seconds()} seconds")
    print(f"Time to completion: {time_to_completion.total_seconds()} seconds")
    print(f"Audio duration: {audio_duration} seconds")

    return final_audio_data
```

### Perform synchronous multi-speaker synthesis with freeform text input

**Note:** The combined size of all lines of dialogue can be at most 4,000 bytes. While the total size of the prompt and dialogue can be up to 4,000 bytes, each prompt and dialogue field must be a maximum of 4,000 bytes. Speaker aliases must consist solely of alphanumeric characters, excluding whitespace.

| Description | Constraints & Limits | Type |
|:---|:---|:---|
| Text field | Less than or equal to 4,000 bytes | Input |
| Prompt field | Less than or equal to 4,000 bytes | Input |
| Text and prompt fields | Less than or equal to 8,000 bytes | Input |
| Speaker aliases | Alphanumeric characters and no whitespace | Input |
| Duration for the output audio | Approximately 655 seconds. If the input text results in the audio exceeding 655 seconds, the audio is truncated. | Output |

### Python

``` devsite-click-to-copy
# google-cloud-texttospeech minimum version 2.31.0 is required.

import os
from google.cloud import texttospeech

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")

def synthesize_multispeaker_freeform(
    prompt: str,
    text: str,
    output_filepath: str = "output_non_turn_based.wav",
):
    """Synthesizes speech from non-turn-based input and saves it to a WAV file.

    Args:
        prompt: Styling instructions on how to synthesize the content in the
          text field.
        text: The text to synthesize, containing speaker aliases to indicate
          different speakers. Example: "Sam: Hi Bob!\nBob: Hi Sam!"
        output_filepath: The path to save the generated audio file. Defaults to
          "output_non_turn_based.wav".
    """
    client = texttospeech.TextToSpeechClient()

    synthesis_input = texttospeech.SynthesisInput(text=text, prompt=prompt)

    multi_speaker_voice_config = texttospeech.MultiSpeakerVoiceConfig(
        speaker_voice_configs=[
            texttospeech.MultispeakerPrebuiltVoice(
                speaker_alias="Speaker1",
                speaker_id="Kore",
            ),
            texttospeech.MultispeakerPrebuiltVoice(
                speaker_alias="Speaker2",
                speaker_id="Charon",
            ),
        ]
    )

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        model_name="gemini-3.1-flash-tts-preview",
        multi_speaker_voice_config=multi_speaker_voice_config,
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.LINEAR16,
        sample_rate_hertz=24000,
    )

    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    with open(output_filepath, "wb") as out:
        out.write(response.audio_content)
        print(f"Audio content written to file: {output_filepath}")
```

### CURL

``` devsite-click-to-copy
# Make sure to install gcloud cli, and sign in to your project.
# Make sure to use your PROJECT_ID value.
# The available models are gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts and gemini-2.5-pro-tts
# To parse the JSON output and use it directly see the last line of the command.
# Requires JQ and ffplay library to be installed.
# google-cloud-texttospeech minimum version 2.31.0 is required.
PROJECT_ID=YOUR_PROJECT_ID
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "x-goog-user-project: $PROJECT_ID" \
  -H "Content-Type: application/json" \
-d '{
  "input": {
    "prompt": "Say the following as a conversation between friends.",
    "text": "Sam: Hi Bob, how are you?\\nBob: I am doing well, and you?"
  },
  "voice": {
    "languageCode": "en-us",
    "modelName": "gemini-3.1-flash-tts-preview",
    "multiSpeakerVoiceConfig": {
      "speakerVoiceConfigs": [
        {
          "speakerAlias": "Sam",
          "speakerId": "Kore"
        },
        {
          "speakerAlias": "Bob",
          "speakerId": "Charon"
        }
      ]
    }
  },
  "audioConfig": {
    "audioEncoding": "LINEAR16",
    "sampleRateHertz": 24000
  }
}' \
  "https://texttospeech.googleapis.com/v1/text:synthesize" \
  | jq -r '.audioContent' | base64 -d | ffplay - -autoexit
```

### Perform synchronous multi-speaker synthesis with structured text input

Multi-speaker with structured text input enables intelligent verbalization of text in a human-like way. For example, this kind of input is useful for addresses and dates. Freeform text input speaks the text exactly as written.

**Note:** Speaker aliases must consist solely of alphanumeric characters, excluding whitespace. The combined size of all lines of dialogue can be at most 4,000 bytes. While the total size of the prompt and dialogue can be up to 4,000 bytes, each prompt and dialogue field must be a maximum of 4,000 bytes.

| Description | Constraints & Limits | Type |
|:---|:---|:---|
| MultiSpeakerMarkUp field | Less than or equal to 4,000 bytes | Input |
| Prompt field | Less than or equal to 4,000 bytes | Input |
| MultiSpeakerMarkUp and prompt fields | Less than or equal to 8,000 bytes | Input |
| Speaker aliases | Alphanumeric characters and no whitespace | Input |
| Duration for the output audio | Approximately 655 seconds. If the input text results in the audio exceeding 655 seconds, the audio is truncated. | Output |

### Python

``` devsite-click-to-copy
# google-cloud-texttospeech minimum version 2.31.0 is required.

import os
from google.cloud import texttospeech

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")

def synthesize_multispeaker_structured(
    prompt: str,
    turns: list[texttospeech.MultiSpeakerMarkup.Turn],
    output_filepath: str = "output_turn_based.wav",
):
    """Synthesizes speech from turn-based input and saves it to a WAV file.

    Args:
        prompt: Styling instructions on how to synthesize the content in the
          text field.
        turns: A list of texttospeech.MultiSpeakerMarkup.Turn objects representing
          the dialogue turns.
        output_filepath: The path to save the generated audio file. Defaults to
          "output_turn_based.wav".
    """
    client = texttospeech.TextToSpeechClient()

    synthesis_input = texttospeech.SynthesisInput(
        multi_speaker_markup=texttospeech.MultiSpeakerMarkup(turns=turns),
        prompt=prompt,
    )

    multi_speaker_voice_config = texttospeech.MultiSpeakerVoiceConfig(
        speaker_voice_configs=[
            texttospeech.MultispeakerPrebuiltVoice(
                speaker_alias="Speaker1",
                speaker_id="Kore",
            ),
            texttospeech.MultispeakerPrebuiltVoice(
                speaker_alias="Speaker2",
                speaker_id="Charon",
            ),
        ]
    )

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        model_name="gemini-3.1-flash-tts-preview",
        multi_speaker_voice_config=multi_speaker_voice_config,
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.LINEAR16,
        sample_rate_hertz=24000,
    )

    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    with open(output_filepath, "wb") as out:
        out.write(response.audio_content)
        print(f"Audio content written to file: {output_filepath}")
```

### CURL

``` devsite-click-to-copy
# Make sure to install gcloud cli, and sign in to your project.
# Make sure to use your PROJECT_ID value.
# The available models are gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts and gemini-2.5-pro-tts.
# To parse the JSON output and use it directly see the last line of the command.
# Requires JQ and ffplay library to be installed.
# google-cloud-texttospeech minimum version 2.31.0 is required.
PROJECT_ID=YOUR_PROJECT_ID
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "x-goog-user-project: $PROJECT_ID" \
  -H "Content-Type: application/json" \
-d '{
  "input": {
    "prompt": "Say the following as a conversation between friends.",
    "multiSpeakerMarkup": {
      "turns": [
        {
          "speaker": "Sam",
          "text": "Hi Bob, how are you?"
        },
        {
          "speaker": "Bob",
          "text": "I am doing well, and you?"
        }
      ]
    }
  },
  "voice": {
    "languageCode": "en-us",
    "modelName": "gemini-3.1-flash-tts-preview",
    "multiSpeakerVoiceConfig": {
      "speakerVoiceConfigs": [
        {
          "speakerAlias": "Sam",
          "speakerId": "Kore"
        },
        {
          "speakerAlias": "Bob",
          "speakerId": "Charon"
        }
      ]
    }
  },
  "audioConfig": {
    "audioEncoding": "LINEAR16",
    "sampleRateHertz": 24000
  }
}' \
  "https://texttospeech.googleapis.com/v1/text:synthesize" \
  | jq -r '.audioContent' | base64 -d | ffplay - -autoexit
```

## Use Vertex AI API

Discover how to use Gemini-TTS models to synthesize single-speaker and multi-speaker speech using Vertex AI API.

In Cloud Text-to-Speech API, the user can provide text and prompt fields separately. In Vertex AI API, this is a single `contents` field, where it specifies the input in the form of "{prompt}: {text}", eg. "Say the following in a curious way: OK, so... tell me about this AI thing."

**Note:** The total size of the prompt and text fields can be up to 8,000 bytes. The output audio can at most be around 655 seconds. If the input text amounts to audio longer than this limit, the audio is truncated.

| Description | Limit | Type |
|:---|:---|:---|
| Contents field | Less than or equal to 8,000 bytes. | Input |
| Duration for the output audio | Approximately 655 seconds. If the input text results in the audio exceeding 655 seconds, the audio is truncated. | Output |

### Before you begin

Before you can begin, follow the installation steps for [Vertex AI API](/vertex-ai/generative-ai/docs/sdks/overview). To take advantage of data residency options, make sure to set the `LOCATION` based on [Available regions](#available_regions).

**Note:** The API ignores the `temperature`, `top_k` and `top_p` generation config parameters in the request.

### Perform synchronous single-speaker synthesis

These code samples demonstrate how to perform synchronous single-speaker synthesis.

### Python

``` devsite-click-to-copy
from google import genai
from google.genai import types
import wave
import os

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "global")

# Set up the wave file to save the output:
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
  with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

response = client.models.generate_content(
  model="gemini-3.1-flash-tts-preview",
  contents="Say the following in a curious way: OK, so... tell me about this [uhm] AI thing.",
  config=types.GenerateContentConfig(
      speech_config=types.SpeechConfig(
        language_code="en-in",
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
              voice_name='Kore',
            )
        )
      ),
  )
)

data = response.candidates[0].content.parts[0].inline_data.data

file_name='output_speech.wav'
wave_file(file_name, data) # Saves the file to current directory
```

### CURL

``` devsite-click-to-copy
# Make sure to install gcloud cli, and sign in to your project.
# Make sure to use your PROJECT_ID value.
# The available models are gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts, gemini-2.5-flash-lite-preview-tts, and gemini-2.5-pro-tts.
# To parse the JSON output and use it directly see the last line of the command.
# Requires JQ and ffplay library to be installed.
PROJECT_ID=YOUR_PROJECT_ID
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "x-goog-user-project: $PROJECT_ID" \
  -H "Content-Type: application/json" \
-d '{
  "contents": {
    "role": "user",
    "parts": { "text": "Say the following in a curious way: OK, so... tell me about this [uhm] AI thing." }
  },
  "generation_config": {
    "speech_config": {
        "language_code": "en-in",
        "voice_config": {
            "prebuilt_voice_config": {
              "voice_name": "kore"
            }
        }
    }
  }
  }' \
  https://aiplatform.googleapis.com/v1beta1/projects/$PROJECT_ID/locations/us-central1/publishers/google/models/gemini-3.1-flash-tts-preview:generateContent \
  | jq -r '.candidates[0].content.parts[0].inlineData.data' \
  | base64 -d | ffmpeg -f s16le -ar 24k -ac 1 -i - output_speech.wav
```

### Perform streaming single-speaker synthesis

In Vertex AI API, unidirectional streaming is supported, that is, the client sends a single request and receives a stream of responses.

This code sample demonstrates how to perform streaming single-speaker synthesis.

### Python

``` devsite-click-to-copy
from google import genai
from google.genai import types
import wave
import os
import datetime

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "global")

# Set up the wave file to save the output:
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
  with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

def synthesize(text: str, model: str, voice: str, locale: str):
    """Synthesizes speech from the input text.

    Args:
        text: Text to synthesize.
        model: gemini tts model name. Available models are gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts, gemini-2.5-flash-lite-preview-tts, and gemini-2.5-pro-tts.
        voice: voice name. Example: leda, kore. Refer to available voices.
        locale: locale name. Example: en-us. Refer to available locales.
    """
    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

    generate_content_config=types.GenerateContentConfig(
        speech_config=types.SpeechConfig(
          language_code=locale,
          voice_config=types.VoiceConfig(
              prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name=voice,
              )
          )
        ),
    )

    request_start_time = datetime.datetime.now()
    is_first_chunk_received = False
    final_audio_data = bytes()
    num_chunks_received = 0

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=text,
        config=generate_content_config,
    ):
        # just a simple progress indicator
        num_chunks_received += 1
        print(".", end="")
        if num_chunks_received % 40 == 0:
            print("")
        # measuring time to first audio
        if not is_first_chunk_received:
            is_first_chunk_received = True
            first_chunk_received_time = datetime.datetime.now()

        if (
            chunk.candidates is None
            or not chunk.candidates
            or chunk.candidates[0].content is None
            or not chunk.candidates[0].content.parts
        ):
            continue
        part = chunk.candidates[0].content.parts[0]
        if part.inline_data and part.inline_data.data:
          # accumulating audio. In a web-server scenario, you would want to
          # "emit" audio to the frontend as soon as it arrives.
          #
          # For example using flask socketio, you could do the following
          # from flask_socketio import SocketIO, emit
          # emit("audio", chunk.candidates[0].content.parts[0].inline_data.data)
          # socketio.sleep(0)
          final_audio_data += chunk.candidates[0].content.parts[0].inline_data.data

    time_to_first_audio = first_chunk_received_time - request_start_time
    time_to_completion = datetime.datetime.now() - request_start_time

    print("\n")
    print(f"Time to first audio: {time_to_first_audio.total_seconds()} seconds")
    print(f"Time to completion: {time_to_completion.total_seconds()} seconds")

    return final_audio_data

audio_data = synthesize(
    "Say the following in a curious way: Radio Bakery is a New York City gem, celebrated for its exceptional and creative baked goods. The pistachio croissant is often described as a delight with perfect sweetness. The rhubarb custard croissant is a lauded masterpiece of flaky pastry and tart filling. The brown butter corn cake stands out with its crisp edges and rich flavor. Despite the bustle, the staff consistently receives praise for being friendly and helpful.",
    "gemini-3.1-flash-tts-preview",
    "Kore",
    "en-in")
file_name='output_speech.wav'
wave_file(file_name, audio_data)

Audio("output_speech.wav")
```

### Perform synchronous multi-speaker synthesis

This code sample demonstrates how to perform synchronous multi-speaker synthesis.

### Python

``` devsite-click-to-copy
from google import genai
from google.genai import types
import wave
import os
import datetime

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "global")

prompt = """TTS the following conversation between Joe and Jane:
        Joe: How's it going today Jane?
        Jane: Not too bad, how about you?"""

# Set up the wave file to save the output:
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
  with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

response = client.models.generate_content(
  model="gemini-3.1-flash-tts-preview",
  contents=prompt,
  config=types.GenerateContentConfig(
      speech_config=types.SpeechConfig(
        language_code="en-in",
        multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
            speaker_voice_configs=[
              types.SpeakerVoiceConfig(
                  speaker='Joe',
                  voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Kore',
                    )
                  )
              ),
              types.SpeakerVoiceConfig(
                  speaker='Jane',
                  voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Puck',
                    )
                  )
              ),
            ]
        )
      ),
  )
)

data = response.candidates[0].content.parts[0].inline_data.data

file_name='output_speech.wav'
wave_file(file_name, data) # Saves the file to current directory

Audio("output_speech.wav")
```

### CURL

``` devsite-click-to-copy
# Make sure to install gcloud cli, and sign in to your project.
# Make sure to use your PROJECT_ID value.
# The available models are gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts, gemini-2.5-flash-lite-preview-tts, and gemini-2.5-pro-tts.
# To parse the JSON output and use it directly see the last line of the command.
# Requires JQ and ffplay library to be installed.
PROJECT_ID=YOUR_PROJECT_ID
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "x-goog-user-project: $PROJECT_ID" \
  -H "Content-Type: application/json" \
-d '{
  "contents": {
    "role": "user",
    "parts": { "text": "Say the following as a conversation between friends: Sam: Hi Bob, how are you?\\nBob: I am doing well, and you?" }
  },
  "generation_config": {
    "speech_config": {
      "language_code": "en-in",
      "multi_speaker_voice_config": {
        "speaker_voice_configs": [{
          "speaker": "Sam",
          "voice_config": {
            "prebuilt_voice_config": {
              "voice_name": "Aoede"
            }
          }
        },{
          "speaker": "Bob",
          "voice_config": {
            "prebuilt_voice_config": {
              "voice_name": "Algieba"
            }
          }
        }]
      }
    },
  }
  }' \
  https://aiplatform.googleapis.com/v1beta1/projects/$PROJECT_ID/locations/us-central1/publishers/google/models/gemini-3.1-flash-tts-preview:generateContent \
  | jq -r '.candidates[0].content.parts[0].inlineData.data' \
  | base64 -d | ffmpeg -f s16le -ar 24k -ac 1 -i - output_speech.wav
```

### Perform streaming multi-speaker synthesis

In Vertex AI API, unidirectional streaming is supported, that is, the client sends a single request and receives a stream of responses.

This code sample demonstrates how to perform streaming multi-speaker synthesis.

### Python

``` devsite-click-to-copy
from google import genai
from google.genai import types
import wave
import os
import datetime

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "global")

prompt = """TTS the following conversation between Joe and Jane:
        Joe: How's it going today Jane?
        Jane: Not too bad! Honestly, I'm just blown away by this new Gemini Text-to-Speech model.
        Joe: Right?! This is a total game changer! And do you know what I just discovered?
        Jane: What?
        Joe: You can use the multi-speaker configuration to create a conversation, just like us!
        Jane: Just like us!"""

# Set up the wave file to save the output:
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
  with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

def synthesize(text: str, model: str, voice: str, locale: str):
    """Synthesizes speech from the input text.

    Args:
        text: Text to synthesize. Note that The synthesis will start when the
          client initiates half-close.
        model: gemini tts model name. Available models are: gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts, gemini-2.5-flash-lite-preview-tts, and gemini-2.5-pro-tts.
        voice: voice name. Example: leda, kore. Refer to available voices.
        locale: locale name. Example: en-us. Refer to available locales.
    """
    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

    generate_content_config=types.GenerateContentConfig(
        speech_config=types.SpeechConfig(
        language_code="en-in",
        multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
            speaker_voice_configs=[
              types.SpeakerVoiceConfig(
                  speaker='Joe',
                  voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Kore',
                    )
                  )
              ),
              types.SpeakerVoiceConfig(
                  speaker='Jane',
                  voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Puck',
                    )
                  )
              ),
            ]
        )
      ),
    )

    request_start_time = datetime.datetime.now()
    is_first_chunk_received = False
    final_audio_data = bytes()
    num_chunks_received = 0

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=text,
        config=generate_content_config,
    ):
        # just a simple progress indicator
        num_chunks_received += 1
        print(".", end="")
        if num_chunks_received % 40 == 0:
            print("")
        # measuring time to first audio
        if not is_first_chunk_received:
            is_first_chunk_received = True
            first_chunk_received_time = datetime.datetime.now()

        if (
            chunk.candidates is None
            or not chunk.candidates
            or chunk.candidates[0].content is None
            or not chunk.candidates[0].content.parts
        ):
            continue
        part = chunk.candidates[0].content.parts[0]
        if part.inline_data and part.inline_data.data:
          # accumulating audio. In a web-server scenario, you would want to
          # "emit" audio to the frontend as soon as it arrives.
          #
          # For example using flask socketio, you could do the following
          # from flask_socketio import SocketIO, emit
          # emit("audio", chunk.candidates[0].content.parts[0].inline_data.data)
          # socketio.sleep(0)
          final_audio_data += chunk.candidates[0].content.parts[0].inline_data.data

    time_to_first_audio = first_chunk_received_time - request_start_time
    time_to_completion = datetime.datetime.now() - request_start_time

    print("\n")
    print(f"Time to first audio: {time_to_first_audio.total_seconds()} seconds")
    print(f"Time to completion: {time_to_completion.total_seconds()} seconds")

    return final_audio_data

audio_data = synthesize(
    prompt,
    "gemini-3.1-flash-tts-preview",
    "Kore",
    "en-in")
file_name='output_speech.wav'
wave_file(file_name, audio_data)

Audio("output_speech.wav")
```

## Perform speech synthesis in Media Studio

<span class="exw-control expand-control" data-track-metadata-position="body" data-track-metadata-end-goal="viewPermissionsHowToGuides" data-track-type="task" data-track-name="iamPermissionsExpandable"></span>

#### Permissions required for this task

To perform this task, you must have the following [permissions](/iam/docs/overview#permissions):

- `serviceusage.services.use`

You can use the Media Studio in the Google Google Cloud console to experiment with text-to-speech models. This provides a user interface for quickly generating, listening to synthesized audio and experimenting with different style instructions and parameters.

1.  In the Google Google Cloud console, go to the **Vertex AI Studio <span aria-label="and then">\></span> Media Studio** page.

    <a href="https://console.cloud.google.com/vertex-ai/studio/media/generate;tab=audio" class="button button-primary" target="console" data-track-name="consoleLink" data-track-type="task" data-track-metadata-position="body">Media Studio</a>

2.  Select **Speech** from the media drop-down.

3.  In the text field, enter the text you want to synthesize into speech.

4.  In the **Settings** pane, configure the following settings:

    1.  **Model**: Select the Cloud TTS (TTS) model that you want to use, such as `Gemini 2.5 Pro TTS`. For more information about available models, see [Cloud TTS models](/text-to-speech/docs/list-voices-and-types).
    2.  **Style instructions**: Optional: Enter a text prompt that describes the selected speaking style, tone, and emotional delivery. This lets you to guide the model's performance beyond the default narration. For example: *"Narrate in a calm, professional tone for a documentary."*.
    3.  **Language**: Select the language and region of the input text. The model generates speech in the selected language and accent. For example, *English (United States)*.
    4.  **Voice**: Choose a predefined voice for the narration. The list contains the available voices for the selected model and language, such as *Acherner (Female)*.

5.  Optional: Expand the Advanced options section to configure technical audio settings:

    1.  **Audio encoding**: Select the encoding for the output audio file. `LINEAR16` is a lossless, uncompressed format suitable for high-quality audio processing. `MULAW` is also available for compressed audio output.
    2.  **Audio sample rate**: Select the sample rate in hertz (Hz). This determines the audio quality. Higher values like 44,100 Hz represent higher fidelity audio, equivalent to CD quality.
    3.  **Speed**: Adjust the speaking rate by moving the slider or entering a value. Values less than 1 slow down the speech, and values greater than 1 speed it up. The default is 1.
    4.  **Volume gain (db)**: Adjust the volume of the output audio in decibels (dB). Positive values increase the volume, and negative values decrease it. The default is 0.

6.  Click the **send** icon at the right of the text-box to generate the audio.

7.  The generated audio appears in the media player. Click the play button to listen to the output. You can continue to adjust the settings, and generate new versions as needed.

## Prompting tips

Creating engaging and natural-sounding audio from text requires understanding the nuances of spoken language and translating them into script form. The following tips will help you craft scripts that sound authentic and capture the chosen tone.

### The three levers of speech control

For the most predictable and nuanced results, ensure all three of the following components are consistent with your desired output.

**Style Prompt** The primary driver of the overall emotional tone and delivery. The prompt sets the context for the entire speech segment.

- Example: `You are an AI assistant speaking in a friendly and helpful tone.`

- Example: `Narrate this in the calm, authoritative tone of a nature documentary narrator.`

**Text Content** The semantic meaning of the words you are synthesizing. An evocative phrase that is emotionally consistent with the style prompt will produce much more reliable results than neutral text.

- Good: A prompt for a scared tone works best with text like `I think someone is in the house.`

- Less Effective: A prompt for a scared tone with text like `The meeting is at 4 PM.` will produce ambiguous results.

**Markup Tags (Preview)** Bracketed tags like `[sigh]` are best used for injecting a specific, localized action or style modification, not for setting the overall tone. They work in concert with the style prompt and text content.

### Markup tag guide

**Preview**

This product or feature is subject to the "Pre-GA Offerings Terms" in the General Service Terms section of the <a href="/terms/service-terms#1" data-track-type="commonIncludes">Service Specific Terms</a>. Pre-GA products and features are available "as is" and might have limited support. For more information, see the <a href="https://cloud.google.com/products/#product-launch-stages" data-track-type="commonIncludes">launch stage descriptions</a>.

Our research shows that bracketed markup tags operate in one of three distinct modes. Understanding a tag's mode is key to using it effectively.

#### Mode 1: Non-speech sounds

The markup is replaced by an audible, non-speech vocalization (e.g., a sigh, a laugh). The tag itself is not spoken. These are excellent for adding realistic, human-like hesitations and reactions.

| Tag | Behavior | Reliability | Guidance |
|:---|:---|:---|:---|
| `[sigh]` | Inserts a sigh sound. | High | The emotional quality of the sigh is influenced by the prompt. |
| `[laughing]` | Inserts a laugh. | High | For best results, use a specific prompt. e.g., a generic prompt may yield a laugh of shock, while "react with an amused laugh" creates a laugh of amusement. |
| `[uhm]` | Inserts a hesitation sound. | High | Useful for creating a more natural, conversational feel. |

#### Mode 2: Style modifiers

The markup is not spoken, but it modifies the delivery of the subsequent speech. The scope and duration of the modification can vary.

| Tag | Behavior | Reliability | Guidance |
|:---|:---|:---|:---|
| `[sarcasm]` | Imparts a sarcastic tone on the subsequent phrase. | High | This tag is a powerful modifier. It demonstrates that abstract concepts can successfully steer the model's delivery. |
| `[robotic]` | Makes the subsequent speech sound robotic. | High | The effect can extend across an entire phrase. A supportive style prompt (e.g., "Say this in a robotic way") is still recommended for best results. |
| `[shouting]` | Increases the volume of the subsequent speech. | High | Most effective when paired with a matching style prompt (e.g., "Shout this next part") and text that implies yelling. |
| `[whispering]` | Decreases the volume of the subsequent speech. | High | Best results are achieved when the style prompt is also explicit (e.g., "now whisper this part as quietly as you can"). |
| `[extremely fast]` | Increases the speed of the subsequent speech. | High | Ideal for disclaimers or fast-paced dialogue. Minimal prompt support needed. |

#### Mode 3: Vocalized markup (adjectives)

The markup tag itself is spoken as a word, while also influencing the tone of the entire sentence. This behavior typically applies to emotional adjectives.

*Warning*: Because the tag itself is spoken, this mode is likely an undesired side effect for most use cases. Prefer using the Style Prompt to set these emotional tones instead.

| Tag | Behavior | Reliability | Guidance |
|:---|:---|:---|:---|
| `[scared]` | The word "scared" is spoken, and the sentence adopts a scared tone. | High | Performance is highly dependent on text content. The phrase "I just heard a window break" produces a genuinely scared result. A neutral phrase produces a "spooky" but less authentic result. |
| `[curious]` | The word "curious" is spoken, and the sentence adopts a curious tone. | High | Use an inquisitive phrase to support the tag's intent. |
| `[bored]` | The word "bored" is spoken, and the sentence adopts a bored, monotone delivery. | High | Use with text that is mundane or repetitive for best effect. |

#### Mode 4: Pacing and pauses

These tags insert silence into the generated audio, giving you granular control over rhythm, timing, and pacing. Standard punctuation (commas, periods, semicolons) will also create natural pauses, but these tags offer more explicit control.

| Tag | Behavior | Reliability | Guidance |
|:---|:---|:---|:---|
| `[short pause]` | Inserts a brief pause, similar to a comma (~250ms). | High | Use to separate clauses or list items for better clarity. |
| `[medium pause]` | Inserts a standard pause, similar to a sentence break (~500ms). | High | Effective for separating distinct sentences or thoughts. |
| `[long pause]` | Inserts a significant pause for dramatic effect (~1000ms+). | High | Use for dramatic timing. For example: "The answer is... `[long pause]` ...no." Avoid overuse, as it can sound unnatural. |

#### Key strategies for reliable results

- **Align all three levers:** For maximum predictability, ensure your Style Prompt, Text Content, and any Markup Tags are all semantically consistent and working toward the same goal.

- **Use emotionally rich text:** Don't rely on prompts and tags alone. Give the model rich, descriptive text to work with. This is especially critical for nuanced emotions like sarcasm, fear, or excitement.

- **Write specific, detailed prompts:** The more specific your style prompt, the more reliable the result. "React with an amused laugh" is better than just `[laughing]`. "Speak like a 1940s radio news announcer" is better than "Speak in an old-fashioned way."

- **Test and verify new tags:** The behavior of a new or untested tag is not always predictable. A tag you assume is a style modifier might be vocalized. Always test a new tag or prompt combination to confirm its behavior before deploying to production.

## Safety check settings

While some safety checks cannot be disabled, you can adjust the thresholds for certain harm categories to further enhance safety and minimize misuse. This can be optionally enabled by setting safety filters under [AdvancedVoiceOptions](/python/docs/reference/texttospeech/latest/google.cloud.texttospeech_v1.types.AdvancedVoiceOptions).

There are [4 harm categories](/vertex-ai/generative-ai/docs/multimodal/configure-safety-filters#harm_categories) that can be configured at different levels of threshold. One or more categories can be set to block harmful content.

The legacy `relax_safety_filters` field is deprecated.

Depending on the safety filters that you configure, your output may contain a safety code similar to: "Cloud Text-to-Speech could not generate audio because the input text or prompt violates Vertex AI's usage guidelines. If you think this was an error, send feedback. Support codes: **62263041**"

The code listed in the output corresponds to a specific harmful category.

The following table displays the support code to safety category mappings:

<table>
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th>Support code</th>
<th>Safety category</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code translate="no" dir="ltr">54702341</code></td>
<td>Unspecified</td>
<td>Unspecified category.</td>
</tr>
<tr>
<td><code translate="no" dir="ltr">62263041</code></td>
<td>Dangerous content</td>
<td>Potentially dangerous content.</td>
</tr>
<tr>
<td><code translate="no" dir="ltr">57734940</code></td>
<td>Harassment</td>
<td>Harassment-related content.</td>
</tr>
<tr>
<td><code translate="no" dir="ltr">90789179</code><br />
</td>
<td>Sexually explicit</td>
<td>Sexual or suggestive content.</td>
</tr>
<tr>
<td><code translate="no" dir="ltr">78610348</code></td>
<td>Hate speech</td>
<td>Content containing hate speech.</td>
</tr>
</tbody>
</table>

These code examples demonstrate how to customize safety configurations in Cloud Text-to-Speech API. For usage in Vertex AI API, refer to [Vertex AI API examples](/vertex-ai/generative-ai/docs/multimodal/configure-safety-filters#api-examples).

### Python

``` devsite-click-to-copy
# google-cloud-texttospeech minimum version 2.32.0 is required.
request = texttospeech.SynthesizeSpeechRequest(
    input=synthesis_input,
    voice=voice,
    audio_config=audio_config,
    advanced_voice_options=texttospeech.AdvancedVoiceOptions(
      safety_settings=texttospeech.AdvancedVoiceOptions.SafetySettings(
          settings=[texttospeech.AdvancedVoiceOptions.SafetySetting(
              category=texttospeech.AdvancedVoiceOptions.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold=texttospeech.AdvancedVoiceOptions.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
          ),
          texttospeech.AdvancedVoiceOptions.SafetySetting(
              category=texttospeech.AdvancedVoiceOptions.HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold=texttospeech.AdvancedVoiceOptions.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
          ),
          texttospeech.AdvancedVoiceOptions.SafetySetting(
              category=texttospeech.AdvancedVoiceOptions.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold=texttospeech.AdvancedVoiceOptions.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
          ),
          texttospeech.AdvancedVoiceOptions.SafetySetting(
              category=texttospeech.AdvancedVoiceOptions.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold=texttospeech.AdvancedVoiceOptions.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
          )]
      )
    ),
)
# Perform the text-to-speech request on the text input with the selected
# voice parameters and audio file type.
response = client.synthesize_speech(request=request)
```

### CURL

``` devsite-click-to-copy
PROJECT_ID=YOUR_PROJECT_ID
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "x-goog-user-project: $PROJECT_ID" \
  -H "Content-Type: application/json" \
-d '{
  "input": {
    "prompt": "Say the following in a curious way.",
    "text": "I am saying something that would otherwise be blocked by Gemini TTS."
  },
  "voice": {
    "languageCode": "en-us",
    "name": "Kore",
    "modelName": "gemini-3.1-flash-tts-preview"
  },
  "audioConfig": {
    "audioEncoding": "LINEAR16"
  },
  "advancedVoiceOptions": {
    "safetySettings": {
      "settings": {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_LOW_AND_ABOVE",
      },
      "settings": {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_LOW_AND_ABOVE",
      },
      "settings": {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_LOW_AND_ABOVE",
      },
      "settings": {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_LOW_AND_ABOVE",
      },
    }
  },
}' \
  "https://texttospeech.googleapis.com/v1/text:synthesize" \
  | jq -r '.audioContent' | base64 -d | ffplay - -autoexit
```

Send feedback

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-06-15 UTC.

Need to tell us more?

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-06-15 UTC."\],\[\],\[\]\]
