'use strict';
// EL ENCIERRO FANTASMA — cruza la avenida entre toros, taxis y búhos fantasma
(function () {
const C = G.C;
const T = 16, TOP = 18, ROWS = 10, COLS = 20;
const LANES = [1, 2, 3, 5, 6, 7, 8];
const DEF = G.GAMES.encierro = {
  id: 'encierro', name: 'El encierro fantasma', place: 'avenida', icon: 'mi_encierro', music: 'tense',
  intro: 'Por la avenida corre un encierro de toros fantasma, taxis sin conductor y un autobús búho. Crúzala hasta la otra acera.',
  controls: [['←↑↓→', 'saltar de casilla']],
  items: ['zapatillas', 'azabache', 'casco'],
  cause: 'Te pilló el encierro fantasma. Saliste en todas las noticias del día siguiente.',
  create(D) { return new Encierro(D); }
};
const rowY = r => TOP + r * T;

function makeBg() {
  const [c, x] = G.makeCanvas(G.W, G.H);
  G.rect(x, 0, 0, G.W, G.H, '#111');
  G.art.tiles(x, 0, rowY(0), G.W, T);
  G.art.tiles(x, 0, rowY(9), G.W, T + 4);
  G.art.asphalt(x, 0, rowY(1), G.W, T * 3, 21);
  G.art.asphalt(x, 0, rowY(5), G.W, T * 4, 22);
  // mediana con árboles
  G.rect(x, 0, rowY(4), G.W, T, '#1a3a22');
  G.rect(x, 0, rowY(4), G.W, 2, '#8a8a9a'); G.rect(x, 0, rowY(4) + T - 2, G.W, 2, '#8a8a9a');
  for (let i = 0; i < G.W; i += 3) G.rect(x, i, rowY(4) + 4 + (i * 7) % 8, 1, 1, '#2f6a35');
  for (let i = 24; i < G.W; i += 64) { G.art.banco(x, i + 20, rowY(4) + 11); }
  // marcas viales
  for (const r of [1, 2, 5, 6, 7]) for (let i = 4; i < G.W; i += 20) G.rect(x, i, rowY(r) + T - 1, 10, 1, '#c8c8c8');
  G.rect(x, 0, rowY(1), G.W, 1, '#6a6a7a'); G.rect(x, 0, rowY(9) - 1, G.W, 1, '#6a6a7a');
  // paso de cebra (irónico)
  for (let r = 5; r < 9; r++) for (let i = 0; i < 4; i++) G.rect(x, 296, rowY(r) + i * 4, 14, 2, '#3a3a4a');
  // fachadas arriba (techo)
  G.text(x, 'TU ACERA', G.W / 2, rowY(0) + 5, C.green, { align: 'center', shadow: true });
  return c;
}

class Encierro {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    this.col = 10; this.row = 9; this.x = this.col * T + 8; this.y = rowY(9) + T;
    this.hop = 0; this.fx = 0; this.fy = 0; this.inv = 0; this.face = 1; this.safeRow = 9;
    this.rep = 0; this.repDir = null;
    this.parts = new G.Particles(); this.coins = new G.Coins();
    this.bg = makeBg();
    const base = (34 + Math.min(1, D) * 38) * G.enemyMul();
    this.lanes = LANES.map((r, i) => {
      const kind = r === 1 || r === 6 ? 'bus' : r === 3 || r === 7 ? 'toro' : 'taxi';
      const dir = i % 2 ? 1 : -1;
      const sp = base * (kind === 'toro' ? 1.35 : kind === 'bus' ? 0.75 : 1.05) * G.rand(0.85, 1.15);
      return { r, kind, dir, sp, objs: [], next: 0 };
    });
    for (const l of this.lanes) { // pre-poblar
      let x = G.rand(0, 60);
      while (x < G.W + 40) { this.addObj(l, l.dir > 0 ? x : G.W - x); x += this.gap(l); }
    }
    for (let i = 0; i < 3 + Math.round(D * 2); i++) this.coins.add(G.irand(1, 18) * T + 8, rowY(G.pick(LANES)) + T - 3, 999);
    this.hud = { label: 'CRUZA', prog: 0 };
  }
  gap(l) { const len = l.kind === 'bus' ? 46 : l.kind === 'toro' ? 22 : 26; return len + G.lerp(70, 34, Math.min(1, this.D)) + G.rand(0, 60); }
  addObj(l, x) {
    if (l.kind === 'toro') { // manada
      const n = G.irand(1, this.D > 0.5 ? 3 : 2);
      for (let i = 0; i < n; i++) l.objs.push({ x: x - l.dir * i * 22, w: 20, t: Math.random() });
    } else l.objs.push({ x, w: l.kind === 'bus' ? 46 : 24, t: Math.random(), c: G.pick(['#d8e8ff', '#e8ffe8']) });
  }
  update(dt) {
    this.t += dt;
    if (this.inv > 0) this.inv -= dt;
    // movimiento por casillas
    if (this.hop > 0) {
      this.hop -= dt;
      const k = 1 - Math.max(0, this.hop) / 0.09;
      this.x = G.lerp(this.fx, this.col * T + 8, k);
      this.y = G.lerp(this.fy, rowY(this.row) + T, k);
    } else {
      const dirs = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
      let want = null;
      for (const [k, dx, dy] of dirs) if (G.Input.hit(k)) want = [k, dx, dy];
      if (!want) for (const [k, dx, dy] of dirs) if (G.Input.down(k) && this.repDir === k) { this.rep -= dt; if (this.rep <= 0) want = [k, dx, dy]; }
      if (want) {
        const [k, dx, dy] = want;
        if (this.repDir !== k || this.rep <= 0) this.rep = this.repDir === k ? 0.13 / G.speedMul() : 0.22;
        this.repDir = k;
        const nc = G.clamp(this.col + dx, 0, COLS - 1), nr = G.clamp(this.row + dy, 0, ROWS - 1);
        if (nc !== this.col || nr !== this.row) {
          this.fx = this.x; this.fy = this.y; this.col = nc; this.row = nr; this.hop = 0.09;
          if (dx) this.face = dx;
          G.audio.sfx('jump');
        }
      }
      if (!['up', 'down', 'left', 'right'].some(k => G.Input.down(k))) this.repDir = null;
      if (this.row === 4 || this.row === 9) this.safeRow = this.row;
    }
    // tráfico
    for (const l of this.lanes) {
      for (const o of l.objs) { o.x += l.dir * l.sp * dt; o.t += dt; }
      l.objs = l.objs.filter(o => l.dir > 0 ? o.x < G.W + 60 : o.x > -60);
      const edge = l.dir > 0 ? Math.min(...l.objs.map(o => o.x), 999) : G.W - Math.max(...l.objs.map(o => o.x), -999);
      if (edge > this.gap(l) * 0.7 || !l.objs.length) this.addObj(l, l.dir > 0 ? -40 : G.W + 40);
      // colisión
      if (this.inv <= 0 && this.hop <= 0.04 && this.row === l.r) {
        for (const o of l.objs) {
          const left = l.dir > 0 ? o.x - o.w : o.x, right = left + o.w;
          if (this.x + 4 > left + 2 && this.x - 4 < right - 2) {
            G.hurt(DEF.cause);
            this.parts.burst(this.x, this.y - 6, 14, [C.white, C.blue, C.red], 70, 0.5);
            this.inv = 1.3;
            this.row = this.safeRow; this.y = rowY(this.row) + T; this.x = this.col * T + 8; this.hop = 0;
            break;
          }
        }
      }
    }
    this.coins.update(dt, this.x, this.y - 3, this.parts, 9);
    this.parts.update(dt);
    this.hud.prog = (9 - this.row) / 9;
    if (this.row === 0 && this.hop <= 0) this.done = true;
  }
  draw(cx) {
    cx.drawImage(this.bg, 0, 0);
    const t = this.t;
    this.coins.draw(cx);
    for (const l of this.lanes) {
      const y = rowY(l.r);
      for (const o of l.objs) {
        const left = Math.round(l.dir > 0 ? o.x - o.w : o.x);
        if (l.kind === 'toro') {
          cx.globalAlpha = 0.85;
          G.draw(cx, Math.floor(o.t * 8) % 2 ? 'toro0' : 'toro1', left, y + 4, l.dir < 0, null);
          cx.globalAlpha = 0.3;
          G.draw(cx, 'toro0', left - l.dir * 3, y + 4, l.dir < 0, C.blue);
          cx.globalAlpha = 1;
          G.rect(cx, left + (l.dir > 0 ? 15 : 3), y + 9, 3, 1, C.red);
        } else if (l.kind === 'taxi') {
          cx.globalAlpha = 0.85;
          G.rect(cx, left, y + 3, o.w, 11, o.c);
          G.rect(cx, left + 5, y + 4, o.w - 10, 9, '#9ab0d0');
          G.rect(cx, left + 8, y + 5, o.w - 16, 7, o.c);
          G.rect(cx, left + o.w / 2 - 1, y + 7, 3, 3, Math.floor(t * 4) % 2 ? C.green : '#0a6a2a');
          G.rect(cx, l.dir > 0 ? left + o.w - 1 : left, y + 4, 1, 2, C.yellow);
          G.rect(cx, l.dir > 0 ? left + o.w - 1 : left, y + 11, 1, 2, C.yellow);
          cx.globalAlpha = 1;
        } else {
          cx.globalAlpha = 0.8;
          G.rect(cx, left, y + 2, o.w, 13, '#3a6ab0');
          G.rect(cx, left + 1, y + 3, o.w - 2, 11, '#4a8ad0');
          for (let i = 4; i < o.w - 4; i += 6) G.rect(cx, left + i, y + 4, 4, 2, '#ffd27a');
          G.text(cx, 'BÚHO', left + o.w / 2, y + 7, C.white, { align: 'center' });
          cx.globalAlpha = 1;
        }
      }
    }
    // Nico
    G.ellipse(cx, this.x, this.y - 1, 4, 1, '#00000080');
    if (!(this.inv > 0 && Math.floor(this.inv * 16) % 2)) {
      const lift = this.hop > 0 ? Math.sin((1 - this.hop / 0.09) * Math.PI) * 3 : 0;
      G.drawFeet(cx, this.hop > 0 ? 'nicoJump' : 'nico0', this.x, this.y - lift, this.face < 0);
    }
    this.parts.draw(cx);
  }
}
})();
