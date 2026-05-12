const variantStyles = {
  primary: "bg-primary text-white hover:bg-[color-mix(in_oklch,var(--color-primary)_85%,black)] active:bg-[color-mix(in_oklch,var(--color-primary)_75%,black)] transition-colors",
  outline: "border border-primary text-primary bg-white hover:bg-primary/20 transition-colors",
  danger: "border border-red-600 bg-white text-red-600 hover:bg-red-600 hover:text-white active:bg-red-700 transition-colors",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: keyof typeof variantStyles;
  className?: string;
}

export default function Button({ children, variant = "primary", className, ...buttonProps }: Props) {
  return (
    <button className={`py-2 rounded-lg font-semibold ${variantStyles[variant]} ${className ?? ""}`} {...buttonProps}>
      {children}
    </button>
  );
}
