import { useEffect, useId, useRef } from 'react';
import { TAPPING_ARTWORK } from './tappingArtwork';

// Authored anatomical coordinates on this illustration.
export const MOTION_POINTS = {
  hand:{x:216,y:218,angle:72,scale:.85,frame:'50 65 235 290'},
  crown:{x:180,y:30,angle:65,scale:.82,frame:'65 0 230 260'},
  brow:{x:161,y:131,angle:105,scale:.7,frame:'85 60 195 220'},
  sideEye:{x:118,y:151,angle:75,scale:.7,frame:'60 65 210 230'},
  underEye:{x:140,y:173,angle:85,scale:.7,frame:'80 80 195 230'},
  nose:{x:180,y:196,angle:95,scale:.68,frame:'100 115 165 205'},
  chin:{x:180,y:229,angle:100,scale:.7,frame:'95 135 175 215'},
  collar:{x:153,y:301,angle:85,scale:.95,frame:'65 220 235 205'},
  arm:{x:163,y:348,angle:-68,scale:.8,frame:'100 170 215 230'},
};

// A tapered continuous limb: broad upper arm, a rounded elbow, a narrow wrist.
function forearmContour(side,hand,wrist,scale) {
  const segments=hand?[[[65,403],[63,346],[72,286],[wrist.x,wrist.y]]]:side?[[[266,295],[293,320],[302,356],[282,360]],[[282,360],[259,365],[249,331],[wrist.x,wrist.y]]]:[[[99,307],[88,323],[70,353],[59,339]],[[59,339],[48,323],[65,216],[wrist.x,wrist.y]]];
  const left=[],right=[];
  segments.forEach((points,segment)=>{
    for(let i=0;i<=32;i++){
      const t=i/32,u=1-t,[a,b,c,d]=points;
      const x=u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],y=u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1];
      const dx=3*u*u*(b[0]-a[0])+6*u*t*(c[0]-b[0])+3*t*t*(d[0]-c[0]),dy=3*u*u*(b[1]-a[1])+6*u*t*(c[1]-b[1])+3*t*t*(d[1]-c[1]),length=Math.hypot(dx,dy)||1;
      const start=segment===0?16:17,end=segment===segments.length-1?11*scale:17,width=start+(end-start)*t;
      left.push([x-dy/length*width,y+dx/length*width]);right.push([x+dy/length*width,y-dx/length*width]);
    }
  });
  return 'M'+[...left,...right.reverse()].map(p=>p.map(n=>n.toFixed(2)).join(' ')).join('L')+'Z';
}

