/**
 * The stage's three programs, as source strings.
 *
 * Kept apart from engine.ts so the GLSL reads as GLSL. The optics are
 * deliberately short of the prototype's: bloom, grain and a vignette only.
 * Chromatic aberration and speed streaks were cut because they smear text
 * behind the composite, and this canvas sits under real copy.
 */

const NOISE = `
vec3 hash3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx)*2.-1.;}
vec3 curlish(vec3 p){return vec3(sin(p.y*1.7+p.z),sin(p.z*1.3+p.x*1.1),sin(p.x*1.9+p.y*.7));}`;

/** The particle program. W = texture width, ROWS = rows per formation. */
export const particleVS = (W: number, ROWS: number) => `
layout(location=0) in vec4 aSeed;
uniform sampler2D uF;
uniform float uFrom, uTo, uMix, uTime, uAspect, uScale, uDpr;
uniform float uTiltA, uTiltB, uSpinZA, uSpinZB, uSpinYA, uSpinYB;
uniform float uAmbient, uFall, uSwarm;
uniform vec2 uOffset; uniform vec3 uC1, uC2;
out vec3 vCol; out float vA;
${NOISE}
vec4 fetchF(float k){int id=gl_VertexID; return texelFetch(uF, ivec2(id%${W}, int(k)*${ROWS}+id/${W}), 0);}
mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1,0,0,0,c,s,0,-s,c);}
mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0,-s,0,1,0,s,0,c);}
mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0,-s,c,0,0,0,1);}
void main(){
  vec4 A=fetchF(uFrom), B=fetchF(uTo);
  // w packs brightness + 10*groupId; decode before anything is mixed.
  float gA=floor(A.w/10.), gB=floor(B.w/10.);
  float bA=A.w-gA*10., bB=B.w-gB*10.;
  // staggered swarm: each mote leaves on its own beat, and arcs out through noise
  float t=clamp((uMix-aSeed.x*.4)/.6,0.,1.); t=t*t*(3.-2.*t);
  vec3 p=mix(A.xyz,B.xyz,t);
  p+=curlish(p*2.3+aSeed.yzw*6.+uTime*.15)*.35*sin(3.14159*t)*uSwarm;
  p.y+=sin(uTime*(.4+aSeed.y)+aSeed.z*20.)*.008*uSwarm;
  float grp = t<.5?gA:gB;
  // group 1 is Fragrant Flower's loose petals: while contact is on stage they
  // fall continuously and sway, which is why the CSS petal layer could go.
  if(grp>0.5 && uFall>0.){
    p.y += (-fract(uTime*.04+aSeed.y)*2.2+1.1)*uFall;
    p.x += sin(uTime*.5+aSeed.z*9.)*.09*uFall;
  }
  float w=mix(bA,bB,t);
  // ambient: between headers the body drifts apart into a quiet field
  vec3 spread=hash3(aSeed.xyz*37.)*1.35;
  p=mix(p,spread,uAmbient);
  w=mix(w,w*.22,uAmbient);
  float tilt=mix(uTiltA,uTiltB,t);
  float sz=mix(uSpinZA,uSpinZB,t)*uTime, sy=mix(uSpinYA,uSpinYB,t)*uTime;
  p=rx(tilt)*ry(sy)*rz(sz)*p;
  vec3 cam=p+vec3(0,0,-3.2);
  float persp=1.6/(-cam.z);
  vec2 ndc=p.xy*persp*uScale; ndc.x/=uAspect; ndc+=uOffset;
  gl_Position=vec4(ndc,0,1);
  gl_PointSize=(1.4+aSeed.w*1.6)*w*uDpr*persp*1.25;
  vCol=mix(uC1,uC2,step(.72,aSeed.y));
  vA=(.35+.65*aSeed.z)*mix(1.,.55,sin(3.14159*t));
}`;

export const particleFS = `
in vec3 vCol; in float vA; out vec4 o;
void main(){ vec2 d=gl_PointCoord-.5; float r=length(d); float m=smoothstep(.5,.2,r); o=vec4(vCol*vA*m,1.); }`;

export const quadVS = `out vec2 vUv; void main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); vUv=p; gl_Position=vec4(p*2.-1.,0,1); }`;

