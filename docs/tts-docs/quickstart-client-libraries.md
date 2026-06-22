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

# Create audio from text by using client libraries

This quickstart walks you through the process of using client libraries to make a request to Cloud TTS, creating audio from text.

To learn more about the fundamental concepts in Cloud Text-to-Speech, read [Cloud Text-to-Speech Basics](/text-to-speech/docs/basics). To see which synthetic voices are available for your language, see the [supported voices and languages page](/text-to-speech/docs/voices).

## Before you begin

Before you can send a request to the Cloud Text-to-Speech API, you must have completed the following actions. See the [before you begin](/text-to-speech/docs/before-you-begin) page for details.

- Enable Cloud Text-to-Speech on a Google Cloud project.

- Make sure billing is enabled for Cloud Text-to-Speech.

- <a href="/sdk/docs/install" data-track-type="commonIncludes" data-track-name="sdkLink" target="_blank">Install</a> the Google Cloud CLI. After installation, <a href="/sdk/docs/initializing" data-track-type="commonIncludes" data-track-name="sdkLink" target="_blank">initialize</a> the Google Cloud CLI by running the following command:

  ``` devsite-click-to-copy
  gcloud init
  ```

  If you're using an external identity provider (IdP), you must first [sign in to the gcloud CLI with your federated identity](/iam/docs/workforce-log-in-gcloud).

- If you're using a local shell, then create local authentication credentials for your user account:

  ``` devsite-click-to-copy
  gcloud auth application-default login
  ```

  You don't need to do this if you're using Cloud Shell.

  If an authentication error is returned, and you are using an external identity provider (IdP), confirm that you have [signed in to the gcloud CLI with your federated identity](/iam/docs/workforce-log-in-gcloud).

## Install the client library

### <span class="notranslate">Go</span>

``` notranslate
go get cloud.google.com/go/texttospeech/apiv1
```

### <span class="notranslate">Java</span>

