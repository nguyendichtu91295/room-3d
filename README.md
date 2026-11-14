# Room 3D

A Three.js room and loft simulator for comparing stair layouts. Frontend only: no backend, database, API keys, or account needed to run locally.

Live viewer: [room-3d-gamma.vercel.app](https://room-3d-gamma.vercel.app).

## Run locally

Install **Node.js 22.12 or newer** and npm. Open a terminal in the project folder:

```sh
cd room-3d
npm ci
npm run dev
```

If you are already inside `room-3d`, skip the `cd` command. Open **http://localhost:5173/**, or the Local URL printed by Vite if that port is occupied. Changes to the source reload automatically. Press **Ctrl+C** in the terminal to stop the server.

Development and preview servers bind to `0.0.0.0` by default so the VM host and other devices can reach them. To start development explicitly on all interfaces:

```sh
npm run dev -- --host 0.0.0.0
```

Open the **Network URL printed by Vite** on that device, for example `http://<your-computer-IP>:5173/`. Use the computer's IP address, not `0.0.0.0`. Your firewall must allow access to the port.

## Build and preview

```sh
npm run build
npm run preview
```

The build writes static files to `dist/`. Preview the result at the URL printed in the terminal, normally **http://localhost:4173/**. These files can be hosted as a static website.

## Viewer controls

- Drag to orbit, scroll to zoom, and right-drag to pan.
- Choose Perspective, Reverse, Shelves, Stairs or Plan camera views.
- Switch between storage stairs, wall-mounted steps, and the existing ladder only.
- Choose 3, 4, or 5 steps below the loft; the final rise onto the loft is included in the displayed rise calculation.
- Adjust the proposed stair run and width. Room, loft, and furniture measurements are fixed in `src/main.js`.
- Toggle dimensions, walls, stair reservation, and furniture. The original ladder remains part of the frame.
- Export measurements as JSON. Reset restores defaults; a page refresh also resets edits. Changes are not saved automatically.

## Current room measurements

All dimensions are in centimetres.

| Item | Dimensions |
| --- | --- |
| Room width × length × height | 223 × 383 × 295 |
| Lower clear height | 170 |
| Loft deck elevation / depth | 180 / 140 |
| Rail height above deck | 30 |
| Headroom above deck, including rail space | 115 |
| Existing ladder outside width, including rails | 50 |
| Tall closet length × body depth × height | 100 × 60 × 211 |
| Closet clearance from left wall / bathroom wall | 5 / 20 |
| Closet-to-loft gap / proposed stair run | 123 / 120 |
| Proposed stair width | 50 |
| Entry door leaf width / derived gap from loft front to near leaf edge | 97 / 26.5 |
| Shelf wall from outer entry frame to bathroom-wall corner | 115 |
| Bathroom sliding entrance / wooden frame per side / outer width | 67 / 10 / 87 |
| Drawer cabinet length × top depth × height | 100 × 38 × 80 |
| Drawer cabinet top clearance from both corner walls | 5 |
| Desk width / leg thickness | 223 / 6 |
| Under-desk cabinets | Two, each 40 cm wide |

The tall closet is anchored 20 cm from the bathroom wall; its gap to the loft is derived from the remaining room length (123 cm). Its backlight follows the closet.

The drawer cabinet top depth is confirmed at 38 cm; its body depth is modeled at an estimated 36 cm to retain the top overhang. Desk depth and height, and unmeasured furniture/door positions, are estimates based on room photos. Closet doors and handles project beyond its 60 cm body. A 10 cm deck/frame assembly is inferred from the 180 cm deck elevation and 170 cm lower clearance.

## Stair versions

Both proposed versions retain the complete original ladder/frame and use one wall-mounted handrail, leaving the room-facing side open. The 120 cm stair run ends 3 cm before the closet, so the approach is from the room side.

1. **Storage stairs:** fixed walking treads above three broad side-opening storage compartments.
2. **Wall-mounted steps:** full-width treads with illustrative wall brackets; no alternating treads or room-side stringer/handrail.
3. **Existing ladder only:** hides proposed stairs while retaining the loft and original ladder.

| Steps below loft | Equal rises including final rise onto loft | Rise | Tread going |
| --- | --- | --- | --- |
| 3 | 4 | 45 | 40 |
| 4 | 5 | 36 | 30 |
| 5 (default) | 6 | 30 | 24 |

These are spatial concepts with high climbing steps, not construction drawings. Wall brackets, attachments, handholds, and the upper transition need design for actual materials and loads before building.

## Project files

- `src/main.js`: Three.js scene, dimensions, furniture, stair geometry, and controls.
- `src/style.css`: page layout and styling.
- `index.html`: viewer interface.
- `vercel.json`: Vercel Vite build configuration.
- `scripts/chrome-debug.sh`: optional dedicated Chrome debugging session on Linux; requires Google Chrome. Normal use needs only a WebGL-capable browser.

## Deploy to Vercel

Vercel team: `coding-challenge`. Project: `room-3d`.

```sh
npm install --global vercel
vercel login
vercel link --scope coding-challenge --project room-3d
vercel deploy --prod --scope coding-challenge
```

Skip login and linking if this machine is already authenticated and this folder is linked. `vercel.json` uses `npm ci`, `npm run build`, and `dist`, matching the setup in `nguyendichtu91295/bpm-counter`. No environment variables are required. `.vercel/`, `.env*`, build output, and dependencies are Git-ignored. `.vercelignore` excludes local documentation and debugging scripts from deployment uploads.

The entry door leaf is 97 cm wide. Its outer frame is positioned to leave 115 cm of clear wall to the bathroom-wall corner. With the estimated frame adding 9 cm overall, the near leaf edge is 26.5 cm from the loft front at the default room size. Both the door and wall cutout use `src/entry-door.js`. The drawer cabinet top sits 5 cm from both corner walls, leaving 8 cm between its end and the entry frame. JSON export records the door layout.

## Human reference

The Human reference dropdown offers standing mid-room, climbing the storage stair, climbing the wall-mounted steps, or no person. The dimensional mannequin is **169.5 cm tall when upright**, with **25 cm long feet**. Other proportions are approximate. Climbing choices select the matching stair version. Use the lower-foot slider to inspect successive pairs of steps. This is a posed scale reference, not a walking animation or a balance simulation. Posing bends the knees without rescaling the person. The summary reports tread overhang and any head position above the ceiling. Furniture visibility does not hide the person. Reset restores the standing person; export includes the selected pose and dimensions.

Run human geometry checks with `node --test tests/human.test.js`. They verify upright height, foot length and contact with successive treads for all supported step counts.

Chrome debugging uses the persistent profile in `~/.cache/room-3d-chrome`, launched by `bash scripts/chrome-debug.sh`. Codex's `chrome-devtools` connection points directly to `http://127.0.0.1:9222`; restart/reload the MCP connection after changing its configuration. Keep the Chrome process running for continued debugging.

## Green chair comparison

Use the **Human reference** dropdown’s two sitting poses to place the chair in its original spot or beneath the higher wall-mounted steps. There are no separate Green chair controls. Standing, climbing and Remove human retain the last chair placement; reset returns it under the steps. **The chair faces into the room**, with its width running along the closet-to-loft gap beside the old ladder. User clarified that this width is about **60 cm**, superseding the product image's 63 cm. Rounded rectangular cushions, upholstery buttons, a pedestal and five-spoke base approximate the real chair.

Chair height 69 cm, seat height 42 cm and seat depth 47 cm are taken from the product screenshot. **Full chair/base depth is still estimated at 60 cm**, independent of the measured chair width. In the tucked position, the back is against the wall and the chair extends 10 cm beyond the 50 cm stair width.

Human reference offers seated poses in both chair positions. Per the user's final direction, the seated figure is a **normal sitting visual reference**, with an upright head, relaxed arms and straight vertical torso. Its **shoulder joints are at 80 cm**, just above the third visible modeled ladder rung (78 cm center, 79.5 cm top), and its **head top is at 106 cm**, below the fourth rung (113 cm center, 111.5 cm underside) and the user's 108 cm maximum. There is no recline, forced spinal curve, or automatic chair pull-out. The figure clears the current five-step treads in this reference pose.

This seated silhouette is calibrated to the supplied visual landmarks rather than preserving every standing anatomical proportion. The 69 cm spine measurement remains recorded for the standing/climbing mannequin; the seated reference uses an illustrative shorter torso. Standing height remains 169.5 cm; feet remain 25 cm. The third/fourth rung heights are from the approximate existing-ladder model, not newly measured real rung heights.

Occupied cushion height is fixed at an estimated 32 cm; unoccupied seat height remains 42 cm. Full chair depth, cushion compression and body shape remain estimates. Body-surface checks inspect triangles against obstacle-local boxes and enclosed brackets. No walking, standing-up or climbing motion clearance is simulated.

Run geometry checks using `node --test tests/*.test.js`.

Existing ladder rung spacing confirmed by user: **32 cm clear vertical gap + 3 cm rung thickness = 35 cm center-to-center spacing**. Rung center elevations remain 8, 43, 78, 113 and 148 cm; the first 8 cm center elevation is still a provisional placement, not a measured floor clearance. The third rung top is 79.5 cm, so the 80 cm shoulder reference sits just 0.5 cm above it. No changes to the proposed stair geometry.

Standing-only proportion update: the user describes longer legs and a shorter torso. The standing visual preset now uses a 97 cm hip height, 45 cm thigh/shin segments, and a 52.5 cm hip-to-neck span while keeping the total height 169.5 cm and feet 25 cm. These segment sizes are illustrative estimates, not new measurements. Climbing and the approved seated silhouette remain separate references and are unchanged. JSON export records the standing preset.

## Room wall visibility

All four room walls are modeled, including the front corners. The entry and bathroom doorways have wall openings with headers above. With **Cutaway** checked, walls between the outside camera and interior fade to 10% opacity but remain faintly visible. Uncheck Cutaway for solid walls around the full perimeter. The Walls checkbox hides/shows the complete shell. Furniture visibility does not remove walls.

## Lighting and monitor

Night view is enabled by default on first load and after resetting measurements. All three light fixtures are always on. The only lighting control is the global **Night view** checkbox in the footer, which dims ambient daylight to make the fixtures easier to inspect. There are no closet-light on/off, brightness or reveal controls.

- **Closet strip:** inverted U behind the top of the tall closet, 100 cm wide with two 97 cm sides (294 cm total run). Horizontal strip at 211 cm; side bottoms at 114 cm. Warm-white color and wall wash are illustrative.
- **Cabinet-corner light:** a slim standing bar behind the low drawer cabinet, near the right/end-wall corner. The 80 cm cabinet occludes the bottom. The bar faces the walls, with a rounded, softly fading wash around both sides of the corner and gentle reflected light into the room. Bar height is confirmed at 160 cm; placement and base detail are approximate.
- **Monitor light bar:** 50 cm long, clipped above the curved monitor, casting brighter warm light across the desk, with an approximate desktop reflection that lights the surrounding desk corner.

The monitor is modeled as 34 inches diagonal with a 1800R (180 cm radius) horizontal curve. **21:9 ultrawide aspect ratio is assumed**, giving approximately 79.4 cm screen arc width × 34.0 cm height; its projected width is slightly smaller due to the curve. Monitor center remains 105 cm above the floor. Light warmth, output and wall-wash gradients are visual approximations, not photometric predictions. JSON export includes these fixtures.

## Corner shelf draft

Use the **Shelves** camera to inspect three wall-mounted shelves forming an L around the standing light-bar corner. Two 80 × 20 cm boards sit on the long cabinet wall, with top surfaces at 140 and 180 cm. One 40 × 20 cm return sits on the adjoining bathroom wall, with its top at 180 cm, aligned with the upper long shelf. The two levels remain 40 cm apart. All three boards are 3.5 cm thick and match the cabinet timber.

The short shelf underside clears the 160 cm light bar by 16.5 cm. The long boards stop 22 cm before the corner, leaving a 2 cm gap beyond the short shelf’s 20 cm footprint. The short board clears the modeled bathroom frame by 4 cm; the long boards start 13 cm beyond the entry frame. Concealed mounting is illustrative. Shelf dimensions are in `src/corner-shelves.js` and the JSON export. Furniture visibility also controls the shelves.

The bathroom door is shown closed on a sliding track, with timber framing and a recessed pull. Its clear entrance is 67 cm; the 10 cm wooden frame is interpreted as per side, giving 87 cm overall. The frame sits 1 cm from the nearest edge of the cabinet top. Its position follows the confirmed 38 cm cabinet top depth and the 5 cm clearance from the right wall. The cabinet top also sits 5 cm from the end wall. The wall opening and JSON export use these same dimensions and placement from `src/bathroom.js`. Entrance height remains an estimated 210 cm, and panel appearance is illustrative.
