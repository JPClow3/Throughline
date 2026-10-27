const WEEKDAYS: Array<{ value: number; label: string; short: string }> = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" }
];

export function WeekdayPicker({
  value,
  onChange,
  disabled = false
}: {
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
}) {
  const selected = new Set(value);

  function toggle(day: number) {
    if (disabled) return;
    if (selected.has(day)) {
      onChange(value.filter((item) => item !== day));
      return;
    }
    onChange([...value, day].sort((a, b) => a - b));
  }

  return (
    <div className="weekday-picker" role="group" aria-label="Repeat on weekdays">
      {WEEKDAYS.map((day) => {
        const active = selected.has(day.value);
        return (
          <button
            key={day.value}
            type="button"
            className={`weekday-chip${active ? " active" : ""}`}
            aria-pressed={active}
            aria-label={day.label}
            disabled={disabled}
            onClick={() => toggle(day.value)}
          >
            {day.short}
          </button>
        );
      })}
    </div>
  );
}
