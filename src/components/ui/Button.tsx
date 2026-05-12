interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export default function Button({ children, className, ...buttonProps }: Props) {
  return (
    <button className={`py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 active:opacity-80 transition-opacity ${className ?? ""}`} {...buttonProps}>
      {children}
    </button>
  );
}
