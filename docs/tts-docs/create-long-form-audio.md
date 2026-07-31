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

<span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

# Create long-form audio

**Preview**

This product or feature is subject to the "Pre-GA Offerings Terms" in the General Service Terms section of the <a href="/terms/service-terms#1" data-track-type="commonIncludes">Service Specific Terms</a>. Pre-GA products and features are available "as is" and might have limited support. For more information, see the <a href="https://cloud.google.com/products/#product-launch-stages" data-track-type="commonIncludes">launch stage descriptions</a>.

This document walks you through the process of synthesizing long-form audio. Long Audio Synthesis asynchronously synthesizes up to 1 million bytes on input. To learn more about the fundamental concepts in Cloud Text-to-Speech, read [Cloud Text-to-Speech Basics](/text-to-speech/docs/basics).

## Before you begin

Before you can send a request to the Cloud Text-to-Speech API, you must have completed the following actions. See the [before you begin](/text-to-speech/docs/before-you-begin) page for details.

- Enable Cloud Text-to-Speech on a Google Cloud project.
  1.  Make sure billing is enabled for Cloud Text-to-Speech.
  2.  Make sure you have the following [Identity and Access Management (IAM) roles](/storage/docs/access-control/iam-roles#standard-roles) on the output Google Cloud bucket.
      - Storage Object Creator
      - Storage Object Viewer

- <a href="/sdk/docs/install" data-track-type="commonIncludes" data-track-name="sdkLink" target="_blank">Install</a> the Google Cloud CLI. After installation, <a href="/sdk/docs/initializing" data-track-type="commonIncludes" data-track-name="sdkLink" target="_blank">initialize</a> the Google Cloud CLI by running the following command:

  ``` devsite-click-to-copy
  gcloud init
  ```

  If you're using an external identity provider (IdP), you must first [sign in to the gcloud CLI with your federated identity](/iam/docs/workforce-log-in-gcloud).

## Synthesize long audio from text using the command line

You can convert long-form text to audio by making an HTTP POST request to the `https://texttospeech.googleapis.com/v1beta1/projects/{$project_number}/locations/global:synthesizeLongAudio` endpoint. In the body of your POST command, specify the following fields.

• `voice`: The type of voice to synthesize.

• `input.text`: The text to synthesize.

• `audioConfig`: The type of audio to create.

• **`output_gcs_uri`**: The Google Cloud output path under the form of "gs://bucket_name/file_name.wav".

• **`parent`**: The parent under the form "projects/{YOUR_PROJECT_NUMBER}/locations/{YOUR_PROJECT_LOCATION}".

The input can contain up to 1MB of characters, the exact limit can vary from different inputs.

1.  Create a Google Cloud storage bucket under the project that is used to run the synthesis. Make sure the service account used to run the synthesis has read and write access to the output Google Cloud bucket.

2.  Execute the REST request at the command line to synthesize the audio from the text using Cloud TTS. The command uses the `gcloud auth application-default print-access-token` command to retrieve an authorization token for the request.

    HTTP method and URL:

    ``` devsite-click-to-copy
    POST https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global:synthesizeLongAudio
    ```

    Request JSON body:

    ``` devsite-click-to-copy

    {
      "parent": "projects/12345/locations/global",
      "audio_config":{
          "audio_encoding":"LINEAR16"
      },
      "input":{
          "text":"hello"
      },
      "voice":{
          "language_code":"en-us",
          "name":"en-us-Standard-A"
      },
      "output_gcs_uri": "gs://bucket_name/file_name.wav"
    }
    ```

    To send your request, expand one of these options:

    #### curl (Linux, macOS, or Cloud Shell)

    **Note:** The following command assumes that you have logged in to the `gcloud` CLI with your user account by running [`gcloud init`](/sdk/gcloud/reference/init) or [`gcloud auth login`](/sdk/gcloud/reference/auth/login) , or by using [Cloud Shell](/shell/docs), which automatically logs you into the `gcloud` CLI . You can check the currently active account by running [`gcloud auth list`](/sdk/gcloud/reference/auth/list).

    Save the request body in a file named `request.json`, and execute the following command:

    ``` devsite-click-to-copy
    curl -X POST \
         -H "Authorization: Bearer $(gcloud auth print-access-token)" \
         -H "Content-Type: application/json; charset=utf-8" \
         -d @request.json \
         "https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global:synthesizeLongAudio"
    ```

    #### PowerShell (Windows)

    **Note:** The following command assumes that you have logged in to the `gcloud` CLI with your user account by running [`gcloud init`](/sdk/gcloud/reference/init) or [`gcloud auth login`](/sdk/gcloud/reference/auth/login) . You can check the currently active account by running [`gcloud auth list`](/sdk/gcloud/reference/auth/list).

    Save the request body in a file named `request.json`, and execute the following command:

    ``` devsite-click-to-copy
    $cred = gcloud auth print-access-token
    $headers = @{ "Authorization" = "Bearer $cred" }

    Invoke-WebRequest `
        -Method POST `
        -Headers $headers `
        -ContentType: "application/json; charset=utf-8" `
        -InFile request.json `
        -Uri "https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global:synthesizeLongAudio" | Select-Object -Expand Content
    ```

    You should receive a JSON response similar to the following:

    ``` readonly

    {
      "name": "23456",
      "metadata": {
        "@type": "type.googleapis.com/google.cloud.texttospeech.v1beta1.SynthesizeLongAudioMetadata",
        "progressPercentage": 0,
        "startTime": "2022-12-20T00:46:56.296191037Z",
        "lastUpdateTime": "2022-12-20T00:46:56.296191037Z"
      },
      "done": false
    }
    ```

3.  The JSON output for the REST command contains the long operation name in the `name` field. Execute the REST request at the command line to query the state of the long-running operation.

    Make sure that the service account running the GET operation is from the same project as the one used for synthesis.

    HTTP method and URL:

    ``` devsite-click-to-copy
    GET https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global/operations/23456
    ```

    To send your request, expand one of these options:

    #### curl (Linux, macOS, or Cloud Shell)

    **Note:** The following command assumes that you have logged in to the `gcloud` CLI with your user account by running [`gcloud init`](/sdk/gcloud/reference/init) or [`gcloud auth login`](/sdk/gcloud/reference/auth/login) , or by using [Cloud Shell](/shell/docs), which automatically logs you into the `gcloud` CLI . You can check the currently active account by running [`gcloud auth list`](/sdk/gcloud/reference/auth/list).

    Execute the following command:

    ``` devsite-click-to-copy
    curl -X GET \
         -H "Authorization: Bearer $(gcloud auth print-access-token)" \
         "https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global/operations/23456"
    ```

    #### PowerShell (Windows)

    **Note:** The following command assumes that you have logged in to the `gcloud` CLI with your user account by running [`gcloud init`](/sdk/gcloud/reference/init) or [`gcloud auth login`](/sdk/gcloud/reference/auth/login) . You can check the currently active account by running [`gcloud auth list`](/sdk/gcloud/reference/auth/list).

    Execute the following command:

    ``` devsite-click-to-copy
    $cred = gcloud auth print-access-token
    $headers = @{ "Authorization" = "Bearer $cred" }

    Invoke-WebRequest `
        -Method GET `
        -Headers $headers `
        -Uri "https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global/operations/23456" | Select-Object -Expand Content
    ```

    You should receive a JSON response similar to the following:

    ``` readonly

    {
      "name": "projects/12345/locations/global/operations/23456",
      "metadata": {
        "@type": "type.googleapis.com/google.cloud.texttospeech.v1beta1.SynthesizeLongAudioMetadata",
        "progressPercentage": 100
      },
      "done": true
    }
    ```

4.  Query the list of all operations running under a given project, execute the REST request.

    Make sure that the service account running the LIST operation is from the same project as the one used for synthesis.

    HTTP method and URL:

    ``` devsite-click-to-copy
    GET https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global/operations
    ```

    To send your request, expand one of these options:

    #### curl (Linux, macOS, or Cloud Shell)

    **Note:** The following command assumes that you have logged in to the `gcloud` CLI with your user account by running [`gcloud init`](/sdk/gcloud/reference/init) or [`gcloud auth login`](/sdk/gcloud/reference/auth/login) , or by using [Cloud Shell](/shell/docs), which automatically logs you into the `gcloud` CLI . You can check the currently active account by running [`gcloud auth list`](/sdk/gcloud/reference/auth/list).

    Execute the following command:

    ``` devsite-click-to-copy
    curl -X GET \
         -H "Authorization: Bearer $(gcloud auth print-access-token)" \
         "https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global/operations"
    ```

    #### PowerShell (Windows)

    **Note:** The following command assumes that you have logged in to the `gcloud` CLI with your user account by running [`gcloud init`](/sdk/gcloud/reference/init) or [`gcloud auth login`](/sdk/gcloud/reference/auth/login) . You can check the currently active account by running [`gcloud auth list`](/sdk/gcloud/reference/auth/list).

    Execute the following command:

    ``` devsite-click-to-copy
    $cred = gcloud auth print-access-token
    $headers = @{ "Authorization" = "Bearer $cred" }

    Invoke-WebRequest `
        -Method GET `
        -Headers $headers `
        -Uri "https://texttospeech.googleapis.com/v1beta1/projects/12345/locations/global/operations" | Select-Object -Expand Content
    ```

    You should receive a JSON response similar to the following:

    ``` readonly

    {
      "operations": [
        {
          "name": "12345",
          "done": false
        },
        {
          "name": "23456",
          "done": false
        }
      ],
      "nextPageToken": ""
    }
    ```

5.  Once the long-running operation successfully completes, find the output audio file in the given bucket uri in the `output_gcs_uri` field. If the operation did not complete successfully, find the error by querying using the GET REST command, correct the error, and issue the RPC again.

## Synthesize long audio from text using client libraries

Follow these instructions for synthesizing long audio.

### Install the client library

### <span class="notranslate">Python</span>

Before installing the library, make sure you've [prepared your environment for Python development](/python/docs/setup).

``` notranslate
pip install --upgrade google-cloud-texttospeech
```

### Create audio data

You can use Cloud TTS to create a long audio file of synthetic human speech. Use the following code to create a long audio file in your Google Cloud bucket.

### <span class="notranslate">Python</span>

Before running the example, make sure you've [prepared your environment for Python development](/python/docs/setup).

``` devsite-click-to-copy
# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from google.cloud import texttospeech


def synthesize_long_audio(project_id: str, output_gcs_uri: str) -> None:
    """
    Synthesizes long input, writing the resulting audio to `output_gcs_uri`.

    Args:
        project_id: ID or number of the Google Cloud project you want to use.
        output_gcs_uri: Specifies a Cloud Storage URI for the synthesis results.
            Must be specified in the format:
            ``gs://bucket_name/object_name``, and the bucket must
            already exist.
    """

    client = texttospeech.TextToSpeechLongAudioSynthesizeClient()

    input = texttospeech.SynthesisInput(
        text="Test input. Replace this with any text you want to synthesize, up to 1 million bytes long!"
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.LINEAR16
    )

    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US", name="en-US-Standard-A"
    )

    parent = f"projects/{project_id}/locations/us-central1"

    request = texttospeech.SynthesizeLongAudioRequest(
        parent=parent,
        input=input,
        audio_config=audio_config,
        voice=voice,
        output_gcs_uri=output_gcs_uri,
    )

    operation = client.synthesize_long_audio(request=request)
    # Set a deadline for your LRO to finish. 300 seconds is reasonable, but can be adjusted depending on the length of the input.
    # If the operation times out, that likely means there was an error. In that case, inspect the error, and try again.
    result = operation.result(timeout=300)
    print(
        "\nFinished processing, check your GCS bucket to find your audio file! Printing what should be an empty result: ",
        result,
    )
```

## Clean up

To avoid unnecessary Google Cloud charges, use the <a href="https://console.cloud.google.com/" target="console" data-track-type="inline link" referrerpolicy="no-referrer-when-downgrade">Google Cloud console</a> to delete your project if you don't need it.

## What's next

- Learn more about Cloud Text-to-Speech by reading the [basics](/text-to-speech/docs/basics).
- Review the list of [available voices](/text-to-speech/docs/voices) you can use for synthetic speech.

Send feedback

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-06-11 UTC.

Need to tell us more?

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-06-11 UTC."\],\[\],\[\]\]
