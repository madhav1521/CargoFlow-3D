export type Dimensions = {
  width: number;
  length: number;
  height: number;
};

export type FillPercent = 0 | 100;

export type PackedCarton = {
  typeId?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  dimensions: Dimensions;
};

export type MixedCartonPlan = {
  cartons: PackedCarton[];
  overflow: boolean;
};

export type CartonInventoryType = {
  id: string;
  dimensions: Dimensions;
  quantity: number;
};

export type CartonInventorySummary = CartonInventoryType & {
  packed: number;
  maxFitAlone: number;
};

export type CartonInventoryPlan = {
  cartons: PackedCarton[];
  overflow: boolean;
  summaries: CartonInventorySummary[];
};

export const DEFAULT_CONTAINER: Dimensions = {
  width: 100,
  length: 200,
  height: 80,
};

export const DEFAULT_BOX: Dimensions = {
  width: 10,
  length: 10,
  height: 10,
};

export const MAX_BOX_CAPACITY = 20_000;
export const MAX_DIMENSION = 10_000;
const MAX_PACKING_CELLS = 2_000_000;

export function getCapacity(container: Dimensions, box: Dimensions) {
  return (
    Math.floor(container.width / box.width) *
    Math.floor(container.length / box.length) *
    Math.floor(container.height / box.height)
  );
}

export function getBoxCount(fillPercent: FillPercent, capacity: number) {
  return Math.round((capacity * fillPercent) / 100);
}

export function createMixedCartonPlan(
  container: Dimensions,
  baseCarton: Dimensions,
): MixedCartonPlan {
  const cells = {
    width: Math.floor(container.width / baseCarton.width),
    length: Math.floor(container.length / baseCarton.length),
    height: Math.floor(container.height / baseCarton.height),
  };
  const cellCount = cells.width * cells.length * cells.height;
  if (
    !Number.isSafeInteger(cellCount) ||
    cellCount <= 0 ||
    cellCount > MAX_PACKING_CELLS
  ) {
    return { cartons: [], overflow: true };
  }

  const occupied = new Uint8Array(cellCount);
  const indexOf = (x: number, y: number, z: number) =>
    (z * cells.height + y) * cells.width + x;
  const variants = [
    [2, 2, 2],
    [2, 1, 2],
    [1, 2, 2],
    [2, 2, 1],
    [1, 1, 2],
    [2, 1, 1],
    [1, 2, 1],
    [1, 1, 1],
  ];
  const cartons: PackedCarton[] = [];
  let seed =
    Math.floor(container.width * 17 + container.length * 31 + container.height * 13) ^
    Math.floor(baseCarton.width * 7 + baseCarton.length * 11 + baseCarton.height * 19);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };

  const fits = (
    x: number,
    y: number,
    z: number,
    shape: number[],
  ) => {
    const [shapeWidth, shapeLength, shapeHeight] = shape;
    if (
      x + shapeWidth > cells.width ||
      y + shapeHeight > cells.height ||
      z + shapeLength > cells.length
    ) {
      return false;
    }

    for (let dz = 0; dz < shapeLength; dz += 1) {
      for (let dy = 0; dy < shapeHeight; dy += 1) {
        for (let dx = 0; dx < shapeWidth; dx += 1) {
          if (occupied[indexOf(x + dx, y + dy, z + dz)]) return false;
        }
      }
    }
    return true;
  };

  const markOccupied = (
    x: number,
    y: number,
    z: number,
    shape: number[],
  ) => {
    for (let dz = 0; dz < shape[1]; dz += 1) {
      for (let dy = 0; dy < shape[2]; dy += 1) {
        for (let dx = 0; dx < shape[0]; dx += 1) {
          occupied[indexOf(x + dx, y + dy, z + dz)] = 1;
        }
      }
    }
  };

  for (let z = 0; z < cells.length; z += 1) {
    for (let y = 0; y < cells.height; y += 1) {
      for (let x = 0; x < cells.width; x += 1) {
        if (occupied[indexOf(x, y, z)]) continue;

        const candidates = variants
          .map((shape) => ({ shape, volume: shape[0] * shape[1] * shape[2] }))
          .filter(({ shape }) => fits(x, y, z, shape))
          .sort((left, right) => right.volume - left.volume);
        const largestVolume = candidates[0]?.volume ?? 1;
        const variedCandidates = candidates.filter(
          ({ volume }) => volume >= largestVolume / 2,
        );
        const chosen =
          variedCandidates[Math.floor(random() * variedCandidates.length)];
        if (!chosen) continue;

        markOccupied(x, y, z, chosen.shape);
        const dimensions = {
          width: baseCarton.width * chosen.shape[0],
          length: baseCarton.length * chosen.shape[1],
          height: baseCarton.height * chosen.shape[2],
        };
        cartons.push({
          dimensions,
          position: {
            x:
              -container.width / 2 +
              x * baseCarton.width +
              dimensions.width / 2,
            y: y * baseCarton.height + dimensions.height / 2,
            z:
              -container.length / 2 +
              z * baseCarton.length +
              dimensions.length / 2,
          },
        });
        if (cartons.length > MAX_BOX_CAPACITY) {
          return { cartons: [], overflow: true };
        }
      }
    }
  }

  return { cartons, overflow: false };
}

