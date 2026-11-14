# Flight Tool

A pen that flies you anywhere in 3D. Grab it, hold the trigger and move your hand: you fly the way you pull, faster the further you pull. Made for **SideQuest / AltspaceVR** worlds.

It works at **any level** (it doesn't use bird flight), in **VR** and on **PC**.

To try it, open <https://flight-tool.firer.at> as a space in Altspace.

## How to fly

**In VR**

1. Grab the pen with grip.
2. Hold the trigger and move your hand. A line runs from where you pressed the trigger to the pen's tip, and you fly along it: up, down, left, right, forward, back, or any mix. The further from the start point, the faster.
3. Hold the pen still at the start point to hover.
4. Let go of the trigger and you fall as normal, keeping the speed you had.
5. Turning is optional: press **A** or **X** while holding the pen to switch twist-to-turn on (an orange band shows on the pen) or off. While it's on and you're flying, twist the pen clockwise to turn right and anticlockwise to turn left, a step at a time.

**On PC**

1. Click the pen to pick it up. While you hold it you hover.
2. The arrow keys fly you where you're looking. **Space** flies up and **Tab** flies down.
3. Hold **3** to fly by the pen's position like in VR: move the mouse, and scroll to push the pen away or pull it in.
4. Drop the pen to land.

A pen waits at each Flight Tool spot, with a **Grab the pen to fly** label over it. The first time you pick one up, a toast shows the controls for VR or PC.

Each player gets a pen of their own: picking up the one at the spot leaves a new one there for the next person. Your pen stays exactly where you let go of it (it doesn't fall or get knocked away) and goes away `return-after` seconds later. With `sync="true"` the spot is instead one shared pen everyone sees, which goes back to its spot `return-after` seconds after it's dropped.

## Add it to an Altspace world (snippet)

In a Creator SDK world, add an empty GameObject at the origin, click **Add Component > BS > Snippet** and type `fly`. Or paste this into `Assets/WebRoot/index.html`, between the snippet section comments:

```html
<!-- snippet section -->
<bs-snippet name="fly" title="Flight Tool" single="true"
  description="A pen that flies you anywhere in 3D: hold the trigger and move your hand. Works at any level, in VR and on PC."
  script="https://flight-tool.firer.at/snippet.js"
  position="0 1 1"
  sync="false"
  max-speed="10"
  dead-zone="0.02"
  full-range="0.3"
  response="6"
  key-speed="5"
  turning="false"
  turn-step="30"
  turn-twist="25"
  turn-repeat="0.35"
  eye-height="1.6"
  return-after="30"
  help="true"
  label="true"
  bundle-base="">
  <bs-gizmo type="position" attribute="position"/>
  <bs-gizmo type="box" attribute="position" size="0.04 0.18 0.04"/>
</bs-snippet>
<!-- end snippet section -->
```

- Add it once. For more pens, add `tool-2-position`, `tool-3-position` and so on to the same element, as many as you like: each is another pen with the same settings.
- `position` is a Unity world position: keep the snippet's GameObject at the origin and move the pen with its gizmo handle or the setting.
- Unity reads the snippet section as XML: quote every attribute, close every element, and write `&` as `&amp;`.

## Settings

All optional. An empty setting uses the default.

| Attribute | Default | What it does |
| :--- | :--- | :--- |
| `position` | `0 1 1` | Where the pen waits (a Unity world position), and where it goes back to. |
| `tool-2-position`, `tool-3-position`, ... | (none) | More pens, each one `x y z`. Any number, gaps are fine; an empty value is skipped. They all use the same settings. |
| `sync` | `false` | `true` makes each spot one shared pen that everyone sees in the holder's hand. `false` gives every player a pen of their own (others don't see it). Each pen's network id comes from the placement's instance and the pen's number, so it's the same for everyone. |
| `max-speed` | `10` | Top speed in metres per second. |
| `dead-zone` | `0.02` | Metres round the start point that don't move you, so a shaky hand still hovers. |
| `full-range` | `0.3` | How far past the dead zone (in metres) you move the pen for top speed. Speed grows with the square of the distance, so small movements give fine control. |
| `response` | `6` | How quickly your speed follows the pen, per second. Higher feels snappier, lower floatier. |
| `key-speed` | `5` | Speed in metres per second for the PC keys (arrow keys, Space, Tab). |
| `turning` | `false` | `true` starts with twist-to-turn on. Players can still toggle it with A / X. |
| `turn-step` | `30` | Degrees per turn step. |
| `turn-twist` | `25` | How far (in degrees) the pen has to be twisted before you turn. |
| `turn-repeat` | `0.35` | Seconds between turn steps while the pen stays twisted. |
| `eye-height` | `1.6` | Metres from eyes to feet. A turn step moves you by your feet, so this keeps you at the same height. |
| `return-after` | `30` | Seconds after it's dropped before the pen goes home: a shared pen moves back to `position`, a pen of your own goes away (a new one already waits there). `0` leaves it where it was dropped. |
| `help` | `true` | `false` skips the toast with the controls the first time someone picks up a pen. |
| `label` | `true` | `false` hides the **Grab the pen to fly** label over the pen's spot. |
| `bundle-base` | `bundles/` next to the script | Folder URL to load the pen's bundles from instead. |

## Good to know

- Only the person flying sees the line and the start point. With `sync="true"` everyone sees the pen too; otherwise each player only sees their own.
- The pen pushes you rather than teleporting you, so walls and floors still stop you.
- Twist-to-turn works by small teleports. If your play area is off-centre, each step can shift you slightly.

## How it works

JavaScript can't fly a player smoothly, but Visual Scripting can. So `snippet.js` loads a small kit for each pen spot: an asset bundle holding the pen and its label, with a Visual Scripting graph that does the flying. The kit is spawned under an object named `fly-<instance>-<n>` (n is the pen's number: 1 for `position`, 2 for `tool-2-position` and so on), which is the pen's key. When a pen spawns, its graph calls `window.penFlightReady(key)` in the page, and the snippet answers with that placement's settings through `scene.SendToVisualScripting("pen-flight-set", "key|Name=value")`.

The kit's graph listens for these, each starting with the key of the pens it's for, or `*` for every pen:

- `pen-flight-set` with `"key|MaxSpeed=12"` and so on (the graph's variable names: `MaxSpeed`, `DeadZone`, `FullRange`, `Response`, `KeySpeed`, `TurnStep`, `TurnTwist`, `TurnRepeat`, `EyeHeight`, `ReturnAfter`, `Help`, `ShowLabel`, `Sync`, and `Turning`; switches are `1` or `0`).
- `pen-flight-home` with `"key|"`: sends the pen back to where it spawned.
- `pen-flight-bring` with `"key|"`: puts the pen in front of you.

When new bundles are uploaded to `bundles/<platform>/penflight`, bump `BUNDLE_VERSION` in `snippet.js`: the app caches bundles by URL, so without a new version players keep the old one.

## Files

- `snippet.js`, `snippet.html`: the Creator SDK snippet and its definition.
- `bundles/`: the pen kit for each platform (windows, android, linux, osx).
- `index.html`: the example space, and the guide shown in a normal browser.
- `test.html`: the example space with the snippet and bundles loaded from wherever it's served (e.g. `http://127.0.0.1:8766/test.html` from a local server), to try changes before publishing.

## License

GPL-3.0. See [LICENSE](LICENSE).
