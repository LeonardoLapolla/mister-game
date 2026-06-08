/* ============================================================
   MISTER — canvas wheel of fortune
   Reads data-segments (JSON), data-glow, data-rim, data-hub off
   each <canvas.mister-wheel>. Click to spin. Auto-inits new
   canvases (handles design-canvas focus overlay re-mounts).
   ============================================================ */
(function () {
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function contrast(hex) {
    try {
      const [r, g, b] = hexToRgb(hex);
      const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return L > 0.58 ? '#0a1208' : '#ffffff';
    } catch (e) { return '#fff'; }
  }

  function draw(cv) {
    const segs = cv.__segs;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssW = cv.clientWidth || 300, cssH = cv.clientHeight || 300;
    if (cv.width !== cssW * dpr) { cv.width = cssW * dpr; cv.height = cssH * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const cx = cssW / 2, cy = cssH / 2;
    const R = Math.min(cx, cy) - 16;
    const rot = cv.__rot || 0;
    const n = segs.length;
    const slice = (Math.PI * 2) / n;
    const glow = cv.dataset.glow || '#A6FF2E';
    const rim = cv.dataset.rim || glow;

    // soft outer halo
    ctx.save();
    ctx.shadowColor = glow; ctx.shadowBlur = 26;
    ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
    ctx.strokeStyle = rim; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();

    // segments
    for (let i = 0; i < n; i++) {
      const a0 = rot + i * slice - Math.PI / 2;
      const a1 = a0 + slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = segs[i].color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.5; ctx.stroke();

      // label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + slice / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = contrast(segs[i].color);
      ctx.font = '700 ' + Math.round(R * 0.092) + "px 'Space Mono', monospace";
      const label = segs[i].label.toUpperCase();
      ctx.fillText(label, R - 16, 0);
      ctx.restore();
    }

    // inner ring
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.30, 0, Math.PI * 2);
    ctx.fillStyle = '#06100a'; ctx.fill();
    ctx.strokeStyle = rim; ctx.lineWidth = 2.5; ctx.stroke();

    // hub
    ctx.save();
    ctx.shadowColor = glow; ctx.shadowBlur = cv.__spinning ? 22 : 12;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.205, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#06100a';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 ' + Math.round(R * 0.115) + "px 'Anton', sans-serif";
    ctx.fillText(cv.__spinning ? '···' : 'GIRA', cx, cy + 1);

    // pointer (top, pointing down into wheel)
    ctx.save();
    ctx.shadowColor = glow; ctx.shadowBlur = 16;
    ctx.beginPath();
    const py = cy - R - 8;
    ctx.moveTo(cx - 13, py);
    ctx.lineTo(cx + 13, py);
    ctx.lineTo(cx, py + 22);
    ctx.closePath();
    ctx.fillStyle = rim; ctx.fill();
    ctx.strokeStyle = '#06100a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  function spin(cv) {
    if (cv.__spinning) return;
    cv.__spinning = true;
    const start = cv.__rot || 0;
    const turns = 4 + Math.random() * 3;
    const target = start + turns * Math.PI * 2 + Math.random() * Math.PI * 2;
    const dur = 3600;
    const t0 = performance.now();
    function frame(t) {
      const p = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3.4); // easeOutCubic-ish
      cv.__rot = start + (target - start) * e;
      draw(cv);
      if (p < 1) requestAnimationFrame(frame);
      else { cv.__spinning = false; draw(cv); }
    }
    requestAnimationFrame(frame);
  }

  function init(cv) {
    if (cv.__msReady) return;
    try { cv.__segs = JSON.parse(cv.dataset.segments); }
    catch (e) { return; }
    if (!Array.isArray(cv.__segs) || !cv.__segs.length) return;
    cv.__msReady = true;
    cv.__rot = (Math.random() * 0.6) - 0.3;
    cv.addEventListener('click', () => spin(cv));
    draw(cv);
  }

  function scan() {
    document.querySelectorAll('canvas.mister-wheel').forEach(init);
  }

  // expose + auto-scan (covers focus-overlay remounts)
  window.MisterWheel = { scan, spin, draw };
  if (document.readyState !== 'loading') scan();
  else document.addEventListener('DOMContentLoaded', scan);
  setInterval(scan, 600);
  window.addEventListener('resize', () => {
    document.querySelectorAll('canvas.mister-wheel').forEach(cv => { if (cv.__msReady) draw(cv); });
  });
})();
