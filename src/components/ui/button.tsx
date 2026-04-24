import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium " +
    "transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 " +
    "active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-900/40 hover:from-brand-400 hover:to-brand-600",
        glass:
          "glass text-white hover:bg-white/10",
        ghost:
          "text-white/80 hover:text-white hover:bg-white/5",
        outline:
          "border border-white/15 text-white hover:bg-white/5",
        danger:
          "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";
