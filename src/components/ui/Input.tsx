type Props = {
  label: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ label, className, ...inputProps }: Props) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-sm font-medium text-text">{label}</span>
      <input className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text placeholder-border focus:outline-none focus:border-primary" {...inputProps} />
    </label>
  );
}
