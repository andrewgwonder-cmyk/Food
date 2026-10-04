/* Живой силуэт: скелет с обратной кинематикой, реквизит и сцены.
   Единицы: рост человека = 1, ось y вверх, x вперёд (лицом вправо). */
(function(){
const R=Math.PI/180,PI=Math.PI,sin=Math.sin,cos=Math.cos,abs=Math.abs,max=Math.max,min=Math.min,clamp=(v,a,b)=>max(a,min(b,v));
const L={th:.245,sh:.24,to:.29,nk:.045,ua:.165,fa:.15};
const dirD=a=>[sin(a*R),-cos(a*R)];               // угол от «вниз», + вперёд
const add=(p,v,k)=>[p[0]+v[0]*k,p[1]+v[1]*k];
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
function ik(P,T,a,b,s){let dx=T[0]-P[0],dy=T[1]-P[1],d=Math.hypot(dx,dy);const md=a+b-1e-4;if(d>md){dx*=md/d;dy*=md/d;d=md}if(d<1e-4)d=1e-4;
 const base=Math.atan2(dy,dx),al=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1));return[[P[0]+a*cos(base+s*al),P[1]+a*sin(base+s*al)],[P[0]+dx,P[1]+dy]]}
const angOf=v=>Math.atan2(v[0],-v[1])/R; // вектор → угол от «вниз»
/* ---------- решение позы ---------- */
function solve(p,hip){const tor=p.tor||0,td=[sin(tor*R),cos(tor*R)],sc=p.sc||1;
 const neck=add(hip,td,L.to*sc),sho=add(hip,td,L.to*.86*sc),ha=tor+(p.hd||0),hv=[sin(ha*R),cos(ha*R)],head=add(neck,hv,(L.nk+.062)*sc);
 const legs={},arms={};
 for(const k of['n','f']){const s=p[k]||{a:[0,3]};let knee,ank;
  if(s.ik)[knee,ank]=ik(hip,s.ik,L.th*sc,L.sh*sc,1);else{knee=add(hip,dirD(s.a[0]),L.th*sc);ank=add(knee,dirD(s.a[0]-s.a[1]),L.sh*sc)}
  const sa=angOf([ank[0]-knee[0],ank[1]-knee[1]]);const fa=(s.fa!=null?s.fa:clamp(sa*.5,-40,30))*R;
  const rot=(x,y)=>[ank[0]+(x*cos(fa)-y*sin(fa))*sc,ank[1]+(x*sin(fa)+y*cos(fa))*sc];
  legs[k]={knee,ank,heel:rot(-.035,-.042),toe:rot(.088,-.042),toeT:rot(.075,-.012),top:rot(.0,.012),hb:rot(-.03,-.008),boot:s.boot}}
 for(const k of['an','af']){const s=p[k]||{a:[0,8]};let el,hand;
  if(s.ik)[el,hand]=ik(sho,s.ik,L.ua*sc,L.fa*sc,-1);else{el=add(sho,dirD(s.a[0]),L.ua*sc);hand=add(el,dirD(s.a[0]+s.a[1]),L.fa*sc)}
  arms[k]={el,hand}}
 return{hip,neck,sho,head,ha,td,legs,arms,sc,st:p.st||{},ax:0}}
function pose(p,x,y){const r=pose0(p,x,y);r.ax=x;return r}
function pose0(p,x,y){ // y==null → ставим на землю по самой низкой точке стопы
 if(p.hip)return solve(p,[x+p.hip[0],(y||0)+p.hip[1]]);
 const s0=solve(p,[x,0]);let lo=1e9;for(const k of['n','f']){const l=s0.legs[k];lo=min(lo,l.heel[1],l.toe[1])}
 const bootH=(p.n&&p.n.boot)?.047:0;return solve(p,[x,(y||0)-lo+bootH])}
/* ---------- рисование ---------- */
function cap(g,a,ra,b,rb){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);if(d<=abs(ra-rb)+1e-6){g.moveTo(a[0]+ra,a[1]);g.arc(a[0],a[1],max(ra,rb),0,2*PI);return}
 const ph=Math.atan2(dy,dx),be=Math.acos(clamp((ra-rb)/d,-1,1));g.moveTo(a[0]+ra*cos(ph+be),a[1]+ra*sin(ph+be));g.arc(a[0],a[1],ra,ph+be,ph-be+2*PI);g.arc(b[0],b[1],rb,ph-be,ph+be);g.closePath()}
function smooth(g,pts){const n=pts.length,m=(i)=>{const a=pts[(i+n)%n],b=pts[(i+1+n)%n];return[(a[0]+b[0])/2,(a[1]+b[1])/2]};const s=m(0);g.moveTo(s[0],s[1]);
 for(let i=1;i<=n;i++){const p=pts[i%n],q=m(i);g.quadraticCurveTo(p[0],p[1],q[0],q[1])}g.closePath()}
