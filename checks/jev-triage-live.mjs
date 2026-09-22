// Opt-in smoke test: makes six paid Jev calls, without writing to GitHub.
import { classifyIssue } from '../.github/scripts/jev-triage.cjs';

if (!process.env.TYPESAFE_API_KEY) throw new Error('Set TYPESAFE_API_KEY before running the live smoke test.');

const examples = [
  { expected: 'documentation', title: 'README omits the build step before starting the studio', body: 'Please update the setup instructions to explain that npm run build must run before npm start.' },
  { expected: 'bug', title: 'Band stage crashes when I click the drum kit', body: 'In the current desktop Chrome release, open the band stage and click the snare. The scene freezes and the console reports a TypeError. Expected: a drum sound and continued animation.' },
  { expected: 'enhancement', title: 'Add an underwater world', body: 'Please add a new underwater setting with fish swimming around Clawd. There is currently no underwater world.' },
  { expected: 'needs-triage', title: 'Help', body: 'It does not work. Please fix it.' },
  { expected: 'needs-triage', title: 'What is your favourite programming language?', body: 'Just curious what everyone likes using.' },
  { expected: 'enhancement', title: 'Add support for both light and dark modes', body: 'Add support for both light and dark modes' },
];

let passed = 0;
for (const [index, example] of examples.entries()) {
  const result = await classifyIssue(example, { apiKey: process.env.TYPESAFE_API_KEY });
  const matches = result.label === example.expected;
  passed += Number(matches);
  console.log(JSON.stringify({ example: index + 1, expected: example.expected, actual: result.label, confidence: result.confidence, passed: matches }));
}
console.log(`${passed}/${examples.length} live examples matched their expected labels.`);
if (passed !== examples.length) process.exitCode = 1;
