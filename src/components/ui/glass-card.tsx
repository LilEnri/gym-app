import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type Variant = "default" | "strong" | "brand";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  default: "glass",
  strong: "glass-strong",
  brand: "glass-brand",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl p-5", variantClass[variant], className)}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";
