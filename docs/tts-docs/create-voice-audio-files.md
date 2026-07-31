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

# Create voice audio files <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

Cloud Text-to-Speech allows you to convert words and sentences into base64 encoded audio data of natural human speech. You can then convert the audio data into a playable audio file like an MP3 by decoding the base64 data. The Cloud Text-to-Speech API accepts input as raw text or [Speech Synthesis Markup Language (SSML)](/text-to-speech/docs/ssml).

This document describes how to create an audio file from either text or SSML input using Cloud TTS. You can also review the [Cloud TTS basics](/text-to-speech/docs/basics) article if you are unfamiliar with concepts like speech synthesis or SSML.

These samples require that you have installed and initialized the Google Cloud CLI. For information about setting up the gcloud CLI, see [Authenticate to Cloud TTS](/text-to-speech/docs/authentication).

## Convert text to synthetic voice audio

The following code samples demonstrate how to convert a string into audio data.

You can configure the output of speech synthesis in a variety of ways, including [selecting a unique voice](/text-to-speech/docs/voices) or [modulating the output in pitch, volume, speaking rate, and sample rate](/text-to-speech/docs/basics#audio-config).

**Note:** See [endpoints documentation](/text-to-speech/docs/endpoints) for specifics on using [Neural2 voices](/text-to-speech/docs/voice-types).

### Protocol

Refer to the [`text:synthesize`](/text-to-speech/docs/reference/rest/v1beta1/text/synthesize) API endpoint for complete details.

To synthesize audio from text, make an HTTP POST request to the [`text:synthesize`](/text-to-speech/docs/reference/rest/v1beta1/text/synthesize) endpoint. In the body of your POST request, specify the type of voice to synthesize in the `voice` configuration section, specify the text to synthesize in the `text` field of the `input` section, and specify the type of audio to create in the `audioConfig` section.

The following code snippet sends a synthesis request to the [`text:synthesize`](/text-to-speech/docs/reference/rest/v1beta1/text/synthesize) endpoint and saves the results to a file named `synthesize-text.txt`. Replace `PROJECT_ID` with your project ID.

``` devsite-click-to-copy
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: <var>PROJECT_ID</var>" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data "{
    'input':{
      'text':'Android is a mobile operating system developed by Google,
         based on the Linux kernel and designed primarily for
         touchscreen mobile devices such as smartphones and tablets.'
    },
    'voice':{
      'languageCode':'en-gb',
      'name':'en-GB-Standard-A',
      'ssmlGender':'FEMALE'
    },
    'audioConfig':{
      'audioEncoding':'MP3'
    }
  }" "https://texttospeech.googleapis.com/v1/text:synthesize" > synthesize-text.txt
```

The Cloud Text-to-Speech API returns the synthesized audio as base64-encoded data contained in the JSON output. The JSON output in the `synthesize-text.txt` file looks similar to the following code snippet.

``` devsite-disable-click-to-copy

{
  "audioContent": "//NExAASCCIIAAhEAGAAEMW4kAYPnwwIKw/BBTpwTvB+IAxIfghUfW.."
}
```

To decode the results from the Cloud Text-to-Speech API as an MP3 audio file, run the following command from the same directory as the `synthesize-text.txt` file.

``` devsite-click-to-copy
cat synthesize-text.txt | grep 'audioContent' | \
sed 's|audioContent| |' | tr -d '\n ":{},' > tmp.txt && \
base64 tmp.txt --decode > synthesize-text-audio.mp3 && \
rm tmp.txt
```

### <span class="notranslate">Go</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_text/synthesize_text.go" data-track-type="clientLibrariesReference" data-track-name="go" data-track-metadata-position="text-to-speech-text">Cloud TTS client libraries</a>. For more information, see the <a href="/go/docs/reference/cloud.google.com/go/texttospeech/latest/apiv1" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_text/synthesize_text.go" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="go">Cloud TTS <span class="notranslate">Go</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_text/synthesize_text.go">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy

// SynthesizeText synthesizes plain text and saves the output to outputFile.
func SynthesizeText(w io.Writer, text, outputFile string) error {
 ctx := context.Background()

 client, err := texttospeech.NewClient(ctx)
 if err != nil {
     return err
 }
 defer client.Close()

 req := texttospeechpb.SynthesizeSpeechRequest{
     Input: &texttospeechpb.SynthesisInput{
         InputSource: &texttospeechpb.SynthesisInput_Text{Text: text},
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

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SynthesizeText.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="text-to-speech-text">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SynthesizeText.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SynthesizeText.java">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
/**
 * Demonstrates using the Text to Speech client to synthesize text or ssml.
 *
 * @param text the raw text to be synthesized. (e.g., "Hello there!")
 * @throws Exception on TextToSpeechClient Errors.
 */
public static ByteString synthesizeText(String text) throws Exception {
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
      return audioContents;
    }
  }
}
```

### <span class="notranslate">Node.js</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/synthesize.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="text-to-speech-text">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/synthesize.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/synthesize.js">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

const client = new textToSpeech.TextToSpeechClient();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
// const text = 'Text to synthesize, eg. hello';
// const outputFile = 'Local path to save audio file to, e.g. output.mp3';

const request = {
  input: {text: text},
  voice: {languageCode: 'en-US', ssmlGender: 'FEMALE'},
  audioConfig: {audioEncoding: 'MP3'},
};
const [response] = await client.synthesizeSpeech(request);
const writeFile = util.promisify(fs.writeFile);
await writeFile(outputFile, response.audioContent, 'binary');
console.log(`Audio content written to file: ${outputFile}`);
```

### <span class="notranslate">Python</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/synthesize_text.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="text-to-speech-text">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/synthesize_text.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_text" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/synthesize_text.py">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
def synthesize_text():
    """Synthesizes speech from the input string of text."""
    from google.cloud import texttospeech

    text = "Hello there."
    client = texttospeech.TextToSpeechClient()

    input_text = texttospeech.SynthesisInput(text=text)

    # Note: the voice can also be specified by name.
    # Names of voices can be retrieved with client.list_voices().
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Chirp3-HD-Charon",
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client.synthesize_speech(
        input=input_text,
        voice=voice,
        audio_config=audio_config,
    )

    # The response's audio_content is binary.
    with open("output.mp3", "wb") as out:
        out.write(response.audio_content)
        print('Audio content written to file "output.mp3"')
```

### Additional languages

**C#**: Please follow the [C# setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="https://googleapis.github.io/google-cloud-dotnet/docs/Google.Cloud.TextToSpeech.V1/index.html" class="external">Cloud TTS reference documentation for .NET.</a>

**PHP**: Please follow the [PHP setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="/php/docs/reference/cloud-text-to-speech/latest" class="external">Cloud TTS reference documentation for PHP.</a>

**Ruby**: Please follow the [Ruby setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="https://googleapis.dev/ruby/google-cloud-text_to_speech/latest/Google/Cloud/TextToSpeech/V1.html" class="external">Cloud TTS reference documentation for Ruby.</a>

## Convert SSML to synthetic voice audio

Using SSML in your audio synthesis request can produce audio that is more similar to natural human speech. Specifically, SSML gives you finer-grain control over how the audio output represents pauses in the speech or how the audio pronounces dates, times, acronyms, and abbreviations.

For more details on the SSML elements supported by Cloud Text-to-Speech API, see the [SSML reference](/text-to-speech/docs/ssml).

### Protocol

Refer to the [`text:synthesize`](/text-to-speech/docs/reference/rest/v1beta1/text/synthesize) API endpoint for complete details.

To synthesize audio from SSML, make an HTTP POST request to the [`text:synthesize`](/text-to-speech/docs/reference/rest/v1beta1/text/synthesize) endpoint. In the body of your POST request, specify the type of voice to synthesize in the `voice` configuration section, specify the SSML to synthesize in the `ssml` field of the `input` section, and specify the type of audio to create in the `audioConfig` section.

The following code snippet sends a synthesis request to the [`text:synthesize`](/text-to-speech/docs/reference/rest/v1beta1/text/synthesize) endpoint and saves the results to a file named `synthesize-ssml.txt`. Replace `PROJECT_ID` with your project ID.

``` devsite-click-to-copy
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: <var>PROJECT_ID</var>" \
  -H "Content-Type: application/json; charset=utf-8" --data "{
    'input':{
     'ssml':'<speak>The <say-as interpret-as=\"characters\">SSML</say-as> standard
          is defined by the <sub alias=\"World Wide Web Consortium\">W3C</sub>.</speak>'
    },
    'voice':{
      'languageCode':'en-us',
      'name':'en-US-Standard-B',
      'ssmlGender':'MALE'
    },
    'audioConfig':{
      'audioEncoding':'MP3'
    }
  }" "https://texttospeech.googleapis.com/v1/text:synthesize" > synthesize-ssml.txt
```

The Text-to-Speech API returns the synthesized audio as base64-encoded data contained in the JSON output. The JSON output in the `synthesize-ssml.txt` file looks similar to the following code snippet.

``` devsite-disable-click-to-copy

{
  "audioContent": "//NExAASCCIIAAhEAGAAEMW4kAYPnwwIKw/BBTpwTvB+IAxIfghUfW.."
}
```

To decode the results from the Text-to-Speech API as an MP3 audio file, run the following command from the same directory as the `synthesize-ssml.txt` file.

``` devsite-click-to-copy
cat synthesize-ssml.txt | grep 'audioContent' | \
sed 's|audioContent| |' | tr -d '\n ":{},' > tmp.txt && \
base64 tmp.txt --decode > synthesize-ssml-audio.mp3 && \
rm tmp.txt
```

### <span class="notranslate">Go</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_text/synthesize_text.go" data-track-type="clientLibrariesReference" data-track-name="go" data-track-metadata-position="text-to-speech-ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/go/docs/reference/cloud.google.com/go/texttospeech/latest/apiv1" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/synthesize_text/synthesize_text.go" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="go">Cloud TTS <span class="notranslate">Go</span> API reference documentation</a>.

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

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SynthesizeText.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="text-to-speech-ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SynthesizeText.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SynthesizeText.java">Set up authentication for a local development environment</a>.

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
public static ByteString synthesizeSsml(String ssml) throws Exception {
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
      return audioContents;
    }
  }
}
```

### <span class="notranslate">Node.js</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/synthesize.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="text-to-speech-ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/synthesize.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

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

### <span class="notranslate">Python</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/synthesize_text.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="text-to-speech-ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_synthesize_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/synthesize_text.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

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

### Additional languages

**C#**: Please follow the [C# setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="https://googleapis.github.io/google-cloud-dotnet/docs/Google.Cloud.TextToSpeech.V1/index.html" class="external">Cloud TTS reference documentation for .NET.</a>

**PHP**: Please follow the [PHP setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="/php/docs/reference/cloud-text-to-speech/latest" class="external">Cloud TTS reference documentation for PHP.</a>

**Ruby**: Please follow the [Ruby setup instructions](/text-to-speech/docs/libraries) on the client libraries page and then visit the <a href="https://googleapis.dev/ruby/google-cloud-text_to_speech/latest/Google/Cloud/TextToSpeech/V1.html" class="external">Cloud TTS reference documentation for Ruby.</a>

## Try it for yourself

If you're new to Google Cloud, create an account to evaluate how Cloud TTS performs in real-world scenarios. New customers also get $300 in free credits to run, test, and deploy workloads.

<a href="https://console.cloud.google.com/freetrial" class="button button-primary" data-track-type="button" data-track-metadata-modifier="primary" data-track-name="
        Try Cloud TTS free
      " data-track-metadata-anchor_text="
        Try Cloud TTS free
      " data-track-metadata-eventdetail="https://console.cloud.google.com/freetrial" data-track-metadata-href="https://console.cloud.google.com/freetrial">Try Cloud TTS free</a>

Send feedback

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-06-11 UTC.

Need to tell us more?

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-06-11 UTC."\],\[\],\[\]\]
