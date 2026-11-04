<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cargo Studio Workspace Guidance

## Project architecture

- This is a Next.js App Router application using React, TypeScript, and Three.js. The simulator UI is client-rendered.
- Keep `app/page.tsx` as a composition root. Put page sections in `app/components/simulation/`, shared behavior in hooks, shared app types in `app/types/`, UI configuration in `app/constants/`, and reusable pure helpers in `app/utils/`.
- Keep carton packing and truck-domain types in `app/truck-spec.ts`. Do not add a service layer unless the project gains an external API or another real service boundary.
- Keep the Three.js scene isolated in `app/components/truck-viewer.tsx`; do not move Three.js objects or browser APIs into server components.

## Domain behavior

- Preserve the automatic deterministic carton mix and custom inventory workflow. Custom carton requests are packed in their entered orientation, without rotation.
- Preserve the packing limits and communicate invalid dimensions, unplaced quantities, and plan overflow to the user.
- Loading is ordered from the truck interior toward the rear doors; unloading is the reverse. Keep the one-carton-at-a-time worker handling and door/lock/seal sequence consistent with the playback timeline.
- The displayed 0% and 100% states mean empty and fully loaded shipment plans, not cubic-volume utilization.

## Three.js changes

- Read [the Three.js loading-scene skill](.github/skills/threejs-loading-simulator/SKILL.md) before changing scene geometry, carton placement, worker animation, or door choreography.
- The truck cab is at negative Z and the rear loading doors are at positive Z. Keep carton positions and handling order consistent with that coordinate convention.
- Prefer instanced meshes for repeated static cartons. Keep the actively handled carton as an individually animated mesh.
- Dispose of Three.js resources and stop animation/resize callbacks when the viewer effect is cleaned up.

## Implementation and verification

- Use the existing TypeScript types and helpers. Keep component props explicit and avoid duplicating planner or validation logic.
- Before making Next.js-specific code changes, consult the relevant installed guide under `node_modules/next/dist/docs/`, as required by the generated guidance above.
- Run `npm run lint` and `npm run build` after code changes. For 3D or interaction changes, also verify the relevant workflow in a browser when available.
- Update `README.md` when user-facing behavior, setup, scripts, or project structure changes.