function Portrait({skin,hair,cloth,side}) {
  if(side)return <g className="tap-still-body tap-side-torso">
    <path d="M168 208C177 222 184 238 181 259C160 259 148 244 141 224L111 120C106 109 100 100 102 88L99 43C99 31 105 28 110 39L119 66L121 32C121 21 128 20 131 30L135 78C142 93 140 104 136 117L169 205Z" fill={skin} stroke="#b09b81"/>
    <path d="M179 231C175 251 160 268 152 287C146 313 156 350 164 402L273 410C280 369 279 334 267 295C259 270 242 257 221 250L219 218Z" fill={skin} stroke="#b09b81"/>
    <path d="M174 74C164 50 178 30 199 28C222 23 247 44 246 77L239 185L200 226L175 186Z" fill={hair}/>
    <path d="M192 77C208 63 230 68 240 86L247 119L261 134C264 138 260 141 250 143L248 171C246 191 230 211 218 214C203 212 185 192 182 165L181 110Z" fill={skin} stroke="#b09b81"/>
    <path d="M173 104C163 110 169 131 185 133L189 108" fill={skin} stroke="#b09b81"/>
    <path d="M171 100C168 67 181 39 203 38C223 37 238 54 242 84C221 80 202 74 190 92L182 115Z" fill={hair}/>
    <path d="M222 105Q233 102 242 109M226 123Q234 129 243 122M239 164Q247 166 249 162M233 181Q242 184 246 178" fill="none" stroke="#826e60" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M178 260Q167 269 163 279M152 324Q154 343 160 355" fill="none" stroke="#ac9279" strokeWidth="1.3"/>
    <path d="M227 253L240 258L238 280Q264 284 270 302L275 405L168 402L164 359Q185 348 187 322L205 279L218 274Z" fill={cloth}/>
    <path d="M217 277Q232 284 246 278M188 335Q205 344 233 337" fill="none" stroke="#718c81"/>
  </g>;
  return <g className="tap-still-body">
    <path d="M112 140C97 97 106 56 141 38C165 21 205 20 229 48C252 66 260 105 247 150C242 192 250 230 236 247Q227 254 217 245L215 213L136 208Q138 239 124 250Q109 245 111 226Z" fill={hair}/>
    <path d="M156 231L154 279C135 284 111 286 94 299C81 311 76 338 75 381L283 381C281 338 278 311 262 299C244 287 222 285 207 279L204 231Z" fill={skin} stroke="#b09b81"/>
    <path d="M157 235Q182 258 204 235L205 268Q180 278 155 266Z" fill="#baa186" opacity=".35"/>
    <path d="M118 118C117 78 142 53 174 53C210 52 238 78 239 118L233 190C228 219 208 242 185 249C161 249 137 224 128 197Z" fill={skin} stroke="#b09b81"/>
    <path d="M120 136C103 124 105 153 122 163M237 135C252 125 251 153 235 163" fill={skin} stroke="#b09b81"/>
    <path d="M113 123C105 78 124 45 155 35C184 21 218 39 235 65L241 100C219 78 201 59 177 60C145 66 128 81 124 122Z" fill={hair}/>
    <path d="M120 100C109 138 110 191 124 225M226 66C239 111 239 170 230 214M136 57Q162 32 190 42M124 83C137 52 164 43 188 49M130 72C148 46 177 39 200 51M143 56Q174 32 209 61M114 119Q110 174 119 202M238 114Q241 161 236 197" fill="none" stroke="#657469" strokeWidth=".85" opacity=".5"/>
    <path d="M161 131Q144 125 129 135M200 131Q216 126 230 135" fill="none" stroke="#766456" strokeWidth="2.3" strokeLinecap="round"/>
    <path d="M122 151Q138 160 154 151M201 151Q216 160 231 151" fill="none" stroke="#826e60" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M124 153L122 156M132 157L131 160M224 156L225 159" stroke="#826e60" strokeWidth=".8"/>
    <path d="M181 147C180 160 175 174 174 180Q179 189 188 183" fill="none" stroke="#aa927b" strokeWidth="1.1" strokeLinecap="round"/>
    <path d="M164 211Q180 202 196 211Q181 223 164 211" fill="#c49984" opacity=".85"/>
    <path d="M165 211Q180 215 195 211M172 229Q180 232 189 229" fill="none" stroke="#977b69" strokeWidth=".9" strokeLinecap="round"/>
    <path d="M109 290Q133 294 155 288M202 288Q226 294 251 290M174 279Q180 283 187 279" fill="none" stroke="#ac9279" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M104 303L116 300L126 327Q178 351 236 327L246 300L257 304L273 382H87Z" fill={cloth}/>
    <path d="M126 327Q178 351 236 327M120 354Q180 372 243 352" fill="none" stroke="#718c81"/>
  </g>;
}

