import { useId } from 'react';

/** Original vector artwork. Point coordinates share the untransformed anatomical viewBox. */
export default function TappingSilhouette({ point, paused = false, quiet = false }) {
  const id = useId().replace(/:/g, '');
  return <svg className={`tap-silhouette ${paused || quiet ? 'tap-still' : ''}`} viewBox="0 0 360 450" role="img" aria-label={point ? `Tapping location: ${point.name}. ${point.instruction}` : 'Sculpted head and upper body silhouette'}>
    <defs>
      <linearGradient id={`${id}-body`} x1="0" x2="1" y2=".3"><stop stopColor="#527773"/><stop offset=".43" stopColor="#1e4246"/><stop offset=".68" stopColor="#294e50"/><stop offset="1" stopColor="#94a68d"/></linearGradient>
      <linearGradient id={`${id}-edge`} x1="0" x2="1"><stop stopColor="#d3b67c" stopOpacity=".2"/><stop offset=".5" stopColor="#e9d1a4"/><stop offset="1" stopColor="#bfa16d" stopOpacity=".3"/></linearGradient>
      <radialGradient id={`${id}-halo`}><stop stopColor="#c99646" stopOpacity=".17"/><stop offset="1" stopColor="#c99646" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-fade`} x2="0" y2="1"><stop offset=".73" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
      <mask id={`${id}-mask`}><rect width="360" height="450" fill={`url(#${id}-fade)`}/></mask>
    </defs>
    <ellipse cx="180" cy="199" rx="172" ry="196" fill={`url(#${id}-halo)`}/>
    <g fill="none" stroke="#ccb27f" strokeWidth=".65" opacity=".2"><ellipse cx="180" cy="205" rx="151" ry="170"/><path d="M25 205H335M180 22V424"/><circle cx="180" cy="205" r="117"/></g>
    <g mask={`url(#${id}-mask)`}>
      <path d="M26 450C31 400 28 330 52 298C70 278 104 280 139 254L145 218C123 202 115 176 117 151C103 145 105 119 117 121C111 78 134 48 180 48C226 48 249 78 243 121C255 119 257 145 243 151C245 176 237 202 215 218L221 254C256 280 290 278 308 298C332 330 329 400 334 450Z" fill={`url(#${id}-body)`} stroke={`url(#${id}-edge)`} strokeWidth="1.4"/>
      <path d="M120 113C129 68 146 58 180 54C209 55 231 74 239 113M144 216Q180 238 216 216M144 237Q180 266 216 237M76 293Q128 282 160 272Q172 269 180 277Q189 269 201 272Q237 284 284 293M180 286V418M81 322Q92 339 94 378M279 322Q268 339 266 378" fill="none" stroke={`url(#${id}-edge)`} strokeWidth="1" opacity=".65"/>
      <g fill="none" stroke="#d9c6a0" strokeWidth="1.5" strokeLinecap="round" opacity=".74">
        <path d="M137 115Q150 108 166 113M194 113Q210 108 223 115M138 132Q151 139 165 131M195 131Q209 139 222 132M179 124L174 156Q180 161 186 156M164 181Q180 177 196 181M169 184Q180 189 191 184M172 195Q180 198 188 195"/>
      </g>
      <path d="M120 93Q117 157 134 185Q141 204 158 214" fill="none" stroke="#e0c68e" strokeWidth="3" opacity=".18"/>
      <path d="M225 74Q240 114 235 162Q232 183 220 196" fill="none" stroke="#e0c68e" strokeWidth="5" opacity=".12"/>
    </g>
    {point?.id === 'hand' && <g><rect x="236" y="208" width="103" height="142" rx="46" fill="#1b383f" stroke="#7c8974"/><path d="M257 328L252 289L249 272Q251 263 257 269L266 283L267 239Q271 232 275 240L275 261L278 233Q282 228 285 236L285 262L289 241Q294 238 296 246L296 270L301 256Q307 254 308 262L309 290Q308 309 298 328" fill={`url(#${id}-body)`} stroke="#c9b58c" strokeWidth="1.4"/></g>}
    {point && <g className="tap-point" style={{ transformOrigin: `${point.x}px ${point.y}px` }}>
      <circle className="tap-ripple" cx={point.x} cy={point.y} r="18" fill="none" stroke="#e5bd73" strokeWidth="1"/>
      <circle cx={point.x} cy={point.y} r="10" fill="#c99646" fillOpacity=".2" stroke="#ebce99" strokeWidth="1"/>
      <circle cx={point.x} cy={point.y} r="4" fill="#fff3d2"/>
    </g>}
  </svg>;
}
