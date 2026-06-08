/* ============================================================
   MISTER — direction builder
   One template, three token sets. Game content is identical
   across directions so comparison is purely about style.
   window.MISTER.render(cfg) -> HTML string
   ============================================================ */
(function () {
  function swatches(list) {
    return list.map(s =>
      `<div class="sw"><span class="chip-color" style="background:${s.hex}"></span>
        <div class="chip-meta"><div class="chip-name">${s.n}</div><div class="chip-hex">${s.hex}</div></div></div>`
    ).join('');
  }

  function render(cfg) {
    const segJSON = JSON.stringify(cfg.wheel).replace(/'/g, '&#39;');
    return `
<div class="ms-root dir-${cfg.key}">

  <!-- HEADER -->
  <div class="dir-head">
    <div>
      <p class="dir-kicker">Direzione ${cfg.letter} · ${cfg.kicker}</p>
      <h1 class="dir-name">${cfg.name}</h1>
      <p class="dir-tag">${cfg.tagline}</p>
    </div>
    <div class="dir-chips">
      ${cfg.chips.map((c, i) => `<span class="chip${i === 0 ? ' on' : ''}">${c}</span>`).join('')}
    </div>
  </div>

  <!-- PALETTE -->
  <section>
    <div class="spec-h">Palette</div>
    <div class="sw-grid">${swatches(cfg.swMain)}</div>
    <div class="sw-grid acc">${swatches(cfg.swAcc)}</div>
  </section>

  <!-- TYPOGRAPHY -->
  <section>
    <div class="spec-h">Tipografia</div>
    <div class="spec-cols">
      <div>
        <p class="type-display">Mister</p>
        <p class="type-meta">${cfg.fonts.display} · display / titoli &nbsp;•&nbsp; ${cfg.fonts.ui} · interfaccia</p>
        <div class="type-scale">
          <div class="type-row"><span class="lbl">H1 · 34</span><span class="t-h1">Stagione 2</span></div>
          <div class="type-row"><span class="lbl">H2 · 24</span><span class="t-h2">Mercato di gennaio</span></div>
          <div class="type-row"><span class="lbl">Body · 15</span><span class="t-body">Gira la ruota per scegliere campionato, budget e modulo.</span></div>
        </div>
      </div>
      <div>
        <p class="type-meta" style="margin-top:2px">${cfg.fonts.num} · numeri &amp; dati</p>
        <p class="t-num" style="font-size:64px"><span class="u">0</span>123456789</p>
        <div class="type-scale" style="margin-top:18px">
          <div class="type-row"><span class="lbl">Punteggio</span><span class="t-num">1.480 <span class="u">pt</span></span></div>
          <div class="type-row"><span class="lbl">Minuto</span><span class="t-num">88<span class="u">'</span> &nbsp; 3–1</span></div>
          <div class="type-row"><span class="lbl">Budget</span><span class="t-num">€50<span class="u">M</span></span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- WHEEL SCREEN + COMPONENTS -->
  <section>
    <div class="spec-cols" style="grid-template-columns:390px 1fr; gap:46px; align-items:start">

      <!-- PHONE -->
      <div class="phone-col">
        <div class="spec-h" style="align-self:flex-start">La ruota · 390px</div>
        <div class="ms-phone">
          <div class="ms-screen">
            <div class="ms-topbar">
              <div class="ms-team"><small>La tua squadra</small>FC Furia</div>
              <div class="ms-budget"><b>€50M</b><span>Budget</span></div>
            </div>
            <div class="ms-steps">
              <div class="st done"></div><div class="st now"></div><div class="st"></div><div class="st"></div><div class="st"></div>
            </div>
            <div class="ms-prompt">Step 2 — Scegli il <b>campionato</b></div>
            <div class="ms-wheelwrap">
              <canvas class="mister-wheel" data-glow="${cfg.glow}" data-rim="${cfg.glow}"
                data-segments='${segJSON}'></canvas>
            </div>
            <button class="ms-spin">Gira la ruota<small>tocca per girare</small></button>
          </div>
        </div>
        <div class="phone-caption">Tocca la ruota o il pulsante per girare ↑</div>
      </div>

      <!-- COMPONENTS -->
      <div class="comp-col">
        <div class="spec-h">Componenti chiave</div>
        <div class="comp-stack">

          <!-- result banner -->
          <div class="ms-banner">
            <span class="bk">W</span>
            <div class="res">Vittoria</div>
            <div class="vs">FC Furia &nbsp;vs&nbsp; Real Aurora · 24ª giornata</div>
            <div class="score">3 — 1</div>
          </div>
          <div class="banner-mini-row">
            <div class="ms-mini"><span class="dot" style="background:var(--draw)">P</span>
              <span class="txt"><b style="color:var(--draw)">Pareggio</b><span>1 — 1 · +1 punto</span></span></div>
            <div class="ms-mini"><span class="dot" style="background:var(--loss);color:#fff">S</span>
              <span class="txt"><b style="color:var(--loss)">Sconfitta</b><span>0 — 2 · 0 punti</span></span></div>
          </div>

          <!-- match card -->
          <div class="ms-match">
            <div class="mh">
              <div class="opp">
                <div class="crest">RA</div>
                <div><b>Real Aurora</b><br><small>3ª in classifica</small></div>
              </div>
              <span class="ha">Trasferta</span>
            </div>
            <div class="forza">
              <span class="lbl">Forza</span>
              <div class="bars"><i class="f"></i><i class="f"></i><i class="f"></i><i class="f"></i><i></i></div>
            </div>
            <div class="prob">
              <span class="pv" style="flex:52">52%</span>
              <span class="pp" style="flex:26">26%</span>
              <span class="ps" style="flex:22">22%</span>
            </div>
            <div class="prob-key">
              <span><i style="background:var(--win)"></i>Vittoria</span>
              <span><i style="background:var(--draw)"></i>Pareggio</span>
              <span><i style="background:var(--loss)"></i>Sconfitta</span>
            </div>
          </div>

          <!-- stats bar -->
          <div class="ms-stats">
            <div class="cell hl"><div class="num">47</div><div class="cap">Punti</div></div>
            <div class="cell"><div class="num">14</div><div class="cap">V</div></div>
            <div class="cell"><div class="num">5</div><div class="cap">P</div></div>
            <div class="cell"><div class="num">4</div><div class="cap">S</div></div>
            <div class="cell"><div class="num">41</div><div class="cap">Gol</div></div>
          </div>

          <!-- standings -->
          <div class="ms-standings">
            <div class="std-h"><span>#</span><span>Squadra</span><span>G</span><span>Pt</span></div>
            <div class="std-row z-ch"><span class="zone"></span><span class="pos">1</span><span class="team"><span class="mc"></span>Athletic Nord</span><span class="pl">23</span><span class="pts">54</span></div>
            <div class="std-row z-ch"><span class="zone"></span><span class="pos">2</span><span class="team"><span class="mc"></span>Olympia FC</span><span class="pl">23</span><span class="pts">51</span></div>
            <div class="std-row z-ch"><span class="zone"></span><span class="pos">3</span><span class="team"><span class="mc"></span>Real Aurora</span><span class="pl">23</span><span class="pts">49</span></div>
            <div class="std-row z-ch"><span class="zone"></span><span class="pos">4</span><span class="team"><span class="mc"></span>Sporting Vale</span><span class="pl">23</span><span class="pts">46</span></div>
            <div class="std-row z-el you"><span class="zone"></span><span class="pos">5</span><span class="team"><span class="mc" style="background:var(--primary)"></span>FC Furia</span><span class="pl">23</span><span class="pts">47</span></div>
            <div class="std-row z-co"><span class="zone"></span><span class="pos">6</span><span class="team"><span class="mc"></span>Union Delta</span><span class="pl">23</span><span class="pts">39</span></div>
            <div class="std-row"><span class="zone"></span><span class="pos">7</span><span class="team"><span class="mc"></span>City Rovers</span><span class="pl">23</span><span class="pts">31</span></div>
            <div class="std-row z-rel"><span class="zone"></span><span class="pos">18</span><span class="team"><span class="mc"></span>Vecchia Pieve</span><span class="pl">23</span><span class="pts">14</span></div>
            <div class="std-legend">
              <span><i style="background:var(--champions)"></i>Champions</span>
              <span><i style="background:var(--europa)"></i>Europa</span>
              <span><i style="background:var(--conference)"></i>Conference</span>
              <span><i style="background:var(--loss)"></i>Retrocessione</span>
            </div>
          </div>

          <!-- competition tickets + buttons -->
          <div class="comp-row">
            <div class="comp-tk ch"><b>Champions</b><span>Qualificato · 1°–4°</span></div>
            <div class="comp-tk el"><b>Europa</b><span>5°–6°</span></div>
            <div class="comp-tk co"><b>Conference</b><span>7°</span></div>
          </div>
          <div class="btn-row">
            <button class="ms-btn primary">Gioca partita</button>
            <button class="ms-btn ghost">Simula tutto</button>
          </div>

        </div>
      </div>
    </div>
  </section>
</div>`;
  }

  window.MISTER = { render };
})();