/** A connected forearm and relaxed two-finger hand, articulated at the wrist. */
export default function TappingMotionVisual({point,paused=true,quiet=false,beat=0,beatMs=600,onArtworkStatus,onRhythmStart}) {
  const id=useId().replace(/:/g,'');const p=MOTION_POINTS[point.id],r=p.angle*Math.PI/180;
  const wrist={x:p.x-Math.sin(r)*82*p.scale,y:p.y+Math.cos(r)*82*p.scale};
  const skin=`url(#${id}-skin)`,hair='#384d45',cloth='#345e58';
  const report=useRef(onArtworkStatus);report.current=onArtworkStatus;
  const rhythm=useRef(onRhythmStart);rhythm.current=onRhythmStart;
  useEffect(()=>{report.current?.(point.id,'loaded');},[point.id]);
  const side=point.id==='arm',hand=point.id==='hand';
  return <svg className="tap-motion-visual" viewBox={p.frame} role="img" aria-label={`Two fingertips at ${point.name}. ${side?'Side view with a raised arm. ':''}${TAPPING_ARTWORK[point.id].placement} Either side is fine.`} data-point={point.id} data-view={side?'side-torso':hand?'hands':'front'}>
    <defs>
      <linearGradient id={`${id}-skin`} x1=".15" y1="0" x2=".9" y2=".65"><stop stopColor="#eee0c8"/><stop offset=".52" stopColor="#dcc8aa"/><stop offset="1" stopColor="#c7ae90"/></linearGradient>
      <radialGradient id={`${id}-halo`}><stop stopColor="#577d70" stopOpacity=".28"/><stop offset="1" stopColor="#577d70" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1"><stop offset=".82" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
      <mask id={`${id}-body-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="440"><rect width="360" height="440" fill={`url(#${id}-fade)`}/></mask>
    </defs>
    <ellipse cx="180" cy="196" rx="168" ry="192" fill={`url(#${id}-halo)`}/>
    <g mask={`url(#${id}-body-mask)`}>{hand?<g className="tap-receiving-hand">
      <path d="M166 369L164 263C145 249 137 229 135 211L115 164C109 153 115 145 122 152L143 180L149 80C150 66 159 66 160 78L163 153L171 58C172 46 181 49 182 61L179 152L190 65C192 53 201 57 200 69L194 158L208 88C211 76 220 80 218 92L211 191C221 220 216 249 204 268L222 369Z" fill={skin} stroke="#b09b81"/>
      <path d="M151 190Q168 176 190 183M168 229Q183 238 205 223M158 104L164 104M176 95L181 95M193 104L199 105M207 127L214 129M165 263Q185 272 204 268" fill="none" stroke="#a99179" opacity=".7"/>
    </g>:<Portrait skin={skin} hair={hair} cloth={cloth} side={side}/>}
    <path className="tap-connected-forearm" d={forearmContour(side,hand,wrist,p.scale)} fill={skin} stroke="#b09b81" strokeWidth=".8" strokeLinejoin="round"/></g>
    <g className="tap-motion-location" data-contact-x={p.x} data-contact-y={p.y}><circle cx={p.x} cy={p.y} r="10" fill="none" stroke="#e8c994" strokeWidth="1.1" opacity=".85"/><circle cx={p.x} cy={p.y} r="2" fill="#e8c994"/></g>
    <g transform={`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(${p.scale})`}>
      <ellipse className={`tap-contact-shadow ${!paused&&!quiet?'is-tapping':''}`} cx="0" cy="2" rx="12" ry="5" fill="#6b5341" style={{'--tap-cycle':`${beatMs}ms`}}/>
      <g transform="translate(0 82)"><g className={`tap-finger-rig ${!paused&&!quiet?'is-tapping':''}`} data-beat={beat} data-motion={quiet?'still':paused?'rest':'approach-contact-lift'} style={{'--tap-cycle':`${beatMs}ms`}} onAnimationStart={event=>{if(event.animationName!=='tap-wrist-contact')return;const animation=event.currentTarget.getAnimations().find(item=>item.animationName==='tap-wrist-contact');rhythm.current?.(performance.now()-Number(animation?.currentTime||0));}}>
        <g transform="translate(0 -82)" className="tap-articulated-hand" fill={skin} stroke="#ae937a" strokeWidth=".9" strokeLinejoin="round">
          <path d="M-11 87L-16 63C-23 55-25 42-22 36C-19 31-14 34-11 40L-6 48L-6 31Q5 27 13 33L22 30L28 39C36 39 38 43 36 51C35 61 25 69 12 76L13 88Z"/>
          <g transform="translate(8 34)"><g className={`tap-knuckle-motion ${!paused&&!quiet?'is-tapping':''}`} style={{'--tap-cycle':`${beatMs}ms`}}><g transform="translate(-8 -34)">
            <path d="M-6 34L-8 21C-9 11-12 4-8 0C-5-3 1-2 3 3L11 30L8 39Z"/>
            <path d="M13 37L7 8C5 1 9-5 14-3C19-2 19 6 21 12L28 39Z"/>
            <path d="M-8 1Q-4-1 0 4L2 10Q-3 13-7 8ZM9 0Q13-3 16 2L18 9Q13 12 10 8Z" fill="#f0e2cc" stroke="#c6ae91" strokeWidth=".6"/>
            <path d="M-6 21L5 19M10 23L24 19" fill="none" stroke="#aa8d72" strokeWidth=".8"/>
            <path d="M-5 6L1 28M13 6L19 27" fill="none" stroke="#f4e9d7" strokeWidth="1.5" opacity=".6" strokeLinecap="round"/>
          </g></g></g>
          <path d="M-5 36Q4 29 14 34M14 41C22 31 29 31 30 38C31 44 20 50 18 56M-11 48Q-5 60 6 62M-8 79L10 77" fill="none" stroke="#aa8d72" strokeWidth=".8"/>
          <path d="M-11 54Q-8 63-3 65" fill="none" stroke="#f4e9d7" strokeWidth="1.5" opacity=".6" strokeLinecap="round"/>
        </g>
      </g></g>
    </g>
  </svg>;
}
