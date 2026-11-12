# Room 3D

Local Three.js frontend. No backend or publication. Run `npm install` and `npm run dev`, then open http://127.0.0.1:5173/. Build static output using `npm run build`.

## Confirmed measurements (cm)

| Item | Value |
| --- | --- |
| Full room width × length × height | 223 × 383 × 295 |
| Lower clear height | 170 |
| Loft deck elevation | 180 |
| Loft depth | 140 |
| Rail above deck | 30 |
| Upper clear height, including rail | 115 |
| Stair reservation width × run × rise | 50 × 118 × 180 |
| Closet width × depth × height | 100 × 50 × 211 |

383 cm replaces the original partial 242 cm room length. The initial ±5 cm tolerance is retained as an approximation. Access opening and stair reservation are on the LEFT when facing the loft from the entry. Default reservation extends in front of the loft; alternate side placement overlaps the loft footprint and is flagged.

## Appearance and placement

Based on local reference photos `photo_2026-11-12_20-16-25.jpg` and `photo_2026-11-12_20-16-42.jpg`: cream walls, reddish timber floor, charcoal loft frame, pale mattress, wooden desk below, timber closet with diagonal door detailing, office chair, green lounge chair, dark door and air conditioner.

Full room boundary is modeled, with cutaway walls for visibility. Loft spans the back wall and extends 140 cm forward. Closet sits against the left wall near the front; its 100 cm width runs along that wall and its 50 cm depth projects into the room. Closet dimensions are measured; its exact offset is estimated. Desk, mattress, chairs, door and AC dimensions and offsets are visual approximations, not measured construction data. A 10 cm frame/deck thickness is inferred from 180 cm deck elevation minus 170 cm lower clearance.

Proposed staircase concepts are now switchable; no floor cutout is designed. The amber volume is the reserved stair envelope. The existing vertical charcoal metal ladder is modeled at the left front loft edge. It uses the 50 cm access zone, with approximate 35 cm rung spacing and rails extending to the loft rail height, based on the photos. It stays visible when furniture is hidden; the amber stair reservation can be hidden separately.

## Controls

Orbit, zoom, pan; four view presets; editable room, loft, closet and stair measurements; wall/dimension/stair/furniture visibility toggles; JSON measurement export; reset. Edits stay in memory and refresh resets them. Furniture toggle hides the closet and photo-based furnishings to inspect the room frame.

## Persistent Chrome debugging

Run `bash scripts/chrome-debug.sh` in a separate terminal. Persistent profile: `~/.cache/room-3d-chrome`; local debugging port 9222. Software WebGL rendering supports this machine's virtual graphics environment. Keep Vite running too. If IPv4 9222 is occupied, Chrome may use IPv6: `http://[::1]:9222/json/list`.

## Reverse reference update

Photos `photo_2026-11-12_20-26-16.jpg` and `photo_2026-11-12_20-26-22.jpg` inform the right-wall entry door (with AC above), low wooden drawer cabinet farther toward the room end, and bathroom doorway in the end wall next to the tall closet. Cabinet length confirmed at 100 cm; depth and height estimated. Cabinet defaults to 100 cm width × 38 cm depth × 85 cm height; all three dimensions are editable. Door location, doorway sizes and cabinet offsets remain photo-based estimates. Small tabletop objects, plant, wall socket, hinges and handle are illustrative. Bathroom doorway only is included; no bathroom floor area is added to the measured room. Reverse and Entry wall camera views expose this side. Exterior walls automatically cut away when viewed from behind.

Closet position corrected: its near face is exactly 118 cm from the loft front frame, including the user’s already allowed 1–2 cm. No extra clearance is added. With 383 cm room length, 140 cm loft depth and 100 cm closet width along the room, the far end of the closet is 25 cm from the end wall. Closet sits flush against the left wall (right side in Entry wall view). Gap is editable separately from proposed stair run.

The existing ladder is integrated into the loft frame: its left rail occupies the front-left support location, 4 cm in from the wall and loft front. The duplicate front-left post is removed; both ladder rails run from ground to rail height. This represents the existing frame, not a structural design recommendation.

## Switchable stair concepts

Use **Stair version** under Reserved stair space to select **Storage stair**, **Alternating tread**, or **Existing ladder only**. **Stairs** camera focuses the comparison. Switching preserves room and furniture dimensions. Reset returns to storage stairs; export includes the selected version and calculated rise/going.

