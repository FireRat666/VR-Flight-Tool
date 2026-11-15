# Flight Tool

A pen that flies you anywhere in 3D. Grab it, hold the trigger and move your hand: you fly the way you pull, faster the further you pull. Made for **SideQuest / AltspaceVR** worlds.

It works at **any level** (it doesn't use bird flight), in **VR** and on **PC**.

To try it, open <https://flight-tool.firer.at> as a space in Altspace.

## How to fly

**In VR**

1. Grab the pen with grip.
2. Hold the trigger and move your hand. A line runs from where you pressed the trigger to the pen's tip, and you fly along it: up, down, left, right, forward, back, or any mix. The further from the start point, the faster.
3. Hold the pen still at the start point to hover.
4. Let go of the trigger and you fall as normal, keeping the speed you had. Press **B** (on the right controller, whichever hand holds the pen) to switch hover on, and you stay where you are instead (the left stick still walks you about at that height).
5. While you fly, push the **right stick** left or right to turn smoothly; the start point turns with you. While you fly or hover, push it up or down to climb or sink. When you aren't flying by the pen (on the ground, or just hovering), it turns you the usual way.
6. Twist-to-turn is optional: press **A** or **X** to switch it on or off. While it's on, an orange fin sticks out of the pen, and when you fly a matching fin at the start point shows where the pen's fin started. Twist the pen like a key, clockwise to turn right and anticlockwise to turn left. The further you twist, the faster you turn.

**On PC**

1. Click the pen to pick it up. While you hold it you hover.
2. **W A S D** fly you where you're looking. **E** flies up and **Q** flies down. They work in either hand.
3. Hold **3** to fly by the pen's position like in VR: move the mouse.
4. Drop the pen to land.

A pen waits at each Flight Tool spot, with a **Grab the pen to fly** label over it. The first time you pick one up, a toast shows the controls for VR or PC.

Each player gets a pen of their own: picking up the one at the spot leaves a new one there for the next person. When you let go of your pen it comes along with you, staying where you left it beside you (and coming round with you when you turn), so you can grab it again whenever you like, until it goes away `return-after` seconds after you let go. Taking a new pen from a spot sends your let-go pens away at once (not one you're still holding). With `sync="true"` it works the same way, and everyone else sees the pen you took too: in your hand, or following you. So any number of people can fly with one spot.

## Add it to an Altspace world (snippet)

In a Creator SDK world, add an empty GameObject at the origin, click **Add Component > BS > Snippet** and type `fly`. Or paste this into `Assets/WebRoot/index.html`, between the snippet section comments:

```html
<!-- snippet section -->
<bs-snippet name="fly" title="Flight Tool" single="true"
  description="A pen that flies you anywhere in 3D: hold the trigger and move your hand. Works at any level, in VR and on PC."
  script="https://flight-tool.firer.at/snippet.js"
  position="0 1 1"
  sync="false"
  sync-limit="10"
  sync-per-player="2"
  max-speed="10"
  dead-zone="0.02"
  full-range="0.3"
  response="6"
  key-speed="5"
  climb-speed="3"
  turning="false"
  turn-speed="45"
  turn-twist="25"
  turn-ease="4"
  return-after="30"
  follow="true"
  hover="false"
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
| `sync` | `false` | `true` lets everyone see the pen each player takes (each player still gets one of their own, so one spot serves any number of people). `false`: others don't see your pen. |
| `sync-limit` | `10` | With `sync`, the most shared pens in the space at once. Pens taken past it aren't shared: they're the taker's own, as with sync off. |
| `sync-per-player` | `2` | With `sync`, the most shared pens each player can have. Past it, their pens are their own. |
| `max-speed` | `10` | Top speed in metres per second. |
| `dead-zone` | `0.02` | Metres round the start point that don't move you, so a shaky hand still hovers. |
| `full-range` | `0.3` | How far past the dead zone (in metres) you move the pen for top speed. Speed grows with the square of the distance, so small movements give fine control. |
| `response` | `6` | How quickly your speed follows the pen, per second. Higher feels snappier, lower floatier. |
| `key-speed` | `5` | Speed in metres per second for the PC keys (W A S D, E, Q). |
| `climb-speed` | `3` | Metres per second up or down with the right stick pushed right over, while you fly or hover (VR). |
| `turning` | `false` | `true` starts with twist-to-turn on. Players can still toggle it with A / X. |
| `turn-speed` | `45` | Degrees per second of smooth turning while you fly, with the right stick pushed right over (or the pen twisted twice `turn-twist`). |
| `turn-twist` | `25` | How far (in degrees) the pen has to be twisted before you start turning. |
| `turn-ease` | `4` | How quickly turning speeds up and slows down, per second. Lower is gentler. |
| `return-after` | `30` | Seconds after you let go of a pen before it goes away (a new one already waits at the spot), following you or not. `false` (or `0`): pens never go away. Taking a new pen sends your let-go pens away at once. |
| `follow` | `true` | A pen you let go of comes along with you, so it's always to hand (until it goes away, `return-after`). `false` leaves it where you let go. |
| `hover` | `false` | `true` starts with hover on: letting go of the trigger leaves you hovering instead of falling. Players toggle it with B. |
| `help` | `true` | `false` skips the toast with the controls the first time someone picks up a pen. |
| `label` | `true` | `false` hides the **Grab the pen to fly** label over the pen's spot. |
| `bundle-base` | `bundles/` next to the script | Folder URL to load the pen's bundles from instead. |

## Good to know

- Only the person flying sees the line and the start point. With `sync="true"` everyone sees the pen too; otherwise each player only sees their own.
- The pen pushes you rather than teleporting you, so walls and floors still stop you.
- Turning works by small teleports, one each frame. The pen learns where a teleport puts you, so the first moment of your first turn may nudge you slightly. While you fly by the pen, the right stick's usual turning is off; the rest of the time (hovering included) it works as usual.

## How it works

JavaScript can't fly a player smoothly, but Visual Scripting can. So `snippet.js` loads a small kit for each pen spot: an asset bundle holding the pen and its label, with a Visual Scripting graph that does the flying. The kit is spawned under an object named `fly-<instance>-<n>` (n is the pen's number: 1 for `position`, 2 for `tool-2-position` and so on), which is the pen's key. When a pen spawns, its graph calls `window.penFlightReady(key)` in the page, and the snippet answers with that placement's settings through `scene.SendToVisualScripting("pen-flight-set", "key|Name=value")`.

The kit's graph listens for these, each starting with the key of the pens it's for, or `*` for every pen:

- `pen-flight-set` with `"key|MaxSpeed=12"` and so on (the graph's variable names: `MaxSpeed`, `DeadZone`, `FullRange`, `Response`, `KeySpeed`, `ClimbSpeed`, `TurnSpeed`, `TurnTwist`, `TurnEase`, `ReturnAfter`, `Follow`, `Hover`, `Help`, `ShowLabel`, `Sync`, and `Turning`; switches are `1` or `0`).
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
