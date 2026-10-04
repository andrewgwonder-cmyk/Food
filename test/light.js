(function(){
const mode=window.LIGHT||'morning';const root=document.documentElement;root.setAttribute('data-light',mode);
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const M=window.Man,{ease,lerp}=M;
const COL={morning:{near:'#0d0806',far:'#2e1f17',rim:'rgba(255,214,150,.95)',glass:'rgba(255,220,180,.22)',rd:-1},
 evening:{near:'#0d0705',far:'#2c1913',rim:'rgba(255,165,110,.95)',glass:'rgba(255,190,150,.2)',rd:1},
 night:{near:'#05080f',far:'#18213a',rim:'rgba(190,210,255,.85)',glass:'rgba(180,200,255,.16)',rd:1}}[mode];
/* ================= луч и пыль ================= */
const c=document.createElement('canvas');c.id='dust';document.body.appendChild(c);
const dpr=Math.min(2,devicePixelRatio||1);let W,H;function size(){W=c.width=innerWidth*dpr;H=c.height=innerHeight*dpr}size();addEventListener('resize',size);
const g=c.getContext('2d');
const P={morning:[-.02,.9,.3,'255,222,175'],evening:[1.04,.12,.25,'255,182,135'],night:[1.02,.2,.24,'215,228,255']}[mode];
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const N=mode==='night'?80:130,parts=[];
for(let i=0;i<N;i++){const r=rnd();const kind=r<.62?0:r<.86?1:r<.93?2:3;
 parts.push({x:rnd(),y:rnd(),kind,s:kind===0?.35+rnd()*.55:kind===1?.9+rnd()*.9:kind===2?5+rnd()*9:3+rnd()*5,
  a:kind===2?.05+rnd()*.07:kind===3?.35+rnd()*.3:.45+rnd()*.5,p1:rnd()*6.3,p2:rnd()*6.3,p3:rnd()*6.3,gl:1.5+rnd()*4,rot:rnd()*6.3,vr:(rnd()-.5)*.6,curl:(rnd()-.5)*1.4})}
function beamI(x,y){const t=y/H,cx=(P[0]+(P[1]-P[0])*t)*W,w=P[2]*W*(.7+.9*t);const d=(x-cx)/(w*.5);return Math.exp(-d*d*1.6)}
function drawBeam(alpha){const x0=P[0]*W,x1=P[1]*W,ang=Math.atan2(H,x1-x0),len=Math.hypot(x1-x0,H);g.save();g.translate(x0,0);g.rotate(ang-Math.PI/2);
 const w=P[2]*W*1.25;const gr=g.createLinearGradient(-w,0,w,0);gr.addColorStop(0,`rgba(${P[3]},0)`);gr.addColorStop(.5,`rgba(${P[3]},${alpha})`);gr.addColorStop(1,`rgba(${P[3]},0)`);
 g.fillStyle=gr;g.beginPath();g.moveTo(-w*.45,0);g.lineTo(w*.45,0);g.lineTo(w,len);g.lineTo(-w,len);g.closePath();g.fill();g.restore()}
let last=performance.now();
function dust(now){const T=now/1000,dt=Math.min(.05,(now-last)/1000);last=now;g.clearRect(0,0,W,H);
 g.globalCompositeOperation='screen';drawBeam((mode==='morning'?.025:.04)+.03*Math.sin(T*.55)+.012*Math.sin(T*1.7));
 for(const p of parts){ // медленный дрейф воздуха: у каждой пылинки свой «ветер»
  const vx=(Math.sin(T*.11+p.p1)*.6+Math.sin(T*.37+p.p2)*.35)*(p.kind===2?.4:1),vy=(Math.sin(T*.09+p.p3)*.5-.15+Math.sin(T*.53+p.p1)*.25)*(p.kind===2?.4:1);
  p.x+=vx*dt*.012;p.y+=vy*dt*.01;if(p.x<-.05)p.x+=1.1;if(p.x>1.05)p.x-=1.1;if(p.y<-.05)p.y+=1.1;if(p.y>1.05)p.y-=1.1;p.rot+=p.vr*dt;
  const X=p.x*W,Y=p.y*H,I=beamI(X,Y);if(I<.03)continue;
  let a=p.a*I;
  if(p.kind===0)a*=.25+.75*Math.pow(Math.max(0,Math.sin(T*p.gl+p.p2)),6)+.15; // плоские чешуйки вспыхивают, когда поворачиваются к свету
  else if(p.kind===1)a*=.6+.4*Math.sin(T*.7+p.p1);
  const r=p.s*dpr;
  if(p.kind===2){const gr=g.createRadialGradient(X,Y,0,X,Y,r);gr.addColorStop(0,`rgba(${P[3]},${(a*.5).toFixed(3)})`);gr.addColorStop(.8,`rgba(${P[3]},${(a*.9).toFixed(3)})`);gr.addColorStop(1,`rgba(${P[3]},0)`);g.fillStyle=gr;g.beginPath();g.arc(X,Y,r,0,7);g.fill()}
  else if(p.kind===3){g.strokeStyle=`rgba(${P[3]},${a.toFixed(3)})`;g.lineWidth=.6*dpr;g.beginPath();const dx=Math.cos(p.rot)*r,dy=Math.sin(p.rot)*r;g.moveTo(X-dx,Y-dy);g.quadraticCurveTo(X+dy*p.curl,Y-dx*p.curl,X+dx,Y+dy);g.stroke()}
  else{g.fillStyle=`rgba(${P[3]},${Math.min(1,a).toFixed(3)})`;g.beginPath();g.arc(X,Y,r,0,7);g.fill();if(p.kind===1&&a>.4){g.fillStyle=`rgba(${P[3]},${(a*.15).toFixed(3)})`;g.beginPath();g.arc(X,Y,r*2.4,0,7);g.fill()}}}
 g.globalCompositeOperation='source-over';if(!RM)requestAnimationFrame(dust)}
requestAnimationFrame(dust);
/* ================= человечек: слой позади карточек ================= */
const S=46,STH=84,GY=70;
const layer=document.createElement('canvas');layer.id='manlayer';document.body.appendChild(layer);
function holes(){const app=document.getElementById('app');const bud=app.querySelector('.budget');
 if(bud&&!(bud.nextElementSibling&&bud.nextElementSibling.classList.contains('gapA'))){const d=document.createElement('div');d.className='gapA';bud.after(d)}
 const secs=app.querySelectorAll('.sec');const last=secs[secs.length-1];
 if(last&&!(last.nextElementSibling&&last.nextElementSibling.classList.contains('gapZ'))){app.querySelectorAll('.gapZ').forEach(e=>e.remove());const d=document.createElement('div');d.className='gapZ';last.after(d)}}
// где стоит полоса: в начале — в просвете под кольцом, к концу прокрутки — в просвете внизу дня; посередине её закрывают карточки
function bandY(){const A=document.querySelector('.gapA'),Z=document.querySelector('.gapZ');if(!A||!Z)return null;
 const sy=scrollY,S2=Math.max(1,document.documentElement.scrollHeight-innerHeight);const aDoc=A.getBoundingClientRect().top+sy,zDoc=Z.getBoundingClientRect().top+sy;
 const p=Math.min(1,Math.max(0,sy/S2)),k=p*p*(3-2*p);return lerp(aDoc,zDoc-S2,k)}
const POOL=[[5,7,['roller','skate','think','dumbbell']],[7,10,['treadmill','pullup','dumbbell','bike']],[10,13,['fixbike','fixcar','sweep','trash']],
 [13,16,['read','bench','think','sweep']],[16,19,['bike','roller','skate','trash','fixcar']],[19,22,['walk','read','think','bench']],[22,29,['bench','think','read','walk',null]]];
function hash(n){let x=n|0;x=(x^61)^(x>>>16);x=x+(x<<3);x^=x>>>4;x=Math.imul(x,0x27d4eb2d);x^=x>>>15;return(x>>>0)/4294967296}
function slotAt(date){const d0=new Date(date);d0.setHours(0,0,0,0);const day=Math.floor(d0.getTime()/864e5);let t=d0.getTime(),i=0;
 while(true){const r=hash(day*1000+i),len=(240+r*300)*1000;if(t+len>date.getTime()){const h=new Date(t).getHours(),hh=h<5?h+24:h;const pool=(POOL.find(p=>hh>=p[0]&&hh<p[1])||POOL[6])[2];
   const r2=hash(day*1000+i+500),r3=hash(day*1000+i+900);let name=pool[Math.floor(r2*pool.length)];
   if(hh>=17&&hh<22&&r3<.07)name='pair';if(r3>.9)name=null;
   return{name,start:t,len,seed:day*1000+i,rev:hash(day*7+i)<.2,spot:.3+hash(day*13+i)*.4}}t+=len;i++}}
let demo=window.MAN_DEMO||null,demo0=performance.now();
function current(now){if(!demo){const s=slotAt(new Date());return{...s,tt:(Date.now()-s.start)/1000}}
 let t=(now-demo0)/1000,acc=0;for(const d of demo){if(t<acc+d[1])return{name:d[0],len:d[1]*1000,tt:t-acc,seed:7,...(d[2]||{})};acc+=d[1]}return{name:null,tt:0,len:1}}
// проход через сцену: в основном слева направо, иногда обратно («возвращается»), иногда остановка и перекур
function traverse(cur,Wu){const mv=M.MV[cur.name];let t=cur.tt,pass=0;const dist=Wu+1.8,moveT=dist/mv.sp;
 for(;pass<400;pass++){const sd=cur.seed*31+pass*977;
  const rev=cur.force?!!cur.rev:(pass>0&&hash(sd+1)<.3);const stop=cur.force?cur.stop!=null:hash(sd+2)<.45;
  const stopAt=cur.force&&cur.stop!=null?cur.stop:.3+hash(sd+3)*.4,stopDur=stop?(cur.force&&cur.stopDur?cur.stopDur:8+hash(sd+4)*6):0,gap=cur.force?99:2.5+hash(sd+5)*4;
  const passT=moveT+stopDur+gap;if(t<passT){const f=rev?-1:1,tS=stopAt*moveT;let d,st=-1;
   if(!stop||t<tS)d=t*mv.sp;else if(t<tS+stopDur){d=tS*mv.sp;st=t-tS}else d=(t-stopDur)*mv.sp;
   if(d>dist)return null;const x=f>0?-.9+d:Wu+.9-d;return{res:st>=0?mv.stop(st,x,f):mv.move(t,x,f),pa:1}}
  t-=passT}return null}
function frame(cur,Wu){if(!cur.name)return null;if(M.MV[cur.name])return traverse(cur,Wu);const sc=M.SC[cur.name];if(!sc)return null;
 const tt=cur.tt,len=cur.len/1000;
 if(sc.move){const r=sc.run(tt,{W:Wu,dir:1,from:-.8,x:-.8});return{res:r,pa:1}} // мусор, метла — всегда слева направо
 const dir=cur.rev?-1:1,edge=dir>0?-.7:Wu+.7,spot=cur.spot*Wu,arr=cur.skip?0:Math.abs(spot-edge)/.75,far=dir>0?Wu+.7:-.7,lv=Math.abs(far-spot)/.75,lvs=cur.skip?1e9:len-lv;
 const pa=Math.min(ease(tt/1.2),ease((len-tt)/1.2));
 if(tt<arr){const x=edge+dir*.75*tt;const r=sc.run(0,{W:Wu,dir:1,x:spot});return{res:{props:r.props,figs:[{s:M.pose(M.walk((tt*.75/.74)%1),x),f:dir}]},pa}}
 if(tt>lvs){const k=tt-lvs,x=spot+dir*.75*k;const r=sc.run(0,{W:Wu,dir:1,x:spot});return{res:{props:r.props,figs:[{s:M.pose(M.walk((k*.75/.74)%1),x),f:dir}]},pa}}
 return{res:sc.run(tt-arr,{W:Wu,dir:1,x:spot}),pa}}
const SMK={morning:'240,228,212',evening:'240,222,205',night:'205,215,235'}[mode];
const off=document.createElement('canvas'),og=off.getContext('2d');
function paint(q,cw,fr){q.setTransform(1,0,0,1,0,0);q.clearRect(0,0,layer.width,layer.height);
 q.setTransform(dpr,0,0,dpr,0,0);const lg=q.createLinearGradient(14,0,cw-14,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(.12,'rgba(255,255,255,.16)');lg.addColorStop(.88,'rgba(255,255,255,.16)');lg.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=lg;q.fillRect(14,GY,cw-28,1);
 if(!fr)return;const res=fr.res;
 const base=(c)=>{c.setTransform(dpr,0,0,dpr,0,0);c.translate(0,GY);c.scale(S,-S)};
 const all=(c,near,far,gl)=>{c.save();c.globalAlpha=fr.pa;for(const p of res.props||[])p(c,near,far,gl);c.restore();M.drawScene(c,{...res,props:[]},near,far,gl)};
 if(off.width!==layer.width||off.height!==layer.height){off.width=layer.width;off.height=layer.height}
 og.setTransform(1,0,0,1,0,0);og.clearRect(0,0,off.width,off.height);base(og);og.transform(1,0,COL.rd<0?1.5:-1.5,-.1,0,0);all(og,'#000','#000','#000');
 q.setTransform(1,0,0,1,0,0);q.globalAlpha=mode==='night'?.4:.5;q.drawImage(off,0,0);q.globalAlpha=1;
 base(q);q.save();q.translate(COL.rd*1.1/S,1/S);all(q,COL.rim,COL.rim,COL.rim);q.restore();
 base(q);all(q,COL.near,COL.far,COL.glass);
 const fx=res.fx;if(fx){q.lineCap='round';q.strokeStyle='rgba(245,238,228,.95)';q.lineWidth=.011;q.beginPath();q.moveTo(...fx.cig[0]);q.lineTo(...fx.cig[1]);q.stroke();
  for(const p of fx.puffs){const gr=q.createRadialGradient(p[0],p[1],0,p[0],p[1],p[2]);gr.addColorStop(0,`rgba(${SMK},${p[3].toFixed(3)})`);gr.addColorStop(1,`rgba(${SMK},0)`);q.fillStyle=gr;q.beginPath();q.arc(p[0],p[1],p[2],0,7);q.fill()}
  const e=fx.ember,gr=q.createRadialGradient(e[0],e[1],0,e[0],e[1],.03);gr.addColorStop(0,`rgba(255,140,60,${.9*fx.glow})`);gr.addColorStop(1,'rgba(255,90,30,0)');q.fillStyle=gr;q.beginPath();q.arc(e[0],e[1],.03,0,7);q.fill();
  q.fillStyle=`rgba(255,${fx.glow>.9?200:150},90,1)`;q.beginPath();q.arc(e[0],e[1],.007,0,7);q.fill()}}
let lastPaint=0;
function man(now){if(now-lastPaint>=31){lastPaint=now;holes();const y=bandY(),app=document.getElementById('app');
 layer.style.display=y==null?'none':'';if(y!=null&&app){const ar=app.getBoundingClientRect(),cs=getComputedStyle(app),pl=parseFloat(cs.paddingLeft),pr=parseFloat(cs.paddingRight);const cw=ar.width-pl-pr;
  layer.style.left=(ar.left+pl)+'px';layer.style.width=cw+'px';layer.style.transform=`translateY(${(y).toFixed(1)}px)`;
  if(layer.width!==Math.round(cw*dpr)){layer.width=Math.round(cw*dpr);layer.height=STH*dpr}
  const cur=current(now);paint(layer.getContext('2d'),cw,frame(cur,cw/S))}}
 requestAnimationFrame(man)}
requestAnimationFrame(man);
/* ================= кольцо при открытии дня ================= */
let lastDay=null;
function ringIn(){const r=document.querySelector('#app .ring');if(!r||r.dataset.anim)return;r.dataset.anim=1;
 const day=(document.querySelector('#app .datebtn small')||{}).textContent;if(day===lastDay||RM)return;lastDay=day;
 const arcs=[...r.querySelectorAll('svg circle')].slice(1);let delay=80;
 arcs.forEach(a=>{const [len,C]=a.getAttribute('stroke-dasharray').split(' ').map(Number);const d=280+len*2.2;
  a.animate([{strokeDasharray:`0 ${C}`},{strokeDasharray:`${len} ${C}`}],{duration:d,delay,easing:'cubic-bezier(.3,.7,.3,1)',fill:'backwards'});delay+=d*.85});
 const b=r.querySelector('.c b');const target=+(b.textContent.replace(/\s/g,''));const t1=performance.now();
 (function tick(n){const k=Math.min(1,(n-t1)/1100),e=1-Math.pow(1-k,3);b.textContent=Math.round(target*e).toLocaleString('ru-RU');if(k<1)requestAnimationFrame(tick)})(t1)}
/* ================= стаканы воды ================= */
const GL=`<svg viewBox="0 0 24 38" class="gl"><defs><clipPath id="CID"><path d="M4.8 3C4.6 12 5.5 23 6.4 29.6c.1.7.6 1 1.2 1h8.8c.6 0 1.1-.3 1.2-1C18.5 23 19.4 12 19.2 3z"/></clipPath>
 <linearGradient id="WG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mw)" stop-opacity=".95"/><stop offset="1" stop-color="var(--mw)" stop-opacity=".55"/></linearGradient>
 <linearGradient id="GG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".22" stop-color="#fff" stop-opacity=".05"/><stop offset=".75" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient></defs>
 <path d="M3.5 2C3.2 12 4.2 24 5.2 31.5c.3 2.5 1.8 4 4.3 4h5c2.5 0 4-1.5 4.3-4 1-7.5 2-19.5 1.7-29.5z" fill="url(#GG)" stroke="rgba(255,255,255,.42)" stroke-width=".6"/>
 <path d="M6.6 31.6h10.8c-.3 1.7-1.3 2.6-3 2.6h-4.8c-1.7 0-2.7-.9-3-2.6z" fill="#fff" fill-opacity=".14"/>
 <g clip-path="url(#CID)"><path class="wat" fill="url(#WG)" d=""/><path class="srf" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".55" d=""/><g class="bub"></g></g>
 <path d="M5.9 5c-.1 8 .5 16 1.3 23" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/>
 <path d="M18 7c0 6-.3 11-.8 16" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width=".6" stroke-linecap="round"/>
 <ellipse cx="12" cy="2.1" rx="8.4" ry=".85" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".55"/></svg>`;
let gid=0;
function wy(level){return 30.6-25.6*.84*level}
function wline(level,T,amp){const y=wy(level);let d='';for(let x=3;x<=21;x+=1.2)d+=(d?' L':'M')+x+' '+(y+Math.sin(T+x*.55)*amp+Math.sin(T*1.7-x*.3)*amp*.4).toFixed(2);return d}
function wpath(level,T,amp){if(level<=0)return'';return wline(level,T,amp)+' L21 32 L3 32Z'}
function glasses(){const cups=document.querySelector('#app .cups');if(!cups||cups.dataset.g)return;cups.dataset.g=1;
 const n=cups.children.length;const sec=cups.closest('.sec');const k=(sec.querySelector('.sec-h .k')||{}).textContent||'';
 const wt=parseFloat(k.replace(',','.'))*1000||0;const prev=window._wt==null?wt:window._wt;window._wt=wt;
 cups.innerHTML='';cups.classList.add('glx');const items=[];
 for(let i=0;i<n;i++){const id='c'+(++gid);const span=document.createElement('span');span.innerHTML=GL.replace('CID',id).replace('url(#CID)',`url(#${id})`).replace(/id="WG"/,`id="w${id}"`).replace('url(#WG)',`url(#w${id})`).replace(/id="GG"/,`id="g${id}"`).replace('url(#GG)',`url(#g${id})`);cups.appendChild(span);
  const lv=v=>Math.max(0,Math.min(1,(v-i*250)/250));items.push({w:span.querySelector('.wat'),s:span.querySelector('.srf'),b:span.querySelector('.bub'),from:lv(prev),to:lv(wt)})}
 const t0=performance.now(),dur=RM?0:1300;
 (function step(now){const k=dur?Math.min(1,(now-t0)/dur):1;let more=k<1;
  items.forEach((it,j)=>{const ch=it.from!==it.to;const lk=ch?ease(k):1;const L=lerp(it.from,it.to,lk);const amp=ch?(1-k)*1.3+.12:.12;
   it.w.setAttribute('d',wpath(L,now/180+j,amp));it.s.setAttribute('d',L>0?wline(L,now/180+j,amp):'');
   if(ch&&it.to>it.from&&k<1){let h='';for(let q=0;q<5;q++){const bt=(k*2.2+q*.23)%1,bx=6+((q*37+j*11)%10),by=30-bt*(30-wy(L));h+=`<circle cx="${bx+Math.sin(bt*9+q)*.8}" cy="${by}" r="${.45+q%3*.25}" fill="#fff" fill-opacity="${(.6*(1-bt)).toFixed(2)}"/>`}it.b.innerHTML=h}else it.b.innerHTML=''});
  if(more)requestAnimationFrame(step);else idle()})(t0);
 function idle(){if(RM)return;const run=now=>{if(!cups.isConnected)return;items.forEach((it,j)=>{it.w.setAttribute('d',wpath(it.to,now/700+j*1.3,.18));it.s.setAttribute('d',it.to>0?wline(it.to,now/700+j*1.3,.18):'')});setTimeout(()=>requestAnimationFrame(run),80)};requestAnimationFrame(run)}}
function onRender(){ringIn();holes();glasses()}
new MutationObserver(onRender).observe(document.getElementById('app'),{childList:true,subtree:true});onRender();
})();
