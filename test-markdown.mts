import { normaliseMarkdown } from "./src/lib/formatting.ts";

const tests: [string, string][] = [
  ["### Header", "<b>Header</b>"],
  ["**bold text**", "<b>bold text</b>"],
  ["some *italic* word", "some <i>italic</i> word"],
  ["already <b>bold</b> text", "already <b>bold</b> text"],
  ["* bullet one\n* bullet two", "• bullet one\n• bullet two"],
  ["- bullet one\n- bullet two", "• bullet one\n• bullet two"],
  ["`inline code`", "<code>inline code</code>"],
  ["normal text", "normal text"],
  ["snake_case stays intact", "snake_case stays intact"],
  ["mix **bold** and *italic*", "mix <b>bold</b> and <i>italic</i>"],
  ["### The Mountain Hub\n*   **Hiking:** some text", "<b>The Mountain Hub</b>\n•   <b>Hiking:</b> some text"],
];

let pass = 0, fail = 0;
for (const [input, expected] of tests) {
  const got = normaliseMarkdown(input);
  const ok = got === expected;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}: input=${JSON.stringify(input)}`);
  if (!ok) {
    console.log(`   got:      ${JSON.stringify(got)}`);
    console.log(`   expected: ${JSON.stringify(expected)}`);
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
