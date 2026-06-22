# 2026-05-28 — Media handling bug-fix patch (amends 2026-05-25)

**Status:** LOCKED. All files `node --check` clean. No schema changes (just code + docs). Not yet deployed (Roma deploys).
**Amends:** `decisions/2026-05-25-media-handling-full-scope.md`
**Trigger:** Three production bugs surfaced on the first JSON upload after the 2026-05-25 deploy.

---

## Production bugs from first JSON upload (verbatim from logs)

User: `62047005` uploaded `conversations-000.json`, 3,647,338 bytes, mime `application/binary` (Telegram's normalisation for this client's binary file).

### Bug 1 — wrong `media_type` segment in R2 key and D1 row

```
R2 stored: 62047005/application/1780002920749_a5tuy1.bin (3647338 bytes)
```

Cause: `mediaType = media.mimeHint.split('/')[0]` returns `"application"` for any `application/*` mime. The R2 key convention plus `media_refs.media_type` expects one of `{document, image, voice, video, audio}`. Affects ALL `application/*` mimes (JSON, PDF, binary, etc) — only worked accidentally for image/audio/video which happen to share a prefix word with the bucket name.

### Bug 2 — D1 SQLITE_TOOBIG on `extracted_text`

```
D1_ERROR: string or blob too big: SQLITE_TOOBIG
```

Cause: I asserted in the 2026-05-25 doc and `ROUTING_RULES.md` that "SQLite TEXT can hold up to 1 GB per cell" with no upper bound. **This was wrong and unverified.** Cloudflare D1 has a hard per-row limit of 2,000,000 bytes (verified 2026-05-28 from `developers.cloudflare.com/d1/platform/limits/`: *"Maximum string, BLOB or table row size: 2,000,000 bytes (2 MB)"*). The 3.6 MB JSON's decoded text exceeded the row limit and the INSERT failed.

### Bug 3 — Gemini API rejected `application/binary`

```
400 Unsupported MIME type: application/binary
```

Cause: line-364 widening accepted the file by extension (`*.json` → `extOk = true`), but only re-normalised the mime to `text/plain` when the docMime was exactly `application/octet-stream`. Telegram had set it to `application/binary` instead, which fell through unchanged. The handler then pushed `inlineData: { mimeType: 'application/binary', ... }` straight to Gemini, which rejected it.

**Also:** my widening accepted `application/json` at the door but never verified Gemini accepts it. **It doesn't.** Verified 2026-05-28 from `ai.google.dev/api/caching`, Gemini's supported MIME list does NOT include `application/json` — JSON files must be sent as `text/plain`. So the `application/json` path would have failed too on a second user even without Bug 3.

---

## Verified platform limits (cross-checked from official docs 2026-05-28)

I fetched these live before designing the fix:

| Limit | Value | Source |
|---|---|---|
| Cloudflare D1 max row size | **2,000,000 bytes (2 MB)** | `developers.cloudflare.com/d1/platform/limits/` |
| Telegram Bot API max file download (hosted) | **20 MB** | `core.telegram.org/bots/api#getfile` |
| Telegram Bot API upload (local server only) | 2000 MB | same |
| Cloudflare R2 max object size | 5 TiB | `developers.cloudflare.com/r2/platform/limits/` |
| R2 max single-part upload | 4.995 GiB | same |
| R2 object metadata size | 8,192 bytes | same |
| Gemini PDF limit | 50 MB or 1000 pages | `ai.google.dev/gemini-api/docs/document-processing` |
| Gemini Files API URI lifetime | 48 hours | `ai.google.dev/gemini-api/docs/files` |
| Gemini supported MIME list (canonical) | see below | `ai.google.dev/api/caching` |

