- <a href="https://docs.cloud.google.com/" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="1" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="1" data-track-metadata-eventdetail="Google Cloud Documentation">Home</a>

- 

  <a href="https://docs.cloud.google.com/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="2" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="2" data-track-metadata-eventdetail="Documentation">Documentation</a>

- 

  <a href="https://docs.cloud.google.com/docs/ai-ml" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="3" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="3" data-track-metadata-eventdetail="AI and ML">AI and ML</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="4" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="4" data-track-metadata-eventdetail="Cloud Text-to-Speech">Cloud Text-to-Speech</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs/samples" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="5" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="5" data-track-metadata-eventdetail="">Samples</a>

# Synthesize text with audio profiles <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

Synthesize text, specifying an audio profile to optimize the synthetic speech for playback on different types of hardware.

## Explore further

For detailed documentation that includes this code sample, see the following:

- [Use device profiles for generated audio](/text-to-speech/docs/audio-profiles)

## Code sample

### <span class="notranslate">Go</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_speech/audio_profile.go" data-track-type="clientLibrariesReference" data-track-name="go" data-track-metadata-position="tts_synthesize_text_audio_profile">Cloud TTS client libraries</a>. For more information, see the <a href="/go/docs/reference/cloud.google.com/go/texttospeech/latest/apiv1" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_speech/audio_profile.go" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="go">Cloud TTS <span class="notranslate">Go</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_speech/audio_profile.go">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy

import (
 "fmt"
 "io"
 "os"

 "context"

 texttospeech "cloud.google.com/go/texttospeech/apiv1"
 "cloud.google.com/go/texttospeech/apiv1/texttospeechpb"
)

// audioProfile generates audio from text using a custom synthesizer like a telephone call.
func audioProfile(w io.Writer, text string, outputFile string) error {
 // text := "hello"
 // outputFile := "out.mp3"

 ctx := context.Background()

 client, err := texttospeech.NewClient(ctx)
 if err != nil {
     return fmt.Errorf("NewClient: %w", err)
 }
 defer client.Close()

 req := &texttospeechpb.SynthesizeSpeechRequest{
     Input: &texttospeechpb.SynthesisInput{
         InputSource: &texttospeechpb.SynthesisInput_Text{Text: text},
     },
     Voice: &texttospeechpb.VoiceSelectionParams{LanguageCode: "en-US"},
     AudioConfig: &texttospeechpb.AudioConfig{
         AudioEncoding:    texttospeechpb.AudioEncoding_MP3,
         EffectsProfileId: []string{"telephony-class-application"},
     },
 }

 resp, err := client.SynthesizeSpeech(ctx, req)
 if err != nil {
     return fmt.Errorf("SynthesizeSpeech: %w", err)
 }

 if err = os.WriteFile(outputFile, resp.AudioContent, 0644); err != nil {
     return err
 }

 fmt.Fprintf(w, "Audio content written to file: %v\n", outputFile)

 return nil
}
```

### <span class="notranslate">Java</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/cloud-client/src/main/java/com/example/texttospeech/SynthesizeText.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="tts_synthesize_text_audio_profile">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/cloud-client/src/main/java/com/example/texttospeech/SynthesizeText.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/cloud-client/src/main/java/com/example/texttospeech/SynthesizeText.java">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
/**
 * Demonstrates using the Text to Speech client with audio profiles to synthesize text or ssml
 *
 * @param text the raw text to be synthesized. (e.g., "Hello there!")
 * @param effectsProfile audio profile to be used for synthesis. (e.g.,
 *     "telephony-class-application")
 * @throws Exception on TextToSpeechClient Errors.
 */
public static ByteString synthesizeTextWithAudioProfile(String text, String effectsProfile)
    throws Exception {
  // Instantiates a client
  try (TextToSpeechClient textToSpeechClient = TextToSpeechClient.create()) {
    // Set the text input to be synthesized
    SynthesisInput input = SynthesisInput.newBuilder().setText(text).build();

    // Build the voice request
    VoiceSelectionParams voice =
        VoiceSelectionParams.newBuilder()
            .setLanguageCode("en-US") // languageCode = "en_us"
            .setSsmlGender(SsmlVoiceGender.FEMALE) // ssmlVoiceGender = SsmlVoiceGender.FEMALE
            .build();

    // Select the type of audio file you want returned and the audio profile
    AudioConfig audioConfig =
        AudioConfig.newBuilder()
            .setAudioEncoding(AudioEncoding.MP3) // MP3 audio.
            .addEffectsProfileId(effectsProfile) // audio profile
            .build();

    // Perform the text-to-speech request
    SynthesizeSpeechResponse response =
        textToSpeechClient.synthesizeSpeech(input, voice, audioConfig);

    // Get the audio contents from the response
    ByteString audioContents = response.getAudioContent();

    // Write the response to the output file.
    try (OutputStream out = new FileOutputStream("output.mp3")) {
      out.write(audioContents.toByteArray());
      System.out.println("Audio content written to file \"output.mp3\"");
      return audioContents;
    }
  }
}
```

