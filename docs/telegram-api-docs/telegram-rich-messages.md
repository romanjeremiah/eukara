# Telegram Bot API – Rich Messages

> Source: https://core.telegram.org/bots/api#rich-messages
> The following methods and objects allow your bot to handle and send rich messages.

---

## Rich Message Formatting Options

Rich messages support advanced structured formatting options like headings, lists, tables, media, block quotations, collapsible blocks, footnotes, and formulas. Telegram clients will render them accordingly. You can specify rich message content using Markdown-style or HTML-style formatting.

Plain URLs, e-mail addresses, username mentions, hashtags, cashtags, bot commands, phone numbers, and bank card numbers are detected automatically. To disable automatic entity detection, pass `True` in the `skip_entity_detection` field.

### Rich Message Limits

- Up to **32768 UTF-8 characters** in the rich message text, including custom emoji alternative text and formula source.
- Up to **500 blocks**, including nested blocks, list items, ordered list items, table rows, quotation blocks, and details blocks.
- Up to **16 levels** of nested formatting and blocks.
- Up to **50 media attachments** in total, including photos, videos, and audio files.
- Up to **20 columns** in a table.

### Rich Markdown Style

To use this mode, pass rich message content in the `markdown` field. Use the following syntax in your message:

```
**bold text**
__bold text__
*italic text*
_italic text_
~~strikethrough text~~
`inline fixed-width code`
==marked text==
||spoiler||

[inline URL](https://t.me/)
[inline e-mail](mailto:user@example.com)
[inline phone number](tel:+123456789)
[inline mention of a user](tg://user?id=123456789)
![👍](tg://emoji?id=5368324170671202286)
![22:45 tomorrow](tg://time?unix=1647531900&format=wDT)
$x^2 + y^2$
\#hashtag $USD +12345678901, card: 4242 4242 4242 4242, https://t.me t.me a@t.me /command @username
all the text above was on the same line

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Paragraph text

```python
  print('pre-formatted fixed-width code block written in the Python programming language')
```

---

- unordered list item
* unordered list item
+ unordered list item

1. ordered list item
2. ordered list item

- [ ] task list item
- [x] completed task list item

>Block quotation started
>
>Block quotation continued on the next line
>Block quotation continued on the same line
>
>The last line of the block quotation

![](https://telegram.org/example/photo.jpg)
![](https://telegram.org/example/video.mp4)
![](https://telegram.org/example/audio.mp3)
![](https://telegram.org/example/audio.ogg)
![](https://telegram.org/example/animation.gif)

![](https://telegram.org/example/photo.jpg "Photo caption")
![](https://telegram.org/example/video.mp4 "Video caption")
![](https://telegram.org/example/audio.mp3 "Audio caption")
![](https://telegram.org/example/audio.ogg "Voice note caption")
![](https://telegram.org/example/animation.gif "Animation caption")

| Header 1 | Header 2 |
|:---------|:--------:|
| left     | center   |

Text with a reference[^id1] and another one[^id2].

[^id1]: Definition of the first footnote.
[^id2]: Definition of the second footnote.

$$E = mc^2$$

```math
E = mc^2
```
```

For formatting features that don't have Markdown syntax, use HTML tags (see Rich HTML Style below).

Additionally, you can use the following tag in `sendRichMessageDraft`:

```html
<tg-thinking>Thinking...</tg-thinking>
```

**Notes:**
- Rich Markdown is compatible with GitHub Flavored Markdown where possible and can contain arbitrary HTML.
- Media can be specified only as a separate block.
- Media blocks support only HTTP and HTTPS URLs.
- Media type is determined by the MIME type and the URL of the media.
- Table cells can contain only inline formatting.
- Formula source is treated as raw LaTeX.
- Markdown isn't parsed inside block HTML tags other than `<details>`, `<tg-collage>`, and `<tg-slideshow>`.

### Rich HTML Style

To use this mode, pass rich message content in the `html` field. The following tags are currently supported:

