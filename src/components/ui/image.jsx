import * as React from "react";
import { cn } from "@/lib/utils";

// Native/local image component. Mentication bundles its intervention artwork;
// this component never rewrites URLs or requests a hosted image transform.
const Image = React.forwardRef(
  ({ src, alt = "", fittingType = "fill", className, style, onError, ...props }, ref) => (
    <img
      ref={ref}
      src={src || undefined}
      alt={alt}
      className={cn(className)}
      style={{ objectFit: fittingType === "fit" ? "contain" : "cover", ...style }}
      onError={onError}
      {...props}
    />
  )
);

Image.displayName = "Image";

export { Image };
