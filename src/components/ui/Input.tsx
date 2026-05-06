type Props = {
  label: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>

export default function Input({ label, className, ...inputProps }: Props) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-sm font-medium text-(--color-text)">{label}</span>
      <input
        className="px-3 py-2 rounded-lg border border-(--color-border) bg-white text-(--color-text) placeholder-(--color-border) focus:outline-none focus:border-(--color-primary)"
        {...inputProps}
      />
    </label>
  )
}
