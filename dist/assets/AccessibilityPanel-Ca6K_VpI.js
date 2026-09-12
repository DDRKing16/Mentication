import{c as a,u as y,j as e,m as x,X as u}from"./index-DnoOynVR.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["rect",{width:"18",height:"14",x:"3",y:"5",rx:"2",ry:"2",key:"12ruh7"}],["path",{d:"M7 15h4M15 15h2M7 11h2M13 11h4",key:"1ueiar"}]],k=a("Captions",b);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 18a6 6 0 0 0 0-12v12z",key:"j4l70d"}]],g=a("Contrast",f);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2",key:"1fvzgz"}],["path",{d:"M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2",key:"1kc0my"}],["path",{d:"M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8",key:"10h0bg"}],["path",{d:"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",key:"1s1gnw"}]],N=a("Hand",j);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["path",{d:"M12 2v20",key:"t6zp3m"}],["path",{d:"m15 19-3 3-3-3",key:"11eu04"}],["path",{d:"m19 9 3 3-3 3",key:"1mg7y2"}],["path",{d:"M2 12h20",key:"9i4pu4"}],["path",{d:"m5 9-3 3 3 3",key:"j64kie"}],["path",{d:"m9 5 3-3 3 3",key:"l8vdw6"}]],v=a("Move",w);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],C=a("RotateCcw",M);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["polyline",{points:"4 7 4 4 20 4 20 7",key:"1nosan"}],["line",{x1:"9",x2:"15",y1:"20",y2:"20",key:"swin9y"}],["line",{x1:"12",x2:"12",y1:"4",y2:"20",key:"1tx1rr"}]],R=a("Type",_),z=[{key:"largeText",label:"Larger text",icon:R,hint:"Scale up text app-wide"},{key:"reducedMotion",label:"Reduce motion",icon:v,hint:"Calm, still transitions"},{key:"captions",label:"Captions on by default",icon:k,hint:"Show narration text"},{key:"highContrast",label:"Higher contrast",icon:g,hint:"Stronger text and borders"},{key:"oneHanded",label:"One-handed layout",icon:N,hint:"Reachable, bottom-anchored"}];function T({onClose:n,dark:s=!1}){const{prefs:i,setPref:r,reset:l}=y(),d=s?"bg-[hsl(178_36%_13%)] text-cream border-cream/15":"bg-card text-foreground border-border",h=s?"border-cream/10 bg-white/5":"border-border bg-background/60",o=s?"text-cream/60":"text-muted-foreground",m=s?"bg-cream/20":"bg-secondary";return e.jsx("div",{className:"fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm",onClick:n,children:e.jsxs(x.div,{initial:{opacity:0,y:20,scale:.98},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:20},transition:{duration:.3,ease:[.22,1,.36,1]},onClick:t=>t.stopPropagation(),className:"w-full max-w-md rounded-3xl border p-6 pb-8 soft-depth "+d,children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"font-heading text-xl font-medium tracking-tight",children:"Accessibility"}),e.jsx("button",{onClick:n,"aria-label":"Close",className:"no-tap opacity-60 transition-opacity hover:opacity-100",children:e.jsx(u,{className:"h-5 w-5"})})]}),e.jsx("p",{className:"mt-1 text-sm "+o,children:"Make Mentication work for you. Changes save automatically."}),e.jsx("div",{className:"mt-5 flex flex-col gap-2.5",children:z.map(t=>{const c=!!i[t.key],p=t.icon;return e.jsxs("button",{onClick:()=>r(t.key,!c),className:"no-tap flex items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] "+h,children:[e.jsx("span",{className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",children:e.jsx(p,{className:"h-4 w-4",strokeWidth:1.7})}),e.jsxs("span",{className:"flex-1",children:[e.jsx("span",{className:"block text-sm font-medium leading-tight",children:t.label}),e.jsx("span",{className:"block text-xs "+o,children:t.hint})]}),e.jsx("span",{className:"relative h-6 w-11 shrink-0 rounded-full transition-colors "+(c?"bg-primary":m),children:e.jsx("span",{className:"absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all "+(c?"left-[1.4rem]":"left-0.5")})})]},t.key)})}),e.jsxs("button",{onClick:()=>l(),className:"no-tap mt-4 flex w-full items-center justify-center gap-1.5 text-sm "+o+" hover:opacity-100",children:[e.jsx(C,{className:"h-3.5 w-3.5"})," Reset to defaults"]}),e.jsx("button",{onClick:n,className:"no-tap mt-3 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground active:scale-95",children:"Done"})]})})}export{T as A,C as R,R as T};
