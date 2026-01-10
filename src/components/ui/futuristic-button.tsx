import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        outline: "border border-input bg-card hover:bg-muted hover:text-accent-foreground shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        ghost: "hover:bg-muted hover:text-accent-foreground transform hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline transform hover:scale-105",
        glow: "btn-glow text-primary-foreground font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        futuristic: "bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 border border-primary/20 backdrop-blur-sm"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-14 rounded-xl px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const FuturisticButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {(variant === "glow" || variant === "futuristic") && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 animate-pulse-glow rounded-lg blur-sm" />
        )}
        <span className="relative z-10">{children}</span>
      </Comp>
    );
  }
);
FuturisticButton.displayName = "FuturisticButton";

export { FuturisticButton, buttonVariants };