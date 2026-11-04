---
name: threejs-loading-simulator
description: "Use when changing the Cargo Studio Three.js truck scene, mixed-carton rendering or placement, worker loading/unloading animation, conveyor, rear doors, lock, or seal."
---

# Three.js Loading Simulator

Use this workflow for scene and animation changes in Cargo Studio. For general project conventions, follow the workspace `AGENTS.md`.

## Before editing

1. Read `app/components/truck-viewer.tsx` and the relevant inputs in `app/truck-spec.ts`.
2. Check how the UI hook in `app/hooks/use-truck-simulation.ts` maps playback progress to carton and door timing.
3. Keep the scene coordinate convention: the truck cab is at negative Z; rear doors are at positive Z; the container floor is at Y = 0.
4. Loading progresses from the truck interior toward the rear. Unloading removes cartons in the reverse order.

## Implementation rules

- Keep static repeated cartons in `THREE.InstancedMesh`; animate the single carton being handled independently.
- Use each planned carton’s dimensions and position. Do not silently substitute the base-carton dimensions for mixed inventory.
- Preserve the selected shipment state, packing-plan ordering, worker path, conveyor transfer, and door/lock/seal playback phases as one coherent animation.
- Keep the worker on the loading route and truck access path; do not make the worker or carried carton jump through truck walls or doors.
- Drive animation from the existing playback progress/timing rather than adding an independent timer that can drift from the UI.
- When changing the viewer’s React effect, clean up animation frames, resize observers, controls, geometries, materials, textures, and renderer resources.
- Surface invalid dimensions or packing-plan limitations through the existing UI validation path instead of rendering a misleading scene.

## Verification

1. Run `npm run lint`.
2. Run `npm run build`.
3. When browser validation is available, check the empty and loaded states, load and unload playback, timeline seeking, custom mixed carton dimensions, and the rear door sequence.
4. Confirm changes preserve one-carton-at-a-time handling and interior-to-rear load order.
