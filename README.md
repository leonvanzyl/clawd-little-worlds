# Clawd's little world

Open `dist/Clawd-Playground.html` in a current desktop browser. The finished HTML includes Three.js, both 3D models, the world geometry, styles, and sound synthesis. It works offline and needs no server, account, or installation. WebGL hardware acceleration is required. No videos are used.

## Play

- Click or tap Clawd to poke it. Drag to turn the camera; scroll or pinch to zoom. The circular arrow starts a slow orbit, and the home button restores the camera.
- Choose Happy, Sad, Joyful, Curious, Sleepy, or Just chilling. Say hello and Little hop are short gestures that return to idle or the drum loop.
- Give Clawd a mug, balloon, or headphones. Hand props follow the hand bones. Drumsticks replace hand props while the band is playing; headphones can stay on.
- Explore the playground, garden, desk, moon, band stage, spooky mansion, and pirate ship. Click the mansion's ghost or the ship's wheel. The stage starts the band automatically; the band button works elsewhere too.
- Sound starts muted. Enable it for synthesized drums and tiny reaction sounds. Click drum surfaces for individual hits.
- Pixel view adds a low-resolution finish. The poses use held steps in either view.
- With the 3D view focused: Space pokes, Left/Right turn the camera, Up/Down zoom.

## Build and extend

Use Node.js 22 or newer. Run `npm ci`, then `npm run build`. The single-page result is written to `dist/Clawd-Playground.html`. For local development, serve that folder with any static server, such as `python -m http.server 8765 --directory dist`.

`app.js` owns interaction, animation blending, audio, and the rendering loop. `expressions.js` draws solid pixel strokes on the existing facial bones and animates three floating voxel Z letters. `worlds.js` builds the scenes and socket-mounted props. `index.html` and `styles.css` define the interface. `assets/Clawd-Animator.glb` is the real Blender-exported skinned model; `assets/Clawd-Drumkit.glb` is the kit.

The model has 20 bones, six body clips, and six source face clips. The website uses revised pixel-shaped expressions that blend independently of the body clips; the GLB retains its original face clips for use in other tools. Happy has arched smiling eyes; Joyful adds a grin; Sad has raised inner brows and a frown; Sleepy has closed eyes and rising 3D Z letters. A poke briefly wakes Clawd, hides the Z letters, then returns to the selected mood. Animation updates occur at 12 held poses per second; camera rendering stays smooth. One-shot actions blend back into Idle or Drums. Procedural adjustments are restored before each mixer update to prevent pose drift. The garden butterfly sits beyond the hand animation envelope. Reaction particles use conservative body and claw bounds so they bounce off the avatar instead of passing through it.

Web bone socket names are `GripL`, `GripR`, `AttachHead`, and `AttachBack`. The glTF loader removes punctuation from Blender's names. Attach a Three.js group to a socket and add block-shaped geometry to extend the prop library. Add a group in `buildWorlds`, a scene button, and its entry in `sceneNames` to create a new setting.

The mansion and pirate environments are authored as Three.js scene geometry in this website. The [Blender sources](blender/README.md) include the original static model and a separate editable character rig with its drum stage. The ready-to-open HTML is committed in `dist/` as well as being reproducible from source.

## Credits

Clawd is based on the Claude Code mascot and the supplied references. Three.js is included under the MIT license; see `THIRD-PARTY-NOTICES.txt`. This is a local interactive fan prototype.

## Verification

Browser checks covered all seven worlds, moods, direct and keyboard pokes, drag-versus-click behavior, solid rear face, automatic return to drumming, props, sound toggle, pixel mode, camera controls, and a phone-width layout. No new browser errors were observed after the final fixes. Both glTF assets are embedded, so the finished page makes no external asset requests.

Run `npm run check` for the focused geometry and expression checks: all six body clips are sampled for garden hand clearance, mood transitions must reset cleanly, and the three Z letters must remain above the head and hide on wake.
