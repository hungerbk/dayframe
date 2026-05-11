type Props = {
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ children, className, ...buttonProps }: Props) {
  return (
    <button className={`py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 active:opacity-80 transition-opacity ${className ?? ""}`} {...buttonProps}>
      {children}
    </button>
  );
}
