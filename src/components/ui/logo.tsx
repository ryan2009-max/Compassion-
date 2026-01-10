import * as React from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = React.ComponentProps<"div"> & {
  imgClassName?: string;
};

const candidates = ["/logo.png", "/logo.svg", "/placeholder.svg"];

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(({ className, imgClassName, ...props }, ref) => {
  const [index, setIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [fallback, setFallback] = React.useState(false);

  const src = candidates[index];

  return (
    <div ref={ref} className={cn(className)} {...props}>
      {src && !loaded && !fallback ? (
        <img
          src={src}
          alt="Logo"
          className={cn("object-contain", imgClassName)}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() =>
            setIndex((prev) => {
              const next = prev + 1;
              if (next < candidates.length) return next;
              setFallback(true);
              return prev;
            })
          }
        />
      ) : loaded && !fallback ? (
        <img src={src} alt="Logo" className={cn(imgClassName)} />
      ) : (
        <Shield className={cn(imgClassName)} />
      )}
    </div>
  );
});
Logo.displayName = "Logo";

export { Logo };