**Gemini canonical supported MIME list (from /api/caching):**
- Documents: `application/pdf`, `application/rtf`, `text/csv`, `text/markdown`, `text/plain`, `text/rtf`, `text/xml`
- Source code: `application/x-javascript`, `application/x-python-code`, `application/x-typescript`, `application/x-ipynb+json`, `text/x-python`, `text/x-typescript`
- Images: `image/avif`, `image/gif`, `image/heic`, `image/heif`, `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Audio: `audio/aac`, `audio/aiff`, `audio/flac`, `audio/mp3`, `audio/mpeg`, `audio/ogg`, `audio/wav`
- Video: `video/3gpp`, `video/avi`, `video/mp4`, `video/mpeg`, `video/mpg`, `video/quicktime`, `video/webm`, `video/wmv`, `video/x-flv`

**Notably NOT in the list:** `application/json`, `application/octet-stream`, `application/binary`, generic `application/xml`, `text/html`. JSON files MUST be sent as `text/plain` (or similar text-family MIME).

---

## Decisions taken (with rationale)

### Bug 1 fix — `toMediaType(mime)` helper

Single source of truth for the `media_type` bucket. Maps:
- `image/*` → `image`
- `video/*` → `video`
- `audio/*` → `audio` (or `voice` when explicitly set by caller for Telegram voice messages)
- everything else (including `application/*`, `text/*`, unknown) → `document`

Applied at the one site in `handlers.js`. Both R2 key segment and `media_refs.media_type` now agree.

### Bug 2 fix — cap `extracted_text` at 1.5 MB UTF-8 bytes

Chose **Option (a)** from the design tradeoff: cap-and-mark, not chunked Vectorize (option b) or extracted_text-in-R2 (option c). Rationale:

- Smallest patch. One layered defence in `handlers.js` plus a belt-and-braces re-cap in `mediaRefs.insertRef`. No new schema, no new R2 paths, no new embedding patterns.
- R2 holds the lossless original. The user never loses access to the full file.
- When `extracted_text` is truncated, the row's `summary` column gets a system note like `"Inline text truncated to fit D1 row limit; full file (N bytes) stored in R2 at <key>"`. Recall code can detect this and (when relevant) read the R2 object for the lossless bytes.
- Cap value: **1,572,864 bytes (1.5 MB)**. Leaves ~430 KB headroom for the other ~17 columns (filename, mime, R2 key, Files API URI, summary, vector_id, timestamps) plus SQLite overhead. Conservative but not wasteful.
- Cap is measured by UTF-8 byte length (via `TextEncoder`), not JS string `.length`, because D1 limits bytes, not characters. A character boundary that falls mid-truncation is tolerated by `TextDecoder({ fatal: false })`.

**Future work (option b — chunked Vectorize embedding):** Deferred. Files larger than 1.5 MB currently have no embedding of their body content — only filename, type, and summary go into Vectorize. For the typical conversation, this is fine. If recall on large-file content turns out to matter in practice, add a background job that streams the R2 object in chunks and embeds each chunk against the same `refId`. The data is all there; it's purely a future enhancement.

### Bug 3 fix — `toGeminiMime(mime, fileName)` helper

Normalises the wire MIME to one Gemini accepts:
1. If the original mime is already in Gemini's supported list, pass through.
2. Else, look up the file extension (`.json` → `text/plain`, `.py` → `text/x-python`, `.js` → `application/x-javascript`, etc).
3. Else if mime starts with `text/`, degrade to `text/plain` (covers `text/html` etc).
4. Else if mime is `application/octet-stream`, `application/binary`, or empty — return `null`. Caller skips pushing to Gemini, file stays in R2 + media_refs.
5. Else return `null` for unknown application/* types.

When `toGeminiMime` returns `null`, the user gets a polite message acknowledging the upload + explaining we couldn't read it. R2 + media_refs still get written so the user can refer to the file later (and convert/rename if they want it read).

The **original** mime is preserved in `media_refs.mime_type` and R2 metadata. Only the wire-format mime is normalised. This is the right discipline — we record what the user sent, but we send Gemini what Gemini accepts.

---

## Files touched

**New:**
- `src/lib/mimeMap.js` — `toMediaType`, `toGeminiMime`, `D1_TEXT_INLINE_CAP`, `isTextShapedForExtraction` helpers. Includes the verified Gemini supported MIME list as a `Set` and the extension→Gemini-mime mapping.

**Edited:**
- `src/bot/handlers.js`:
  - Import `toMediaType, toGeminiMime, D1_TEXT_INLINE_CAP` from `../lib/mimeMap`.
  - Around the `shouldUseFilesAPI` decision: normalise mime via `toGeminiMime` first. When `null`, send a polite "saved but can't read" reply and skip pushing to userParts.
  - Replace `mediaType = media.mimeHint.split('/')[0]` with `mediaType = toMediaType(media.mimeHint)`.
  - Cap `extractedText` at 1.5 MB UTF-8 bytes before passing to `insertRef`. Set `summary` to a system note when truncated.

- `src/services/mediaRefs.js`:
  - Defence-in-depth: `insertRef` re-applies the 1.5 MB cap. Logged as `media_refs_insert_text_truncated_defensive`. Even if a future caller forgets to cap, D1 will never reject the INSERT due to size.

- `schema.sql`, `src/migration_006_media_refs.sql`:
  - Comment updated: `extracted_text` is documented as a capped UTF-8 excerpt, lossless original in R2. No actual schema change — D1 columns are TEXT; the cap is an application-layer rule, not a DB constraint.

- `ROUTING_RULES.md`:
  - "Media Handling" section corrected: D1 column described as "capped at 1.5 MB to fit D1's 2 MB row limit".
  - New subsections: "Verified platform limits" table and "Gemini-accepted MIME types" canonical list.
  - Receive flow updated to mention `toGeminiMime` and the truncation flow.
  - Change log entry added.

- `decisions/2026-05-25-media-handling-full-scope.md`:
  - Inline schema comment corrected — false "1 GB per cell" claim replaced with the verified 2 MB row limit.

---

## Migration applied

None. No schema change. The 1.5 MB cap is an application-layer enforcement.

---

## Pre-deploy testing checklist

1. `npx wrangler deploy --minify`.
2. Upload the same JSON file that triggered the bug. Watch logs for:
   - `media_refs_inserted` with `hasExtractedText: true` (or `media_extracted_text_truncated` if it's still big)
   - `📎 Vectorize (v2) indexed media_ref:` line
   - Successful AI reply that references the JSON content
3. Upload a Python file. Verify Gemini receives it as `text/x-python`.
4. Upload a TypeScript file. Verify Gemini receives it as `application/x-typescript`.
5. Upload something weird (`.bin` or a random binary). Verify the polite "can't read it" reply + log `media_gemini_unsupported_mime`.
6. Upload >20 MB file. Verify oversized rejection (existing guard).
7. Send a follow-up question referencing the JSON file. Verify the RECENT FILES block in `prompt_sizes` log includes the file.
8. Run `/forget`. Verify the cascade still works.

---

## Honesty section

What I got wrong in the 2026-05-25 decision doc and didn't catch until the production bug:

1. **"1 GB per cell" was an unverified assertion.** I knew SQLite-the-engine supports up to 1 GB per cell. I did not check whether Cloudflare D1 narrows that. It does (2 MB). I should have verified before writing the architecture doc.

2. **Gemini's supported MIME list was assumed, not checked.** I widened the intake gate to accept `application/json` and structured-text MIMEs, but never checked whether Gemini itself accepts those MIMEs at the API level. It doesn't accept `application/json` directly.

3. **`mime.split('/')[0]` was carried over from existing code** (line 1761 pre-dated my changes). Reading the code wasn't enough — I should have asked "would this break for `application/json`?" given that the rest of my widening was specifically *about* `application/json`. The answer would have been obvious.

What I did right this time before fixing:

- Fetched all three providers' official docs (Cloudflare D1, Cloudflare R2, Telegram Bot API, four separate Gemini doc pages) **before** writing any code. The verified-limits table at the top is the basis of every decision in this patch.
- Surfaced the design tradeoff (option a/b/c for Bug 2) honestly and let Roma choose, rather than picking the "richest" option (b) which would have been more code for an uncertain benefit.
- Documented the original-mime / wire-mime discipline explicitly so this confusion doesn't recur.

What's still deferred:

- Chunked Vectorize embedding for files >1.5 MB (option b). The current behaviour is: filename + summary + first ~430KB excerpt go into the embedding. For most files this is plenty; for huge JSON dumps it's a real limitation. Add later if recall on large-file content proves to matter.
- AI-generated summary on upload (lazy field still empty). Could use HEAVY_BG_TIERS gemini-3.5-flash; not wired.
- The user whose upload triggered these bugs is still owed a working response. Once deployed, Roma may want to nudge them with "I had a hiccup reading your earlier JSON — try sending it again?" Optional, UX call.
