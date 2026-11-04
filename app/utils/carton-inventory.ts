import type {
  CartonTypeInput,
  CartonTypeSummary,
  DimensionValues,
} from "../types/simulation";
import type { Dimensions, PackedCarton } from "../truck-spec";
import { MAX_BOX_CAPACITY, MAX_DIMENSION } from "../truck-spec";

export function getDimensionsFromInputs(inputs: DimensionValues) {
  return {
    container: {
      width: Number(inputs.containerWidth),
      length: Number(inputs.containerLength),
      height: Number(inputs.containerHeight),
    },
    box: {
      width: Number(inputs.boxWidth),
      length: Number(inputs.boxLength),
      height: Number(inputs.boxHeight),
    },
  };
}

export function areDimensionsValid(...dimensions: Dimensions[]) {
  return dimensions.every((dimension) =>
    Object.values(dimension).every(
      (value) =>
        Number.isFinite(value) && value > 0 && value <= MAX_DIMENSION,
    ),
  );
}

export function areCartonInputsValid(cartonTypes: CartonTypeInput[]) {
  return (
    cartonTypes.length > 0 &&
    cartonTypes.every((type) => {
      const dimensions = [
        Number(type.width),
        Number(type.length),
        Number(type.height),
      ];
      const quantity = Number(type.quantity);
      return (
        dimensions.every(
          (dimension) =>
            Number.isFinite(dimension) &&
            dimension > 0 &&
            dimension <= MAX_DIMENSION,
        ) &&
        Number.isSafeInteger(quantity) &&
        quantity >= 0 &&
        quantity <= MAX_BOX_CAPACITY
      );
    })
  );
}

export function summarizeCartons(
  cartons: PackedCarton[],
  container: Dimensions,
): CartonTypeSummary[] {
  const grouped = new Map<string, CartonTypeSummary>();
  for (const carton of cartons) {
    const { width, length, height } = carton.dimensions;
    const key = `${width}x${length}x${height}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.packed += 1;
      existing.requested += 1;
      continue;
    }

    grouped.set(key, {
      id: key,
      dimensions: carton.dimensions,
      requested: 1,
      packed: 1,
      maxFitAlone:
        Math.floor(container.width / width) *
        Math.floor(container.length / length) *
        Math.floor(container.height / height),
    });
  }

  return [...grouped.values()].sort(
    (left, right) =>
      right.dimensions.width * right.dimensions.length * right.dimensions.height -
      left.dimensions.width * left.dimensions.length * left.dimensions.height,
  );
}

export function createCartonInputsFromPlan(
  cartons: PackedCarton[],
  container: Dimensions,
): CartonTypeInput[] {
  return summarizeCartons(cartons, container).map((summary, index) => ({
    id: `carton-${index + 1}`,
    width: String(summary.dimensions.width),
    length: String(summary.dimensions.length),
    height: String(summary.dimensions.height),
    quantity: String(summary.packed),
  }));
}

export function getValidationMessage({
  dimensionsValid,
  customInventory,
  customInventoryValid,
  overflow,
  capacity,
}: {
  dimensionsValid: boolean;
  customInventory: boolean;
  customInventoryValid: boolean;
  overflow: boolean;
  capacity: number;
}) {
  if (!dimensionsValid) {
    return `Enter positive dimensions no larger than ${MAX_DIMENSION.toLocaleString()} units.`;
  }
  if (customInventory && !customInventoryValid) {
    return "Enter valid positive carton dimensions and whole-number quantities for every carton type.";
  }
  if (overflow) {
    return "This packing plan exceeds the preview limits. Reduce the requested quantities or use coarser measurement units.";
  }
  if (capacity === 0) {
    return customInventory
      ? "No requested cartons fit. Add stock or adjust the carton and container dimensions."
      : "No whole cartons fit with these dimensions and the entered orientation.";
  }
  return "";
}

export function getPlaybackStatus(
  playing: boolean,
  direction: "load" | "unload",
  progress: number,
) {
  if (playing) {
    return direction === "load" ? "Loading in progress" : "Unloading in progress";
  }
  if (progress === 0 && direction === "load") return "Ready to load";
  if (progress === 1) {
    return direction === "load" ? "Truck loaded" : "Truck unloaded";
  }
  return "Simulation paused";
}