### <span class="notranslate">Node.js</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/audioProfile.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="tts_synthesize_text_audio_profile">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/audioProfile.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/audioProfile.js">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
// const text = 'Text you want to vocalize';
// const outputFile = 'YOUR_OUTPUT_FILE_LOCAtION;
// const languageCode = 'LANGUAGE_CODE_FOR_OUTPUT';
// const ssmlGender = 'SSML_GENDER_OF_SPEAKER';

// Imports the Google Cloud client library
const speech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

// Creates a client
const client = new speech.TextToSpeechClient();

async function synthesizeWithEffectsProfile() {
  // Add one or more effects profiles to array.
  // Refer to documentation for more details:
  // https://cloud.google.com/text-to-speech/docs/audio-profiles
  const effectsProfileId = ['telephony-class-application'];

  const request = {
    input: {text: text},
    voice: {languageCode: languageCode, ssmlGender: ssmlGender},
    audioConfig: {audioEncoding: 'MP3', effectsProfileId: effectsProfileId},
  };

  const [response] = await client.synthesizeSpeech(request);
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(outputFile, response.audioContent, 'binary');
  console.log(`Audio content written to file: ${outputFile}`);
}
```

### <span class="notranslate">PHP</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/php-docs-samples/blob/HEAD/texttospeech/src/synthesize_text_effects_profile.php" data-track-type="clientLibrariesReference" data-track-name="php" data-track-metadata-position="tts_synthesize_text_audio_profile">Cloud TTS client libraries</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/php-docs-samples/blob/HEAD/texttospeech/src/synthesize_text_effects_profile.php">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
use Google\Cloud\TextToSpeech\V1\AudioConfig;
use Google\Cloud\TextToSpeech\V1\AudioEncoding;
use Google\Cloud\TextToSpeech\V1\Client\TextToSpeechClient;
use Google\Cloud\TextToSpeech\V1\SsmlVoiceGender;
use Google\Cloud\TextToSpeech\V1\SynthesisInput;
use Google\Cloud\TextToSpeech\V1\SynthesizeSpeechRequest;
use Google\Cloud\TextToSpeech\V1\VoiceSelectionParams;

/**
 * @param string $text Text to synthesize
 * @param string $effectsProfileId Audio Profile ID
 */
function synthesize_text_effects_profile(string $text, string $effectsProfileId): void
{
    // create client object
    $client = new TextToSpeechClient();

    $inputText = (new SynthesisInput())
        ->setText($text);

    // note: the voice can also be specified by name
    // names of voices can be retrieved with $client->listVoices()
    $voice = (new VoiceSelectionParams())
        ->setLanguageCode('en-US')
        ->setSsmlGender(SsmlVoiceGender::FEMALE);

    // define effects profile id.
    $audioConfig = (new AudioConfig())
        ->setAudioEncoding(AudioEncoding::MP3)
        ->setEffectsProfileId(array($effectsProfileId));
    $request = (new SynthesizeSpeechRequest())
        ->setInput($inputText)
        ->setVoice($voice)
        ->setAudioConfig($audioConfig);

    $response = $client->synthesizeSpeech($request);
    $audioContent = $response->getAudioContent();

    file_put_contents('output.mp3', $audioContent);
    print('Audio content written to "output.mp3"' . PHP_EOL);

    $client->close();
}
```

### <span class="notranslate">Python</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/audio_profile.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="tts_synthesize_text_audio_profile">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/audio_profile.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text_audio_profile" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/audio_profile.py">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
def synthesize_text_with_audio_profile():
    """Synthesizes speech from the input string of text."""
    from google.cloud import texttospeech

    text = "hello"
    output = "output.mp3"
    effects_profile_id = "telephony-class-application"
    client = texttospeech.TextToSpeechClient()

    input_text = texttospeech.SynthesisInput(text=text)

    # Note: the voice can also be specified by name.
    # Names of voices can be retrieved with client.list_voices().
    voice = texttospeech.VoiceSelectionParams(language_code="en-US")

    # Note: you can pass in multiple effects_profile_id. They will be applied
    # in the same order they are provided.
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        effects_profile_id=[effects_profile_id],
    )

    response = client.synthesize_speech(
        input=input_text, voice=voice, audio_config=audio_config
    )

    # The response's audio_content is binary.
    with open(output, "wb") as out:
        out.write(response.audio_content)
        print('Audio content written to file "%s"' % output)
```

## What's next

To search and filter code samples for other Google Cloud products, see the [Google Cloud sample browser](/docs/samples?product=texttospeech).

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\[\],\[\],\[\]\]
