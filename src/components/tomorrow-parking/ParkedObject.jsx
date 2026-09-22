import React from "react";

// The same glass object in its closed state. Used after parking and on the
// daytime arrival screen so the note keeps object continuity across the night.
export default function ParkedObject({ caption, large = false }) {
  return (
    <div className={`tpl-object${large ? " tpl-object--lg" : ""}`} aria-hidden="true">
      <div className="tpl-rail tpl-rail--left" />
      <div className="tpl-rail tpl-rail--right" />
      <div className="tpl-shutter-door">
        <div className="tpl-shutter-door__sheen" />
        <div className="tpl-shutter-door__seams tpl-shutter-door__seams--tight" />
        <div className="tpl-shutter-door__lip" />
        <div className="tpl-handle-wrap">
          <div className="tpl-handle tpl-handle--sm">
            {[0, 1, 2, 3].map((i) => <span key={i} className="tpl-handle__grip" />)}
          </div>
          {caption && <span className="tpl-object__caption">{caption}</span>}
        </div>
      </div>
    </div>
  );
}
