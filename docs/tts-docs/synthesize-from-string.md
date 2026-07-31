- <a href="https://docs.cloud.google.com/" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="1" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="1" data-track-metadata-eventdetail="Google Cloud Documentation">Home</a>

- 

  <a href="https://docs.cloud.google.com/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="2" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="2" data-track-metadata-eventdetail="Documentation">Documentation</a>

- 

  <a href="https://docs.cloud.google.com/docs/ai-ml" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="3" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="3" data-track-metadata-eventdetail="AI and ML">AI and ML</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="4" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="4" data-track-metadata-eventdetail="Cloud Text-to-Speech">Cloud Text-to-Speech</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs/samples" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="5" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="5" data-track-metadata-eventdetail="">Samples</a>

# Synthesize from a string of text <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

Demonstrates synthesizing from a string of text.

## Explore further

For detailed documentation that includes this code sample, see the following:

- [Cloud TTS client libraries](/text-to-speech/docs/libraries)
- [Quickstart: Create audio from text by using client libraries](/text-to-speech/docs/create-audio-text-client-libraries)

## Code sample

### <span class="notranslate">Go</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/quickstart/quickstart.go" data-track-type="clientLibrariesReference" data-track-name="go" data-track-metadata-position="tts_quickstart">Cloud TTS client libraries</a>. For more information, see the <a href="/go/docs/reference/cloud.google.com/go/texttospeech/latest/apiv1" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/quickstart/quickstart.go" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="go">Cloud TTS <span class="notranslate">Go</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/quickstart/quickstart.go">Set up authentication for a local development environment</a>.

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

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/QuickstartSample.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="tts_quickstart">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/QuickstartSample.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/QuickstartSample.java">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
// Imports the Google Cloud client library
import com.google.cloud.texttospeech.v1beta1.AudioConfig;
import com.google.cloud.texttospeech.v1beta1.AudioEncoding;
import com.google.cloud.texttospeech.v1beta1.SsmlVoiceGender;
import com.google.cloud.texttospeech.v1beta1.SynthesisInput;
import com.google.cloud.texttospeech.v1beta1.SynthesizeSpeechResponse;
import com.google.cloud.texttospeech.v1beta1.TextToSpeechClient;
import com.google.cloud.texttospeech.v1beta1.VoiceSelectionParams;
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

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/googleapis/google-cloud-node/blob/HEAD/packages/google-cloud-texttospeech/samples/quickstart.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="tts_quickstart">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/googleapis/google-cloud-node/blob/HEAD/packages/google-cloud-texttospeech/samples/quickstart.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/googleapis/google-cloud-node/blob/HEAD/packages/google-cloud-texttospeech/samples/quickstart.js">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const fs = require('fs');
const util = require('util');
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
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile('output.mp3', response.audioContent, 'binary');
  console.log('Audio content written to file: output.mp3');
}
quickStart();
```

### <span class="notranslate">PHP</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/php-docs-samples/blob/HEAD/texttospeech/quickstart.php" data-track-type="clientLibrariesReference" data-track-name="php" data-track-metadata-position="tts_quickstart">Cloud TTS client libraries</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/php-docs-samples/blob/HEAD/texttospeech/quickstart.php">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
// includes the autoloader for libraries installed with composer
require __DIR__ . '/vendor/autoload.php';

// Imports the Cloud Client Library
use Google\Cloud\TextToSpeech\V1\AudioConfig;
use Google\Cloud\TextToSpeech\V1\AudioEncoding;
use Google\Cloud\TextToSpeech\V1\Client\TextToSpeechClient;
use Google\Cloud\TextToSpeech\V1\SsmlVoiceGender;
use Google\Cloud\TextToSpeech\V1\SynthesisInput;
use Google\Cloud\TextToSpeech\V1\SynthesizeSpeechRequest;
use Google\Cloud\TextToSpeech\V1\VoiceSelectionParams;

// instantiates a client
$client = new TextToSpeechClient();

// sets text to be synthesised
$synthesisInputText = (new SynthesisInput())
    ->setText('Hello, world!');

// build the voice request, select the language code ("en-US") and the ssml
// voice gender
$voice = (new VoiceSelectionParams())
    ->setLanguageCode('en-US')
    ->setSsmlGender(SsmlVoiceGender::FEMALE);

// Effects profile
$effectsProfileId = 'telephony-class-application';

// select the type of audio file you want returned
$audioConfig = (new AudioConfig())
    ->setAudioEncoding(AudioEncoding::MP3)
    ->setEffectsProfileId(array($effectsProfileId));

// perform text-to-speech request on the text input with selected voice
// parameters and audio file type
$request = (new SynthesizeSpeechRequest())
    ->setInput($synthesisInputText)
    ->setVoice($voice)
    ->setAudioConfig($audioConfig);
$response = $client->synthesizeSpeech($request);
$audioContent = $response->getAudioContent();

// the response's audioContent is binary
file_put_contents('output.mp3', $audioContent);
echo 'Audio content written to "output.mp3"' . PHP_EOL;
```

### <span class="notranslate">Python</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/quickstart.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="tts_quickstart">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/quickstart.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_quickstart" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/quickstart.py">Set up authentication for a local development environment</a>.

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

## What's next

To search and filter code samples for other Google Cloud products, see the [Google Cloud sample browser](/docs/samples?product=texttospeech).

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\[\],\[\],\[\]\]
