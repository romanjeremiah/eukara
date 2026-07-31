- <a href="https://docs.cloud.google.com/" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="1" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="1" data-track-metadata-eventdetail="Google Cloud Documentation">Home</a>

- 

  <a href="https://docs.cloud.google.com/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="2" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="2" data-track-metadata-eventdetail="Documentation">Documentation</a>

- 

  <a href="https://docs.cloud.google.com/docs/ai-ml" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="3" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="3" data-track-metadata-eventdetail="AI and ML">AI and ML</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="4" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="4" data-track-metadata-eventdetail="Cloud Text-to-Speech">Cloud Text-to-Speech</a>

- 

  <a href="https://docs.cloud.google.com/text-to-speech/docs/samples" class="devsite-breadcrumb-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Breadcrumbs" data-value="5" data-track-type="globalNav" data-track-name="breadcrumb" data-track-metadata-position="5" data-track-metadata-eventdetail="">Samples</a>

# List available voices <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

Shows how to list the available voices.

## Explore further

For detailed documentation that includes this code sample, see the following:

- [Supported voices and languages](/text-to-speech/docs/list-voices-and-types)

## Code sample

### <span class="notranslate">Go</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/list_voices/list_voices.go" data-track-type="clientLibrariesReference" data-track-name="go" data-track-metadata-position="tts_list_voices">Cloud TTS client libraries</a>. For more information, see the <a href="/go/docs/reference/cloud.google.com/go/texttospeech/latest/apiv1" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/list_voices/list_voices.go" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="go">Cloud TTS <span class="notranslate">Go</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/golang-samples/blob/HEAD/texttospeech/list_voices/list_voices.go">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy

// ListVoices lists the available text to speech voices.
func ListVoices(w io.Writer) error {
 ctx := context.Background()

 client, err := texttospeech.NewClient(ctx)
 if err != nil {
     return err
 }
 defer client.Close()

 // Performs the list voices request.
 resp, err := client.ListVoices(ctx, &texttospeechpb.ListVoicesRequest{})
 if err != nil {
     return err
 }

 for _, voice := range resp.Voices {
     // Display the voice's name. Example: tpc-vocoded
     fmt.Fprintf(w, "Name: %v\n", voice.Name)

     // Display the supported language codes for this voice. Example: "en-US"
     for _, languageCode := range voice.LanguageCodes {
         fmt.Fprintf(w, "  Supported language: %v\n", languageCode)
     }

     // Display the SSML Voice Gender.
     fmt.Fprintf(w, "  SSML Voice Gender: %v\n", voice.SsmlGender.String())

     // Display the natural sample rate hertz for this voice. Example: 24000
     fmt.Fprintf(w, "  Natural Sample Rate Hertz: %v\n",
         voice.NaturalSampleRateHertz)
 }

 return nil
}
```

### <span class="notranslate">Java</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/ListAllSupportedVoices.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="tts_list_voices">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/ListAllSupportedVoices.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/beta/src/main/java/com/example/texttospeech/ListAllSupportedVoices.java">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
/**
 * Demonstrates using the Text to Speech client to list the client's supported voices.
 *
 * @throws Exception on TextToSpeechClient Errors.
 */
public static void listAllSupportedVoices() throws Exception {
  // Instantiates a client
  try (TextToSpeechClient textToSpeechClient = TextToSpeechClient.create()) {
    // Builds the text to speech list voices request
    ListVoicesRequest request = ListVoicesRequest.getDefaultInstance();

    // Performs the list voices request
    ListVoicesResponse response = textToSpeechClient.listVoices(request);
    List<Voice> voices = response.getVoicesList();

    for (Voice voice : voices) {
      // Display the voice's name. Example: tpc-vocoded
      System.out.format("Name: %s\n", voice.getName());

      // Display the supported language codes for this voice. Example: "en-us"
      List<ByteString> languageCodes = voice.getLanguageCodesList().asByteStringList();
      for (ByteString languageCode : languageCodes) {
        System.out.format("Supported Language: %s\n", languageCode.toStringUtf8());
      }

      // Display the SSML Voice Gender
      System.out.format("SSML Voice Gender: %s\n", voice.getSsmlGender());

      // Display the natural sample rate hertz for this voice. Example: 24000
      System.out.format("Natural Sample Rate Hertz: %s\n\n", voice.getNaturalSampleRateHertz());
    }
  }
}
```

