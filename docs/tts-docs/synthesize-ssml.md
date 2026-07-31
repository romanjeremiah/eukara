- <a href="https://docs.cloud.google.com/" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="1" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="1" data-track-metadata-eventdetail="Google Cloud Documentation">Home</a>

- 

  <a href="https://docs.cloud.google.com/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="2" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="2" data-track-metadata-eventdetail="Documentation">Documentation</a>

- 

  <a href="https://docs.cloud.google.com/docs/ai-ml" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="3" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="3" data-track-metadata-eventdetail="AI and ML">AI and ML</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="4" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="4" data-track-metadata-eventdetail="Cloud Text-to-Speech">Cloud Text-to-Speech</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs/samples" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="5" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="5" data-track-metadata-eventdetail="">Samples</a>

# Synthesize SSML <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

Demonstrates how to use SSML with the Text-to-speech API.

## Explore further

For detailed documentation that includes this code sample, see the following:

- [Create voice audio files](/text-to-speech/docs/create-audio)

## Code sample

### <span class="notranslate">Go</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_text/synthesize_text.go" data-track-type="clientLibrariesReference" data-track-name="go" data-track-metadata-position="tts_synthesize_ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/go/docs/reference/cloud.google.com/go/texttospeech/latest/apiv1" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_text/synthesize_text.go" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="go">Cloud TTS <span class="notranslate">Go</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_text/synthesize_text.go">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy

// SynthesizeSSML synthesizes ssml and saves the output to outputFile.
//
// ssml must be well-formed according to:
//
//  https://www.w3.org/TR/speech-synthesis/
//
// Example: <speak>Hello there.</speak>
func SynthesizeSSML(w io.Writer, ssml, outputFile string) error {
 ctx := context.Background()

 client, err := texttospeech.NewClient(ctx)
 if err != nil {
     return err
 }
 defer client.Close()

 req := texttospeechpb.SynthesizeSpeechRequest{
     Input: &texttospeechpb.SynthesisInput{
         InputSource: &texttospeechpb.SynthesisInput_Ssml{Ssml: ssml},
     },
     // Note: the voice can also be specified by name.
     // Names of voices can be retrieved with client.ListVoices().
     Voice: &texttospeechpb.VoiceSelectionParams{
         LanguageCode: "en-US",
         SsmlGender:   texttospeechpb.SsmlVoiceGender_FEMALE,
     },
     AudioConfig: &texttospeechpb.AudioConfig{
         AudioEncoding: texttospeechpb.AudioEncoding_MP3,
     },
 }

 resp, err := client.SynthesizeSpeech(ctx, &req)
 if err != nil {
     return err
 }

 err = os.WriteFile(outputFile, resp.AudioContent, 0644)
 if err != nil {
     return err
 }
 fmt.Fprintf(w, "Audio content written to file: %v\n", outputFile)
 return nil
}
```

### <span class="notranslate">Java</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/SynthesizeText.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="tts_synthesize_ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/SynthesizeText.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/SynthesizeText.java">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
/**
 * Demonstrates using the Text to Speech client to synthesize text or ssml.
 *
 * <p>Note: ssml must be well-formed according to: (https://www.w3.org/TR/speech-synthesis/
 * Example: <speak>Hello there.</speak>
 *
 * @param ssml the ssml document to be synthesized. (e.g., "<?xml...")
 * @throws Exception on TextToSpeechClient Errors.
 */
public static void synthesizeSsml(String ssml) throws Exception {
  // Instantiates a client
  try (TextToSpeechClient textToSpeechClient = TextToSpeechClient.create()) {
    // Set the ssml input to be synthesized
    SynthesisInput input = SynthesisInput.newBuilder().setSsml(ssml).build();

    // Build the voice request
    VoiceSelectionParams voice =
        VoiceSelectionParams.newBuilder()
            .setLanguageCode("en-US") // languageCode = "en_us"
            .setSsmlGender(SsmlVoiceGender.FEMALE) // ssmlVoiceGender = SsmlVoiceGender.FEMALE
            .build();

    // Select the type of audio file you want returned
    AudioConfig audioConfig =
        AudioConfig.newBuilder()
            .setAudioEncoding(AudioEncoding.MP3) // MP3 audio.
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
    }
  }
}
```

### <span class="notranslate">Node.js</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/synthesize.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="tts_synthesize_ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/synthesize.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/synthesize.js">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

const client = new textToSpeech.TextToSpeechClient();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
// const ssml = '<speak>Hello there.</speak>';
// const outputFile = 'Local path to save audio file to, e.g. output.mp3';

const request = {
  input: {ssml: ssml},
  voice: {languageCode: 'en-US', ssmlGender: 'FEMALE'},
  audioConfig: {audioEncoding: 'MP3'},
};

const [response] = await client.synthesizeSpeech(request);
const writeFile = util.promisify(fs.writeFile);
await writeFile(outputFile, response.audioContent, 'binary');
console.log(`Audio content written to file: ${outputFile}`);
```

### <span class="notranslate">PHP</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/php-docs-samples/blob/HEAD/texttospeech/src/synthesize_ssml.php" data-track-type="clientLibrariesReference" data-track-name="php" data-track-metadata-position="tts_synthesize_ssml">Cloud TTS client libraries</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/php-docs-samples/blob/HEAD/texttospeech/src/synthesize_ssml.php">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
use Google\Cloud\TextToSpeech\V1\AudioConfig;
use Google\Cloud\TextToSpeech\V1\AudioEncoding;
use Google\Cloud\TextToSpeech\V1\Client\TextToSpeechClient;
use Google\Cloud\TextToSpeech\V1\SsmlVoiceGender;
use Google\Cloud\TextToSpeech\V1\SynthesisInput;
use Google\Cloud\TextToSpeech\V1\SynthesizeSpeechRequest;
use Google\Cloud\TextToSpeech\V1\VoiceSelectionParams;

/**
 * @param string $ssml SSML to synthesize
 */
function synthesize_ssml(string $ssml): void
{
    // create client object
    $client = new TextToSpeechClient();

    $input_text = (new SynthesisInput())
        ->setSsml($ssml);

    // note: the voice can also be specified by name
    // names of voices can be retrieved with $client->listVoices()
    $voice = (new VoiceSelectionParams())
        ->setLanguageCode('en-US')
        ->setSsmlGender(SsmlVoiceGender::FEMALE);

    $audioConfig = (new AudioConfig())
        ->setAudioEncoding(AudioEncoding::MP3);
    $request = (new SynthesizeSpeechRequest())
        ->setInput($input_text)
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

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/synthesize_text.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="tts_synthesize_ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/synthesize_text.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/synthesize_text.py">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
def synthesize_ssml():
    """Synthesizes speech from the input string of ssml.

    Note: ssml must be well-formed according to:
        https://www.w3.org/TR/speech-synthesis/

    """
    from google.cloud import texttospeech

    ssml = "<speak>Hello there.</speak>"
    client = texttospeech.TextToSpeechClient()

    input_text = texttospeech.SynthesisInput(ssml=ssml)

    # Note: the voice can also be specified by name.
    # Names of voices can be retrieved with client.list_voices().
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Standard-C",
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=input_text, voice=voice, audio_config=audio_config
    )

    # The response's audio_content is binary.
    with open("output.mp3", "wb") as out:
        out.write(response.audio_content)
        print('Audio content written to file "output.mp3"')
```

## What's next

To search and filter code samples for other Google Cloud products, see the [Google Cloud sample browser](/docs/samples?product=texttospeech).

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\[\],\[\],\[\]\]
