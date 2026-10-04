// The Peace Palace drawing, as a plain SVG string so the same artwork is
// used by the React Palace page AND inlined into the static home document
// (scripts/build-home-document.mjs strips the `export` and embeds this file).
// Keep it dependency-free and free of `</script`.
//
// Each level is its own building, matching PALACE_STAGES in peacePalace.js:
// 0 clearing · 1 shack · 2 cottage · 3 manor · 4 towers · 5 castle · 6 bloom.

export function palaceSvg(level, options) {
  const opts = options || {};
  const id = opts.id || "palace";
  const viewBox = opts.viewBox || "0 0 400 280";
  const label = opts.label || "";
  const lvl = Math.max(0, Math.min(6, Math.floor(Number(level) || 0)));

  const SKY_TOP = "#101B33";
  const SKY_BOTTOM = "#22335A";
  const GROUND = "#0C1526";
  const WALL = "#F4EDDE";
  const SHADE = "#DDD2BC";
  const ROOF = "#1C7A6E";
  const ROOF_DARK = "#155E55";
  const DOOR = "#2A2F45";
  const LIT = "#FFD9A0";
  const GLOW = "#00F5D4";
  const BLOOM = "#E9A8B8";
  const WOOD = "#7A5A40";
  const WOOD_DARK = "#4E3A2A";

  const rect = (x, y, w, h, fill, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra || ""}/>`;
  const path = (d, fill, extra) => `<path d="${d}" fill="${fill}" ${extra || ""}/>`;
  const circle = (cx, cy, r, fill, extra) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra || ""}/>`;
  const win = (x, y, w, h, lit) => rect(x, y, w, h, lit || LIT, `rx="1.5"`) + rect(x + w / 2 - 0.5, y, 1, h, SHADE, `opacity="0.6"`);
  const archDoor = (cx, base, w, h, fill) =>
    path(`M ${cx - w / 2} ${base} L ${cx - w / 2} ${base - h + w / 2} Q ${cx} ${base - h - w / 4} ${cx + w / 2} ${base - h + w / 2} L ${cx + w / 2} ${base} Z`, fill || DOOR);
  const crenels = (x, y, w, n) => {
    let s = "";
    const step = w / (n * 2 - 1);
    for (let i = 0; i < n; i += 1) s += rect(x + i * step * 2, y - 5, step, 5, WALL);
    return s;
  };
  const flag = (x, y, colour) => rect(x, y - 16, 1.2, 16, SHADE) + path(`M ${x + 1.2} ${y - 16} L ${x + 11} ${y - 12.5} L ${x + 1.2} ${y - 9} Z`, colour);
  const path2door = (cx) => path(`M ${cx - 7} 216 L ${cx + 7} 216 L ${cx + 24} 262 L ${cx - 24} 262 Z`, SHADE, `opacity="0.22"`);

  const clearing = () =>
    path2door(200) +
    rect(184, 212, 32, 4, SHADE, `rx="2" opacity="0.35"`) +
    rect(198, 196, 2.4, 16, "#6B8F5E") +
    path("M 199 200 Q 190 194 192 188 Q 199 192 199 200 Z", "#7FB37A") +
    path("M 199.6 197 Q 208 191 207 185 Q 200 189 199.6 197 Z", "#8FC48A") +
    circle(200, 214, 3, GLOW, `opacity="0.7"`) + circle(200, 214, 8, GLOW, `opacity="0.18"`);

  const shack = () =>
    path2door(200) +
    rect(172, 186, 56, 30, WOOD) +
    [180, 188, 196, 204, 212, 220].map((x) => rect(x, 186, 1, 30, WOOD_DARK, `opacity="0.55"`)).join("") +
    path("M 164 190 L 236 176 L 238 183 L 166 197 Z", WOOD_DARK) +
    rect(186, 181, 14, 3, WOOD, `transform="rotate(-11 193 182)"`) +
    rect(218, 162, 5, 16, "#5E5A58") +
    rect(194, 198, 12, 18, "#2B1F16") +
    win(177, 194, 11, 8) +
    rect(232, 206, 10, 10, WOOD_DARK, `rx="1"`) +
    circle(176, 198, 9, LIT, `opacity="0.12"`);

  const cottage = () =>
    path2door(200) +
    rect(222, 150, 9, 22, SHADE) +
    circle(228, 142, 4, "#C9D3E0", `opacity="0.25"`) + circle(234, 133, 5.5, "#C9D3E0", `opacity="0.16"`) +
    rect(160, 182, 80, 34, WALL) +
    rect(160, 182, 16, 34, SHADE, `opacity="0.6"`) +
    path("M 150 185 L 200 150 L 250 185 Z", ROOF) +
    path("M 150 185 L 200 150 L 200 156 L 158 185 Z", ROOF_DARK, `opacity="0.6"`) +
    archDoor(200, 216, 12, 18) +
    win(169, 192, 12, 10) + win(219, 192, 12, 10) +
    [128, 138, 148, 252, 262, 272].map((x) => rect(x, 206, 2.5, 12, WOOD)).join("") +
    rect(126, 209, 24, 2, WOOD) + rect(250, 209, 25, 2, WOOD);

  const manor = () =>
    path2door(200) +
    rect(136, 184, 32, 32, WALL) + rect(232, 184, 32, 32, WALL) +
    path("M 130 187 L 168 170 L 168 187 Z", ROOF) + path("M 232 170 L 270 187 L 232 187 Z", ROOF) +
    win(145, 194, 12, 10) + win(243, 194, 12, 10) +
    rect(168, 158, 64, 58, WALL) +
    rect(168, 158, 12, 58, SHADE, `opacity="0.55"`) +
    path("M 160 161 L 200 130 L 240 161 Z", ROOF) +
    rect(214, 132, 8, 18, SHADE) +
    win(176, 168, 12, 10) + win(212, 168, 12, 10) + win(176, 188, 12, 10) + win(212, 188, 12, 10) +
    circle(200, 148, 4, LIT) +
    archDoor(200, 216, 14, 22);

  const frontWall = () =>
    rect(106, 208, 82, 9, SHADE) + rect(212, 208, 82, 9, SHADE) +
    crenels(106, 208, 82, 7) + crenels(212, 208, 82, 7) +
    rect(184, 196, 4, 21, WALL) + rect(212, 196, 4, 21, WALL);

  const tower = (x, h, bloom) =>
    rect(x, 216 - h, 28, h, WALL) +
    rect(x, 216 - h, 10, h, SHADE, `opacity="0.55"`) +
    path(`M ${x - 5} ${216 - h} L ${x + 14} ${216 - h - 24} L ${x + 33} ${216 - h} Z`, ROOF) +
    win(x + 9, 216 - h + 14, 10, 12, bloom ? GLOW : LIT) +
    win(x + 9, 216 - h + 38, 10, 12, LIT) +
    flag(x + 14, 216 - h - 24, bloom ? GLOW : BLOOM);

  const castle = (bloom) =>
    path2door(200) +
    rect(138, 170, 32, 46, WALL) + rect(230, 170, 32, 46, WALL) +
    crenels(138, 170, 32, 3) + crenels(230, 170, 32, 3) +
    win(148, 182, 12, 12) + win(240, 182, 12, 12) +
    rect(168, 138, 64, 78, WALL) +
    rect(168, 138, 12, 78, SHADE, `opacity="0.55"`) +
    crenels(168, 138, 64, 5) +
    rect(186, 108, 28, 30, WALL) +
    path("M 180 108 L 200 76 L 220 108 Z", ROOF) +
    flag(200, 76, bloom ? GLOW : BLOOM) +
    win(195, 116, 10, 12, bloom ? GLOW : LIT) +
    win(176, 152, 12, 12) + win(212, 152, 12, 12) +
    win(176, 176, 12, 12) + win(212, 176, 12, 12) +
    circle(200, 162, 6, bloom ? GLOW : LIT, `opacity="0.85"`) +
    archDoor(200, 216, 16, 26, bloom ? "#1E3D4A" : DOOR);

  const bloomGarden = () =>
    [[120, 230], [150, 238], [176, 246], [226, 246], [252, 238], [282, 230], [104, 240], [296, 242]]
      .map(([x, y]) => circle(x, y, 3.4, BLOOM) + circle(x, y, 1.4, "#FBE3EA")).join("") +
    [[188, 228], [212, 228]].map(([x, y]) => rect(x - 0.8, y - 12, 1.6, 12, SHADE) + circle(x, y - 13, 3, GLOW, `opacity="0.9"`) + circle(x, y - 13, 8, GLOW, `opacity="0.18"`)).join("");

  let building = "";
  if (lvl === 0) building = clearing();
  else if (lvl === 1) building = shack();
  else if (lvl === 2) building = cottage();
  else if (lvl === 3) building = manor() + frontWall();
  else if (lvl === 4) building = tower(110, 72, false) + tower(262, 72, false) + manor() + frontWall();
  else building = tower(108, 86, lvl === 6) + tower(264, 86, lvl === 6) + castle(lvl === 6) + frontWall() + (lvl === 6 ? bloomGarden() : "");

  const stars = [[38, 42], [86, 24], [150, 52], [222, 30], [262, 62], [318, 36], [352, 78], [58, 92], [196, 78], [336, 108], [118, 112], [280, 128]]
    .map(([x, y], i) => circle(x, y, i % 3 === 0 ? 1.6 : 1.1, "#EAF2F6", `opacity="0.55" class="palace-star" style="animation-delay:${(i % 5) * 0.9}s"`)).join("");

  const aura = lvl === 6 ? `<ellipse cx="200" cy="170" rx="150" ry="90" fill="url(#${id}-aura)"/>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice"${label ? ` role="img" aria-label="${label}"` : ` aria-hidden="true" focusable="false"`}>` +
    `<defs>` +
    `<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY_TOP}"/><stop offset="1" stop-color="${SKY_BOTTOM}"/></linearGradient>` +
    `<radialGradient id="${id}-halo" cx="0.78" cy="0.2" r="0.45"><stop offset="0" stop-color="#F2ECDC" stop-opacity="0.34"/><stop offset="1" stop-color="#F2ECDC" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id}-aura"><stop offset="0" stop-color="${GLOW}" stop-opacity="0.22"/><stop offset="1" stop-color="${GLOW}" stop-opacity="0"/></radialGradient>` +
    `</defs>` +
    `<rect width="400" height="280" fill="url(#${id}-sky)"/>` +
    `<rect width="400" height="280" fill="url(#${id}-halo)"/>` +
    stars +
    circle(312, 56, 17, "#F2ECDC", `opacity="0.92"`) +
    circle(319, 50, 16, SKY_TOP, `opacity="0.28"`) +
    aura +
    path("M 0 222 Q 100 204 200 214 Q 300 224 400 208 L 400 280 L 0 280 Z", GROUND) +
    building +
    `</svg>`;
}