```html
<a name="chapter-0"></a>
<b>bold text</b>, <strong>bold text</strong>
<i>italic text</i>, <em>italic text</em>
<u>underlined text</u>, <ins>underlined text</ins>
<s>strikethrough text</s>, <strike>strikethrough text</strike>, <del>strikethrough text</del>
<code>inline fixed-width code</code>
<mark>marked text</mark>
<sub>subscript text</sub>
<sup>superscript text</sup>
<tg-spoiler>spoiler</tg-spoiler>

<a href="#note-1">Reference</a>
<a href="https://t.me/">inline URL</a>
<a href="mailto:user@example.com">inline e-mail</a>
<a href="tel:+123456789">inline phone number</a>
<a href="tg://user?id=123456789">inline mention of a user</a>
<a href="#chapter-1">in-document link</a>
<a name="chapter-1"></a>

<tg-reference name="note-1">Referenced text</tg-reference>
<tg-emoji emoji-id="5368324170671202286"></tg-emoji>
<img src="tg://emoji?id=5368324170671202286" alt=""/>
<tg-time unix="1647531900" format="wDT">22:45 tomorrow</tg-time>
<tg-math>x^2 + y^2</tg-math>

<u>underlined text</u>, <ins>underlined text</ins>
<sub>subscript text</sub>
<sup>superscript text</sup>
<a name="chapter-1"></a>
<aside>Pull quote<cite>The Author</cite></aside>
<details open><summary>Title</summary>Content</details>
<tg-map lat="41.9" long="12.5" zoom="14"/>
<tg-collage><img src="https://telegram.org/example/photo.jpg"/><figcaption>Caption<cite>The Author</cite></figcaption></tg-collage>
<tg-slideshow><img src="https://telegram.org/example/photo.jpg"/><video src="https://telegram.org/example/video.mp4"/><figcaption>Slideshow caption<cite>The Author</cite></figcaption></tg-slideshow>
```

Additionally, you can use the following tag in `sendRichMessageDraft`:

```html
<tg-thinking>Thinking...</tg-thinking>
```

**Notes:**
- Only the tags mentioned above are currently supported.
- All numerical HTML entities are supported.
- The API currently supports only the following named HTML entities: `&lt;`, `&gt;`, `&amp;`, `&quot;`, `&apos;`, `&nbsp;`, `&hellip;`, `&mdash;`, `&ndash;`, `&lsquo;`, `&rsquo;`, `&ldquo;`, `&rdquo;`.
- Use nested `<pre>` and `<code>` tags to define the programming language for a pre-formatted block.
- Links `mailto:...`, `tel:...`, and `tg://user?id=...` are rendered as e-mail links, phone links, and inline mentions respectively.
- An empty `<a name="..."></a>` on its own creates an anchor.
- Use `<tg-reference name="...">...</tg-reference>` to define referenced text.
- The body of a `<details>` tag can contain rich message content.
- Formula source is treated as raw LaTeX.

---

## Methods

### sendRichMessage

Use this method to send rich messages. If the message contains a block with a media element, then the bot must have the right to send the media to the chat. On success, the sent `Message` is returned.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| business_connection_id | String | Optional | Unique identifier of the business connection on behalf of which the message will be sent. |
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format @username |
| message_thread_id | Integer | Optional | Unique identifier for the target message thread (topic) of a forum |
| direct_messages_topic_id | Integer | Optional | Identifier of the direct messages topic to which the message will be sent |
| rich_message | InputRichMessage | Yes | The message to be sent |
| disable_notification | Boolean | Optional | Sends the message silently. Users will receive a notification with no sound. |
| protect_content | Boolean | Optional | Protects the contents of the sent message from forwarding and saving |
| allow_paid_broadcast | Boolean | Optional | Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. |
| message_effect_id | String | Optional | Unique identifier of the message effect to be added to the message; for private chats only |
| suggested_post_parameters | SuggestedPostParameters | Optional | A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. |
| reply_parameters | ReplyParameters | Optional | Description of the message to reply to |
| reply_markup | InlineKeyboardMarkup or ReplyKeyboardMarkup or ReplyKeyboardRemove or ForceReply | Optional | Additional interface options. |

