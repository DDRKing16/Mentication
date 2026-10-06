import { useId } from 'react';
import TappingContactVisual from './TappingContactVisual';

const FACE_POINTS = new Set(['crown', 'brow', 'sideEye', 'underEye', 'nose', 'chin']);
const BODY = 'M38 548C38 481 39 397 69 365C90 342 124 345 154 314L160 265C136 249 125 222 127 191C111 180 114 154 128 158C120 102 145 60 200 60C255 60 280 102 272 158C286 154 289 180 273 191C275 222 264 249 240 265L246 314C276 345 310 342 331 365C361 397 362 481 362 548Z';

/** Original sculpted vector. Markers are anatomically placed in the same viewBox as the artwork. */
export default function TappingSilhouette({ point, paused = false, quiet = false, overview = false, beat = 0 }) {
  const id = `tapping-${useId().replace(/:/g, '')}`;
  if (overview || point?.id === 'sideEye') return <TappingContactVisual overview={overview} paused={paused} quiet={quiet} beat={beat}/>;
  const hand = point?.id === 'hand' && !overview;
  const face = FACE_POINTS.has(point?.id) && !overview;
  const underArm = point?.id === 'arm' && !overview;
  const body = underArm ? 'M116 548L115 430Q107 386 87 362Q66 345 60 314L39 236Q34 216 42 211Q55 211 63 234L94 301Q114 329 154 314L160 265' + BODY.split('L160 265')[1] : BODY;
  const frame = hand ? '30 112 340 392' : face ? '88 38 224 284' : point?.id === 'arm' && !overview ? '30 228 340 306' : '0 25 400 505';
  const active = !paused && !quiet;
  const x = point?.x || 0, y = point?.y || 0;
  return <svg className={`tap-silhouette ${active ? 'tap-alive' : 'tap-still'} ${overview ? 'tap-overview' : ''}`} viewBox={frame} role="img" aria-label={point ? `Mirror view. ${point.name}: ${point.instruction} Either side is fine.` : 'Sculpted head and upper body in warm gold and deep emerald'}>
    <defs>
      <linearGradient id={`${id}-stone`} x1="0" y1="0" x2="1" y2=".6"><stop stopColor="#506e67"/><stop offset=".3" stopColor="#7e9583"/><stop offset=".52" stopColor="#cad0aa"/><stop offset=".72" stopColor="#748e7c"/><stop offset="1" stopColor="#294d47"/></linearGradient>
      <linearGradient id={`${id}-neck`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#203e39"/><stop offset=".4" stopColor="#718974"/><stop offset=".6" stopColor="#9aaa87"/><stop offset="1" stopColor="#344f42"/></linearGradient>
      <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2=".35"><stop stopColor="#ead7a6"/><stop offset=".44" stopColor="#a8b28d"/><stop offset="1" stopColor="#3a6054"/></linearGradient>
      <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f0deaf" stopOpacity=".8"/><stop offset=".65" stopColor="#b2b991" stopOpacity=".15"/><stop offset="1" stopColor="#728e76" stopOpacity=".05"/></linearGradient>
      <radialGradient id={`${id}-face`} cx=".32" cy=".3" r=".8"><stop stopColor="#d2cfa3"/><stop offset=".38" stopColor="#a3b18c"/><stop offset=".72" stopColor="#5d7c69"/><stop offset="1" stopColor="#2e5148"/></radialGradient>
      <radialGradient id={`${id}-cheek`}><stop stopColor="#e5d6ab" stopOpacity=".7"/><stop offset="1" stopColor="#bdc49c" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-warm`}><stop stopColor="#dbb679" stopOpacity=".18"/><stop offset="1" stopColor="#dbb679" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-fade`} x2="0" y2="1"><stop offset=".7" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
      <mask id={`${id}-soft`}><rect width="400" height="560" fill={`url(#${id}-fade)`}/></mask>
      <clipPath id={`${id}-body`}><path d={body}/></clipPath>
      <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    {!face && <ellipse cx="200" cy="220" rx="197" ry="229" fill={`url(#${id}-warm)`}/>}
    {!hand && <g mask={`url(#${id}-soft)`}>
      <path d={body} fill={`url(#${id}-stone)`} stroke={`url(#${id}-rim)`} strokeWidth="1.1"/>
      <g clipPath={`url(#${id}-body)`}>
        <path d="M161 252L153 315Q179 344 200 346Q223 344 247 315L239 252Z" fill={`url(#${id}-neck)`}/>
        <path d="M152 316Q162 333 180 340L175 387L78 372Q110 349 152 316Z" fill={`url(#${id}-light)`} opacity=".7"/>
        <path d="M247 316Q237 333 220 340L225 387L323 372Q289 349 247 316Z" fill="#193f36" opacity=".25"/>
        <ellipse cx="158" cy="185" rx="43" ry="63" fill={`url(#${id}-cheek)`}/>
        <path d="M157 90Q177 61 214 64Q254 66 269 121Q275 165 269 191Q267 235 238 260Q200 278 165 258Q139 234 132 194Q122 151 132 119Q141 98 157 90Z" fill={`url(#${id}-face)`}/>
        <ellipse cx="172" cy="122" rx="49" ry="52" fill={`url(#${id}-cheek)`} opacity=".5"/>
        <path d="M132 144Q141 133 148 141L152 180L139 203Q130 175 132 144Z" fill="#244e43" opacity=".34"/>
        <path d="M268 131Q263 193 245 220Q240 240 222 258Q253 244 263 216Q278 181 268 131Z" fill="#153d34" opacity=".42"/>
        <path d="M136 168Q154 156 176 163L182 181Q158 186 142 178Z" fill="#315244" opacity=".46"/>
        <path d="M224 163Q246 156 264 168L258 178Q241 186 218 181Z" fill="#244d40" opacity=".56"/>
        <path d="M139 167Q157 162 174 168Q157 177 141 170Z" fill="#d7ceaa" opacity=".6"/>
        <path d="M225 168Q242 162 261 167L260 170Q242 177 226 168Z" fill="#bac4a0" opacity=".5"/>
        <path d="M139 160Q156 151 176 157M224 157Q245 151 263 160" stroke="#25483c" strokeWidth="3.4" fill="none" strokeLinecap="round"/>
        <path d="M186 152Q193 140 198 149L196 189Q187 201 188 207Q200 214 209 205L205 190Q201 170 201 150" fill={`url(#${id}-light)`}/>
        <path d="M186 162L184 193Q177 207 187 211Q200 217 212 207" stroke="#3f604b" strokeWidth="1.2" opacity=".55" fill="none"/>
        <ellipse cx="165" cy="199" rx="32" ry="30" fill={`url(#${id}-cheek)`}/>
        <path d="M182 220Q191 216 200 220Q210 216 219 221Q201 226 182 220Z" fill="#405d49"/>
        <path d="M182 221Q199 228 218 221Q208 234 191 229Z" fill="#a8ad87"/>
        <path d="M191 229Q200 234 211 228M192 242Q201 246 210 241" fill="none" stroke="#e3d3a7" opacity=".35"/>
        <path d="M153 90Q124 137 135 191Q139 235 165 253" fill="none" stroke="#f1deae" strokeWidth="1.5" opacity=".55"/>
        <path d="M160 269Q195 292 239 269Q217 310 200 311Q180 310 160 269" fill="#233f35" opacity=".22"/>
        <path d="M84 365Q136 350 178 330Q189 327 200 337Q211 327 222 330Q269 351 315 365" stroke="#ddcba0" strokeWidth="2" opacity=".42" fill="none"/>
        <path d={underArm ? "M97 354Q121 378 115 430M313 382Q293 416 302 469M200 351V535" : "M87 382Q107 416 98 469M313 382Q293 416 302 469M200 351V535"} fill="none" stroke="#244e3f" strokeWidth="2" opacity=".28"/>
        <path d="M110 390Q159 356 184 376Q200 425 199 511M289 395Q246 366 223 377Q205 425 202 508" fill="none" stroke="#d9c89b" strokeWidth="12" opacity=".1" filter={`url(#${id}-blur)`}/>
      </g>
    </g>}
    {hand && <g>
      <path d="M105 519L115 362Q97 334 88 298L76 262Q75 246 87 242Q100 239 106 254L127 291L131 207Q130 185 143 184Q157 184 158 202L161 264L163 164Q163 145 177 146Q190 146 190 166L193 263L197 179Q198 161 211 162Q224 164 223 183L225 270L231 223Q233 207 245 209Q258 211 256 228L252 319Q248 349 227 369L227 519Z" fill={`url(#${id}-stone)`} stroke={`url(#${id}-rim)`} strokeWidth="1.5" transform="translate(34 0)"/>
      <path d="M147 272Q155 294 170 305Q182 311 203 307M195 289Q216 302 240 290M162 331Q197 343 227 325M151 365Q185 390 226 366" fill="none" stroke="#345345" strokeWidth="1.4" opacity=".48"/>
      <path d="M290 234Q291 284 286 315Q282 346 266 365" fill="none" stroke="#ead3a0" strokeWidth="2" opacity=".7"/>

    </g>}
    {point && <g className="tap-point">
      <circle cx={x} cy={y} r="22" fill="#ffcf78" opacity=".25" filter={`url(#${id}-glow)`}/>
      <circle key={`ripple-${beat}`} className="tap-ripple" cx={x} cy={y} r="13" fill="none" stroke="#f7d99c" strokeWidth=".9"/>
      <circle cx={x} cy={y} r="8" fill="#382f18" fillOpacity=".45" stroke="#ffe4ae" strokeWidth="1.4"/>
      <circle key={`core-${beat}`} className="tap-point-core" cx={x} cy={y} r="3" fill="#fff3d2"/>
    </g>}
  </svg>;
}
