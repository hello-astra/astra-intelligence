/** Labelled range input with min/max captions and an optional hint. */
export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-fg-2">
          {label}
        </label>
        <span className="text-sm font-semibold text-fg tabular-nums">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full cursor-pointer accent-[#4f86ff]"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div className="mt-0.5 flex justify-between text-[10px] text-fg-4">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-fg-3">
          {hint}
        </p>
      )}
    </div>
  )
}
