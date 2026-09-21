# Blender sources

- `Clawd.blend` and `Clawd.glb` are the original static model, with eyes only on the front.
- `Clawd-Animator.blend` is the separate animated rig and drum stage.
- `Clawd-Controls.py` is the optional sidebar panel, also embedded in the animator file.

The website uses this rig with additional pixel facial shapes and sleep effects in `expressions.js`. Its seven environments are built in `worlds.js`.

## Animate in Blender

Open **Clawd-Animator.blend** and select the scene **Clawd | Pixel stage**. Space plays the four-second drum loop. Select **Clawd | Animator** and enter Pose Mode to move individual controls.

| Control | Purpose |
|---|---|
| Root | Move or hop the whole character |
| Body | Bounce, squash, stretch, or tilt |
| Shoulder.L / Shoulder.R | Position the arm roots |
| Hand.L / Hand.R | Move the claws; the bridges stay attached |
| Four Foot controls | Independent little steps and taps |
| Face | Shift the face as a group |
| Eye.L / Eye.R | Blinks, squints, widening, and slanted expressions |
| Brow.L / Brow.R, Mouth | Extra expressions; hidden at tiny scale in the neutral pose |
| Grip.L / Grip.R | Hold and rotate props independently of the hands |
| Attach.Head / Attach.Back | Attach a hat, headphones, backpack, or other accessory |

The body clips are **Idle, Wave, Hop, Cheer, Expressions, and Drums**. Facial clips are **Neutral, Happy, Surprised, Focused, Sleepy, and Blink**. The Actions are reusable assets. Choose a clip in the Dope Sheet's Action Editor. Hide the drum-scene and prop collections to work with the character alone.

The timeline runs at 24 fps, with key poses on twos and Constant interpolation. This produces 12 held poses per second. Keep new keys Constant for the pixel-step style. Local bone Y points up and local Z points forward.

## Optional Clawd panel

In Blender's Text Editor, select the embedded **Clawd-Controls.py** text and choose **Run Script**. In the 3D View, press **N** and open the **Clawd** tab. This registers the panel for the current Blender session; it does not change your automatic script-execution settings.

The panel switches clips, keys facial poses, inserts held keys, and snaps selected pose controls to 0.2-unit movements and 15-degree turns. To attach a new prop, position it first, select it in Object Mode, choose a socket, and use **Attach selected prop**. Its current world position is preserved.

This is a stylized forward-kinematic rig designed for expressive block animation. New situations and complex poses are authored with the controls and prop sockets; there is no automatic motion generation or physics simulation.
