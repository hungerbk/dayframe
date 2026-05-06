import type { ReactNode } from "react";

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function ToggleGroup<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.ariaLabel}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${value === option.value
              ? "bg-white shadow-sm text-slate-700"
              : "text-slate-400 hover:text-slate-600"
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
