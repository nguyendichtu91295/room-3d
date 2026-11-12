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

To open the viewer on another device on the same network:

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
- Use Perspective, Reverse, Entry wall, Stairs, Desk, Front, Plan, and Side for camera presets.
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
| Closet clearance from wall | 5 |
| Closet-to-loft gap / proposed stair run | 120 |
| Proposed stair width | 50 |
| Entry door leaf width / gap from loft front to near leaf edge | 97 / 34 |
| Drawer cabinet length × depth × height | 100 × 38 × 85 |
| Desk width / leg thickness | 223 / 6 |
| Under-desk cabinets | Two, each 40 cm wide |

Drawer cabinet depth and height, desk depth and height, and unmeasured furniture/door positions are estimates based on room photos. Closet doors and handles project beyond its 60 cm body. A 10 cm deck/frame assembly is inferred from the 180 cm deck elevation and 170 cm lower clearance.

## Stair versions

Both proposed versions retain the complete original ladder/frame and use one wall-mounted handrail, leaving the room-facing side open. The closet meets the bottom of the stair footprint, so the approach is from the room side.

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

The entry door leaf is 97 cm wide, with its near edge 34 cm from the loft front. The surrounding frame is still estimated (9 cm wider overall). Drawer cabinet is against the right wall, with its tabletop 1 cm from the end wall. At the default room dimensions, this leaves 9 cm between the door leaf far edge and cabinet top, or 4.5 cm from the estimated door frame, preventing overlap with the doorway.
