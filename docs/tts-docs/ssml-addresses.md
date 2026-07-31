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

# Speak addresses with SSML <span slot="popout-heading"> Stay organized with collections </span> <span slot="popout-contents"> Save and categorize content based on your preferences. </span>

This tutorial demonstrates how to use [Speech Synthesis Markup Language (SSML)](/text-to-speech/docs/ssml) to speak a text file of addresses. You can mark up a string of text with SSML tags to personalize synthetic audio from Cloud Text-to-Speech.

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr>
<th>Plaintext</th>
<th>SSML rendering of plaintext</th>
</tr>
</thead>
<tbody>
<tr>
<td><div>
&#10;</div>
<pre class="lang-py" translate="no" dir="ltr" data-is-upgraded=""><code>
123 Street Ln</code></pre></td>
<td><div>
&#10;</div>
<pre class="lang-py" translate="no" dir="ltr" data-is-upgraded=""><code>
&lt;speak&gt;123 Street Ln&lt;/speak&gt;</code></pre></td>
</tr>
<tr>
<td><div>
&#10;</div>
<pre class="lang-py" translate="no" dir="ltr" data-is-upgraded=""><code>
1 Number St</code></pre></td>
<td><div>
&#10;</div>
<pre class="lang-py" translate="no" dir="ltr" data-is-upgraded=""><code>
&lt;speak&gt;1 Number St&lt;/speak&gt;</code></pre></td>
</tr>
<tr>
<td><div>
&#10;</div>
<pre class="lang-py" translate="no" dir="ltr" data-is-upgraded=""><code>
1 Piazza del Fibonacci</code></pre></td>
<td><div>
&#10;</div>
<pre class="lang-py" translate="no" dir="ltr" data-is-upgraded=""><code>
&lt;speak&gt;1 Piazza del Fibonacci&lt;/speak&gt;</code></pre></td>
</tr>
</tbody>
</table>

## Objective

Send a synthetic speech request to Cloud Text-to-Speech using SSML and [Cloud Text-to-Speech client libraries](/text-to-speech/docs/reference/libraries).

## Costs