const FL=(g,fn)=>{g.beginPath();fn();g.fill()};
function leg(g,s,l,w){const k=s.sc*w;FL(g,()=>cap(g,s.hip,.058*k,l.knee,.041*k));FL(g,()=>cap(g,l.knee,.04*k,l.ank,.025*k));g.beginPath();
 if(l.boot){const b=l.boot;g.moveTo(l.hb[0],l.hb[1]);smooth(g,[l.heel,l.toe,l.toeT,[l.ank[0]+.01,l.ank[1]+.07],[l.ank[0]-.04,l.ank[1]+.07],l.hb]);
  g.fill();if(b==='roll'){for(let i=0;i<4;i++){const t=i/3,x=lerp(l.heel[0]+.005,l.toe[0]-.01,t),y=lerp(l.heel[1],l.toe[1],t)-.025;FL(g,()=>g.arc(x,y,.02*s.sc,0,2*PI))}}return}
 else smooth(g,[l.heel,l.toe,l.toeT,l.top,l.hb]);g.fill()}
function arm(g,s,a,w){const k=s.sc*w;FL(g,()=>cap(g,s.sho,.036*k,a.el,.028*k));FL(g,()=>cap(g,a.el,.027*k,a.hand,.02*k));FL(g,()=>g.arc(a.hand[0],a.hand[1],.023*k,0,2*PI))}
function body(g,s,fem){const td=s.td,nf=[td[1],-td[0]],H=s.hip,sc=s.sc,P=(t,o)=>[H[0]+td[0]*L.to*t*sc+nf[0]*o*sc,H[1]+td[1]*L.to*t*sc+nf[1]*o*sc];
 const w=fem?.9:1;const pts=[P(-.05,.06),P(.3,.068*w),P(.62,(fem?.088:.084)),P(.86,.066),P(1.02,.03),P(1.02,-.035),P(.86,-.068),P(.6,-.066*w),P(.32,-.052*w),P(.08,-.08*(fem?1.08:1)),P(-.1,-.06)];
 FL(g,()=>smooth(g,pts));
 if(fem&&s.st.skirt!=null){g.beginPath();const a=P(.1,.075),b=P(.1,-.085),sw=s.st.skirt;g.moveTo(a[0],a[1]);g.lineTo(a[0]+.07*sc+sw,a[1]-.24*sc);g.lineTo(b[0]-.05*sc+sw,b[1]-.24*sc);g.lineTo(b[0],b[1]);g.closePath();g.fill()}}
function head(g,s,fem){const C=s.head,a=s.ha*R,sc=s.sc,T=(x,y)=>[C[0]+(x*cos(-a)-y*sin(-a))*sc,C[1]+(x*sin(-a)+y*cos(-a))*sc];
 FL(g,()=>cap(g,s.neck,.03*sc,T(-.005,-.03),.03*sc));
 FL(g,()=>g.ellipse(C[0],C[1],.057*sc,.066*sc,-a,0,2*PI));
 const pts=[T(.052,.02),T(.07,-.006),T(.056,-.016),T(.05,-.03),T(.044,-.056),T(.02,-.066),T(-.01,-.05)];FL(g,()=>smooth(g,pts)); // нос, подбородок
 if(fem){FL(g,()=>g.ellipse(...T(-.012,.014),.064*sc,.064*sc,-a,0,2*PI));FL(g,()=>cap(g,T(-.06,.02),.03*sc,T(-.075,-.075),.02*sc))}
 else FL(g,()=>g.ellipse(...T(-.008,.012),.06*sc,.062*sc,-a,0,2*PI))}
function figure(g,s,near,far,fem){const w=fem?.88:1;
 g.fillStyle=far;leg(g,s,s.legs.f,w);arm(g,s,s.arms.af,w);
 if(s.st.held)s.st.held(g,s,'far',far);
 g.fillStyle=near;body(g,s,fem);head(g,s,fem);leg(g,s,s.legs.n,w);arm(g,s,s.arms.an,w);
 if(s.st.held)s.st.held(g,s,'near',near)}
