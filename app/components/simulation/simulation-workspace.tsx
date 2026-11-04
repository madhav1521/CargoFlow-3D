"use client";

import type { CSSProperties } from "react";
import { PLAYBACK_SPEEDS, TRUCK_MODES } from "../../constants/simulation";
import type {
  Playback,
  PlaybackTiming,
} from "../../types/simulation";
import type {
  Dimensions,
  FillPercent,
  PackedCarton,
} from "../../truck-spec";
import Icon from "../svg-icon";
import TruckViewer from "../truck-viewer";

type SimulationWorkspaceProps = {
  box: Dimensions;
  capacity: number;
  canRenderTruck: boolean;
  cartonPlan: { cartons: PackedCarton[] };
  container: Dimensions;
  playback: Playback;
  playbackStatus: string;
  playbackTiming: PlaybackTiming;
  selectedFill: FillPercent;
  speed: number;
  actualCount: number;
  actualFillPercent: number;
  validationMessage: string;
  onSelectFill: (fill: FillPercent) => void;
  onStart: (direction: Playback["direction"]) => void;
  onTogglePlayback: () => void;
  onReset: () => void;
  onSeek: (progress: number) => void;
  onSpeedChange: (speed: number) => void;
};

export default function SimulationWorkspace({
  box,
  capacity,
  canRenderTruck,
  cartonPlan,
  container,
  playback,
  playbackStatus,
  playbackTiming,
  selectedFill,
  speed,
  actualCount,
  actualFillPercent,
  validationMessage,
  onSelectFill,
  onStart,
  onTogglePlayback,
  onReset,
  onSeek,
  onSpeedChange,
}: SimulationWorkspaceProps) {
  return (
    <section className="simulation-workspace" aria-label="Loading simulation">
      <div
        className={`scene-panel ${actualFillPercent > 0 ? "amber" : "blue"}`}
      >
        <div className="scene-topline">
          <div>
            <p className="panel-kicker">LIVE 3D FLOOR</p>
            <h2>Loading bay <span>04</span></h2>
          </div>
          <div className="scene-tools">
            <span><i /> REAL-TIME</span>
            <span className="scene-tool-divider" />
            <span><Icon name="rotate" /> DRAG TO ORBIT</span>
          </div>
        </div>
        <div className="scene-modebar">
          <span className="scene-mode-label">SELECT LOAD</span>
          <div className="mode-selector" role="group" aria-label="Truck fill level">
            {TRUCK_MODES.map((mode) => {
              const count = canRenderTruck && mode.fill === 100 ? capacity : 0;
              return (
                <button
                  className={`mode-option ${mode.color} ${selectedFill === mode.fill ? "selected" : ""}`}
                  type="button"
                  key={mode.fill}
                  onClick={() => onSelectFill(mode.fill)}
                  aria-pressed={selectedFill === mode.fill}
                >
                  <span className="mode-percent">
                    {mode.fill}<small>%</small>
                  </span>
                  <span className="mode-copy">
                    <b>{mode.label}</b>
                    <small>{count.toLocaleString()} cartons</small>
                  </span>
                  <span className="mode-check" aria-hidden="true">✓</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="scene-viewport">
          {canRenderTruck ? (
            <TruckViewer
              box={box}
              cartons={cartonPlan.cartons}
              container={container}
              fillPercent={actualFillPercent}
              playback={playback}
              timing={playbackTiming}
            />
          ) : (
            <div className="scene-validation" role="alert">
              <Icon name="box" />
              <span>{validationMessage}</span>
            </div>
          )}
          <div className="scene-coordinate">
            BAY 04 <b>—</b> {actualFillPercent.toFixed(0)}% LOADED
          </div>
          <div className="scene-legend">
            <span><i className="legend-carton" /> CORRUGATED CARTONS</span>
            <span><i className="legend-worker" /> OPERATOR</span>
          </div>
        </div>
        <div className="scene-caption">
          <div className="scene-caption-icon"><Icon name="conveyor" /></div>
          <p>
            <b>ROLLER CONVEYOR</b>
            <span>Cartons move between the operator and truck deck</span>
          </p>
          <span className={`scene-status-chip ${playback.playing ? "moving" : ""}`}>
            <i /> {playbackStatus}
          </span>
        </div>
      </div>

      <aside className="control-panel" aria-labelledby="controls-title">
        <div className="control-panel-header">
          <span className="section-index">02</span>
          <div>
            <p className="panel-kicker">OPERATOR CONTROLS</p>
            <h2 id="controls-title">Run simulation</h2>
          </div>
        </div>

        <div className="active-load-card">
          <div className={`active-load-icon ${actualFillPercent > 0 ? "amber" : "blue"}`}>
            <Icon name="container" />
          </div>
          <div className="active-load-copy">
            <span>ACTIVE LOAD</span>
            <b>{actualFillPercent.toFixed(0)}% <small>shipment</small></b>
          </div>
          <div className="active-load-count">
            <b>{actualCount.toLocaleString()}</b>
            <span>CARTONS</span>
          </div>
        </div>

        <div className="primary-actions">
          <button
            className="action-button load-action"
            type="button"
            onClick={() => onStart("load")}
            disabled={!canRenderTruck}
          >
            <Icon name="load" />
            <span><b>Load truck</b><small>Conveyor → cargo bay</small></span>
            <span className="action-arrow">↗</span>
          </button>
          <button
            className="action-button unload-action"
            type="button"
            onClick={() => onStart("unload")}
            disabled={!canRenderTruck}
          >
            <Icon name="unload" />
            <span><b>Unload truck</b><small>Cargo bay → conveyor</small></span>
            <span className="action-arrow">↙</span>
          </button>
        </div>

        <div className="secondary-actions">
          <button
            className="utility-button"
            type="button"
            onClick={onTogglePlayback}
            disabled={!canRenderTruck || (
              !playback.playing &&
              (playback.progress === 0 || playback.progress === 1)
            )}
          >
            <Icon name={playback.playing ? "pause" : "play"} />
            {playback.playing ? "Pause" : "Resume"}
          </button>
          <button
            className="utility-button"
            type="button"
            onClick={onReset}
            disabled={!canRenderTruck}
          >
            <Icon name="reset" />
            Reset scene
          </button>
        </div>

        <div className="timeline-block">
          <div className="timeline-heading">
            <span>SIMULATION TIMELINE</span>
            <b>{Math.round(playback.progress * 100)}%</b>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(playback.progress * 100)}
            onChange={(event) =>
              onSeek(Number(event.target.value) / 100)
            }
            aria-label="Simulation timeline"
            disabled={!canRenderTruck}
            style={
              {
                "--timeline-progress": `${playback.progress * 100}%`,
              } as CSSProperties
            }
          />
          <div className="timeline-labels">
            <span>{playback.direction === "load" ? "EMPTY" : "LOADED"}</span>
            <span>{playback.direction === "load" ? "LOADED" : "EMPTY"}</span>
          </div>
        </div>

        <label className="speed-row">
          <span><Icon name="speed" /> Playback speed</span>
          <select
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            aria-label="Simulation speed"
            disabled={!canRenderTruck}
          >
            {PLAYBACK_SPEEDS.map((playbackSpeed) => (
              <option value={playbackSpeed} key={playbackSpeed}>
                {playbackSpeed}×
              </option>
            ))}
          </select>
        </label>

        <div className="workflow-steps">
          <span className="workflow-title">HANDLING SEQUENCE</span>
          <div className="workflow-step">
            <span>01</span><Icon name="worker" /><b>Pick &amp; check</b><i />
          </div>
          <div className="workflow-step">
            <span>02</span><Icon name="conveyor" /><b>Conveyor transfer</b><i />
          </div>
          <div className="workflow-step">
            <span>03</span><Icon name="container" /><b>Stack in truck</b><i />
          </div>
        </div>

        <div className="control-footnote">
          <span className="safety-mark">!</span>
          <span>One carton is handled at a time in this visual simulation.</span>
        </div>
      </aside>
    </section>
  );
}
