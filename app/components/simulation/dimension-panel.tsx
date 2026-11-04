"use client";

import { DIMENSION_GROUPS } from "../../constants/simulation";
import type {
  DimensionInput,
  DimensionValues,
} from "../../types/simulation";
import Icon from "../svg-icon";

type DimensionPanelProps = {
  inputs: DimensionValues;
  onChange: (key: DimensionInput, value: string) => void;
};

export default function DimensionPanel({
  inputs,
  onChange,
}: DimensionPanelProps) {
  return (
    <div aria-labelledby="dimension-title">
      <div className="dimension-panel-heading">
        <div className="dimension-heading-copy">
          <span className="section-index">01</span>
          <div>
            <p className="panel-kicker">LOAD SPECIFICATION</p>
            <h2 id="dimension-title">Set your load dimensions</h2>
          </div>
        </div>
        <span className="live-indicator"><i /> UPDATING LIVE</span>
      </div>

      <div className="dimension-groups">
        {DIMENSION_GROUPS.map((group) => (
          <fieldset className="dimension-group" key={group.title}>
            <legend>
              <Icon name={group.icon} />
              {group.title}
            </legend>
            <div className="dimension-fields">
              {group.fields.map((field) => (
                <label className="dimension-field" key={field.key}>
                  <span><Icon name={field.icon} />{field.label}</span>
                  <div className="number-entry">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={inputs[field.key]}
                      onChange={(event) =>
                        onChange(field.key, event.target.value)
                      }
                      aria-label={`${group.title} ${field.label.toLowerCase()}`}
                    />
                    <small>u</small>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

    </div>
  );
}