### <span class="notranslate">Node.js</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/listVoices.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="tts_list_voices">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/listVoices.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/listVoices.js">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
const textToSpeech = require('@google-cloud/text-to-speech');

const client = new textToSpeech.TextToSpeechClient();

const [result] = await client.listVoices({});
const voices = result.voices;

console.log('Voices:');
voices.forEach(voice => {
  console.log(`Name: ${voice.name}`);
  console.log(`  SSML Voice Gender: ${voice.ssmlGender}`);
  console.log(`  Natural Sample Rate Hertz: ${voice.naturalSampleRateHertz}`);
  console.log('  Supported languages:');
  voice.languageCodes.forEach(languageCode => {
    console.log(`    ${languageCode}`);
  });
});
```

### <span class="notranslate">PHP</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/php-docs-samples/blob/HEAD/texttospeech/src/list_voices.php" data-track-type="clientLibrariesReference" data-track-name="php" data-track-metadata-position="tts_list_voices">Cloud TTS client libraries</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/php-docs-samples/blob/HEAD/texttospeech/src/list_voices.php">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
use Google\Cloud\TextToSpeech\V1\Client\TextToSpeechClient;
use Google\Cloud\TextToSpeech\V1\ListVoicesRequest;

function list_voices(): void
{
    // create client object
    $client = new TextToSpeechClient();

    // perform list voices request
    $request = (new ListVoicesRequest());
    $response = $client->listVoices($request);
    $voices = $response->getVoices();

    foreach ($voices as $voice) {
        // display the voice's name. example: tpc-vocoded
        printf('Name: %s' . PHP_EOL, $voice->getName());

        // display the supported language codes for this voice. example: 'en-US'
        foreach ($voice->getLanguageCodes() as $languageCode) {
            printf('Supported language: %s' . PHP_EOL, $languageCode);
        }

        // SSML voice gender values from TextToSpeech\V1\SsmlVoiceGender
        $ssmlVoiceGender = ['SSML_VOICE_GENDER_UNSPECIFIED', 'MALE', 'FEMALE',
        'NEUTRAL'];

        // display the SSML voice gender
        $gender = $voice->getSsmlGender();
        printf('SSML voice gender: %s' . PHP_EOL, $ssmlVoiceGender[$gender]);

        // display the natural hertz rate for this voice
        printf('Natural Sample Rate Hertz: %d' . PHP_EOL,
            $voice->getNaturalSampleRateHertz());
    }

    $client->close();
}
```

### <span class="notranslate">Python</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/list_voices.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="tts_list_voices">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/list_voices.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_list_voices" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/list_voices.py">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
def list_voices():
    """Lists the available voices."""
    from google.cloud import texttospeech

    client = texttospeech.TextToSpeechClient()

    # Performs the list voices request
    voices = client.list_voices()

    for voice in voices.voices:
        # Display the voice's name. Example: tpc-vocoded
        print(f"Name: {voice.name}")

        # Display the supported language codes for this voice. Example: "en-US"
        for language_code in voice.language_codes:
            print(f"Supported language: {language_code}")

        ssml_gender = texttospeech.SsmlVoiceGender(voice.ssml_gender)

        # Display the SSML Voice Gender
        print(f"SSML Voice Gender: {ssml_gender.name}")

        # Display the natural sample rate hertz for this voice. Example: 24000
        print(f"Natural Sample Rate Hertz: {voice.natural_sample_rate_hertz}\n")
```

## What's next

To search and filter code samples for other Google Cloud products, see the [Google Cloud sample browser](/docs/samples?product=texttospeech).

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\[\],\[\],\[\]\]
