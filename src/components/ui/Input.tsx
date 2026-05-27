interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
}

export default function Input({ label, className, ...inputProps }: Props) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-sm font-medium text-text">{label}</span>
      <input className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text placeholder-border focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed" {...inputProps} />
    </label>
  );
}
