import {
  DEFAULT_BOX,
  DEFAULT_CONTAINER,
} from "../truck-spec";
import type {
  DimensionGroupConfig,
  DimensionValues,
  TruckMode,
} from "../types/simulation";

export const SIMULATION_TICK_MS = 40;
export const CARTON_HANDLING_DURATION_MS = 1_500;
export const WORKER_APPROACH_DURATION_MS = 1_200;
export const DOOR_ACTION_DURATION_MS = 3_000;

export const INITIAL_DIMENSION_VALUES: DimensionValues = {
  containerWidth: String(DEFAULT_CONTAINER.width),
  containerLength: String(DEFAULT_CONTAINER.length),
  containerHeight: String(DEFAULT_CONTAINER.height),
  boxWidth: String(DEFAULT_BOX.width),
  boxLength: String(DEFAULT_BOX.length),
  boxHeight: String(DEFAULT_BOX.height),
};

export const DIMENSION_GROUPS: DimensionGroupConfig[] = [
  {
    title: "Container interior",
    icon: "container",
    fields: [
      { key: "containerWidth", label: "Width", icon: "width" },
      { key: "containerLength", label: "Length", icon: "length" },
      { key: "containerHeight", label: "Height", icon: "height" },
    ],
  },
  {
    title: "Base carton size · mixed sizes generated from this",
    icon: "box",
    fields: [
      { key: "boxWidth", label: "Width", icon: "width" },
      { key: "boxLength", label: "Length", icon: "length" },
      { key: "boxHeight", label: "Height", icon: "height" },
    ],
  },
];

export const TRUCK_MODES: TruckMode[] = [
  { fill: 100, label: "Loaded", color: "amber" },
  { fill: 0, label: "Empty", color: "blue" },
];

export const PLAYBACK_SPEEDS = [0.5, 1, 2, 10, 20] as const;
export const INITIAL_SPEED = 1;
export const INITIAL_PLAYBACK = {
  direction: "load",
  progress: 1,
  playing: false,
  runId: 0,
} as const;
