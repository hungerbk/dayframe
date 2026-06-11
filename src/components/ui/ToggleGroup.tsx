import type { ReactNode } from "react";

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  shortLabel?: ReactNode;
  ariaLabel?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function ToggleGroup<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="flex gap-1 bg-background rounded-lg p-1 border border-border">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.ariaLabel}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${value === option.value
              ? "bg-page shadow-sm text-text"
              : "text-text/40 hover:text-text/70"
            }`}
        >
          {option.shortLabel ? (
            <>
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.shortLabel}</span>
            </>
          ) : option.label}
        </button>
      ))}
    </div>
  );
}
