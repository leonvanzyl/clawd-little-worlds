// Opt-in smoke test: makes one paid Jev call per example, without writing to GitHub.
import { classifyIssue } from '../.github/scripts/jev-triage.cjs';

if (!process.env.TYPESAFE_API_KEY) throw new Error('Set TYPESAFE_API_KEY before running the live smoke test.');

const examples = [
  { expected: 'documentation', agent: 'agent:claude-haiku', title: 'README omits the build step before starting the studio', body: 'Please update the setup instructions to explain that npm run build must run before npm start.' },
  { expected: 'bug', agent: 'agent:codex', title: 'Band stage crashes when I click the drum kit', body: 'In the current desktop Chrome release, open the band stage and click the snare. The scene freezes and the console reports a TypeError. Expected: a drum sound and continued animation.' },
  { expected: 'enhancement', agent: 'agent:codex', title: 'Add an underwater world', body: 'Please add a new underwater setting with fish swimming around Clawd. There is currently no underwater world.' },
  { expected: 'needs-triage', agent: 'needs-agent-triage', title: 'Help', body: 'It does not work. Please fix it.' },
  { expected: 'needs-triage', agent: 'needs-agent-triage', title: 'What is your favourite programming language?', body: 'Just curious what everyone likes using.' },
  { expected: 'enhancement', agent: 'agent:claude', title: 'Add support for both light and dark modes', body: 'Add support for both light and dark modes' },
  { expected: 'enhancement', agent: 'agent:codex', title: 'Add another expression - dazed and confused', body: 'Add another expression - dazed and confused' },
  { expected: 'enhancement', agent: 'agent:claude', title: 'Add project persistence in PostgreSQL', body: 'Design the schema, migrations and backend API for saved projects, with transactions and authorization. This is server and database work only.' },
  { expected: 'enhancement', agent: 'agent:claude', title: 'Deploy the studio backend to the cloud', body: 'Set up infrastructure, containers, CI/CD and rollback for the web server. No game, geometry or animation changes are needed.' },
  { expected: 'documentation', agent: 'agent:claude-haiku', title: 'Fix a typo in the Blender documentation', body: 'In blender/README.md replace "animaton" with "animation". This is a text correction only; do not edit any models or animation.' },
  { expected: 'enhancement', agent: 'agent:codex', title: 'Generate a pirate backdrop image', body: 'Generate a new painted image of a pirate cove to use as a background asset.' },
  { expected: 'enhancement', agent: 'agent:codex', title: 'Add a 2D platform game', body: 'Design the sprite layout, jumping mechanics, platforms and collision behavior for a new 2D game mode.' },
  { expected: 'enhancement', agent: 'agent:codex', title: 'Animate a submarine and save its position', body: 'Build a Blender submarine rig and 3D animation, position it in the world, and implement a complex backend persistence API for it. Both animation and backend changes are required in this issue.' },
  { expected: 'enhancement', agent: 'agent:claude', title: 'Add a project settings form', body: 'Implement an accessible web form with validation, state management and API integration for project settings. This is ordinary frontend application development, not changes to the 3D world.' },
  { agent: 'agent:claude-haiku', title: 'Change the button copy', body: 'Replace the existing button text "New website" with "Create website". No layout, logic, styling or behavior changes.' },
  { expected: 'bug', agent: 'agent:codex', title: 'Move the mug away from the hand', body: 'The mug mesh intersects the hand bone. Adjust the 3D attachment offset so the hand and mug no longer intersect. This is a small spatial placement fix.' },
  { agent: 'agent:codex', title: 'Use the browser UI to set up the demo', body: 'Use computer-use controls to open the browser, interact with the settings UI and configure a saved demo scene. This task requires direct browser interaction, not writing application code.' },
];

let passed = 0;
for (const [index, example] of examples.entries()) {
  const result = await classifyIssue(example, { apiKey: process.env.TYPESAFE_API_KEY });
  // Copy-only and direct-computer-use tasks can legitimately cross category boundaries;
  // those examples check routing only, leaving the existing category policy unchanged.
  const matches = (!example.expected || result.label === example.expected) && result.agent?.label === example.agent;
  passed += Number(matches);
  console.log(JSON.stringify({ example: index + 1, expected: example.expected, actual: result.label, confidence: result.confidence, expectedAgent: example.agent, actualAgent: result.agent?.label, agentConfidence: result.agent?.confidence, passed: matches }));
}
console.log(`${passed}/${examples.length} live examples matched their expected labels.`);
if (passed !== examples.length) process.exitCode = 1;