Both proposed versions have 8 treads below the loft and 9 equal rises. Default: 180 / 9 = 20 cm rise; 118 / 8 = 14.75 cm going; width 50 cm. Storage tops are fixed, with illustrative side-opening storage panels. Alternating treads occupy alternate half widths, with up to 29.5 cm depth per foot; the top tread is clipped to the footprint boundary. These are visual concepts, not fabrication or safety-approved plans. Handhold positions are illustrative. Existing ladder rails and rungs remain because they form part of the existing frame. Their connection to the proposed upper step needs further design.

The closet meets the low end of the footprint: entry is from the room side, not a straight approach through the closet. Side placement remains exploratory and overlaps the loft footprint. Any proposed stair's support, guard, head clearance, approach, and upper transition require review before building.

Both proposed stairs use one wall-mounted handrail only, 5 cm off the left wall, with illustrative brackets. The room-facing side has no handrail or rail posts, allowing side entry beside the closet. Alternating-stair sloping stringers are structural supports below the treads, not additional handrails. Existing frame/ladder rails remain.

Storage layout simplified to **three** broad side-opening compartments spanning tread bays 1–3, 4–6, and 7–8 from the loft end. Each door fits below the lowest tread in its group; the stepped area above is fixed fascia. No individual mini drawers are shown. At default dimensions, approximate door spans/heights are 42.25 × 113 cm, 42.25 × 53 cm, and 27.5 × 33 cm, with 50 cm gross carcass depth before panel thickness. The eight walking treads are unchanged.

## Reduced step comparison

Step count is now selectable: 3, 4, or 5 treads below the loft (default 5). Rise = deck height / (treads + 1); going = run / treads. At 180 cm rise and 118 cm run: 3 steps = 45 cm rise / 39.33 cm going; 4 = 36 / 29.5 cm; 5 = 30 / 23.6 cm. These are high climbing steps, not ordinary stair dimensions. Three storage sections adapt to each count; fixed stair tops, single wall handrail, and the complete existing ladder/frame remain. The selector works with both proposed stair versions and exports its geometry. This supersedes the earlier eight-tread default.

## Frame stair revision

Version 02 now has full-width wall-mounted treads, not alternating treads. Each tread is 50 cm wide by the selected going (default 23.6 cm for five steps). Illustrative steel brackets sit below the treads at the wall. There is no room-side stringer, post, or handrail; the only handrail is wall-mounted. The existing loft ladder/frame stays intact. Brackets and wall fixings are illustrative and require design for the actual wall and loads. This supersedes the earlier alternating-tread option; its internal selector key remains `alternating` for compatibility.

## Desk update

Desk spans the full room/loft width (223 cm by default), with four 6 × 6 cm legs. Two under-desk drawer cabinets are each 40 cm wide, placed inside the legs at either end. User's “40 cm” is interpreted as cabinet width. Desk depth remains an estimated 59 cm, tabletop top 77 cm; cabinet depth 48 cm and height 60 cm are estimates. Central legroom is 223 − 2×6 − 2×40 = 131 cm. Existing loft supports remain separately modeled. JSON export includes desk dimensions.

## Vercel deployment

`vercel.json` mirrors the Vite configuration in `nguyendichtu91295/bpm-counter`: `npm ci`, `npm run build`, output `dist`. Deploy from this directory with `npm exec --yes --package=vercel -- vercel --prod`. The CLI may require `vercel login` first. The `.vercel` project link and environment files are ignored; `.vercelignore` excludes local scripts, docs, dependencies and generated build output from uploads. No backend or environment secrets are needed.

Production: https://room-3d-gamma.vercel.app
Vercel team: `coding-challenge`; project: `room-3d`. Local folder is linked in ignored `.vercel/project.json`. Redeploy using `vercel deploy --prod --scope coding-challenge`. The source is deployed directly via CLI; no GitHub repository has been created or connected.

## Corrected measured widths

User confirmed: closet body depth is **60 cm** (supersedes earlier 50 cm); existing ladder total outside width, including both frame rails, is **50 cm**. Rails are 4 cm wide and 46 cm apart between their centerlines, giving 50 cm overall. Ladder width is independent of the proposed stair width. Closet length 100 cm, height 211 cm, and 118 cm gap to loft remain unchanged.

Closet has a 5 cm clearance from the left wall, placing its 60 cm body front 65 cm into the room. The 118 cm longitudinal gap to the loft is unchanged.

## Stair run remeasurement

User remeasured the available stair run to **120 cm**, fitting close to the closet. Both stair run and closet-to-loft gap now default to 120 cm, superseding 118 cm. No additional end clearance is assumed. With 180 cm loft rise: 3 treads = 45 cm rise and 40 cm going; 4 = 36 cm rise and 30 cm going; 5 = 30 cm rise and 24 cm going. Width remains 50 cm. Closet remains 5 cm off the wall.
