import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...props }, ref) => (
    <input
      ref={ref}
      // colorScheme: dark forza date picker / autofill / spinner in tema scuro
      style={{ colorScheme: "dark", ...style }}
      className={cn(
        "w-full h-11 px-4 rounded-xl",
        "bg-white/5 border border-white/10",
        "text-white placeholder:text-white/40",
        "focus:outline-none focus:border-brand-500/60 focus:bg-white/[0.07]",
        "transition-colors duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block text-sm font-medium text-white/80 mb-1.5", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";