Refer to the [Cloud TTS pricing page](https://cloud.google.com/text-to-speech/pricing/) for cost information.

## Before you begin

- Make sure that you have a [Cloud Text-to-Speech project](/text-to-speech/docs/reference/libraries) in [Google Cloud console](https://console.cloud.google.com/).
- This tutorial allows you to use Java, Node.js, or Python. If you plan to use Java, <a href="https://maven.apache.org/download.cgi" class="external">download</a> and <a href="https://maven.apache.org/install.html" class="external">install</a> Maven. If you plan to use Node.js, <a href="https://www.npmjs.com/get-npm" class="external">download npm</a>.

## Download the code samples

To download the code samples, clone the Google Cloud GitHub samples for the programming language that you intend to use.

### Java

This tutorial uses code in the `texttospeech/cloud-client/src/main/java/com/example/texttospeech/` directory of the <a href="https://github.com/GoogleCloudPlatform/java-docs-samples" class="external">Google Cloud Platform Java samples repository</a>.  
  
To download and navigate to the code for this tutorial, run the following commands from the terminal.

``` devsite-click-to-copy
git clone https://github.com/GoogleCloudPlatform/java-docs-samples.git
cd java-docs-samples/texttospeech/cloud-client/src/main/java/com/example/texttospeech/
```

### Node.js

This tutorial uses code in the `texttospeech` directory of the <a href="https://github.com/GoogleCloudPlatform/nodejs-docs-samples" class="external">Google Cloud Platform Node.js samples repository</a>.  
  
To download and navigate to the code for this tutorial, run the following commands from the terminal.

``` devsite-click-to-copy
git clone https://github.com/GoogleCloudPlatform/nodejs-docs-samples.git
cd texttospeech/
```

### Python

This tutorial uses code in the `texttospeech/snippets` directory of the <a href="https://github.com/GoogleCloudPlatform/python-docs-samples" class="external">Google Cloud Platform Python samples repository</a>.  
  
To download and navigate to the code for this tutorial, run the following commands from the terminal.

``` devsite-click-to-copy
git clone https://github.com/GoogleCloudPlatform/python-docs-samples.git
cd samples/snippets
```

## Install the client library

This tutorial uses the [Text-to-Speech client library](/text-to-speech/docs/reference/libraries).

### Java

This tutorial uses the following dependencies.  

``` devsite-click-to-copy
<!--  Using libraries-bom to manage versions.
See https://github.com/GoogleCloudPlatform/cloud-opensource-java/wiki/The-Google-Cloud-Platform-Libraries-BOM -->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.google.cloud</groupId>
      <artifactId>libraries-bom</artifactId>
      <version>26.32.0</version>
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

### Node.js

From terminal, run the follow command.

``` lang-sh
npm install @google-cloud/text-to-speech
```

### Python

From terminal, run the follow command.

``` lang-sh
pip install --upgrade google-cloud-texttospeech
```

## Set up your Google Cloud Platform credentials

Provide authentication credentials to your application code by setting the environment variable `GOOGLE_APPLICATION_CREDENTIALS`. This variable applies only to your current shell session. If you want the variable to apply to future shell sessions, set the variable in your shell startup file, for example in the `~/.bashrc` or `~/.profile` file.

### Linux or macOS

``` devsite-click-to-copy
export GOOGLE_APPLICATION_CREDENTIALS="KEY_PATH"
```

Replace `KEY_PATH` with the path of the JSON file that contains your credentials.

For example:

``` devsite-click-to-copy
export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"
```

### Windows

For PowerShell:

``` devsite-click-to-copy
$env:GOOGLE_APPLICATION_CREDENTIALS="KEY_PATH"
```

Replace `KEY_PATH` with the path of the JSON file that contains your credentials.

For example:

``` devsite-click-to-copy
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\service-account-file.json"
```

For command prompt:

``` devsite-click-to-copy
set GOOGLE_APPLICATION_CREDENTIALS=KEY_PATH
```

Replace `KEY_PATH` with the path of the JSON file that contains your credentials.

## Import libraries

This tutorial uses the following system and client libraries.

### <span class="notranslate">Java</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="text_to_speech_ssml_addresses_imports">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
// Imports the Google Cloud client library
import com.google.cloud.texttospeech.v1.AudioConfig;
import com.google.cloud.texttospeech.v1.AudioEncoding;
import com.google.cloud.texttospeech.v1.SsmlVoiceGender;
import com.google.cloud.texttospeech.v1.SynthesisInput;
import com.google.cloud.texttospeech.v1.SynthesizeSpeechResponse;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.google.cloud.texttospeech.v1.VoiceSelectionParams;
import com.google.common.html.HtmlEscapers;
import com.google.protobuf.ByteString;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
```

### <span class="notranslate">Node.js</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="text_to_speech_ssml_addresses_imports">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const fs = require('fs');
//const escape = require('escape-html');
const util = require('util');
```

### <span class="notranslate">Python</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="text_to_speech_ssml_addresses_imports">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_imports" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
import html

from google.cloud import texttospeech
```

## Use the Cloud Text-to-Speech API

The following function takes a string of text tagged with SSML and the name of an MP3 file. The function uses the text tagged with SSML to generate synthetic audio. The function saves the synthetic audio to the MP3 filename designated as a parameter.

The entire SSML input can only be read by a single voice. You can set the voice in the [`VoiceSelectionParams`](/text-to-speech/docs/reference/rest/v1/text/synthesize#voiceselectionparams) object.

**Note**: This function overrides any pre-existing files with the same name as the `outfile` parameter. Ensure that you do not lose any pre-existing local files by using a unique filename as your `outfile`.

### <span class="notranslate">Java</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="text_to_speech_ssml_addresses_audio">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
/**
 * Generates synthetic audio from a String of SSML text.
 *
 * <p>Given a string of SSML text and an output file name, this function calls the Text-to-Speech
 * API. The API returns a synthetic audio version of the text, formatted according to the SSML
 * commands. This function saves the synthetic audio to the designated output file.
 *
 * @param ssmlText String of tagged SSML text
 * @param outFile String name of file under which to save audio output
 * @throws Exception on errors while closing the client
 */
public static void ssmlToAudio(String ssmlText, String outFile) throws Exception {
  // Instantiates a client
  try (TextToSpeechClient textToSpeechClient = TextToSpeechClient.create()) {
    // Set the ssml text input to synthesize
    SynthesisInput input = SynthesisInput.newBuilder().setSsml(ssmlText).build();

    // Build the voice request, select the language code ("en-US") and
    // the ssml voice gender ("male")
    VoiceSelectionParams voice =
        VoiceSelectionParams.newBuilder()
            .setLanguageCode("en-US")
            .setSsmlGender(SsmlVoiceGender.MALE)
            .build();

    // Select the audio file type
    AudioConfig audioConfig =
        AudioConfig.newBuilder().setAudioEncoding(AudioEncoding.MP3).build();

    // Perform the text-to-speech request on the text input with the selected voice parameters and
    // audio file type
    SynthesizeSpeechResponse response =
        textToSpeechClient.synthesizeSpeech(input, voice, audioConfig);

    // Get the audio contents from the response
    ByteString audioContents = response.getAudioContent();

    // Write the response to the output file
    try (OutputStream out = new FileOutputStream(outFile)) {
      out.write(audioContents.toByteArray());
      System.out.println("Audio content written to file " + outFile);
    }
  }
}
```

### <span class="notranslate">Node.js</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="text_to_speech_ssml_addresses_audio">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
/**
 * Generates synthetic audio from a String of SSML text.
 *
 * Given a string of SSML text and an output file name, this function
 * calls the Text-to-Speech API. The API returns a synthetic audio
 * version of the text, formatted according to the SSML commands. This
 * function saves the synthetic audio to the designated output file.
 *
 * ARGS
 * ssmlText: String of tagged SSML text
 * outfile: String name of file under which to save audio output
 * RETURNS
 * nothing
 *
 */
async function ssmlToAudio(ssmlText, outFile) {
  // Creates a client
  const client = new textToSpeech.TextToSpeechClient();

  // Constructs the request
  const request = {
    // Select the text to synthesize
    input: {ssml: ssmlText},
    // Select the language and SSML Voice Gender (optional)
    voice: {languageCode: 'en-US', ssmlGender: 'MALE'},
    // Select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };

  // Performs the Text-to-Speech request
  const [response] = await client.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(outFile, response.audioContent, 'binary');
  console.log('Audio content written to file ' + outFile);
}
```

### <span class="notranslate">Python</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="text_to_speech_ssml_addresses_audio">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_audio" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
def ssml_to_audio(ssml_text: str) -> None:
    """
    Generates SSML text from plaintext.
    Given a string of SSML text and an output file name, this function
    calls the Text-to-Speech API. The API returns a synthetic audio
    version of the text, formatted according to the SSML commands. This
    function saves the synthetic audio to the designated output file.

    Args:
        ssml_text: string of SSML text
    """

    # Instantiates a client
    client = texttospeech.TextToSpeechClient()

    # Sets the text input to be synthesized
    synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)

    # Builds the voice request, selects the language code ("en-US") and
    # the SSML voice gender ("MALE")
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.MALE
    )

    # Selects the type of audio file to return
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    # Performs the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    # Writes the synthetic audio to the output file.
    with open("test_example.mp3", "wb") as out:
        out.write(response.audio_content)
        print("Audio content written to file " + "test_example.mp3")
```

## Personalize synthetic audio

The following function takes in the name of a text file and converts the contents of the file into a string of text tagged with SSML.

### <span class="notranslate">Java</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java" data-track-type="clientLibrariesReference" data-track-name="java" data-track-metadata-position="text_to_speech_ssml_addresses_ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/java/docs/reference/google-cloud-texttospeech/latest/overview" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="java">Cloud TTS <span class="notranslate">Java</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/java-docs-samples/blob/HEAD/texttospeech/snippets/src/main/java/com/example/texttospeech/SsmlAddresses.java">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
/**
 * Generates SSML text from plaintext.
 *
 * <p>Given an input filename, this function converts the contents of the input text file into a
 * String of tagged SSML text. This function formats the SSML String so that, when synthesized,
 * the synthetic audio will pause for two seconds between each line of the text file. This
 * function also handles special text characters which might interfere with SSML commands.
 *
 * @param inputFile String name of plaintext file
 * @return a String of SSML text based on plaintext input.
 * @throws IOException on files that don't exist
 */
public static String textToSsml(String inputFile) throws Exception {

  // Read lines of input file
  String rawLines = new String(Files.readAllBytes(Paths.get(inputFile)));

  // Replace special characters with HTML Ampersand Character Codes
  // These codes prevent the API from confusing text with SSML tags
  // For example, '<' --> '&lt;' and '&' --> '&amp;'
  String escapedLines = HtmlEscapers.htmlEscaper().escape(rawLines);

  // Convert plaintext to SSML
  // Tag SSML so that there is a 2 second pause between each address
  String expandedNewline = escapedLines.replaceAll("\\n", "\n<break time='2s'/>");
  String ssml = "<speak>" + expandedNewline + "</speak>";

  // Return the concatenated String of SSML
  return ssml;
}
```

### <span class="notranslate">Node.js</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js" data-track-type="clientLibrariesReference" data-track-name="nodejs" data-track-metadata-position="text_to_speech_ssml_addresses_ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/nodejs/docs/reference/text-to-speech/latest" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="nodejs">Cloud TTS <span class="notranslate">Node.js</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/HEAD/texttospeech/ssmlAddresses.js">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
/**
 * Generates SSML text from plaintext.
 *
 * Given an input filename, this function converts the contents of the input text file
 * into a String of tagged SSML text. This function formats the SSML String so that,
 * when synthesized, the synthetic audio will pause for two seconds between each line
 * of the text file. This function also handles special text characters which might
 * interfere with SSML commands.
 *
 * ARGS
 * inputfile: String name of plaintext file
 * RETURNS
 * a String of SSML text based on plaintext input
 *
 */
function textToSsml(inputFile) {
  let rawLines = '';
  // Read input file
  try {
    rawLines = fs.readFileSync(inputFile, 'utf8');
  } catch (e) {
    console.log('Error:', e.stack);
    return;
  }

  // Replace special characters with HTML Ampersand Character Codes
  // These codes prevent the API from confusing text with SSML tags
  // For example, '<' --> '&lt;' and '&' --> '&amp;'
  let escapedLines = rawLines;
  escapedLines = escapedLines.replace(/&/g, '&amp;');
  escapedLines = escapedLines.replace(/"/g, '&quot;');
  escapedLines = escapedLines.replace(/</g, '&lt;');
  escapedLines = escapedLines.replace(/>/g, '&gt;');

  // Convert plaintext to SSML
  // Tag SSML so that there is a 2 second pause between each address
  const expandedNewline = escapedLines.replace(/\n/g, '\n<break time="2s"/>');
  const ssml = '<speak>' + expandedNewline + '</speak>';

  // Return the concatenated String of SSML
  return ssml;
}
```

### <span class="notranslate">Python</span>

To learn how to install and use the client library for Cloud TTS, see <a href="/text-to-speech/docs/libraries" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py" data-track-type="clientLibrariesReference" data-track-name="python" data-track-metadata-position="text_to_speech_ssml_addresses_ssml">Cloud TTS client libraries</a>. For more information, see the <a href="/python/docs/reference/texttospeech/latest" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py" data-track-type="clientLibrariesUsage" data-track-name="clientLibrariesLink" data-track-metadata-lang="python">Cloud TTS <span class="notranslate">Python</span> API reference documentation</a>.

To authenticate to Cloud TTS, set up Application Default Credentials. For more information, see <a href="/docs/authentication/set-up-adc-local-dev-environment" data-track-metadata-region-tag="tts_ssml_address_ssml" data-track-metadata-snippet-file-url="https://github.com/GoogleCloudPlatform/python-docs-samples/blob/HEAD/texttospeech/snippets/ssml_addresses.py">Set up authentication for a local development environment</a>.

``` devsite-click-to-copy
def text_to_ssml(inputfile: str) -> str:
    """
    Generates SSML text from plaintext.
    Given an input filename, this function converts the contents of the text
    file into a string of formatted SSML text. This function formats the SSML
    string so that, when synthesized, the synthetic audio will pause for two
    seconds between each line of the text file. This function also handles
    special text characters which might interfere with SSML commands.

    Args:
        inputfile: name of plaintext file
    Returns: SSML text based on plaintext input
    """

    # Parses lines of input file
    with open(inputfile) as f:
        raw_lines = f.read()

    # Replace special characters with HTML Ampersand Character Codes
    # These Codes prevent the API from confusing text with
    # SSML commands
    # For example, '<' --> '&lt;' and '&' --> '&amp;'

    escaped_lines = html.escape(raw_lines)

    # Convert plaintext to SSML
    # Wait two seconds between each address
    ssml = "<speak>{}</speak>".format(
        escaped_lines.replace("\n", '\n<break time="2s"/>')
    )

    # Return the concatenated string of ssml script
    return ssml
```

## Put it all together

This program uses the following input.

``` lang-py

123 Street Ln, Small Town, IL 12345 USA
1 Jenny St & Number St, Tutone City, CA 86753
1 Piazza del Fibonacci, 12358 Pisa, Italy
```

Passing the above text to `text_to_ssml()` generates the following tagged text.

``` lang-py

<speak>123 Street Ln, Small Town, IL 12345 USA
<break time="2s"/>1 Jenny St &amp; Number St, Tutone City, CA 86753
<break time="2s"/>1 Piazza del Fibonacci, 12358 Pisa, Italy
<break time="2s"/></speak>
```

### Run the code

To generate an audio file of synthetic speech, run the following code from the command line.

### Java

#### Linux or MacOS

From the `java-docs-samples/texttospeech/cloud-client/` directory, execute the following command on the command line.

``` devsite-click-to-copy
$ mvn clean package
```

#### Windows

From the `java-docs-samples/texttospeech/cloud-client/` directory, execute the following command on the command line.

``` devsite-click-to-copy
$ mvn clean package
```

### Node.js

#### Linux or MacOS

In the `hybridGlossaries.js` file, uncomment the `TODO (developer)` commented-out variables.

In the following command, replace `projectId` with your Google Cloud project ID. From the `nodejs-docs-samples/texttospeech` directory, execute the following command on the command line.

``` devsite-click-to-copy
$ node ssmlAddresses.js projectId
```

#### Windows

In the `hybridGlossaries.js` file, uncomment the `TODO (developer)` commented-out variables.

In the following command, replace `projectId` with your Google Cloud project ID. From the `nodejs-docs-samples/texttospeech` directory, execute the following command on the command line.

``` devsite-click-to-copy
$env: C:/Node.js/node.exe C: ssmlAddresses.js projectId
```

### Python

#### Linux or MacOS

From the `python-docs-samples/texttospeech/snippets` directory, execute the following command on the command line.

``` devsite-click-to-copy
$ python ssml_addresses.py
```

#### Windows

From the `python-docs-samples/texttospeech/snippets` directory, execute the following command on the command line.

``` devsite-click-to-copy
$env: C:/Python3/python.exe C: ssml_addresses.py
```

### Check your output

This program outputs an `example.mp3` audio file of synthetic speech.

### Java

Navigate into `java-docs-samples/texttospeech/cloud-client/resources/` directory.  
  
Check the `resources` directory for an `example.mp3` file.

### Node.js

Navigate into `nodejs-docs-samples/texttospeech/resources/` directory.  
  
Check the `resources` directory for an `example.mp3` file.

### Python

Navigate into `python-docs-samples/texttospeech/snippets/resources`.  
  
Check the `resources` directory for an `example.mp3` file.

Listen to the following audio clip to check that your `example.mp3` file sounds the same.

Your browser does not support the audio element.  

## Troubleshoot

- Forgetting to [set the `GOOGLE_APPLICATION_CREDENTIALS`](#setting_up_your_google_cloud_platform_credentials) environment variable on the command line generates the error message:

  ```
  The Application Default Credentials are not available.
  ```

- Passing `text_to_ssml()` the name of a non-existent file generates the error message:

  ```
  IOError: [Errno 2] No such file or directory
  ```

- Passing `ssml_to_audio()` a `ssml_text` parameter which contains `None` generates the error message:

  ```
  InvalidArgument: 400 Invalid input type. Type has to be text or SSML
  ```

- Make sure that you are running the code from the [correct directory](#running_the_code).

## What's next

- Explore other [SSML tags](/text-to-speech/docs/ssml).
- Learn how to [use SSML with Translation and Vision](/translate/docs/hybrid-glossaries-tutorial)

## Clean up

To avoid incurring charges to your Google Cloud Platform account for the resources used in this tutorial, use the [Google Cloud console](https://console.cloud.google.com/) to delete your project if you do not need it.

### Delete your project

1.  In the [Google Cloud console](https://console.cloud.google.com/), go to the Projects page.
2.  In the project list, select the project you want to delete and click **Delete**.
3.  In the dialog box, type the project ID, and click **Shut down** to delete the project.

Send feedback

Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-06-11 UTC.

Need to tell us more?

\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Hard to understand","hardToUnderstand","thumb-down"\],\["Incorrect information or sample code","incorrectInformationOrSampleCode","thumb-down"\],\["Missing the information/samples I need","missingTheInformationSamplesINeed","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-06-11 UTC."\],\[\],\[\]\]

- ### Products and pricing

  - <a href="//cloud.google.com/products/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 1)" data-track-type="footer link" data-track-metadata-module="footer" data-track-name="see all products" data-track-metadata-child_headline="products and pricing" data-track-metadata-eventdetail="cloud.google.com/products/" data-track-metadata-position="footer">See all products</a>
  - <a href="//cloud.google.com/pricing/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 2)" data-track-type="footer link" data-track-metadata-module="footer" data-track-name="google cloud pricing" data-track-metadata-child_headline="products and pricing" data-track-metadata-eventdetail="cloud.google.com/pricing/" data-track-metadata-position="footer">Google Cloud pricing</a>
  - <a href="//cloud.google.com/marketplace/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 3)" data-track-metadata-child_headline="resources" data-track-name="google cloud marketplace" data-track-metadata-module="footer" data-track-type="footer link" data-track-metadata-position="footer" data-track-metadata-eventdetail="cloud.google.com/marketplace/">Google Cloud Marketplace</a>
  - <a href="//cloud.google.com/contact/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 4)" data-track-metadata-eventdetail="cloud.google.com/contact/" data-track-metadata-position="footer" data-track-metadata-module="footer" data-track-type="footer link" data-track-metadata-child_headline="engage" data-track-name="contact sales">Contact sales</a>

- ### Support

  - <a href="//discuss.google.dev/c/google-cloud/14/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 1)" data-track-metadata-module="footer" data-track-type="footer link" data-track-metadata-child_headline="engage" data-track-name="google cloud community" data-track-metadata-eventdetail="www.googlecloudcommunity.com" data-track-metadata-position="footer" target="_blank" rel="noopener">Community forums</a>
  - <a href="//cloud.google.com/support-hub/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 2)" data-track-name="support" data-track-metadata-child_headline="resources" data-track-type="footer link" data-track-metadata-module="footer" data-track-metadata-position="footer" data-track-metadata-eventdetail="cloud.google.com/support-hub/">Support</a>
  - <a href="//docs.cloud.google.com/release-notes" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 3)" data-track-metadata-module="footer" data-track-type="footer link" data-track-metadata-child_headline="resources" data-track-name="release notes" data-track-metadata-eventdetail="cloud.google.com/release-notes/" data-track-metadata-position="footer">Release Notes</a>
  - <a href="//status.cloud.google.com" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 4)" data-track-metadata-position="footer" target="_blank" data-track-metadata-eventdetail="status.cloud.google.com" data-track-name="system status" data-track-metadata-child_headline="resources" data-track-type="footer link" data-track-metadata-module="footer">System status</a>

- ### Resources

  - <a href="//github.com/googlecloudPlatform/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 1)" data-track-type="footer link" data-track-metadata-module="footer" data-track-name="github" data-track-metadata-child_headline="resources" data-track-metadata-eventdetail="github.com/googlecloudPlatform/" data-track-metadata-position="footer">GitHub</a>
  - <a href="/docs/get-started/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 2)" data-track-type="footer link" data-track-metadata-module="footer" data-track-name="google cloud quickstarts" data-track-metadata-child_headline="resources" data-track-metadata-eventdetail="cloud.google.com/docs/get-started/" data-track-metadata-position="footer">Getting Started with Google Cloud</a>
  - <a href="/docs/samples" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 3)" data-track-metadata-child_headline="resources" data-track-name="code samples" data-track-metadata-module="footer" data-track-type="footer link" data-track-metadata-position="footer" data-track-metadata-eventdetail="cloud.google.com/docs/samples">Code samples</a>
  - <a href="/architecture/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 4)" data-track-metadata-eventdetail="cloud.google.com/architecture/" data-track-metadata-position="footer" data-track-metadata-module="footer" data-track-type="footer link" data-track-metadata-child_headline="resources" data-track-name="cloud architecture center">Cloud Architecture Center</a>
  - <a href="//cloud.google.com/learn/training/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 5)" data-track-metadata-child_headline="resources" data-track-name="training" data-track-metadata-module="footer" data-track-type="footer link" data-track-metadata-position="footer" data-track-metadata-eventdetail="cloud.google.com/learn/training/">Training and Certification</a>

- ### Engage

  - <a href="//cloud.google.com/blog/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 1)" data-track-metadata-position="footer" data-track-metadata-eventdetail="cloud.google.com/blog/" data-track-name="blog" data-track-metadata-child_headline="engage" data-track-type="footer link" data-track-metadata-module="footer">Blog</a>
  - <a href="//cloud.google.com/events/" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 2)" data-track-metadata-eventdetail="cloud.google.com/events/" data-track-metadata-position="footer" data-track-type="footer link" data-track-metadata-module="footer" data-track-name="events" data-track-metadata-child_headline="engage">Events</a>
  - <a href="//x.com/googlecloud" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 3)" data-track-metadata-child_headline="engage" data-track-name="follow on x" data-track-metadata-module="footer" data-track-type="footer link" target="_blank" rel="noopener" data-track-metadata-position="footer" data-track-metadata-eventdetail="x.com/googlecloud">X (Twitter)</a>
  - <a href="//www.youtube.com/googlecloud" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 4)" target="_blank" data-track-metadata-position="footer" rel="noopener" data-track-metadata-eventdetail="www.youtube.com/googlecloud" data-track-metadata-child_headline="engage" data-track-name="google cloud on youtube" data-track-metadata-module="footer" data-track-type="footer link">Google Cloud on YouTube</a>
  - <a href="//www.youtube.com/googlecloudplatform" class="devsite-footer-linkbox-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Link (index 5)" data-track-metadata-eventdetail="www.youtube.com/googlecloudplatform" target="_blank" rel="noopener" data-track-metadata-position="footer" data-track-metadata-module="footer" data-track-type="footer link" data-track-metadata-child_headline="engage" data-track-name="google cloud tech on youtube">Google Cloud Tech on YouTube</a>

- <a href="//about.google/" class="devsite-footer-utility-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer About Google link" data-track-name="about google" data-track-type="footer link" data-track-metadata-module="utility footer" data-track-metadata-position="footer" target="_blank" data-track-metadata-eventdetail="//about.google/">About Google</a>
- <a href="//policies.google.com/privacy" class="devsite-footer-utility-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Privacy link" data-track-metadata-module="utility footer" data-track-type="footer link" data-track-name="privacy" data-track-metadata-eventdetail="//policies.google.com/privacy" target="_blank" data-track-metadata-position="footer">Privacy</a>
- <a href="//policies.google.com/terms?hl=en" class="devsite-footer-utility-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Site terms link" data-track-name="site terms" data-track-type="footer link" data-track-metadata-module="utility footer" target="_blank" data-track-metadata-position="footer" data-track-metadata-eventdetail="//www.google.com/intl/en/policies/terms/regional.html">Site terms</a>
- <a href="//cloud.google.com/product-terms" class="devsite-footer-utility-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Google Cloud terms link" data-track-metadata-module="utility footer" data-track-type="footer link" data-track-name="google cloud terms" data-track-metadata-eventdetail="//cloud.google.com/product-terms" data-track-metadata-position="footer">Google Cloud terms</a>
- <a href="#" class="devsite-footer-utility-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Manage cookies link" aria-hidden="true" data-track-metadata-eventdetail="#" data-track-metadata-position="footer" data-track-metadata-module="utility footer" data-track-type="footer link" data-track-name="Manage cookies">Manage cookies</a>
- <a href="//cloud.google.com/sustainability" class="devsite-footer-utility-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Our third decade of climate action: join us link" data-track-metadata-position="footer" data-track-metadata-eventdetail="/sustainability/" data-track-name="Our third decade of climate action: join us" data-track-metadata-module="utility footer" data-track-type="footer link">Our third decade of climate action: join us</a>
- <span class="devsite-footer-utility-description">Sign up for the Google Cloud newsletter</span> <a href="//cloud.google.com/newsletter/" class="devsite-footer-utility-link gc-analytics-event" data-category="Site-Wide Custom Events" data-label="Footer Subscribe link" data-track-metadata-eventdetail="/newsletter/" data-track-metadata-position="footer" data-track-type="footer link" data-track-metadata-module="utility footer" data-track-name="subscribe">Subscribe</a>

<!-- -->

- <span role="menuitem" lang="en">English</span>
- <span role="menuitem" lang="de">Deutsch</span>
- <span role="menuitem" lang="es">Español</span>
- <span role="menuitem" lang="es_419">Español – América Latina</span>
- <span role="menuitem" lang="fr">Français</span>
- <span role="menuitem" lang="id">Indonesia</span>
- <span role="menuitem" lang="it">Italiano</span>
- <span role="menuitem" lang="pt">Português</span>
- <span role="menuitem" lang="pt_br">Português – Brasil</span>
- <span role="menuitem" lang="he">עברית</span>
- <span role="menuitem" lang="zh_cn">中文 – 简体</span>
- <span role="menuitem" lang="zh_tw">中文 – 繁體</span>
- <span role="menuitem" lang="ja">日本語</span>
- <span role="menuitem" lang="ko">한국어</span>
