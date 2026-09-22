# Clawd's little world

Open `dist/Clawd-Playground.html` in a current desktop browser for the offline playground. It includes Three.js, both 3D models, the world geometry, styles, and sound synthesis. WebGL hardware acceleration is required. No videos are used. The Claude Code mode connects to a local server as described below.

## Claude Code studio

Use Node.js 24.15 or newer and an installed [Claude Code CLI](https://code.claude.com/docs/en/setup). Sign in with `claude auth login` to use your Claude subscription. Then, from this project directory:

```sh
npm ci
npm run build
npm start
```

Open the address printed by the server (normally `http://127.0.0.1:8765`) and choose **Claude Code**. If that port is already occupied, set the `PORT` environment variable to another free port before starting. Describe a website, watch the actual local preview update as files change, then send follow-up changes. The preview is an interactive browser iframe, not a recording. New starts a separate website; generated files live in `projects/<project-id>/` and are excluded from Git.

Clawd sits large and centred over a website preview that fills the entire window. The compact prompt bar keeps the conversation folded by default; its chat button opens the formatted history. Questions and approvals open it automatically. The corner options menu contains Connection, New website, refresh and open controls. Explore website temporarily hides Clawd and the prompt so every part of the preview is available; Back to Clawd restores them.

The official Claude Agent SDK orchestrates the installed Claude Code executable with **Opus and high effort**, using your existing CLI subscription session. Connection offers an Anthropic API key fallback. Keys remain in server memory and the Claude child process environment; they are never stored in this project's files, browser storage, or Git. Use subscription clears the fallback key. Stop the local server to discard its in-memory key.

Clawd reacts to actual streamed events:

| Claude is doing | Clawd does |
| --- | --- |
| Thinking | Ponders with floating dots |
| Exploring files | Reads a little book |
| Researching the web | Holds a magnifying glass |
| Writing or editing | Types at the desk |
| Waiting for a tool or retry | Shows an hourglass |
| Delegating | Spawns up to six small 3D Clawds, with separate activity and stop controls |
| Asking a question or requesting approval | Raises a hand; an answer or approval card appears |
| Finishing or encountering an error | Waves happily or looks sad |

The chat renders sanitized Markdown, including headings, lists, tables, links and code blocks, while responses stream. It reports activity rather than displaying private model reasoning. Refreshing the page reconnects to the current run and restores pending questions. Stop cancels the current run and dismisses pending approvals. Completed websites and Claude session IDs survive a server restart; the visible activity log is held in memory.

This first studio version builds **HTML, CSS and JavaScript websites**. The local development server is provided by the studio. Shell commands, package installation, arbitrary backend execution and framework build servers are not enabled. Claude's file tools run in restricted mode inside the generated website workspace. WebFetch requests and questions are presented to the user; ordinary website file edits are already allowed. The studio listens only on the local computer; previews use a separate local origin and cannot read the studio API.

## Play

- Click or tap Clawd to poke it. Drag to turn the camera; scroll or pinch to zoom. The circular arrow starts a slow orbit, and the home button restores the camera.
- Choose Happy, Sad, Joyful, Curious, Sleepy, or Just chilling. Say hello and Little hop are short gestures that return to idle or the drum loop.
- Give Clawd a mug, balloon, or headphones. Hand props follow the hand bones. Drumsticks replace hand props while the band is playing; headphones can stay on.
- Explore the playground, garden, desk, moon, band stage, spooky mansion, and pirate ship. Click the mansion's ghost or the ship's wheel. The stage starts the band automatically; the band button works elsewhere too.
- Sound starts muted. Enable it for synthesized drums and tiny reaction sounds. Click drum surfaces for individual hits.
- Pixel view adds a low-resolution finish. The poses use held steps in either view.
- With the 3D view focused: Space pokes, Left/Right turn the camera, Up/Down zoom.

## Build and extend

Use Node.js 24.15 or newer. Run `npm ci`, then `npm run build`. The single-page result is written to `dist/Clawd-Playground.html`. Run `npm start` for both modes; a generic static server supports only the playground.

`app.js` owns interaction, animation blending, audio, and the rendering loop. `expressions.js` draws solid pixel strokes on the existing facial bones and animates three floating voxel Z letters. `worlds.js` builds the scenes and socket-mounted props. `index.html` and `styles.css` define the interface. `assets/Clawd-Animator.glb` is the real Blender-exported skinned model; `assets/Clawd-Drumkit.glb` is the kit.

`server.mjs` manages Claude sessions, local preview servers and event streams. `code-mode.js` and `code-mode.css` implement the studio interface. `chat-markdown.js` renders assistant messages using Marked and DOMPurify. `work-avatars.js` creates independent clones of the rig for real helper tasks; `work-props.js` supplies activity props.

The model has 20 bones, six body clips, and six source face clips. The website uses revised pixel-shaped expressions that blend independently of the body clips; the GLB retains its original face clips for use in other tools. Happy has arched smiling eyes; Joyful adds a grin; Sad has raised inner brows and a frown; Sleepy has closed eyes and rising 3D Z letters. A poke briefly wakes Clawd, hides the Z letters, then returns to the selected mood. Animation updates occur at 12 held poses per second; camera rendering stays smooth. One-shot actions blend back into Idle or Drums. Procedural adjustments are restored before each mixer update to prevent pose drift. The garden butterfly sits beyond the hand animation envelope. Reaction particles use conservative body and claw bounds so they bounce off the avatar instead of passing through it.

Web bone socket names are `GripL`, `GripR`, `AttachHead`, and `AttachBack`. The glTF loader removes punctuation from Blender's names. Attach a Three.js group to a socket and add block-shaped geometry to extend the prop library. Add a group in `buildWorlds`, a scene button, and its entry in `sceneNames` to create a new setting.

The mansion and pirate environments are authored as Three.js scene geometry in this website. The [Blender sources](blender/README.md) include the original static model and a separate editable character rig with its drum stage. The ready-to-open HTML is committed in `dist/` as well as being reproducible from source.

## Issue triage

New issues are automatically classified by Jev as documentation, bugs, or enhancements. Unclear issues receive `needs-triage`. A bot comment shows the context sent to Jev, its response, and confidence score. See [Jev issue triage](.github/JEV-TRIAGE.md) for configuration, manual dry runs, and testing.

## Credits

Clawd is based on the Claude Code mascot and the supplied references. The bundled browser code includes Three.js, Marked and DOMPurify; see `THIRD-PARTY-NOTICES.txt`. Server dependencies retain their licenses in their npm packages. This is a local interactive fan prototype.

## Verification

Browser checks covered all seven worlds, moods, direct and keyboard pokes, drag-versus-click behavior, solid rear face, automatic return to drumming, props, sound toggle, pixel mode, camera controls, and a phone-width layout. No new browser errors were observed after the final fixes. Both glTF assets are embedded, so the finished page makes no external asset requests.

Run `npm run check` for focused geometry, expression, Markdown and studio checks. These cover hand clearance, mood reset, sleep letters, unsafe Markdown, partial responses, preview isolation, connection handling, approvals, questions, helper identity, cancellation and event replay. Studio unit tests inject a controlled provider. Separately, a real Claude Max session with Opus/high built a working plant-shop website, answered a user-choice card, and delegated a file review to a researcher. API-key fallback was tested with a controlled provider; no live paid API key was supplied.