### sendRichMessageDraft

Use this method to stream a partial rich message to a user while the message is being generated. Note that the streamed draft is ephemeral and acts as a temporary 30-second preview — once the output is finalized, you must call `sendRichMessage` with the complete message to persist it. Returns `True` on success.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chat_id | Integer | Yes | Unique identifier for the target private chat |
| message_thread_id | Integer | Optional | Unique identifier for the target message thread |
| draft_id | Integer | Yes | Unique identifier of the message draft; must be non-zero. Changes to drafts with the same identifier are animated. |
| rich_message | InputRichMessage | Yes | The partial message to be streamed |

---

## Types

### RichMessage

Rich formatted message.

| Field | Type | Description |
|-------|------|-------------|
| blocks | Array of RichBlock | Content of the message |
| is_rtl | Boolean | Optional. True, if the rich message must be shown right-to-left |

### InputRichMessage

Describes a rich message to be sent. Exactly one of the fields `html` or `markdown` must be used.

| Field | Type | Description |
|-------|------|-------------|
| html | String | Optional. Content of the rich message to send described using HTML formatting. |
| markdown | String | Optional. Content of the rich message to send described using Markdown formatting. |
| is_rtl | Boolean | Optional. Pass True if the rich message must be shown right-to-left |
| skip_entity_detection | Boolean | Optional. Pass True to skip automatic detection of entities |

### RichText

This object represents a rich formatted text. Currently, it can be either a String for plain text, an Array of RichText, or any of the following types:

RichTextBold, RichTextItalic, RichTextUnderline, RichTextStrikethrough, RichTextSpoiler, RichTextDateTime, RichTextTextMention, RichTextSubscript, RichTextSuperscript, RichTextMarked, RichTextCode, RichTextCustomEmoji, RichTextMathematicalExpression, RichTextUrl, RichTextEmailAddress, RichTextPhoneNumber, RichTextBankCardNumber, RichTextMention, RichTextHashtag, RichTextCashtag, RichTextBotCommand, RichTextAnchor, RichTextAnchorLink, RichTextReference, RichTextReferenceLink

### RichTextBold

A bold text.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "bold" |
| text | RichText | The text |

### RichTextItalic

An italicized text.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "italic" |
| text | RichText | The text |

### RichTextUnderline

An underlined text.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "underline" |
| text | RichText | The text |

### RichTextStrikethrough

A strikethrough text.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "strikethrough" |
| text | RichText | The text |

### RichTextSpoiler

A text covered by a spoiler.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "spoiler" |
| text | RichText | The text |

### RichTextDateTime

Formatted date and time.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "date_time" |
| text | RichText | The text |
| unix_time | Integer | The Unix time associated with the entity |
| date_time_format | String | The string that defines the formatting of the date and time. |

### RichTextTextMention

A mention of a Telegram user by their identifier.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "text_mention" |
| text | RichText | The text |
| user | User | The mentioned user |

### RichTextSubscript

A subscript text.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "subscript" |
| text | RichText | The text |

### RichTextSuperscript

A superscript text.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "superscript" |
| text | RichText | The text |

### RichTextMarked

A marked text.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "marked" |
| text | RichText | The text |

### RichTextCode

A monowidth text.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "code" |
| text | RichText | The text |

### RichTextCustomEmoji

A custom emoji.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "custom_emoji" |
| custom_emoji_id | String | Unique identifier of the custom emoji. Use getCustomEmojiStickers to get full information. |
| alternative_text | String | Alternative emoji for the custom emoji |

### RichTextMathematicalExpression

A mathematical expression.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "mathematical_expression" |
| expression | String | The expression in LaTeX format |

### RichTextUrl

A text with a link.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "url" |
| text | RichText | The text |
| url | String | URL of the link |

### RichTextEmailAddress

A text with an email address.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "email_address" |
| text | RichText | The text |
| email_address | String | The email address |

### RichTextPhoneNumber

A text with a phone number.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "phone_number" |
| text | RichText | The text |
| phone_number | String | The phone number |

