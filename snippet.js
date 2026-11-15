// Flight Tool as a SideQuest/Altspace Creator SDK snippet.
//
//   <bs-snippet name="fly" title="Flight Tool" single="true"
//     script="https://flight-tool.firer.at/snippet.js" position="0 1 1" tool-2-position="5 1 1"></bs-snippet>
//
// A pen that flies you around: grab it, hold the trigger and move your hand away from where you pressed it.
// It works at any level (it doesn't use bird flight).
//
// JavaScript can't fly a player smoothly, but Visual Scripting can. So this script loads a small kit (an asset
// bundle holding the pen, with a Visual Scripting graph that does the flying) for each pen spot: `position`, and
// tool-2-position, tool-3-position and so on, as many as you add. When a pen spawns its graph calls
// window.penFlightReady(key), and this script answers with the settings (the same for every spot).
//
// By default everyone has pens of their own: picking up the one waiting at `position` leaves a new one there, and a
// pen you let go of comes along with you (`follow`), so it's always to hand. With sync="true" that still
// happens, and everyone else sees the pen you took too, in your hand or following you.
//
// Settings (attributes on the element, all optional):
//   position      Where the pen waits, "x y z" (Unity world position).                Default "0 1 1"
//   tool-N-position  More pens, N = 2, 3, 4...: each one "x y z", any number of them.  Default none
//   sync          "true": everyone sees the pen each player takes (still one each).   Default false
//   sync-limit    Most shared pens in the space at once; past it, pens aren't shared. Default 10
//   sync-per-player  Most shared pens each player can have; past it, theirs.         Default 2
//   max-speed     Top speed in m/s, with the pen full-range past the dead zone.       Default 10
//   dead-zone     Metres round the start point that don't move you.                    Default 0.02
//   full-range    Metres past the dead zone for top speed (speed grows with the
//                 square, for fine control near the start point).                      Default 0.3
//   response      How quickly your speed follows the pen, per second.                  Default 6
//   key-speed     Speed in m/s for the PC keys (W A S D, E, Q).                       Default 5
//   climb-speed   Speed in m/s up or down with the right stick, flying or hovering.  Default 3
//   turning       "true" to start with twist-to-turn on (the A / X button toggles it). Default false
//   turn-speed    Degrees per second of smooth turning while flying (right stick, or twist). Default 45
//   turn-twist    Degrees of twist before you start turning (as much again for full speed). Default 25
//   turn-ease     How quickly turning speeds up and slows down, per second.           Default 4
//   return-after  Seconds after it's dropped before the pen goes home (0 = never).     Default 30
//                 A pen of your own that follows you doesn't go away.
//   follow        "false": a pen you let go of stays put, instead of coming with you. Default true
//   hover         "true": start with hover on (B toggles it): you hover when you
//                 let go of the trigger, rather than fall.                             Default false
//   help          "false" to skip the toast with the controls on the first grab.      Default true
//   label         "false" to hide the "Grab the pen to fly" label.                     Default true
//   bundle-base   Folder URL of the kit bundles.                     Default bundles/ next to this file
(() => {
  const SNIPPET_NAME = 'fly';
  const BUNDLE_FILE = 'penflight';
  // The app caches kit bundles by URL, so bump this whenever the bundles are rebuilt.
  const BUNDLE_VERSION = '12';
  // Return IDs the kit's graph listens for.
  const SET_ID = 'pen-flight-set';
  const OWN_ID = 'pen-flight-own';
  // Your user state: the shared pens you have, "key~id,key~id", so everyone else's page shows a copy of each.
  const PENS_PROP = 'fly-pens';
  const LOG = 'Flight Tool (snippet)';

  // Attribute -> the graph's Object variable, and its default.
  const NUMBERS = [
    ['max-speed', 'MaxSpeed', 10],
    ['dead-zone', 'DeadZone', 0.02],
    ['full-range', 'FullRange', 0.3],
    ['response', 'Response', 6],
    ['key-speed', 'KeySpeed', 5],
    ['climb-speed', 'ClimbSpeed', 3],
    ['turn-speed', 'TurnSpeed', 45],
    ['turn-twist', 'TurnTwist', 25],
    ['turn-ease', 'TurnEase', 4],
    ['return-after', 'ReturnAfter', 30],
  ];
  // Attribute -> variable, default: true / false, sent as 1 / 0.
  const SWITCHES = [
    ['turning', 'Turning', false],
    ['follow', 'Follow', true],
    ['hover', 'Hover', false],
    ['help', 'Help', true],
    ['label', 'ShowLabel', true],
    // Last: once it's on, the pen is the shared one.
    ['sync', 'Sync', false],
  ];

  const thisScript = document.currentScript;
  const started = new WeakSet();
  // Pen key (the name of the object the kit is spawned under) -> that placement's settings.
  const placements = new Map();
  let count = 0;

  const bundleUrls = (el) => {
    const scriptUrl = el.getAttribute('script') || (thisScript && thisScript.src) || location.href;
    const custom = (el.getAttribute('bundle-base') || '').trim();
    const base = new URL(custom || 'bundles/', new URL(scriptUrl, location.href));
    if (!base.pathname.endsWith('/')) base.pathname += '/';
    const url = (platform) => new URL(`${platform}/${BUNDLE_FILE}?v=${BUNDLE_VERSION}`, base).href;
    return {
      windowsUrl: url('windows'),
      androidUrl: url('android'),
      linuxUrl: url('linux'),
      osxUrl: url('osx'),
      isScene: false,
    };
  };

  const readSettings = (el) => {
    const attr = (name) => (el.getAttribute(name) || '').trim();
    const vars = {};
    for (const [name, key, fallback] of NUMBERS) {
      const n = parseFloat(attr(name));
      vars[key] = Number.isFinite(n) ? n : fallback;
    }
    for (const [name, key, fallback] of SWITCHES) {
      const v = attr(name).toLowerCase();
      vars[key] = (v === '' ? fallback : v === 'true') ? 1 : 0;
    }
    const position = parsePosition(attr('position')) || [0, 1, 1];
    // Limits on shared pens (sync), used here in the page only.
    const count = (name, fallback) => {
      const n = parseInt(attr(name), 10);
      return Number.isFinite(n) && n >= 0 ? n : fallback;
    };
    const limits = { total: count('sync-limit', 10), perPlayer: count('sync-per-player', 2) };
    return { vars, position, el, limits };
  };

  const send = async (key) => {
    const settings = placements.get(key);
    if (!settings) return;
    const scene = BS.Scene.GetInstance();
    for (const [name, value] of Object.entries(settings.vars)) {
      await scene.SendToVisualScripting(SET_ID, `${key}|${name}=${value}`);
    }
  };

  // Called by a pen's graph when it has spawned (a new pen at home does too), so the settings arrive once it's
  // listening.
  window.penFlightReady = (key) => {
    send(String(key)).catch((e) => console.warn(`${LOG}: sending settings failed`, e));
    return true;
  };

  const parsePosition = (text) => {
    const parts = String(text || '').trim().split(/[\s,]+/).map(parseFloat);
    return parts.length === 3 && parts.every(Number.isFinite) ? parts : null;
  };

  // Every pen spot on the element: `position` (pen 1), then tool-2-position, tool-3-position... in number order.
  // Any number works, gaps too; an empty or broken value is skipped.
  const penSpots = (el, first) => {
    const spots = [{ n: 1, position: first }];
    for (const { name, value } of Array.from(el.attributes)) {
      const m = /^tool-(\d+)-position$/.exec(name);
      if (!m || Number(m[1]) < 2) continue;
      const position = parsePosition(value);
      if (position) spots.push({ n: Number(m[1]), position });
      else if (value.trim()) console.warn(`${LOG}: ${name}="${value}" isn't "x y z", so that pen is left out`);
    }
    return spots.sort((a, b) => a.n - b.n);
  };

  const spawnPen = async (el, key, position, synced) => {
    try {
      const [x, y, z] = position;
      const obj = new BS.GameObject({ name: key, localPosition: new BS.Vector3(x, y, z) });
      await obj.Async();
      await obj.AddComponent(new BS.AssetBundle(bundleUrls(el)));
      // "*" = the first prefab in the AssetBundle on this same object.
      await obj.AddComponent(new BS.KitItem({ path: '*' }));
      console.log(`${LOG}: loading pen ${key} (bundle v${BUNDLE_VERSION}) at ${position.join(' ')}${synced ? ', synced' : ''}`);
      return obj;
    } catch (e) {
      console.error(`${LOG}: failed to start ${key}`, e);
      return null;
    }
  };

  // ---- Sync: every player still takes a pen of their own from the spot, and everyone sees it.
  // The pen you take asks for a network id (penFlightTaken); it's listed in your user state, and every other
  // player's page spawns a copy of it named "key~id" (a mirror), which follows your pen. When your pen goes away
  // (penFlightGone) or you leave, the copies go too.
  const mine = new Map();      // id -> key, your shared pens
  const shared = new Map();    // another player's uid -> their "key~id" entries
  const mirrors = new Map();   // "key~id" -> { obj } for the copies of other players' pens
  const safe = (text) => String(text || '').replace(/[^A-Za-z0-9_-]/g, '');

  const publish = () => {
    const list = Array.from(mine, ([id, key]) => `${key}~${id}`).join(',');
    BS.Scene.GetInstance().SetUserProps({ [PENS_PROP]: list });
  };

  window.penFlightTaken = (key) => {
    key = String(key);
    const scene = BS.Scene.GetInstance();
    // Past a limit the pen isn't shared: it stays your own, as with sync off.
    const place = placements.get(key);
    const limits = place ? place.limits : { total: 10, perPlayer: 2 };
    let total = mine.size;
    for (const list of shared.values()) total += list.length;
    if (mine.size >= limits.perPlayer || total >= limits.total) {
      console.log(`${LOG}: not sharing this pen (${mine.size} of ${limits.perPlayer} yours, ${total} of ${limits.total} in the space)`);
      return false;
    }
    const uid = safe(scene.localUser && scene.localUser.uid) || 'me';
    const id = `${key}-${uid}-${Date.now().toString(36)}`;
    mine.set(id, key);
    scene.SendToVisualScripting(OWN_ID, `${key}|${id}`)
      .then(publish)
      .catch((e) => console.warn(`${LOG}: sharing pen ${id} failed`, e));
    return true;
  };

  window.penFlightGone = (id) => {
    if (mine.delete(String(id))) publish();
    return true;
  };

  const syncMirrors = () => {
    const wanted = new Set();
    for (const list of shared.values()) for (const entry of list) wanted.add(entry);
    for (const [entry, mirror] of mirrors) {
      if (wanted.has(entry)) continue;
      mirrors.delete(entry);
      if (mirror.obj) mirror.obj.Destroy();
      mirror.gone = true;
    }
    for (const entry of wanted) {
      if (mirrors.has(entry)) continue;
      const key = entry.split('~')[0];
      const place = placements.get(key);
      // Not a spot here (yet): tried again once the spots have started.
      if (!place || !place.vars.Sync) continue;
      const mirror = { obj: null, gone: false };
      mirrors.set(entry, mirror);
      spawnPen(place.el, entry, place.position, true).then((obj) => {
        if (mirror.gone && obj) obj.Destroy();
        else mirror.obj = obj;
      });
    }
  };

  const start = async (el) => {
    if (started.has(el)) return;
    started.add(el);
    // Keys are the same for everyone in the space (the placement's instance and the pen's number), so each synced
    // pen gets the same network id everywhere.
    const base = `fly-${(el.getAttribute('instance') || '').trim() || ++count}`;
    const settings = readSettings(el);
    for (const { n, position } of penSpots(el, settings.position)) {
      const key = `${base}-${n}`;
      placements.set(key, { ...settings, position });
      await spawnPen(el, key, position, settings.vars.Sync);
    }
    syncMirrors();
  };

  const scan = () => document.querySelectorAll(`bs-snippet[name="${SNIPPET_NAME}"]`).forEach(start);

  // ---- PC keys: W A S D fly you where you look, E up and Q down, whichever hand holds the pen. The page hears
  // the keyboard and sends each pen KeyX / KeyY / KeyZ (-1..1) when they change; pens use them only while held.
  const held = new Set();
  const sentKeys = { KeyX: 0, KeyY: 0, KeyZ: 0 };
  const sendKeys = () => {
    if (placements.size === 0) return;
    const K = BS.KeyCode;
    const axis = (plus, minus) => (held.has(plus) ? 1 : 0) - (held.has(minus) ? 1 : 0);
    const now = { KeyX: axis(K.D, K.A), KeyY: axis(K.W, K.S), KeyZ: axis(K.E, K.Q) };
    const scene = BS.Scene.GetInstance();
    for (const [name, value] of Object.entries(now)) {
      if (sentKeys[name] === value) continue;
      sentKeys[name] = value;
      scene.SendToVisualScripting(SET_ID, `*|${name}=${value}`).catch(() => {});
    }
  };

  window.addEventListener('bs-loaded', () => {
    const scene = BS.Scene.GetInstance();
    const K = BS.KeyCode;
    const flyKeys = new Set([K.W, K.A, K.S, K.D, K.Q, K.E]);
    scene.On('key-press', (e) => {
      const key = e.detail && e.detail.key;
      if (!flyKeys.has(key)) return;
      held.add(key);
      sendKeys();
    });
    scene.On('key-release', (e) => {
      const key = e.detail && e.detail.key;
      if (!held.delete(key)) return;
      sendKeys();
    });
    scene.On('user-state-changed', (e) => {
      const user = e.detail && e.detail.user;
      if (!user || user.isLocal) return;
      for (const change of e.detail.changes || []) {
        if (change.key !== PENS_PROP) continue;
        shared.set(user.uid, String(change.newValue || '').split(',').filter((entry) => entry.includes('~')));
        syncMirrors();
      }
    });
    scene.On('user-left', (e) => {
      if (e.detail && shared.delete(e.detail.uid)) syncMirrors();
    });
    scan();
    // Placements added later, e.g. with document.createElement('bs-snippet').
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  });
})();