/** Dual-filter (Kawase) down-sample — the cheap half of the bloom chain. */
export const downFS = `in vec2 vUv; uniform sampler2D uT; uniform vec2 uPx; out vec4 o;
void main(){ vec4 s=texture(uT,vUv)*4.; s+=texture(uT,vUv-uPx); s+=texture(uT,vUv+uPx); s+=texture(uT,vUv+vec2(uPx.x,-uPx.y)); s+=texture(uT,vUv-vec2(uPx.x,-uPx.y)); o=s/8.; }`;

export const upFS = `in vec2 vUv; uniform sampler2D uT; uniform vec2 uPx; out vec4 o;
void main(){ vec4 s=texture(uT,vUv+vec2(-uPx.x*2.,0.)); s+=texture(uT,vUv+vec2(-uPx.x,uPx.y))*2.; s+=texture(uT,vUv+vec2(0.,uPx.y*2.)); s+=texture(uT,vUv+vec2(uPx.x,uPx.y))*2.;
 s+=texture(uT,vUv+vec2(uPx.x*2.,0.)); s+=texture(uT,vUv+vec2(uPx.x,-uPx.y))*2.; s+=texture(uT,vUv+vec2(0.,-uPx.y*2.)); s+=texture(uT,vUv+vec2(-uPx.x,-uPx.y))*2.; o=s/12.; }`;

/**
 * Composite: bloom, the section wash that .motif-field::before used to paint
 * in CSS, grain, a vignette — and the avoid rects.
 *
 * uAvoid holds up to 16 viewport rects marked [data-stage-avoid]. Inside them
 * the backdrop is clamped dark (or, in ink mode, light), so --muted body copy
 * keeps its 4.5:1 over whatever the stage is doing behind it. The clamp is the
 * reason this canvas can sit behind real text at all.
 */
export const compFS = `in vec2 vUv; uniform sampler2D uScene, uBloom;
uniform float uTime, uBloomK, uInk, uGrain;
uniform vec3 uBg, uC1, uC2; uniform vec2 uRes;
uniform vec4 uAvoid[16]; uniform float uAvoidSoft[16]; uniform int uAvoidN;
out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 uv=vUv;
  vec3 ink=texture(uScene,uv).rgb + texture(uBloom,uv).rgb*uBloomK;
  // the two radial gradients of .motif-field::before, painted on the GPU
  vec3 wash=uC1*.26*smoothstep(.75,0.,length((vUv-vec2(.1,1.))*vec2(1.,1.6)))
          + uC2*.22*smoothstep(.7,0.,length((vUv-vec2(.9,0.))*vec2(1.,1.6)));
  // What the stage ADDS over the page. Kept separate from uBg so the avoid
  // rects can take the glow away under copy without ever darkening the page
  // itself — scaling the finished colour pulled the backdrop below the plain
  // background and drew a visible black box around every heading.
  vec3 add = uInk>.5 ? -(wash*.35 + clamp(ink,0.,1.)*.55*uBg) : wash*.5+ink;

  // avoid rects: take the glow out from under real copy so contrast survives.
  // Feathered, because a hard edge is the box itself: the clamp has to fade
  // out across ~22px instead of stopping on a line.
  vec2 px=vec2(vUv.x*uRes.x,(1.-vUv.y)*uRes.y);
  float FEATHER=22.;
  float lim=1.;
  float m=0.;
  for(int i=0;i<16;i++){
    if(i>=uAvoidN) break;
    vec4 r=uAvoid[i];
    float ix=min(smoothstep(0.,FEATHER,px.x-r.x), smoothstep(0.,FEATHER,r.z-px.x));
    float iy=min(smoothstep(0.,FEATHER,px.y-r.y), smoothstep(0.,FEATHER,r.w-px.y));
    float inside=ix*iy;
    if(inside>m){ m=inside; lim=uAvoidSoft[i]>.5 ? .06 : .034; }
  }
  if(m>0.){
    // The most glow that still leaves the rect under the limit. If the page
    // is already at or over it, the stage simply contributes nothing here.
    vec3 W=vec3(.2126,.7152,.0722);
    float headroom=lim-dot(uBg,W);
    float la=max(abs(dot(add,W)),1e-4);
    add=mix(add, add*clamp(headroom/la,0.,1.), m);
  }
  vec3 col=uBg+add;
  col+=(h(vUv*uRes+uTime*91.)-.5)*.035*uGrain;
  col*=1.-.25*pow(length(vUv-.5)*1.25,2.);
  o=vec4(col,1);
}`;
