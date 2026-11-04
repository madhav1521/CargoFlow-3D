import type {
  Dimensions,
  FillPercent,
  PackedCarton,
} from "../truck-spec";

export type DimensionInput =
  | "containerWidth"
  | "containerLength"
  | "containerHeight"
  | "boxWidth"
  | "boxLength"
  | "boxHeight";

export type DimensionValues = Record<DimensionInput, string>;

export type CartonTypeInput = {
  id: string;
  width: string;
  length: string;
  height: string;
  quantity: string;
};

export type CartonTypeSummary = {
  id: string;
  dimensions: Dimensions;
  requested: number;
  packed: number;
  maxFitAlone: number;
};

export type CartonMixMode = "auto" | "custom";
export type PlaybackDirection = "load" | "unload";

export type PlaybackTiming = {
  loadApproachStart: number;
  loadDoorStart: number;
  unloadDoorEnd: number;
  unloadCartonsStart: number;
  totalDuration: number;
};

export type Playback = {
  direction: PlaybackDirection;
  progress: number;
  playing: boolean;
  runId: number;
};

export type IconName =
  | "box"
  | "container"
  | "width"
  | "length"
  | "height"
  | "load"
  | "unload"
  | "play"
  | "pause"
  | "reset"
  | "speed"
  | "rotate"
  | "worker"
  | "conveyor";

export type DimensionFieldConfig = {
  key: DimensionInput;
  label: string;
  icon: IconName;
};

export type DimensionGroupConfig = {
  title: string;
  icon: IconName;
  fields: DimensionFieldConfig[];
};

export type TruckMode = {
  fill: FillPercent;
  label: string;
  color: string;
};

export type TruckSimulationState = {
  inputs: DimensionValues;
  container: Dimensions;
  box: Dimensions;
  cartonTypes: CartonTypeInput[];
  mixMode: CartonMixMode;
  cartonPlan: { cartons: PackedCarton[]; overflow: boolean };
  inventorySummary: CartonTypeSummary[];
  capacity: number;
  actualCount: number;
  actualFillPercent: number;
  validationMessage: string;
  canRenderTruck: boolean;
  playback: Playback;
  playbackTiming: PlaybackTiming;
  playbackStatus: string;
  selectedFill: FillPercent;
  speed: number;
  updateDimension: (key: DimensionInput, value: string) => void;
  updateCartonType: (
    id: string,
    key: keyof Omit<CartonTypeInput, "id">,
    value: string,
  ) => void;
  addCartonType: () => void;
  removeCartonType: (id: string) => void;
  customizeCartonMix: () => void;
  useAutomaticCartonMix: () => void;
  updatePlayback: (next: Playback) => void;
  startSimulation: (direction: PlaybackDirection) => void;
  selectFill: (fill: FillPercent) => void;
  togglePlayback: () => void;
  seekSimulation: (progress: number) => void;
  resetSimulation: () => void;
  setSpeed: (speed: number) => void;
};
