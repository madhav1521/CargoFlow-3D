"use client";

import { MAX_BOX_CAPACITY, MAX_DIMENSION } from "../../truck-spec";
import type {
  CartonMixMode,
  CartonTypeInput,
  CartonTypeSummary,
} from "../../types/simulation";

type CartonInventoryPanelProps = {
  mixMode: CartonMixMode;
  cartonTypes: CartonTypeInput[];
  summaries: CartonTypeSummary[];
  onCustomize: () => void;
  onAddType: () => void;
  onUseAutomatic: () => void;
  onUpdateType: (
    id: string,
    key: keyof Omit<CartonTypeInput, "id">,
    value: string,
  ) => void;
  onRemoveType: (id: string) => void;
};

const CARTON_FIELDS = [
  ["width", "Width"],
  ["length", "Length"],
  ["height", "Height"],
  ["quantity", "Quantity"],
] as const;

export default function CartonInventoryPanel({
  mixMode,
  cartonTypes,
  summaries,
  onCustomize,
  onAddType,
  onUseAutomatic,
  onUpdateType,
  onRemoveType,
}: CartonInventoryPanelProps) {
  const isAutomatic = mixMode === "auto";

  return (
    <section
      className="carton-mix"
      aria-labelledby="carton-mix-title"
      aria-label={isAutomatic ? "Generated size mix" : "Define carton sizes"}
    >
      <div className="carton-mix-heading">
        <div>
          <p className="panel-kicker">CARTON INVENTORY</p>
          <h3 id="carton-mix-title">
            {isAutomatic ? "Generated size mix" : "Define carton sizes"}
          </h3>
          <p>
            Quantities are packed in the entered orientation; “fits alone”
            is a per-size estimate, not an additive total.
          </p>
        </div>
        {isAutomatic ? (
          <button
            className="mix-action"
            type="button"
            onClick={onCustomize}
          >
            Customize inventory
          </button>
        ) : (
          <div className="mix-actions">
            <button className="mix-action" type="button" onClick={onAddType}>
              Add carton size
            </button>
            <button
              className="mix-action subtle"
              type="button"
              onClick={onUseAutomatic}
            >
              Use auto mix
            </button>
          </div>
        )}
      </div>

      {isAutomatic ? (
        <AutomaticInventoryTable summaries={summaries} />
      ) : (
        <CustomInventoryList
          cartonTypes={cartonTypes}
          summaries={summaries}
          onRemoveType={onRemoveType}
          onUpdateType={onUpdateType}
        />
      )}
    </section>
  );
}

function AutomaticInventoryTable({
  summaries,
}: {
  summaries: CartonTypeSummary[];
}) {
  return (
    <div
      className="carton-mix-table"
      role="table"
      aria-label="Generated carton sizes and quantities"
    >
      <div className="carton-mix-row carton-mix-table-head" role="row">
        <span role="columnheader">Carton size</span>
        <span role="columnheader">Dimensions · W × L × H</span>
        <span role="columnheader">Packed</span>
        <span role="columnheader">Fits alone</span>
      </div>
      {summaries.map((summary, index) => (
        <div className="carton-mix-row" role="row" key={summary.id}>
          <span className="carton-mix-name" role="cell">
            Carton {String(index + 1).padStart(2, "0")}
          </span>
          <span className="carton-mix-dimensions" role="cell">
            {summary.dimensions.width} × {summary.dimensions.length} ×{" "}
            {summary.dimensions.height}
          </span>
          <b role="cell">{summary.packed.toLocaleString()}</b>
          <span role="cell">{summary.maxFitAlone.toLocaleString()}</span>
        </div>
      ))}
      {summaries.length === 0 && (
        <p className="carton-mix-empty">No cartons fit the current dimensions.</p>
      )}
    </div>
  );
}

function CustomInventoryList({
  cartonTypes,
  summaries,
  onRemoveType,
  onUpdateType,
}: {
  cartonTypes: CartonTypeInput[];
  summaries: CartonTypeSummary[];
  onRemoveType: (id: string) => void;
  onUpdateType: CartonInventoryPanelProps["onUpdateType"];
}) {
  return (
    <div className="carton-type-list">
      {cartonTypes.map((type, index) => {
        const summary = summaries.find((item) => item.id === type.id);
        const requested = Number(type.quantity);
        const unplaced = summary
          ? Math.max(0, summary.requested - summary.packed)
          : 0;
        return (
          <div className="carton-type-row" key={type.id}>
            <div className="carton-type-title">
              <b>Carton {String(index + 1).padStart(2, "0")}</b>
              <span>
                {summary
                  ? `${summary.packed.toLocaleString()} packed · ${summary.maxFitAlone.toLocaleString()} fits alone`
                  : "Enter carton details"}
              </span>
              <button
                className="remove-carton-type"
                type="button"
                onClick={() => onRemoveType(type.id)}
                aria-label={`Remove carton type ${index + 1}`}
              >
                Remove
              </button>
            </div>
            <div className="carton-type-fields">
              {CARTON_FIELDS.map(([key, label]) => (
                <label className="carton-type-field" key={key}>
                  <span>{label}</span>
                  <input
                    type="number"
                    min={key === "quantity" ? 0 : 0.001}
                    max={key === "quantity" ? MAX_BOX_CAPACITY : MAX_DIMENSION}
                    step={key === "quantity" ? 1 : "any"}
                    value={type[key]}
                    onChange={(event) =>
                      onUpdateType(type.id, key, event.target.value)
                    }
                    aria-label={`Carton ${index + 1} ${label.toLowerCase()}`}
                  />
                </label>
              ))}
            </div>
            <p className="carton-type-result">
              {Number.isSafeInteger(requested)
                ? `${unplaced.toLocaleString()} requested cartons do not fit.`
                : "Set a whole-number quantity and positive dimensions."}
            </p>
          </div>
        );
      })}
      {cartonTypes.length === 0 && (
        <p className="carton-mix-empty">
          Add a carton size to build an inventory.
        </p>
      )}
    </div>
  );
}
