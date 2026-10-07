import { useEffect, useId, useRef } from 'react';
import { TAPPING_ARTWORK } from './tappingArtwork';

// Anatomical coordinates on the illustration, independent of photo registration.
export const MOTION_POINTS = {
  hand:{x:235,y:300,angle:-56,frame:'80 64 300 388'},
  crown:{x:200,y:75,angle:155,frame:'90 20 220 310'},
  brow:{x:177,y:165,angle:135,scale:.66,frame:'96 72 218 252'},
  sideEye:{x:149,y:186,angle:95,scale:.68,frame:'84 72 240 252'},
  underEye:{x:169,y:204,angle:85,scale:.66,frame:'90 80 226 252'},
  nose:{x:200,y:232,angle:120,scale:.6,frame:'91 100 226 250'},
  chin:{x:200,y:261,angle:70,scale:.66,frame:'91 110 226 250'},
  collar:{x:179,y:355,angle:-42,frame:'35 220 330 275'},
  arm:{x:171,y:378,angle:90,scale:.85,frame:'30 45 310 455'},
};

/** An articulated illustration: two real finger shapes translate into contact
 * and lift away. The torso stays still. The round alone supplies each beat. */
export default function TappingMotionVisual({point,paused=true,quiet=false,beat=0,onArtworkStatus}) {
  const unique=useId().replace(/:/g,'');const p=MOTION_POINTS[point.id];
  const skin=`${unique}skin`,shadow=`${unique}shadow`,hair=`${unique}hair`,cloth=`${unique}cloth`;
  const label=TAPPING_ARTWORK[point.id].placement;
  const report=useRef(onArtworkStatus);report.current=onArtworkStatus;
  useEffect(()=>{report.current?.(point.id,'loaded');},[point.id]);
  return <svg className="tap-motion-visual" viewBox={p.frame} role="img" aria-label={`Illustrated two-finger tapping at ${point.name}. ${point.id==='arm'?'Side view with the arm raised. ':''}${label} Either side is fine.`} data-point={point.id} data-view={point.id==='arm'?'side-torso':'front'}>
    <defs>
      <linearGradient id={skin} x1="0" x2="1" y1="0" y2=".4"><stop stopColor="#b98468"/><stop offset=".48" stopColor="#eac4a5"/><stop offset="1" stopColor="#c38f70"/></linearGradient>
      <linearGradient id={shadow} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#d5a085"/><stop offset="1" stopColor="#a36b53"/></linearGradient>
      <linearGradient id={hair} x1="0" x2="1"><stop stopColor="#172828"/><stop offset=".55" stopColor="#394339"/><stop offset="1" stopColor="#162627"/></linearGradient>
      <linearGradient id={cloth} x1="0" x2="1"><stop stopColor="#446765"/><stop offset=".55" stopColor="#71938a"/><stop offset="1" stopColor="#2e5453"/></linearGradient>
    </defs>
    <ellipse cx="200" cy="305" rx="142" ry="189" fill="#82aaa0" opacity=".06"/>
    {point.id==='hand' ? <g className="tap-receiving-hand" stroke="#865d49" strokeWidth="1.1" strokeLinejoin="round">
      <path d="M176 452L173 346Q156 327 149 300L119 245Q108 232 117 224Q126 215 136 227L157 252L160 139Q162 120 174 125Q181 128 180 146L180 241L192 113Q194 96 205 102Q213 106 208 125L201 237L215 113Q220 98 230 106Q235 111 232 128L217 242L232 139Q236 124 246 132Q251 137 246 156L230 267Q241 302 228 346L253 452Z" fill={`url(#${skin})`}/>
      <path d="M188 285Q205 299 227 283M192 311Q204 318 220 314M171 198L180 197M198 173L207 174M216 171L224 174M232 190L240 193" fill="none" opacity=".4"/>
      <path d="M214 248Q222 267 226 279" fill="none" opacity=".35"/>
    </g> : point.id==='arm' ? <g className="tap-still-body tap-side-torso">
      {/* Complete, connected raised arm and a side profile expose the lateral ribs. */}
      <path d="M199 228L195 255Q183 263 179 284Q164 303 156 345Q153 388 164 432L177 492H281L281 406Q290 350 269 302Q253 265 233 255L230 219Z" fill={`url(#${skin})`} stroke="#a87960" strokeWidth="1.2"/>
      <path d="M182 287Q160 258 151 221L137 181Q127 166 126 151L116 114Q112 101 120 98Q128 96 134 109L142 126L140 94Q139 81 148 80Q156 80 158 92L164 133Q174 151 174 174L190 224Q200 253 196 277Z" fill={`url(#${skin})`} stroke="#9b6f57" strokeWidth="1.2"/>
      <path d="M127 125L142 134M142 151Q153 160 166 153M148 193L167 189M175 281Q181 296 192 300" fill="none" stroke="#a9785e" strokeWidth="1.4" opacity=".6"/>
      <path d="M172 150Q158 99 184 77Q214 57 241 79Q258 92 254 128L250 205L236 242L173 239Z" fill={`url(#${hair})`}/>
      <path d="M189 111Q202 91 226 99Q253 103 257 129L262 147L277 157Q280 162 264 165L263 184Q261 210 238 232Q228 240 218 233L202 215Q179 199 182 166Z" fill={`url(#${skin})`} stroke="#bc866b" strokeWidth="1"/>
      <path d="M180 150Q172 165 184 179Q193 184 195 171" fill={`url(#${skin})`} stroke="#ae7c61" strokeWidth="1"/>
      <path d="M175 147Q165 100 189 83Q217 66 245 89L254 123Q232 110 209 111L195 150Q184 153 175 147Z" fill={`url(#${hair})`}/>
      <path d="M237 133Q246 130 253 137M241 146Q248 142 256 147" fill="none" stroke="#5b4238" strokeWidth="2.3" strokeLinecap="round"/>
      <ellipse cx="250" cy="146" rx="2.2" ry="3" fill="#4e4439"/>
      <path d="M251 186L261 185M246 201Q253 204 258 200" fill="none" stroke="#ad6f63" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M181 304Q173 334 173 354M176 394Q181 419 191 440" fill="none" stroke="#b18066" strokeWidth="1.5" opacity=".6"/>
      <path d="M216 277Q241 275 262 304Q289 344 283 393L194 404Q199 364 197 325Z" fill={`url(#${cloth})`}/>
      <path d="M216 277L222 301M263 391Q231 400 196 404" fill="none" stroke="#aec0aa" strokeWidth="1.2" opacity=".5"/>
      <path d="M179 489Q226 474 281 485L283 506H181Z" fill={`url(#${cloth})`}/>
    </g> : <g className="tap-still-body">
      <path d="M135 130Q128 72 163 59Q204 38 237 73Q269 93 264 162L276 285Q278 327 242 338L135 330Q109 301 126 260Z" fill={`url(#${hair})`}/>
      <path d="M175 270L172 325Q146 336 109 343Q86 348 75 383L64 498H338L325 383Q315 349 291 343Q255 335 228 325L225 270Z" fill={`url(#${skin})`}/>
      <path d="M176 272L224 272L224 307Q205 329 175 306Z" fill={`url(#${shadow})`} opacity=".5"/>
      <path d="M289 342Q321 350 330 393L347 498H312L293 419Z" fill={`url(#${skin})`}/>
      <path d="M135 149Q133 110 156 94Q163 75 189 82Q211 87 232 103Q254 111 252 151L246 226Q240 260 216 283Q203 291 190 283Q158 266 147 228Z" fill={`url(#${skin})`} stroke="#bc866b" strokeWidth="1"/>
      <path d="M140 166Q124 157 130 188Q134 207 148 210M250 166Q267 157 261 189Q258 203 248 210" fill={`url(#${skin})`} stroke="#ae7c61" strokeWidth="1"/>
      <path d="M134 149Q132 102 157 89Q177 63 212 81Q234 81 250 114L251 143Q235 142 217 106Q182 111 155 128Z" fill={`url(#${hair})`}/>
      <path d="M146 147Q132 221 147 289L131 310Q117 238 128 166Z" fill={`url(#${hair})`}/>
      <path d="M177 165Q164 158 153 170M215 165Q229 159 240 170" fill="none" stroke="#5b4238" strokeWidth="3.4" strokeLinecap="round"/>
      <path d="M153 183Q167 175 179 183Q165 188 153 183M215 183Q228 175 239 183Q227 188 215 183" fill="#efddd0" stroke="#805d4f" strokeWidth="1"/>
      <ellipse cx="167" cy="182" rx="3.2" ry="4" fill="#4e4439"/><ellipse cx="227" cy="182" rx="3.2" ry="4" fill="#4e4439"/>
      <path d="M197 178L190 214Q198 221 207 213" fill="none" stroke="#af7c66" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M183 244Q199 237 215 244Q199 254 183 244" fill="#b87366"/><path d="M184 244Q199 246 214 244" fill="none" stroke="#91594d" strokeWidth="1"/>
      <path d="M191 261Q200 264 209 261" fill="none" stroke="#b58670" strokeWidth="1.2"/>
      <path d="M117 345Q141 349 166 351M236 351Q258 349 282 345M190 342Q200 352 210 342" fill="none" stroke="#af7d63" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      <path d="M110 412Q154 420 175 440Q202 450 227 440Q253 420 289 412L312 498H91Z" fill={`url(#${cloth})`}/>
      <path d="M111 414L102 376M289 414L299 377" fill="none" stroke="#568077" strokeWidth="12"/>
      <path d="M170 450Q200 470 230 450" fill="none" stroke="#c8c7a8" strokeWidth="1" opacity=".35"/>
    </g>}
    <g className="tap-motion-location" data-contact-x={p.x} data-contact-y={p.y}>
      <ellipse cx={p.x} cy={p.y} rx="12" ry="9" fill="#ffe2ae" opacity=".18"/>
      <circle cx={p.x} cy={p.y} r="10" fill="none" stroke="#ffe2ae" strokeWidth="1.4"/>
    </g>
    <g transform={`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(${p.scale||1})`}><g transform="translate(-15 4)">
      <g key={beat} className={`tap-finger-rig ${!paused&&!quiet?'is-tapping':''}`} data-beat={beat} data-motion={quiet?'still':paused?'rest':'approach-contact-lift'}>
        <ellipse className="tap-finger-shadow" cx="6" cy="4" rx="16" ry="7" fill="#593d2e" opacity=".2"/>
        <g className="tap-articulated-hand" stroke="#805641" strokeWidth=".8" strokeLinejoin="round">
          <path d="M13 128L6 87Q-7 77-11 58L-15 25Q-16 15-9 14Q-3 14-1 24L4 46L0 9Q-1-2 7-3Q15-3 16 8L21 41L17 6Q16-5 24-5Q32-5 33 5L37 48L45 34Q48 28 53 32Q59 35 55 44L48 63Q45 76 31 90L39 128Z" fill={`url(#${skin})`}/>
          <path d="M3 9Q4 3 9 3Q14 4 14 10L14 17Q8 20 3 17Z" fill="#efcdb4" stroke="#c6967a"/><path d="M20 6Q21 0 26 1Q30 2 31 8L31 15Q25 18 20 15Z" fill="#efcdb4" stroke="#c6967a"/>
          <path d="M4 33L16 31M22 30L33 28M-2 52Q18 43 34 51M6 70Q18 75 30 65M14 92L31 90" fill="none" stroke="#a9785e" opacity=".55"/>
          <path d="M45 39Q35 42 32 55" fill="none" stroke="#ab7b61"/>
          <path d="M14 127L38 126" fill="none" stroke="#ebcead" strokeWidth="1.4" opacity=".6"/>
        </g>
      </g>
    </g></g>
  </svg>;
}
