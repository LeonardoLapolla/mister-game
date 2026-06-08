/* ============================================================
   MISTER · PRO PITCH wheel engine (result-aware)
   ProtoWheel.mount(canvas, { segments, onResult })
   - segments: [{label, color, sub?}]
   - spin(targetIndex?) eases so the chosen segment lands under
     the top pointer, then calls onResult(index, segment).
   Pro Pitch look: glass rim, soft emerald glow, clean labels.
   ============================================================ */
(function () {
  const TAU = Math.PI * 2;

  function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  function lum(hex){try{const[r,g,b]=hexToRgb(hex);return (0.299*r+0.587*g+0.114*b)/255;}catch(e){return 0;}}
  function ink(hex){return lum(hex)>0.55?'#06120C':'#F2FBF6';}
  function mix(hex,t){const[r,g,b]=hexToRgb(hex);const f=(c)=>Math.round(c+(255-c)*t);return `rgb(${f(r)},${f(g)},${f(b)})`;}
  function shade(hex,t){const[r,g,b]=hexToRgb(hex);const f=(c)=>Math.round(c*(1-t));return `rgb(${f(r)},${f(g)},${f(b)})`;}

  function mount(cv, opts){
    const state = {
      segs: opts.segments || [],
      rot: -0.18,
      spinning: false,
      onResult: opts.onResult || function(){},
      glow: opts.glow || '#16C784'
    };
    cv.__pw = state;

    function draw(){
      const ctx = cv.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio||1, 2.5);
      const W = cv.clientWidth||300, Hh = cv.clientHeight||300;
      if (cv.width !== W*dpr){ cv.width=W*dpr; cv.height=Hh*dpr; }
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,W,Hh);
      const cx=W/2, cy=Hh/2, R=Math.min(cx,cy)-18;
      const segs=state.segs, n=segs.length, slice=TAU/n, rot=state.rot;

      // outer glass rim
      ctx.save();
      ctx.shadowColor=state.glow; ctx.shadowBlur= state.spinning?34:18;
      ctx.beginPath(); ctx.arc(cx,cy,R+6,0,TAU);
      const rg=ctx.createLinearGradient(0,cy-R,0,cy+R);
      rg.addColorStop(0,'rgba(255,255,255,.22)'); rg.addColorStop(.5,'rgba(255,255,255,.04)'); rg.addColorStop(1,'rgba(255,255,255,.14)');
      ctx.strokeStyle=rg; ctx.lineWidth=7; ctx.stroke();
      ctx.restore();

      // segments
      for(let i=0;i<n;i++){
        const a0=rot+i*slice-Math.PI/2, a1=a0+slice;
        const grad=ctx.createRadialGradient(cx,cy,R*0.28,cx,cy,R);
        grad.addColorStop(0, mix(segs[i].color,0.12));
        grad.addColorStop(1, shade(segs[i].color,0.10));
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,a0,a1); ctx.closePath();
        ctx.fillStyle=grad; ctx.fill();
        ctx.strokeStyle='rgba(7,10,13,.55)'; ctx.lineWidth=2; ctx.stroke();
        // label
        ctx.save();
        ctx.translate(cx,cy); ctx.rotate(a0+slice/2);
        ctx.textAlign='right'; ctx.textBaseline='middle';
        ctx.fillStyle=ink(segs[i].color);
        const big=Math.round(R*0.108);
        ctx.font='700 '+big+"px 'Saira Condensed', sans-serif";
        ctx.fillText((segs[i].label||'').toUpperCase(), R-18, segs[i].sub?-6:0);
        if(segs[i].sub){
          ctx.font='500 '+Math.round(R*0.062)+"px 'DM Mono', monospace";
          ctx.globalAlpha=.8; ctx.fillText(segs[i].sub.toUpperCase(), R-18, big*0.62);
        }
        ctx.restore();
      }

      // inner disc
      ctx.beginPath(); ctx.arc(cx,cy,R*0.30,0,TAU);
      const ig=ctx.createRadialGradient(cx,cy-8,4,cx,cy,R*0.30);
      ig.addColorStop(0,'#10161C'); ig.addColorStop(1,'#070A0D');
      ctx.fillStyle=ig; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.10)'; ctx.lineWidth=2; ctx.stroke();

      // hub
      ctx.save();
      ctx.shadowColor=state.glow; ctx.shadowBlur=state.spinning?26:14;
      ctx.beginPath(); ctx.arc(cx,cy,R*0.205,0,TAU);
      const hg=ctx.createLinearGradient(0,cy-R*.2,0,cy+R*.2);
      hg.addColorStop(0,'#5BE3B0'); hg.addColorStop(1,state.glow);
      ctx.fillStyle=hg; ctx.fill();
      ctx.restore();
      ctx.fillStyle='#04130D'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='700 '+Math.round(R*0.12)+"px 'Saira Condensed', sans-serif";
      ctx.fillText(state.spinning?'•••':'GIRA', cx, cy+1);

      // pointer
      ctx.save();
      ctx.shadowColor=state.glow; ctx.shadowBlur=14;
      const py=cy-R-10;
      ctx.beginPath(); ctx.moveTo(cx-14,py); ctx.lineTo(cx+14,py); ctx.lineTo(cx,py+24); ctx.closePath();
      ctx.fillStyle='#EAF1F4'; ctx.fill();
      ctx.restore();
    }
    state.draw=draw;

    function spin(targetIndex){
      if(state.spinning) return;
      const n=state.segs.length;
      const idx = (typeof targetIndex==='number') ? targetIndex : Math.floor(Math.random()*n);
      state.spinning=true;
      const slice=TAU/n;
      // we want the centre of segment idx to sit at top pointer (angle -PI/2 in our system => segment top aligns when rot + idx*slice + slice/2 === 0 mod TAU, since drawn from -PI/2)
      const start=state.rot;
      const desired = -(idx*slice + slice/2);
      const turns = 5 + Math.floor(Math.random()*2);
      // normalise so target > start by full turns
      let target = desired;
      while (target < start + turns*TAU) target += TAU;
      const dur=3800, t0=performance.now();
      function frame(t){
        const p=Math.min((t-t0)/dur,1);
        const e=1-Math.pow(1-p,3.6);
        state.rot=start+(target-start)*e;
        draw();
        if(p<1) requestAnimationFrame(frame);
        else { state.spinning=false; draw(); state.onResult(idx, state.segs[idx]); }
      }
      requestAnimationFrame(frame);
    }
    state.spin=spin;

    cv.style.cursor='pointer';
    cv.onclick=()=>spin();
    draw();
    return state;
  }

  window.ProtoWheel = { mount };
})();
