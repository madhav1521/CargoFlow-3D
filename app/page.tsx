"use client";

import CartonInventoryPanel from "./components/simulation/carton-inventory-panel";
import DashboardHeader from "./components/simulation/dashboard-header";
import DimensionPanel from "./components/simulation/dimension-panel";
import LoadSummary from "./components/simulation/load-summary";
import SimulationWorkspace from "./components/simulation/simulation-workspace";
import useTruckSimulation from "./hooks/use-truck-simulation";

export default function HomePage() {
  const simulation = useTruckSimulation();

  return (
    <main className="dashboard">
      <DashboardHeader />

      <section className="dimension-panel" aria-label="Load specification">
        <DimensionPanel
          inputs={simulation.inputs}
          onChange={simulation.updateDimension}
        />
        <CartonInventoryPanel
          mixMode={simulation.mixMode}
          cartonTypes={simulation.cartonTypes}
          summaries={simulation.inventorySummary}
          onCustomize={simulation.customizeCartonMix}
          onAddType={simulation.addCartonType}
          onUseAutomatic={simulation.useAutomaticCartonMix}
          onUpdateType={simulation.updateCartonType}
          onRemoveType={simulation.removeCartonType}
        />
        <div className="dimension-panel-footer">
          <span>Measurements share the same unit.</span>
          <span>Carton counts update with the container and inventory.</span>
        </div>
      </section>

      <SimulationWorkspace
        box={simulation.box}
        capacity={simulation.capacity}
        canRenderTruck={simulation.canRenderTruck}
        cartonPlan={simulation.cartonPlan}
        container={simulation.container}
        playback={simulation.playback}
        playbackStatus={simulation.playbackStatus}
        playbackTiming={simulation.playbackTiming}
        selectedFill={simulation.selectedFill}
        speed={simulation.speed}
        actualCount={simulation.actualCount}
        actualFillPercent={simulation.actualFillPercent}
        validationMessage={simulation.validationMessage}
        onSelectFill={simulation.selectFill}
        onStart={simulation.startSimulation}
        onTogglePlayback={simulation.togglePlayback}
        onReset={simulation.resetSimulation}
        onSeek={simulation.seekSimulation}
        onSpeedChange={simulation.setSpeed}
      />

      <LoadSummary
        capacity={simulation.capacity}
        canRenderTruck={simulation.canRenderTruck}
        selectedFill={simulation.selectedFill}
        onSelectFill={simulation.selectFill}
      />

      <footer className="page-footer">
        <span>CARGO STUDIO <b>·</b> LOADING BAY SIMULATOR</span>
        <span>
          Drag to orbit <i /> Scroll to zoom <i /> Dimensions in shared units
        </span>
      </footer>
    </main>
  );
}
