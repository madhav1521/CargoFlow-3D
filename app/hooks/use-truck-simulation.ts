"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CARTON_HANDLING_DURATION_MS,
  DOOR_ACTION_DURATION_MS,
  INITIAL_DIMENSION_VALUES,
  INITIAL_PLAYBACK,
  INITIAL_SPEED,
  SIMULATION_TICK_MS,
  WORKER_APPROACH_DURATION_MS,
} from "../constants/simulation";
import type {
  CartonMixMode,
  CartonTypeInput,
  DimensionInput,
  Playback,
  PlaybackDirection,
  PlaybackTiming,
  TruckSimulationState,
} from "../types/simulation";
import {
  createCartonInventoryPlan,
  createMixedCartonPlan,
  DEFAULT_BOX,
  type FillPercent,
} from "../truck-spec";
import {
  areCartonInputsValid,
  areDimensionsValid,
  createCartonInputsFromPlan,
  getDimensionsFromInputs,
  getPlaybackStatus,
  getValidationMessage,
  summarizeCartons,
} from "../utils/carton-inventory";

export default function useTruckSimulation(): TruckSimulationState {
  const [inputs, setInputs] = useState(INITIAL_DIMENSION_VALUES);
  const [mixMode, setMixMode] = useState<CartonMixMode>("auto");
  const [cartonTypes, setCartonTypes] = useState<CartonTypeInput[]>([]);
  const [selectedFill, setSelectedFill] = useState<FillPercent>(100);
  const [playback, setPlayback] = useState<Playback>(INITIAL_PLAYBACK);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const playbackRef = useRef(playback);
  const nextCartonTypeId = useRef(1);

  const { container, box } = useMemo(
    () => getDimensionsFromInputs(inputs),
    [inputs],
  );
  const dimensionsValid = areDimensionsValid(container, box);
  const automaticPlan = useMemo(
    () => createMixedCartonPlan(container, box),
    [box, container],
  );
  const customInventoryValid = areCartonInputsValid(cartonTypes);
  const customPlan = useMemo(
    () =>
      createCartonInventoryPlan(
        container,
        cartonTypes.map((type) => ({
          id: type.id,
          dimensions: {
            width: Number(type.width),
            length: Number(type.length),
            height: Number(type.height),
          },
          quantity: Number(type.quantity),
        })),
      ),
    [cartonTypes, container],
  );
  const cartonPlan =
    mixMode === "auto" ? automaticPlan : customPlan;
  const capacity = cartonPlan.cartons.length;
  const inventorySummary =
    mixMode === "auto"
      ? summarizeCartons(automaticPlan.cartons, container)
      : customPlan.summaries.map((summary) => ({
          id: summary.id,
          dimensions: summary.dimensions,
          requested: summary.quantity,
          packed: summary.packed,
          maxFitAlone: summary.maxFitAlone,
        }));
  const validationMessage = getValidationMessage({
    dimensionsValid,
    customInventory: mixMode === "custom",
    customInventoryValid,
    overflow: cartonPlan.overflow,
    capacity,
  });
  const canRenderTruck = validationMessage.length === 0;
  const playbackTiming = useMemo<PlaybackTiming>(() => {
    const cartonHandlingDuration =
      Math.max(1, capacity) * CARTON_HANDLING_DURATION_MS / speed;
    const workerApproachDuration = WORKER_APPROACH_DURATION_MS / speed;
    const doorActionDuration = DOOR_ACTION_DURATION_MS / speed;
    const totalDuration =
      cartonHandlingDuration + workerApproachDuration + doorActionDuration;
    return {
      loadApproachStart: cartonHandlingDuration / totalDuration,
      loadDoorStart:
        (cartonHandlingDuration + workerApproachDuration) / totalDuration,
      unloadDoorEnd: doorActionDuration / totalDuration,
      unloadCartonsStart:
        (doorActionDuration + workerApproachDuration) / totalDuration,
      totalDuration,
    };
  }, [capacity, speed]);
  const cargoProgress =
    playback.direction === "load"
      ? Math.min(1, playback.progress / playbackTiming.loadApproachStart)
      : Math.max(
          0,
          Math.min(
            1,
            (playback.progress - playbackTiming.unloadCartonsStart) /
              (1 - playbackTiming.unloadCartonsStart),
          ),
        );
  const actualCount = canRenderTruck
    ? playback.direction === "load"
      ? Math.floor(cargoProgress * capacity)
      : capacity - Math.floor(cargoProgress * capacity)
    : 0;
  const actualFillPercent =
    capacity > 0 ? (actualCount / capacity) * 100 : 0;

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    if (!playback.playing) return;

    const startedAt = performance.now();
    const startingProgress = playbackRef.current.progress;
    const interval = window.setInterval(() => {
      const progress = Math.min(
        1,
        startingProgress +
          (performance.now() - startedAt) / playbackTiming.totalDuration,
      );
      setPlayback((current) => {
        if (current.runId !== playback.runId) return current;
        const next = { ...current, progress, playing: progress < 1 };
        playbackRef.current = next;
        return next;
      });
    }, SIMULATION_TICK_MS);

    return () => window.clearInterval(interval);
  }, [playback.playing, playback.runId, playbackTiming]);

  function updatePlayback(next: Playback) {
    playbackRef.current = next;
    setPlayback(next);
  }

  function updateDimension(key: DimensionInput, value: string) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function customizeCartonMix() {
    const types = createCartonInputsFromPlan(automaticPlan.cartons, container);
    setCartonTypes(types);
    nextCartonTypeId.current = types.length + 1;
    setMixMode("custom");
  }

  function addCartonType() {
    const id = `carton-${nextCartonTypeId.current}`;
    nextCartonTypeId.current += 1;
    setCartonTypes((current) => [
      {
        id,
        width: String(DEFAULT_BOX.width),
        length: String(DEFAULT_BOX.length),
        height: String(DEFAULT_BOX.height),
        quantity: "0",
      },
      ...current,
    ]);
  }

  function updateCartonType(
    id: string,
    key: keyof Omit<CartonTypeInput, "id">,
    value: string,
  ) {
    setCartonTypes((current) =>
      current.map((type) =>
        type.id === id ? { ...type, [key]: value } : type,
      ),
    );
  }

  function removeCartonType(id: string) {
    setCartonTypes((current) =>
      current.filter((type) => type.id !== id),
    );
  }

  function startSimulation(direction: PlaybackDirection) {
    setSelectedFill(direction === "load" ? 100 : 0);
    updatePlayback({
      direction,
      progress: 0,
      playing: true,
      runId: playbackRef.current.runId + 1,
    });
  }

  function selectFill(fill: FillPercent) {
    setSelectedFill(fill);
    updatePlayback({
      direction: fill === 100 ? "load" : "unload",
      progress: 1,
      playing: false,
      runId: playbackRef.current.runId + 1,
    });
  }

  function togglePlayback() {
    const current = playbackRef.current;
    updatePlayback({
      ...current,
      playing: !current.playing,
      runId: current.runId + 1,
    });
  }

  function seekSimulation(progress: number) {
    updatePlayback({
      ...playbackRef.current,
      progress,
      playing: false,
      runId: playbackRef.current.runId + 1,
    });
  }

  function resetSimulation() {
    setSelectedFill(0);
    updatePlayback({
      direction: "load",
      progress: 0,
      playing: false,
      runId: playbackRef.current.runId + 1,
    });
  }

  return {
    inputs,
    container,
    box,
    cartonTypes,
    mixMode,
    cartonPlan,
    inventorySummary,
    capacity,
    actualCount,
    actualFillPercent,
    validationMessage,
    canRenderTruck,
    playback,
    playbackTiming,
    playbackStatus: getPlaybackStatus(
      playback.playing,
      playback.direction,
      playback.progress,
    ),
    selectedFill,
    speed,
    updateDimension,
    updateCartonType,
    addCartonType,
    removeCartonType,
    customizeCartonMix,
    useAutomaticCartonMix: () => setMixMode("auto"),
    updatePlayback,
    startSimulation,
    selectFill,
    togglePlayback,
    seekSimulation,
    resetSimulation,
    setSpeed,
  };
}