### RichTextBankCardNumber

A text with a bank card number.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "bank_card_number" |
| text | RichText | The text |
| bank_card_number | String | The bank card number |

### RichTextMention

A mention by a username.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "mention" |
| text | RichText | The text |
| username | String | The username |

### RichTextHashtag

A hashtag.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "hashtag" |
| text | RichText | The text |
| hashtag | String | The hashtag |

### RichTextCashtag

A cashtag.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "cashtag" |
| text | RichText | The text |
| cashtag | String | The cashtag |

### RichTextBotCommand

A bot command.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "bot_command" |
| text | RichText | The text |
| bot_command | String | The bot command |

### RichTextAnchor

An anchor.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "anchor" |
| name | String | The name of the anchor |

### RichTextAnchorLink

A link to an anchor.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "anchor_link" |
| text | RichText | The link text |
| anchor_name | String | The name of the anchor. If the name is empty, then the link brings back to the top of the message. |

### RichTextReference

A reference.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "reference" |
| text | RichText | Text of the reference |
| name | String | The name of the reference |

### RichTextReferenceLink

A link to a reference.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the rich text, always "reference_link" |
| text | RichText | The link text |
| reference_name | String | The name of the reference |

### RichBlockCaption

Caption of a rich formatted block.

| Field | Type | Description |
|-------|------|-------------|
| text | RichText | Block caption |
| credit | RichText | Optional. Block credit which corresponds to the HTML tag `<cite>` |

### RichBlockTableCell

Cell in a table.

| Field | Type | Description |
|-------|------|-------------|
| text | RichText | Optional. Text in the cell. If omitted, then the cell is invisible. |
| is_header | True | Optional. True, if the cell is a header cell |
| colspan | Integer | Optional. The number of columns the cell spans if it is bigger than 1 |
| rowspan | Integer | Optional. The number of rows the cell spans if it is bigger than 1 |
| align | String | Horizontal cell content alignment. Currently, must be one of "left", "center", or "right". |
| valign | String | Vertical cell content alignment. Currently, must be one of "top", "middle", or "bottom". |

### RichBlockListItem

An item of a list.

| Field | Type | Description |
|-------|------|-------------|
| label | String | Label of the item |
| blocks | Array of RichBlock | The content of the item |
| has_checkbox | True | Optional. True, if the item has a checkbox |
| is_checked | True | Optional. True, if the item has a checked checkbox |
| value | Integer | Optional. For ordered lists, the numeric value of the item label |
| type | String | Optional. For ordered lists, the type of the item label; must be one of "a", "A", "i", "I", or "1" |

### RichBlock

This object represents a block in a rich formatted message. Currently, it can be any of the following types:

RichBlockParagraph, RichBlockSectionHeading, RichBlockPreformatted, RichBlockFooter, RichBlockDivider, RichBlockMathematicalExpression, RichBlockAnchor, RichBlockList, RichBlockBlockQuotation, RichBlockPullQuotation, RichBlockCollage, RichBlockSlideshow, RichBlockTable, RichBlockDetails, RichBlockMap, RichBlockAnimation, RichBlockAudio, RichBlockPhoto, RichBlockVideo, RichBlockVoiceNote, RichBlockThinking

### RichBlockParagraph

A text paragraph, corresponding to the HTML tag `<p>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "paragraph" |
| text | RichText | Text of the block |

### RichBlockSectionHeading

A section heading, corresponding to the HTML tags `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, or `<h6>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "heading" |
| text | RichText | Text of the block |
| size | Integer | Relative size of the text font; 1–6, 1 is the largest, 6 is the smallest |

### RichBlockPreformatted

A preformatted text block, corresponding to the nested HTML tags `<pre>` and `<code>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "pre" |
| text | RichText | Text of the block |
| language | String | Optional. The programming language of the text |

### RichBlockFooter

A footer, corresponding to the HTML tag `<footer>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "footer" |
| text | RichText | Text of the block |

### RichBlockDivider

A divider, corresponding to the HTML tag `<hr/>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "divider" |

