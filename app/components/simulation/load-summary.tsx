import { TRUCK_MODES } from "../../constants/simulation";
import type { FillPercent } from "../../truck-spec";
import Icon from "../svg-icon";

type LoadSummaryProps = {
  capacity: number;
  canRenderTruck: boolean;
  selectedFill: FillPercent;
  onSelectFill: (fill: FillPercent) => void;
};

export default function LoadSummary({
  capacity,
  canRenderTruck,
  selectedFill,
  onSelectFill,
}: LoadSummaryProps) {
  return (
    <section className="load-summary" aria-label="Load comparison summary">
      <div className="summary-title">
        <p className="panel-kicker">LOAD PLAN</p>
        <h2>Two load targets</h2>
      </div>
      {TRUCK_MODES.map((mode, index) => {
        const count = canRenderTruck && mode.fill === 100 ? capacity : 0;
        const fill =
          canRenderTruck && capacity > 0 ? (count / capacity) * 100 : 0;
        return (
          <button
            className={`summary-mode ${mode.color} ${selectedFill === mode.fill ? "selected" : ""}`}
            type="button"
            key={mode.fill}
            onClick={() => onSelectFill(mode.fill)}
            aria-pressed={selectedFill === mode.fill}
          >
            <span className="summary-number">0{index + 1}</span>
            <span className="summary-details">
              <b>{mode.fill}% <small>{mode.label}</small></b>
              <span>
                {count.toLocaleString()} cartons · {fill.toFixed(0)}% actual
              </span>
            </span>
            <span className="summary-meter"><i style={{ width: `${fill}%` }} /></span>
            <span className="summary-select">
              {selectedFill === mode.fill ? "VIEWING" : "VIEW LOAD"}
            </span>
          </button>
        );
      })}
      <div className="summary-total">
        <Icon name="box" />
        <span>MIXED CARTONS IN PLAN</span>
        <b>{canRenderTruck ? capacity.toLocaleString() : "—"}</b>
      </div>
    </section>
  );
}