/* ---------- реквизит ---------- */
function wheel(g,x,y,r,ang,lw){g.lineWidth=lw;g.beginPath();g.arc(x,y,r,0,2*PI);g.stroke();g.lineWidth=lw*.28;g.beginPath();for(let i=0;i<8;i++){const a=ang+i*PI/8;g.moveTo(x+cos(a)*r,y+sin(a)*r);g.lineTo(x-cos(a)*r,y-sin(a)*r)}g.stroke();g.beginPath();g.arc(x,y,lw*.9,0,2*PI);g.fill()}
const BK={ra:[-.36,.19],fa:[.36,.19],bb:[0,.16],seat:[-.13,.52],ht:[.27,.5],hb:[.3,.42],bar:[.22,.57],r:.19,cr:.088};
function bike(g,ox,oy,f,wang,cang,col){g.save();g.translate(ox,oy);g.scale(f,1);g.strokeStyle=col;g.fillStyle=col;g.lineCap='round';g.lineJoin='round';
 wheel(g,...BK.ra,BK.r,wang,.022);wheel(g,...BK.fa,BK.r,wang,.022);
 g.lineWidth=.022;g.beginPath();g.moveTo(...BK.ra);g.lineTo(...BK.bb);g.lineTo(...BK.seat);g.lineTo(...BK.ra);g.moveTo(...BK.seat);g.lineTo(...BK.ht);g.lineTo(...BK.hb);g.lineTo(...BK.bb);g.moveTo(...BK.ht);g.lineTo(...BK.fa);
 g.moveTo(...BK.ht);g.lineTo(.25,.56);g.lineTo(BK.bar[0],BK.bar[1]);g.stroke();
 g.lineWidth=.035;g.beginPath();g.moveTo(BK.seat[0]-.06,BK.seat[1]+.03);g.lineTo(BK.seat[0]+.05,BK.seat[1]+.025);g.stroke(); // седло
 g.lineWidth=.018;g.beginPath();const c1=[BK.bb[0]+cos(cang)*BK.cr,BK.bb[1]+sin(cang)*BK.cr],c2=[BK.bb[0]-cos(cang)*BK.cr,BK.bb[1]-sin(cang)*BK.cr];
 g.moveTo(...c1);g.lineTo(...c2);g.stroke();g.beginPath();g.arc(...BK.bb,.035,0,2*PI);g.fill();g.restore();return[c1,c2]}
function bench(g,x,col,far){g.fillStyle=far;g.fillRect(x-.16,0,.03,.26);g.fillStyle=col;g.fillRect(x+.12,0,.03,.26);g.fillRect(x-.2,.25,.4,.035);
 g.save();g.translate(x-.19,.26);g.rotate(-12*R);g.fillRect(-.012,0,.03,.33);g.fillRect(-.03,.14,.045,.05);g.fillRect(-.03,.25,.045,.05);g.restore()}
function book(g,h,t,col){const fl=sin(t)*.5;g.fillStyle=col;g.beginPath();g.moveTo(h[0]-.005,h[1]+.005);g.lineTo(h[0]-.06,h[1]+.05);g.lineTo(h[0]-.055,h[1]+.065);g.lineTo(h[0],h[1]+.025);
 g.lineTo(h[0]+.05+fl*.02,h[1]+.07);g.lineTo(h[0]+.058,h[1]+.055);g.closePath();g.fill()}
function car(g,x,f,col,glass,hood,far){g.save();g.translate(x,0);g.scale(f,1);g.fillStyle=col;
 g.beginPath();smooth(g,[[0,.2],[-.01,.36],[.06,.44],[.75,.47],[1.12,.8],[1.7,.84],[2.1,.8],[2.3,.6],[2.33,.36],[2.3,.2],[1.95,.14],[1.62,.14],[.75,.14],[.42,.14]]);g.fill();
 g.fillStyle=glass;g.beginPath();g.moveTo(.86,.5);g.lineTo(1.13,.77);g.lineTo(1.62,.79);g.lineTo(1.62,.5);g.closePath();g.moveTo(1.67,.5);g.lineTo(1.67,.79);g.lineTo(2.05,.77);g.lineTo(2.2,.56);g.lineTo(2.2,.5);g.closePath();g.fill();
 g.fillStyle=col;for(const wx of[.5,1.85]){g.beginPath();g.arc(wx,.17,.17,0,2*PI);g.fill();g.fillStyle=far;g.beginPath();g.arc(wx,.17,.08,0,2*PI);g.fill();g.fillStyle=col}
 if(hood>0){g.fillStyle=far;g.fillRect(.08,.4,.64,.06);g.fillStyle=col;g.save();g.translate(.74,.47);g.rotate(PI-hood*58*R);g.fillRect(0,-.012,.7,.026);g.restore()}
 g.restore()}
function tread(g,x,t,col,far){g.fillStyle=col;g.beginPath();g.moveTo(x-.5,.03);g.lineTo(x-.52,.08);g.quadraticCurveTo(x-.5,.105,x-.45,.105);g.lineTo(x+.46,.11);g.lineTo(x+.48,.04);g.lineTo(x+.4,.015);g.lineTo(x-.45,.015);g.closePath();g.fill();g.fillRect(x-.44,0,.04,.02);g.fillRect(x+.38,0,.04,.02);
 g.strokeStyle=far;g.lineWidth=.008;g.beginPath();for(let i=0;i<6;i++){const xx=x-.42+((i*.16-t*.9)%.96+.96)%.96;g.moveTo(xx,.095);g.lineTo(xx+.03,.095)}g.stroke();
 g.strokeStyle=col;g.lineCap='round';g.lineWidth=.03;g.beginPath();g.moveTo(x+.42,.09);g.lineTo(x+.52,.78);g.moveTo(x+.5,.66);g.lineTo(x+.18,.63);g.stroke();
 g.fillStyle=col;g.save();g.translate(x+.53,.8);g.rotate(-20*R);g.fillRect(-.09,-.03,.14,.07);g.restore()}
