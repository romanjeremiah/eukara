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

# Specify a regional endpoint <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

Cloud Text-to-Speech offers `global`, `us`, `eu` multiregional and regional API endpoints. If you use a regional endpoint, your data at-rest and in-use stay within the regional or continental boundaries of Europe or the USA, respectively. If your data's location must be controlled in order to comply with local regulatory requirements, then specifying an endpoint is important. There is no functional change to the behavior of the API.

### Global

| Model name                                    | Global |
|-----------------------------------------------|--------|
| Gemini 2.5 Flash TTS (`gemini-2.5-flash-tts`) |        |
| Gemini 2.5 Flash TTS (`gemini-2.5-pro-tts`)   |        |
| Chirp 3: HD voices                            |        |
| Chirp 3: Instant Custom Voice                 |        |

### United States

| Model name                                    | US multi-region |
|-----------------------------------------------|-----------------|
| Gemini 2.5 Flash TTS (`gemini-2.5-flash-tts`) |                 |
| Gemini 2.5 Flash TTS (`gemini-2.5-pro-tts`)   |                 |
| Chirp 3: HD voices                            |                 |
| Chirp 3: Instant Custom Voice                 |                 |

### Europe

|  | EU multi-region | London, United Kingdom (europe-west2) | Frankfurt, Germany (europe-west3) | Eemshaven, Netherlands (europe-west4) |
|----|----|----|----|----|
| Gemini 2.5 Flash TTS (`gemini-2.5-flash-tts`) |  |  |  |  |
| Gemini 2.5 Flash TTS (`gemini-2.5-pro-tts`) |  |  |  |  |
| Chirp 3: HD voices |  |  |  |  |
| Chirp 3: Instant Custom Voice |  |  |  |  |

### Asia Pacific

|  | Tokyo, Japan (asia-northeast1) | Sydney, Australia (australia-southeast1) | Mumbai, India (asia-south1) | Singapore (asia-southeast1) | Seoul, Korea (asia-northeast3) |
|----|----|----|----|----|----|
| Gemini 2.5 Flash TTS (`gemini-2.5-flash-tts`) |  |  |  |  |  |
| Gemini 2.5 Flash TTS (`gemini-2.5-pro-tts`) |  |  |  |  |  |
| Chirp 3: HD voices |  |  |  |  |  |
| Chirp 3: Instant Custom Voice |  |  |  |  |  |

## Use regional endpoints

When you use a regional endpoint, make sure to include the matching `us` or `eu` location in the `parent` string. See the [`Synthesize`](/text-to-speech/docs/create-audio) documentation for more information about configuring the synthesize request body.

### Protocol

To perform text to speech synthesis using a regional endpoint, run the applicable command in the table below to configure the correct endpoint:

| Multi-region | Endpoint override |
|----|----|
| EU | `$ export CLOUD_TTS_ENDPOINT=https://eu-texttospeech.googleapis.com` |
| US | `$ export CLOUD_TTS_ENDPOINT=https://us-texttospeech.googleapis.com` |

Only Neural2 voices are available from these endpoints:

| Single-region | Endpoint override |
|----|----|
| US Central1 | `$ export CLOUD_TTS_ENDPOINT=https://us-central1-texttospeech.googleapis.com` |

The following code sample demonstrates how to send a [`synthesis request`](/text-to-speech/docs/reference/rest/v1beta1/text/synthesize) that keeps all data confined to a specified region. You can substitute either the `EU` or `US` regional endpoint for the `CLOUD_TTS_ENDPOINT` variable. Replace `PROJECT_ID` with your project ID.

``` devsite-click-to-copy
$ curl   -H "Authorization: Bearer $(gcloud auth print-access-token)" \
         -H "x-goog-user-project: PROJECT_ID" \
         -H "Content-Type: application/json; charset=utf-8" \
         --data "{
          'input':{
            'text':'Android is a mobile operating system developed by Google,
             based on the Linux kernel and designed primarily for
             touchscreen mobile devices such as smartphones and tablets.'
           },
          'voice':{
            'languageCode':'en-gb',
            'name':'en-GB-Neural2-A',
            'ssmlGender':'FEMALE'
          },
        'audioConfig':{
          'audioEncoding':'MP3'
        }
      }" $CLOUD_TTS_ENDPOINT/v1/text:synthesize > synthesize-text.txt
```

This example uses the [Google Cloud CLI](/sdk/docs/install) to create an access token for your Google Account. For instructions on installing the gcloud CLI, see [Authenticate to Cloud TTS](/text-to-speech/docs/authentication).

## Restrict global API endpoint usage

To help enforce the use of regional endpoints, use the `constraints/gcp.restrictEndpointUsage` organization policy constraint to block requests to the global API endpoint. For more information, see [Restrict endpoint usage](/docs/security/compliance/restrict-endpoint-usage).

Send feedback

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-06-11 UTC.

Need to tell us more?

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-06-11 UTC."\],\[\],\[\]\]