If you are using <a href="https://maven.apache.org/" class="external" data-track-type="buildTools" data-track-name="externalLink">Maven</a>, add the following to your `pom.xml` file. For more information about BOMs, see [The Google Cloud Platform Libraries BOM](https://cloud.google.com/java/docs/bom).

``` devsite-click-to-copy
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.google.cloud</groupId>
      <artifactId>libraries-bom</artifactId>
      <version>26.83.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-texttospeech</artifactId>
  </dependency>
</dependencies>
```

If you are using <a href="https://gradle.org/" class="external" data-track-type="buildTools" data-track-name="externalLink" target="_blank">Gradle</a>, add the following to your dependencies:

``` devsite-click-to-copy
implementation 'com.google.cloud:google-cloud-texttospeech:2.94.0'
```

If you are using <a href="https://www.scala-sbt.org/" class="external" data-track-type="buildTools" data-track-name="externalLink" target="_blank">sbt</a>, add the following to your dependencies:

``` devsite-click-to-copy
libraryDependencies += "com.google.cloud" % "google-cloud-texttospeech" % "2.94.0"
```

If you're using Visual Studio Code or IntelliJ, you can add client libraries to your project using the following IDE plugins:

- [Cloud Code for VS Code](/code/docs/vscode/client-libraries)
- [Cloud Code for IntelliJ](/code/docs/intellij/client-libraries)

The plugins provide additional functionality, such as key management for service accounts. Refer to each plugin's documentation for details.

**Note:** Cloud Java client libraries do not currently support Android.

### <span class="notranslate">Node.js</span>

Before installing the library, make sure you've [prepared your environment for Node.js development](/nodejs/docs/setup).

``` notranslate
npm install @google-cloud/text-to-speech
```

### <span class="notranslate">Python</span>

Before installing the library, make sure you've [prepared your environment for Python development](/python/docs/setup).

``` notranslate
pip install --upgrade google-cloud-texttospeech
```

### Additional languages

**C#**: Please follow the [C# setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="https://googleapis.github.io/google-cloud-dotnet/docs/Google.Cloud.TextToSpeech.V1/index.html" class="external">Cloud TTS reference documentation for .NET.</a>

**PHP**: Please follow the [PHP setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="/php/docs/reference/cloud-text-to-speech/latest" class="external">Cloud TTS reference documentation for PHP.</a>

**Ruby**: Please follow the [Ruby setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="https://googleapis.dev/ruby/google-cloud-text_to_speech/latest/Google/Cloud/TextToSpeech/V1.html" class="external">Cloud TTS reference documentation for Ruby.</a>

## Create audio data

Now you can use Cloud TTS to create an audio file of synthetic human speech. Use the following code to send a [`synthesize`](/text-to-speech/docs/reference/rest/v1beta1/text/synthesize) request to the Cloud Text-to-Speech API.

### <span class="notranslate">Go</span>

``` devsite-click-to-copy

// Command quickstart generates an audio file with the content "Hello, World!".
package main

import (
 "context"
 "fmt"
 "log"
 "os"

 texttospeech "cloud.google.com/go/texttospeech/apiv1"
 "cloud.google.com/go/texttospeech/apiv1/texttospeechpb"
)

func main() {
 // Instantiates a client.
 ctx := context.Background()

 client, err := texttospeech.NewClient(ctx)
 if err != nil {
     log.Fatal(err)
 }
 defer client.Close()

 // Perform the text-to-speech request on the text input with the selected
 // voice parameters and audio file type.
 req := texttospeechpb.SynthesizeSpeechRequest{
     // Set the text input to be synthesized.
     Input: &texttospeechpb.SynthesisInput{
         InputSource: &texttospeechpb.SynthesisInput_Text{Text: "Hello, World!"},
     },
     // Build the voice request, select the language code ("en-US") and the SSML
     // voice gender ("neutral").
     Voice: &texttospeechpb.VoiceSelectionParams{
         LanguageCode: "en-US",
         SsmlGender:   texttospeechpb.SsmlVoiceGender_NEUTRAL,
     },
     // Select the type of audio file you want returned.
     AudioConfig: &texttospeechpb.AudioConfig{
         AudioEncoding: texttospeechpb.AudioEncoding_MP3,
     },
 }

 resp, err := client.SynthesizeSpeech(ctx, &req)
 if err != nil {
     log.Fatal(err)
 }

 // The resp's AudioContent is binary.
 filename := "output.mp3"
 err = os.WriteFile(filename, resp.AudioContent, 0644)
 if err != nil {
     log.Fatal(err)
 }
 fmt.Printf("Audio content written to file: %v\n", filename)
}
```

### <span class="notranslate">Java</span>

``` devsite-click-to-copy
// Imports the Google Cloud client library
import com.google.cloud.texttospeech.v1.AudioConfig;
import com.google.cloud.texttospeech.v1.AudioEncoding;
import com.google.cloud.texttospeech.v1.SsmlVoiceGender;
import com.google.cloud.texttospeech.v1.SynthesisInput;
import com.google.cloud.texttospeech.v1.SynthesizeSpeechResponse;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.google.cloud.texttospeech.v1.VoiceSelectionParams;
import com.google.protobuf.ByteString;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Google Cloud TextToSpeech API sample application. Example usage: mvn package exec:java
 * -Dexec.mainClass='com.example.texttospeech.QuickstartSample'
 */
public class QuickstartSample {

  /** Demonstrates using the Text-to-Speech API. */
  public static void main(String... args) throws Exception {
    // Instantiates a client
    try (TextToSpeechClient textToSpeechClient = TextToSpeechClient.create()) {
      // Set the text input to be synthesized
      SynthesisInput input = SynthesisInput.newBuilder().setText("Hello, World!").build();

      // Build the voice request, select the language code ("en-US") and the ssml voice gender
      // ("neutral")
      VoiceSelectionParams voice =
          VoiceSelectionParams.newBuilder()
              .setLanguageCode("en-US")
              .setSsmlGender(SsmlVoiceGender.NEUTRAL)
              .build();

      // Select the type of audio file you want returned
      AudioConfig audioConfig =
          AudioConfig.newBuilder().setAudioEncoding(AudioEncoding.MP3).build();

      // Perform the text-to-speech request on the text input with the selected voice parameters and
      // audio file type
      SynthesizeSpeechResponse response =
          textToSpeechClient.synthesizeSpeech(input, voice, audioConfig);

      // Get the audio contents from the response
      ByteString audioContents = response.getAudioContent();

      // Write the response to the output file.
      try (OutputStream out = new FileOutputStream("output.mp3")) {
        out.write(audioContents.toByteArray());
        System.out.println("Audio content written to file \"output.mp3\"");
      }
    }
  }
}
```

### <span class="notranslate">Node.js</span>

Before running the example, make sure you've [prepared your environment for Node.js development](/nodejs/docs/setup).

``` devsite-click-to-copy
// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const {writeFile} = require('node:fs/promises');

// Creates a client
const client = new textToSpeech.TextToSpeechClient();

async function quickStart() {
  // The text to synthesize
  const text = 'hello, world!';

  // Construct the request
  const request = {
    input: {text: text},
    // Select the language and SSML voice gender (optional)
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);

  // Save the generated binary audio content to a local file
  await writeFile('output.mp3', response.audioContent, 'binary');
  console.log('Audio content written to file: output.mp3');
}

await quickStart();
```

### <span class="notranslate">Python</span>

Before running the example, make sure you've [prepared your environment for Python development](/python/docs/setup).

``` devsite-click-to-copy
"""Synthesizes speech from the input string of text or ssml.
Make sure to be working in a virtual environment.

Note: ssml must be well-formed according to:
    https://www.w3.org/TR/speech-synthesis/
"""
from google.cloud import texttospeech

# Instantiates a client
client = texttospeech.TextToSpeechClient()

# Set the text input to be synthesized
synthesis_input = texttospeech.SynthesisInput(text="Hello, World!")

# Build the voice request, select the language code ("en-US") and the ssml
# voice gender ("neutral")
voice = texttospeech.VoiceSelectionParams(
    language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
)

# Select the type of audio file you want returned
audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.MP3
)

# Perform the text-to-speech request on the text input with the selected
# voice parameters and audio file type
response = client.synthesize_speech(
    input=synthesis_input, voice=voice, audio_config=audio_config
)

# The response's audio_content is binary.
with open("output.mp3", "wb") as out:
    # Write the response to the output file.
    out.write(response.audio_content)
    print('Audio content written to file "output.mp3"')
```

Congratulations! You've sent your first request to Cloud Text-to-Speech.

<style>
#quickstart-feedback-question {
  margin: 1em 0;
  position: relative;
}
#quickstart-feedback-question section.expandable {
  position: static;
}
</style>

## How did it go?

It worked!

**Great!** What did you like about the quickstart? What could we have done better? <a href="#" class="google-feedback" data-p="5041938" data-b="Quickstart">Let us know!</a>.

I got stuck.

**We're sorry to hear that.** <a href="#" class="google-feedback" data-p="5041938" data-b="Quickstart">Let us know what went wrong</a>. We'll want to fix it.

## Clean up

To avoid incurring charges to your Google Cloud account for the resources used on this page, follow these steps.

- Use the <a href="https://console.cloud.google.com/" target="console" data-track-type="inline link" referrerpolicy="no-referrer-when-downgrade">Google Cloud console</a> to delete your project if you don't need it.

## What's next

- Learn more about Cloud Text-to-Speech by reading the [basics](/text-to-speech/docs/basics).
- Review the list of [available voices](/text-to-speech/docs/voices) you can use for synthetic speech.

Send feedback

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-06-11 UTC.

Need to tell us more?

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-06-11 UTC."\],\[\],\[\]\]
