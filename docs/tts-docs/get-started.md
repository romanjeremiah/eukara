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

# Get started with Cloud Text-to-Speech <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

Cloud Text-to-Speech is an API that is powered by Google's artificial intelligence (AI) technology. You send your transcript data to Cloud Text-to-Speech in an API call, then receive natural-sounding, synthetic human speech as playable audio in response. For more information on how Cloud Text-to-Speech works, see the [basics](/text-to-speech/docs/basics) page.

This guide walks you through the steps necessary to start sending requests to the Cloud Text-to-Speech API. See the [code samples](/text-to-speech/docs/samples) section for examples of how to make a request to the API and receive a response, or learn how to use these samples by following the Cloud Text-to-Speech [quickstarts](/text-to-speech/docs/quickstarts) and [how-to guides](/text-to-speech/docs/how-to).

## Enable the Cloud Text-to-Speech API

Before you can begin using Cloud Text-to-Speech, you must enable the API in the Google Cloud console:

1.  Sign in to the <a href="https://console.cloud.google.com/" target="console" data-track-type="tasks" data-track-name="consoleLink" data-track-metadata-position="body">Google Cloud console</a>.

2.  Open the <a href="https://console.cloud.google.com/projectselector2/home/dashboard" target="console" data-track-type="commonIncludes" data-track-name="consoleLink" data-track-metadata-end-goal="createProject">project selector page</a> and either choose an existing project or create a new one. For details about creating a project, see the [Google Cloud documentation](/resource-manager/docs/creating-managing-projects).

3.  If you create a new project, you will be prompted to link a billing account to this project. If you are using a pre-existing project, make sure that you have billing enabled.

    <a href="/billing/docs/how-to/modify-project" class="button" target="_blank" data-track-type="commonIncludes" data-track-name="supportLink" data-track-metadata-end-goal="enableBilling">Learn how to confirm that billing is enabled for your project</a>

    **Note:** You must enable billing to use Cloud Text-to-Speech API; however, you won't be charged unless you exceed the free quota. See our [pricing](/text-to-speech/pricing) page for more details.

4.  Once you have selected a project and linked it to a billing account, you can enable the Cloud Text-to-Speech API. Go to the **Search products and resources** bar at the top of the page and type in **"speech"**. Select the **Cloud Text-to-Speech API** from the list of results.

5.  To try Cloud Text-to-Speech without linking it to your project, choose the **Try this app** option. To enable the Cloud Text-to-Speech API for use with your project, click **Enable**.

6.  Set up authentication for your development environment. For instructions, see [Set up authentication for Cloud Text-to-Speech](/text-to-speech/docs/authentication#authn-how-to).

## Disable the Cloud Text-to-Speech API

To disable the Cloud Text-to-Speech API, navigate to your Google Cloud dashboard and click the **Go to APIs overview** link in the **APIs** box. Click **Cloud Text-to-Speech API**, then click the **Disable API** button at the top of the page.

## What's next

Learn how to send a transcription request to the Cloud Text-to-Speech API using [client libraries](/text-to-speech/docs/create-audio-text-client-libraries) or the [command line](/text-to-speech/docs/create-audio-text-command-line).

Send feedback

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-06-11 UTC.

Need to tell us more?

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-06-11 UTC."\],\[\],\[\]\]