function tower(g,x,col,far){g.fillStyle=col;g.fillRect(x+.14,0,.04,1.37);g.fillRect(x-.06,1.33,.24,.04);g.fillRect(x-.22,0,.55,.04);g.fillStyle=far;g.fillRect(x+.18,.5,.12,.03);g.beginPath();g.arc(x-.06,1.35,.024,0,2*PI);g.fill()}
function dumbbell(g,h){g.beginPath();g.ellipse(h[0]-.03,h[1],.014,.042,0,0,2*PI);g.ellipse(h[0]+.03,h[1],.014,.042,0,0,2*PI);g.fill();g.fillRect(h[0]-.03,h[1]-.008,.06,.016)}
function broomHeld(st){return(g,s,side,col)=>{if(side!=='near')return;g.save();g.strokeStyle=col;g.fillStyle=col;g.lineCap='round';g.lineWidth=.016;
 const b=st.b,t=st.top;g.beginPath();g.moveTo(...t);g.lineTo(...b);g.stroke();g.beginPath();g.moveTo(b[0]-.07,.0);g.lineTo(b[0]+.07,.0);g.lineTo(b[0]+.04,b[1]+.04);g.lineTo(b[0]-.03,b[1]+.04);g.closePath();g.fill();g.restore()}}
function bag(g,h){g.beginPath();smooth(g,[[h[0]-.015,h[1]],[h[0]+.015,h[1]],[h[0]+.06,h[1]-.12],[h[0]+.03,h[1]-.21],[h[0]-.05,h[1]-.21],[h[0]-.065,h[1]-.11]]);g.fill()}
function skate(g,x,col,ang){g.save();g.translate(x,.0);g.rotate(ang||0);g.fillStyle=col;g.beginPath();smooth(g,[[-.24,.07],[-.2,.05],[.2,.05],[.24,.07],[.2,.065],[-.2,.065]]);g.fill();g.fillRect(-.24,.05,.48,.016);
 for(const wx of[-.14,.14]){g.beginPath();g.arc(wx,.025,.026,0,2*PI);g.fill()}g.restore()}
/* ---------- циклы движений ---------- */
function walk(ph,amp=1,o={}){const P=2*PI;const L1=(p)=>{const th=22*amp*sin(P*p),kn=6+52*amp*Math.pow(max(0,cos(P*p)),2);return{a:[th,kn]}};
 return{tor:o.tor??3,hd:o.hd??-2,n:L1(ph),f:L1(ph+.5),an:{a:[-18*amp*sin(P*ph),14+8*amp*max(0,-sin(P*ph))]},af:{a:[18*amp*sin(P*ph),14+8*amp*max(0,sin(P*ph))]},...o.extra}}
function run(ph){const P=2*PI;const L1=p=>({a:[38*sin(P*p),18+82*Math.pow(max(0,cos(P*p+.4)),1.3)]});
 return{tor:9,hd:-6,n:L1(ph),f:L1(ph+.5),an:{a:[-32*sin(P*ph),95]},af:{a:[32*sin(P*ph),95]}}}
