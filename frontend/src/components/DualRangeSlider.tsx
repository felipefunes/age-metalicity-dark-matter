interface DualRangeSliderProps {
  domainMin: number;
  domainMax: number;
  valueMin: number;
  valueMax: number;
  step: number;
  onChange: (min: number, max: number) => void;
  formatValue: (value: number) => string;
  ariaLabelMin: string;
  ariaLabelMax: string;
}

export function DualRangeSlider({
  domainMin,
  domainMax,
  valueMin,
  valueMax,
  step,
  onChange,
  formatValue,
  ariaLabelMin,
  ariaLabelMax,
}: DualRangeSliderProps) {
  function handleMinChange(next: number) {
    onChange(Math.min(next, valueMax), valueMax);
  }

  function handleMaxChange(next: number) {
    onChange(valueMin, Math.max(next, valueMin));
  }

  return (
    <div>
      <div className="range-values">
        <span>{formatValue(valueMin)}</span>
        <span>{formatValue(valueMax)}</span>
      </div>
      <div className="dual-range">
        <input
          type="range"
          aria-label={ariaLabelMin}
          min={domainMin}
          max={domainMax}
          step={step}
          value={valueMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
        />
        <input
          type="range"
          aria-label={ariaLabelMax}
          min={domainMin}
          max={domainMax}
          step={step}
          value={valueMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
