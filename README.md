# Cargo Studio — Container Loading Simulator

A browser-based 3D truck-loading simulator built with Next.js, React, TypeScript, and Three.js. Configure the truck interior and carton inventory, preview the packing plan, and run a worker-assisted loading or unloading animation in an orbitable 3D scene.

## Features

- Interactive 3D truck and loading bay with orbit and zoom controls.
- Editable container and base-carton dimensions.
- Automatic, repeatable mixed-carton packing plan generated from the base-carton dimensions.
- Custom inventory mode for adding carton types with individual dimensions and requested quantities.
- Per-carton-type report showing packed quantity, unplaced quantity, and an estimate of how many fit when packed alone.
- One-at-a-time loading and unloading animation, conveyor transfer, and animated door/lock/seal actions.
- Playback controls for load/unload, pause/resume, reset, timeline seeking, and speed.
- Responsive interface with dimension validation and packing preview limits.

## Requirements

- Node.js compatible with the installed Next.js version.
- npm (the commands below use the repository's npm scripts).

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The page and controls are client-rendered. Next.js serves the app and provides the development and production build tooling.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Create an optimized production build and run the TypeScript checks. |
| `npm run start` | Serve the production build locally after `npm run build`. |

## Using the simulator

1. Set the truck's interior width, length, and height.
2. Set the base-carton dimensions used by the automatic mix.
3. Review the generated size report, or choose **Customize inventory** to define carton sizes and requested quantities.
4. Choose **Load truck** or **Unload truck** to animate the operation. Use the timeline, playback controls, and speed selector as needed.
5. Drag in the 3D viewport to orbit the truck and use the mouse wheel to zoom.

The **100% Loaded** and **0% Empty** options are shipment states: they load the full generated/packed inventory or leave the truck empty. They do not represent a target percentage of geometric volume.

## Packing behavior and limits

- All dimensions use the same unit and are entered as positive values.
- Automatic mode creates a deterministic mixture of base, long, wide, and tall cartons. Changing container or base-carton dimensions regenerates the plan.
- Custom mode packs the requested inventory in the entered orientation, without rotating cartons. Cartons are placed from the truck interior toward the rear.
- Packing is a visual, grid-based planning heuristic. It is not a guarantee of an optimal real-world loading arrangement and does not model carton weight, fragility, stacking strength, or load restraints.
- **Fits alone** is a per-carton-type estimate with the container dedicated to that single size. It is not additive across types.
- The 3D preview is limited to 20,000 cartons and 2,000,000 packing cells. Plans exceeding these limits are rejected with an on-screen validation message.

## Technology

- [Next.js](https://nextjs.org/docs) App Router
- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/) for the interactive 3D scene
- ESLint for linting

## Production

Build and run the production app:

```bash
npm run build
npm run start
```

For deployment options and environment-specific configuration, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