const stand=(o={})=>({tor:1,hd:0,n:{a:[3,4]},f:{a:[-3,3]},an:{a:[-4,10]},af:{a:[3,12]},...o});
/* ---------- сцены ---------- */
// каждая сцена: f(t,x0,W) → {figs:[{s,fem,layer}], props:[fn(g,col,far)], over:[fn]}; x0 — место, W — ширина сцены
const SP=.75; // скорость шага (рост/с)
function walker(t,x0,dirn){const ph=t*SP/0.74;return{x:x0+dirn*t*SP,p:walk(ph%1)}}
const SC={
 walk:{dur:10,run(t,c){const w=walker(t,c.from,c.dir);return{figs:[{s:pose(w.p,w.x),f:c.dir}]}}},
 think:{dur:16,run(t,c){const ph=t%8,f0=c.dir;
  if(ph<5){const base=stand({tor:3,hd:-12+6*sin(t*.5)});const s0=pose(base,0);base.an={ik:[s0.head[0]+.05,s0.head[1]-.075]};base.af={ik:[.07,s0.sho[1]-.2]};return{figs:[{s:shift(pose(base,0),c.x),f:f0}]}}
  const k=(ph-5)/3,out=k<.5,d=out?k*2:(1-k)*2;return{figs:[{s:pose(walk((t*SP/.74)%1),c.x+f0*ease(d)*.9),f:out?f0:-f0}]}}},
 bench:{dur:20,prop:'bench',run(t,c){const p={hip:[0,.305],tor:-8+2*sin(t*.4),hd:-4+4*sin(t*.3),n:{ik:[.25,.045]},f:{ik:[.29,.045]},an:{ik:[.17,.35]},af:{ik:[-.12,.45]}};
  return{figs:[{s:shift(pose(p,0),c.x),f:c.dir}],props:[(g,col,far)=>{g.save();g.translate(c.x,0);g.scale(c.dir,1);bench(g,0,col,far);g.restore()}]}}},
 read:{dur:22,prop:'bench',run(t,c){const flip=(t%6)>5.4;const p={hip:[0,.305],tor:-2,hd:24+2*sin(t*.5),n:{ik:[.27,.045]},f:{ik:[.3,.045]},an:{ik:[.2+(flip?.03:0),.54+(flip?.04:0)]},af:{ik:[.23,.52]}};
  const s=pose(p,0);const bk=(g,ss,side,col)=>{if(side==='far')book(g,ss.arms.af.hand,t*3*(flip?1:0),col)};return{figs:[{s:shift(s,c.x),f:c.dir,held:bk}],props:[(g,col,far)=>{g.save();g.translate(c.x,0);g.scale(c.dir,1);bench(g,0,col,far);g.restore()}]}}},
 dumbbell:{dur:16,run(t,c){const P=2*PI,ph=t/2.4;const e1=10+125*ease((sin(P*ph)+1)/2),e2=10+125*ease((sin(P*ph+PI)+1)/2);
  const p=stand({tor:-2,hd:0,n:{a:[4,4]},f:{a:[-4,4]},an:{a:[6,e1]},af:{a:[6,e2]}});const s=pose(p,0);
  return{figs:[{s:shift(s,c.x),f:c.dir,held:(g,ss,side)=>dumbbell(g,side==='near'?ss.arms.an.hand:ss.arms.af.hand)}]}}},
 treadmill:{dur:16,prop:'tread',run(t,c){const s=pose(run((t/0.68)%1),0,.11);return{figs:[{s:shift(s,c.x),f:c.dir}],props:[(g,col,far)=>{g.save();g.translate(c.x,0);g.scale(c.dir,1);tread(g,0,t,col,far);g.restore()}]}}},
 pullup:{dur:14,prop:'tower',run(t,c){const k=ease((1-cos(2*PI*t/2.6))/2);const sy=1.02+.22*k;const hip=[-.05,sy-.25];
  const p={hip,tor:-4,hd:-6*k,n:{a:[-8,70]},f:{a:[2,80]},an:{ik:[-.05+.03,1.335]},af:{ik:[-.05+.05,1.335]}};const s=pose(p,0);
  return{figs:[{s:shift(s,c.x),f:c.dir}],props:[(g,col,far)=>{g.save();g.translate(c.x,0);g.scale(c.dir,1);tower(g,0,col,far);g.restore()}]}}},
 fixbike:{dur:20,prop:'bikeup',run(t,c){const spin=t%5<2.2,wa=spin?t*6:0;const work=sin(t*5)*.015;
  const p={hip:[0,.29],tor:22+3*sin(t*.8),hd:14,n:{a:[0,90],fa:-80},f:{a:[78,82]},an:{ik:[.42+work,.37+work]},af:{ik:[.4,.33]}};const s=pose(p,0);
  return{figs:[{s:shift(s,c.x),f:c.dir}],props:[(g,col,far)=>{g.save();g.translate(c.x+.78*c.dir,.6);g.scale(c.dir,-1);bike(g,0,0,1,wa,t*.4,col);g.restore()}]}}},
 fixcar:{dur:22,prop:'car',run(t,c){const ph=t%11;let p;
  if(ph<8.5){const w=sin(t*3)*.02;p=stand({tor:58+3*sin(t*.9),hd:10,n:{a:[2,4]},f:{a:[-6,4]},an:{ik:[.36+w,.44]},af:{ik:[.46,.42-w]}})}
  else{const k=ease((ph-8.5)/.6)*ease((11-ph)/.6);p=stand({tor:lerp(58,2,k),hd:lerp(10,-8,k),an:null,af:{a:[3,10]}});const s0=pose({...p,an:{a:[0,10]}},0);p.an={ik:[lerp(.36,s0.head[0]+.03,k),lerp(.44,s0.head[1]+.05,k)]}}
  const s=pose(p,0);return{figs:[{s:shift(s,c.x),f:c.dir}],props:[(g,col,far,gl)=>car(g,c.x+.2*c.dir,c.dir,col,gl,1,far)]}}},
 bike:{dur:18,move:1,at(t,x,f){const sp=1.25;const ca=-t*2*PI*1.1,wa=-t*sp/BK.r;const pd=[BK.bb[0]+cos(ca)*BK.cr,BK.bb[1]+sin(ca)*BK.cr],pf=[BK.bb[0]-cos(ca)*BK.cr,BK.bb[1]-sin(ca)*BK.cr];
  const p={hip:[-.12,.555],tor:30,hd:-24,n:{ik:[pd[0]-.03,pd[1]+.045],fa:-6},f:{ik:[pf[0]-.03,pf[1]+.045],fa:-6},an:{ik:[BK.bar[0],BK.bar[1]]},af:{ik:[BK.bar[0]+.01,BK.bar[1]]}};
  return{figs:[{s:shift(pose(p,0),x),f}],props:[(g,col)=>{bike(g,x,0,f,wa,ca,col)}]}},run(t,c){const sp=1.25,span=c.W+1.8,d=(t*sp+(c.dir<0?span:0))%(2*span),fw=d<span,x=-.9+(fw?d:2*span-d),f=fw?1:-1;
  const ca=-t*2*PI*1.1,wa=-t*sp/BK.r;const pd=[BK.bb[0]+cos(ca)*BK.cr,BK.bb[1]+sin(ca)*BK.cr],pf=[BK.bb[0]-cos(ca)*BK.cr,BK.bb[1]-sin(ca)*BK.cr];
  const p={hip:[-.12,.555],tor:30,hd:-24,n:{ik:[pd[0]-.03,pd[1]+.045],fa:-6},f:{ik:[pf[0]-.03,pf[1]+.045],fa:-6},an:{ik:[BK.bar[0],BK.bar[1]]},af:{ik:[BK.bar[0]+.01,BK.bar[1]]}};
  const s=pose(p,0);return{figs:[{s:shift(s,x),f}],props:[(g,col)=>{bike(g,x,0,f,wa,ca,col)}],x}}},
 roller:{dur:14,move:1,at(t,x,f){const ph=(t/1.3)%1,P=2*PI;const L1=q=>{const s=sin(P*q);return{a:[10+28*s,30+30*max(0,cos(P*q))+(s<0?-s*20:0)],fa:0,boot:'roll'}};
  const p={tor:34,hd:-30,n:L1(ph),f:L1(ph+.5),an:{a:[-40*sin(P*ph),25]},af:{a:[40*sin(P*ph),25]}};return{figs:[{s:shift(pose(p,0),x),f}]}},run(t,c){const sp=1.5,span=c.W+1.8,d=(t*sp+(c.dir<0?span:0))%(2*span),fw=d<span,x=-.9+(fw?d:2*span-d),f=fw?1:-1,ph=(t/1.3)%1,P=2*PI;
  const L1=q=>{const s=sin(P*q);return{a:[10+28*s,30+30*max(0,cos(P*q))+ (s<0?-s*20:0)],fa:0,boot:'roll'}};
  const p={tor:34,hd:-30,n:L1(ph),f:L1(ph+.5),an:{a:[-40*sin(P*ph),25]},af:{a:[40*sin(P*ph),25]}};return{figs:[{s:shift(pose(p,0),x),f}],x}}},
 skate:{dur:14,move:1,at(t,x,f){const cyc=t%3;let p;
  if(cyc<1.2){const k=cyc/1.2,bx=lerp(.06,-.17,k),by=.045+(k>.8?(k-.8)*.4:0);p={hip:[0,.5],tor:12,hd:-14,n:{ik:[.1,.115],fa:0},f:{ik:[bx,by],fa:0},an:{a:[-25,20]},af:{a:[30,20]}}}
  else{const b=sin(t*2)*.01;p={hip:[-.01,.55+b],tor:6,hd:-12,n:{ik:[.11,.115],fa:0},f:{ik:[-.13,.115],fa:0},an:{a:[-35,30]},af:{a:[40,25]}}}
  return{figs:[{s:shift(pose(p,0),x),f}],props:[(g,col)=>{g.save();g.translate(x,0);g.scale(f,1);skate(g,0,col);g.restore()}]}},run(t,c){const sp=1.1,span=c.W+1.8,d=(t*sp+(c.dir<0?span:0))%(2*span),fw=d<span,x=-.9+(fw?d:2*span-d),f=fw?1:-1,cyc=t%3;let p;
  if(cyc<1.2){const k=cyc/1.2,bx=lerp(.06,-.17,k),by=.045+(k>.8?(k-.8)*.4:0);p={hip:[0,.5],tor:12,hd:-14,n:{ik:[.1,.115],fa:0},f:{ik:[bx,by],fa:0},an:{a:[-25,20]},af:{a:[30,20]}}}
  else{const b=sin(t*2)*.01;p={hip:[-.01,.55+b],tor:6,hd:-12,n:{ik:[.11,.115],fa:0},f:{ik:[-.13,.115],fa:0},an:{a:[-35,30]},af:{a:[40,25]}}}
  const s=pose(p,0);return{figs:[{s:shift(s,x),f}],props:[(g,col)=>{g.save();g.translate(x,0);g.scale(f,1);skate(g,0,col);g.restore()}],x}}},
 sweep:{dur:16,move:1,run(t,c){const sw=sin(t*2.6),x=c.x+c.dir*min(t*.07,1.1);const bx=.36+.12*sw,b=[bx,.045],top=[-.05,.8];
  const st={col:'#000',b,top};const p=stand({tor:20,hd:12,n:{a:[8,8]},f:{a:[-10,8]},an:{ik:[lerp(top[0],b[0],.45),lerp(top[1],b[1],.45)]},af:{ik:[lerp(top[0],b[0],.12),lerp(top[1],b[1],.12)]}});
  const s=pose(p,0);s.st.held=null;return{figs:[{s:shift(s,x),f:c.dir,broom:{b,top}}],dust:{x:x+bx*c.dir,on:cos(t*2.6)>.3},x}}},
 trash:{dur:18,move:1,run(t,c){const cyc=t%6,f=c.dir;let x,p;const base=c.from+f*Math.floor(t/6)*1.2;
  if(cyc<3){x=base+f*cyc*.4;p=walk((cyc*SP/.74*.55)%1,.8)}else{x=base+f*1.2;const k=ease(min(1,(cyc-3)/1))*ease(min(1,(6-cyc)/1));p=stand({tor:lerp(3,72,k),hd:lerp(0,22,k),n:{a:[lerp(3,55,k),lerp(4,75,k)]},f:{a:[lerp(-3,18,k),lerp(3,40,k)]},an:{a:[lerp(-4,40,k),lerp(10,10,k)]},af:{a:[lerp(3,-2,k),8]}})}
  const s=pose(p,0);return{figs:[{s:shift(s,x),f,held:(g,ss,side)=>{if(side==='far')bag(g,ss.arms.af.hand)}}],trash:{x:base+f*1.55,show:cyc<4.2},x}}},
 pair:{dur:14,move:1,run(t,c){const w1=walker(t,c.from,c.dir),ph=(t*SP/.74)%1;const p2=walk((ph+.3)%1,.85,{tor:2,hd:-3+3*sin(t*.5)});p2.st={skirt:.02*sin(2*PI*ph)};p2.sc=.94;
  return{figs:[{s:pose(p2,w1.x-.15*c.dir),f:c.dir,fem:1,back:1},{s:pose({...w1.p,hd:2*sin(t*.4)-4},w1.x),f:c.dir}],x:w1.x}}}
};
function shift(s,dx){const m=p=>[p[0]+dx,p[1]];const r={...s,ax:(s.ax||0)+dx,hip:m(s.hip),neck:m(s.neck),sho:m(s.sho),head:m(s.head),legs:{},arms:{}};
 for(const k in s.legs){const l=s.legs[k];r.legs[k]={...l};for(const q of['knee','ank','heel','toe','toeT','top','hb'])r.legs[k][q]=m(l[q])}
 for(const k in s.arms){const a=s.arms[k];r.arms[k]={el:m(a.el),hand:m(a.hand)}}return r}
