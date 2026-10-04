// The Peace Palace visual. The drawing itself lives in src/lib/palaceArt.js
// so the home screen shows exactly the same building at the same level.
// Ambient motion is plain CSS (palace-* classes) so the app-wide
// `html.reduce-motion` rule stills it automatically.
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { palaceSvg } from "@/lib/palaceArt";

export default function PeacePalace({ level = 0, className = "" }) {
  const markup = useMemo(
    () => palaceSvg(level, { id: "palace-page", label: `The Peace Palace, level ${level + 1} of 7` }),
    [level]
  );
  return (
    <motion.div
      key={level}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`[&>svg]:block [&>svg]:h-auto [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