### RichBlockMathematicalExpression

A block with a mathematical expression in LaTeX format, corresponding to the custom HTML tag `<tg-math-block>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "mathematical_expression" |
| expression | String | The mathematical expression in LaTeX format |

### RichBlockAnchor

A block with an anchor, corresponding to the HTML tag `<a>` with the attribute `name`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "anchor" |
| name | String | The name of the anchor |

### RichBlockList

A list of blocks, corresponding to the HTML tag `<ul>` or `<ol>` with multiple nested tags `<li>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "list" |
| items | Array of RichBlockListItem | Items of the list |

### RichBlockBlockQuotation

A block quotation, corresponding to the HTML tag `<blockquote>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "blockquote" |
| blocks | Array of RichBlock | Content of the block |
| credit | RichText | Optional. Credit of the block |

### RichBlockPullQuotation

A quotation with centered text, loosely corresponding to the HTML tag `<aside>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "pullquote" |
| text | RichText | Text of the block |
| credit | RichText | Optional. Credit of the block |

### RichBlockCollage

A collage, corresponding to the custom HTML tag `<tg-collage>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "collage" |
| blocks | Array of RichBlock | Elements of the collage |
| caption | RichBlockCaption | Optional. Caption of the block |

### RichBlockSlideshow

A slideshow, corresponding to the custom HTML tag `<tg-slideshow>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "slideshow" |
| blocks | Array of RichBlock | Elements of the slideshow |
| caption | RichBlockCaption | Optional. Caption of the block |

### RichBlockTable

A table, corresponding to the HTML tag `<table>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "table" |
| cells | Array of Array of RichBlockTableCell | Cells of the table |
| is_bordered | True | Optional. True, if the table has borders |
| is_striped | True | Optional. True, if the table is striped |
| caption | RichText | Optional. Caption of the table |

### RichBlockDetails

An expandable block for details disclosure, corresponding to the HTML tag `<details>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "details" |
| summary | RichText | Always shown summary of the block |
| blocks | Array of RichBlock | Content of the block |
| is_open | True | Optional. True, if the content of the block is visible by default |

### RichBlockMap

A block with a map, corresponding to the custom HTML tag `<tg-map>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "map" |
| location | Location | Location of the center of the map |
| zoom | Integer | Map zoom level; 13–20 |
| width | Integer | Expected width of the map |
| height | Integer | Expected height of the map |
| caption | RichBlockCaption | Optional. Caption of the block |

### RichBlockAnimation

A block with an animation, corresponding to the HTML tag `<video>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "animation" |
| animation | Animation | The animation |
| has_spoiler | True | Optional. True, if the media preview is covered by a spoiler animation |
| caption | RichBlockCaption | Optional. Caption of the block |

### RichBlockAudio

A block with a music file, corresponding to the HTML tag `<audio>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "audio" |
| audio | Audio | The audio |
| caption | RichBlockCaption | Optional. Caption of the block |

### RichBlockPhoto

A block with a photo, corresponding to the HTML tag `<img>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "photo" |
| photo | Array of PhotoSize | Available sizes of the photo |
| has_spoiler | True | Optional. True, if the media preview is covered by a spoiler animation |
| caption | RichBlockCaption | Optional. Caption of the block |

### RichBlockVideo

A block with a video, corresponding to the HTML tag `<video>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "video" |
| video | Video | The video |
| has_spoiler | True | Optional. True, if the media preview is covered by a spoiler animation |
| caption | RichBlockCaption | Optional. Caption of the block |

### RichBlockVoiceNote

A block with a voice note, corresponding to the HTML tag `<audio>`.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "voice_note" |
| voice_note | Voice | The voice note |
| caption | RichBlockCaption | Optional. Caption of the block |

### RichBlockThinking

A block with a "Thinking…" placeholder, corresponding to the custom HTML tag `<tg-thinking>`. The block may be used only in `sendRichMessageDraft`, therefore it can't be received in messages.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of the block, always "thinking" |
| text | RichText | Text of the block. |