function greatestCommonDivisor(left: number, right: number) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function createCartonInventoryPlan(
  container: Dimensions,
  inventory: CartonInventoryType[],
): CartonInventoryPlan {
  const summaries = inventory.map((type) => ({
    ...type,
    packed: 0,
    maxFitAlone:
      Math.floor(container.width / type.dimensions.width) *
      Math.floor(container.length / type.dimensions.length) *
      Math.floor(container.height / type.dimensions.height),
  }));
  const requestedTotal = summaries.reduce(
    (total, type) => total + type.quantity,
    0,
  );
  if (
    !Number.isSafeInteger(requestedTotal) ||
    requestedTotal > MAX_BOX_CAPACITY
  ) {
    return { cartons: [], overflow: true, summaries };
  }
  if (requestedTotal === 0) {
    return { cartons: [], overflow: false, summaries };
  }

  const activeTypes = summaries.filter((type) => type.quantity > 0);
  const scale = 1000;
  const allDimensions = [
    container.width,
    container.length,
    container.height,
    ...activeTypes.flatMap((type) => [
      type.dimensions.width,
      type.dimensions.length,
      type.dimensions.height,
    ]),
  ];
  const scaledDimensions = allDimensions.map((dimension) =>
    Math.round(dimension * scale),
  );
  if (
    allDimensions.some(
      (dimension, index) =>
        Math.abs(scaledDimensions[index] / scale - dimension) > 0.000001,
    )
  ) {
    return { cartons: [], overflow: true, summaries };
  }

  const unit = scaledDimensions.reduce(greatestCommonDivisor);
  if (!unit) return { cartons: [], overflow: true, summaries };
  const cellSize = unit / scale;
  const cells = {
    width: Math.round(container.width / cellSize),
    length: Math.round(container.length / cellSize),
    height: Math.round(container.height / cellSize),
  };
  const cellCount = cells.width * cells.length * cells.height;
  if (
    !Number.isSafeInteger(cellCount) ||
    cellCount <= 0 ||
    cellCount > MAX_PACKING_CELLS
  ) {
    return { cartons: [], overflow: true, summaries };
  }

  const occupied = new Uint8Array(cellCount);
  const indexOf = (x: number, y: number, z: number) =>
    (z * cells.height + y) * cells.width + x;
  const cartons: PackedCarton[] = [];
  const packingOrder = activeTypes
    .map((type) => ({
      type,
      width: Math.round(type.dimensions.width / cellSize),
      length: Math.round(type.dimensions.length / cellSize),
      height: Math.round(type.dimensions.height / cellSize),
    }))
    .sort(
      (left, right) =>
        right.width * right.length * right.height -
        left.width * left.length * left.height,
    );

  for (const item of packingOrder) {
    const { type, width, length, height } = item;
    for (let count = 0; count < type.quantity; count += 1) {
      let placed = false;
      for (let z = 0; z + length <= cells.length && !placed; z += 1) {
        for (let y = 0; y + height <= cells.height && !placed; y += 1) {
          for (let x = 0; x + width <= cells.width && !placed; x += 1) {
            let fits = true;
            for (let dz = 0; dz < length && fits; dz += 1) {
              for (let dy = 0; dy < height && fits; dy += 1) {
                for (let dx = 0; dx < width; dx += 1) {
                  if (occupied[indexOf(x + dx, y + dy, z + dz)]) {
                    fits = false;
                    break;
                  }
                }
              }
            }
            if (!fits) continue;

            for (let dz = 0; dz < length; dz += 1) {
              for (let dy = 0; dy < height; dy += 1) {
                for (let dx = 0; dx < width; dx += 1) {
                  occupied[indexOf(x + dx, y + dy, z + dz)] = 1;
                }
              }
            }
            cartons.push({
              typeId: type.id,
              dimensions: type.dimensions,
              position: {
                x:
                  -container.width / 2 +
                  x * cellSize +
                  type.dimensions.width / 2,
                y: y * cellSize + type.dimensions.height / 2,
                z:
                  -container.length / 2 +
                  z * cellSize +
                  type.dimensions.length / 2,
              },
            });
            type.packed += 1;
            placed = true;
          }
        }
      }
      if (!placed) break;
    }
  }

  cartons.sort(
    (left, right) =>
      left.position.z - left.dimensions.length / 2 -
        (right.position.z - right.dimensions.length / 2) ||
      left.position.y - right.position.y ||
      left.position.x - right.position.x,
  );

  return { cartons, overflow: false, summaries };
}