/* ---------- кадр ---------- */
// рисует результат сцены; f — направление взгляда (зеркалим вокруг x фигуры)
function drawFig(g,F,near,far){const s=F.s,f=F.f||1;g.save();if(f<0){g.translate(s.ax,0);g.scale(-1,1);g.translate(-s.ax,0)}
 const st=s.st||{};if(F.held)st.held=F.held;s.st=st;
 if(F.broom){const b=F.broom,X=p=>[s.ax+p[0],p[1]];st.held=broomHeld({col:near,b:X(b.b),top:X(b.top)})}
 figure(g,s,F.back?far:near,far,F.fem);g.restore()}
function drawScene(g,res,near,far,glass){for(const p of res.props||[])p(g,near,far,glass);
 const figs=(res.figs||[]).slice().sort((a,b)=>(b.back||0)-(a.back||0));for(const F of figs)drawFig(g,F,near,far);
 if(res.trash&&res.trash.show){g.fillStyle=near;g.beginPath();g.ellipse(res.trash.x,.012,.03,.014,.3,0,2*PI);g.fill()}}
window.Man={SC,drawScene,pose,walk,stand,ease,lerp,_shift:shift,bike,skateboard:skate,BK};
})();
/* ---------- движение слева направо, остановки и перекур ---------- */
(function(){const M=window.Man,{pose,walk,stand,ease,lerp}=M,PI=Math.PI,sin=Math.sin,cos=Math.cos,R=PI/180;
const BKB={bar:[.22,.57]};
function at(s,x){return M._shift(s,x)}
function smokeArm(ts,base,o={}){const c=ts%4.6;const s0=pose(base,0);const ha=s0.ha*R;
 const mouth=[s0.head[0]+(.058*cos(-ha)+.032*sin(-ha)),s0.head[1]+(.058*sin(-ha)-.032*cos(-ha))];
 const rest=[.11,s0.sho[1]-.21];let k=c<.9?ease(c/.9):c<1.9?1:c<2.7?1-ease((c-1.9)/.8):0;
 const hand=[lerp(rest[0],mouth[0]+.012,k),lerp(rest[1],mouth[1]-.006,k)];
 return{hand,mouth,k,c}}
function smoking(ts,base,extra){const sa=smokeArm(ts,base);const exh=sa.c>=1.95&&sa.c<4.3;
 const p={...base,hd:(base.hd||0)+(exh?-9*Math.min(1,(sa.c-1.95)/.4):0),an:{ik:sa.hand}};const s=pose(p,0);
 const h=s.arms.an.hand,tip=[h[0]+lerp(.05,.055,sa.k),h[1]+lerp(.018,.0,sa.k)];
 const fx={cig:[[h[0]+.008,h[1]+.002],tip],ember:tip,glow:(sa.c>1&&sa.c<1.9)?1:.45,puffs:[]};
 if(exh){const m=[s.head[0]+.06,s.head[1]-.03];for(let j=0;j<9;j++){const q=(sa.c-1.95)*.55-j*.045;if(q<=0||q>=1)continue;
  fx.puffs.push([m[0]+.04+.32*q+.02*sin(q*9+j),m[1]+.04*q+.22*q*q,.012+.065*q,.42*(1-q)])}}
 for(let j=0;j<6;j++){const q=((ts*.42)+j/6)%1;fx.puffs.push([tip[0]+.025*sin(q*7+j*2)+.03*q,tip[1]+.012+.32*q,.006+.022*q,.22*(1-q)*Math.min(1,q*6)])}
 return{s,fx}}
function mirrorFx(fx,x,f){if(!fx)return fx;const m=p=>[x+f*p[0],p[1]];return{cig:fx.cig.map(m),ember:m(fx.ember),glow:fx.glow,puffs:fx.puffs.map(p=>[x+f*p[0],p[1],p[2],p[3]])}}
const MV={
 walk:{sp:.75,move(t,x,f){return{figs:[{s:at(pose(walk((t*.75/.74)%1),0),x),f}]}},
  stop(ts,x,f){const r=smoking(ts,stand({tor:1,hd:-2,af:{a:[4,14]}}));return{figs:[{s:at(r.s,x),f}],fx:mirrorFx(r.fx,x,f)}}},
 pair:{sp:.7,move(t,x,f){const ph=(t*.7/.74)%1;const p2=walk((ph+.3)%1,.85,{tor:2,hd:-3+3*sin(t*.5)});p2.st={skirt:.02*sin(2*PI*ph)};p2.sc=.94;
   return{figs:[{s:at(pose(p2,0),x-.15*f),f,fem:1,back:1},{s:at(pose({...walk(ph),hd:2*sin(t*.4)-4},0),x),f}]}},
  stop(ts,x,f){const r=smoking(ts,stand({tor:1,hd:-2,af:{a:[4,14]}}));const p2=stand({tor:1,hd:2+3*sin(ts*.6),an:{a:[10,95]},af:{a:[12,100]}});p2.st={skirt:0};p2.sc=.94;
   return{figs:[{s:at(pose(p2,0),x+.42*f),f:-f,fem:1,back:1},{s:at(r.s,x),f}],fx:mirrorFx(r.fx,x,f)}}},
 bike:{sp:1.25,move(t,x,f){return M.SC.bike.at(t,x,f)},
  stop(ts,x,f){const base={hip:[.02,.5],tor:4,hd:-2,n:{ik:[.13,.045],fa:0},f:{ik:[-.1,.045],fa:0},af:{ik:[BKB.bar[0]+.01,BKB.bar[1]]}};const r=smoking(ts,base);
   return{figs:[{s:at(r.s,x),f}],props:[(g,col)=>M.bike(g,x,0,f,0,.8,col)],fx:mirrorFx(r.fx,x,f)}}},
 roller:{sp:1.5,move(t,x,f){return M.SC.roller.at(t,x,f)},
  stop(ts,x,f){const r=smoking(ts,stand({tor:2,hd:-2,n:{a:[3,6],boot:'roll',fa:0},f:{a:[-4,6],boot:'roll',fa:0},af:{a:[4,14]}}));return{figs:[{s:at(r.s,x),f}],fx:mirrorFx(r.fx,x,f)}}},
 skate:{sp:1.1,move(t,x,f){return M.SC.skate.at(t,x,f)},
  stop(ts,x,f){const r=smoking(ts,stand({tor:1,hd:-2,af:{a:[4,14]}}));return{figs:[{s:at(r.s,x),f}],props:[(g,col)=>{g.save();g.translate(x+.42*f,0);g.scale(f,1);M.skateboard(g,0,col);g.restore()}],fx:mirrorFx(r.fx,x,f)}}}
};
M.MV=MV;})();
