import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full h-11 pl-4 pr-10 rounded-xl appearance-none",
          "bg-white/5 border border-white/10",
          "text-white",
          "focus:outline-none focus:border-brand-500/60 focus:bg-white/[0.07]",
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
    </div>
  ),
);
Select.displayName = "Select";
