'use strict';
// ZOMBIS EN LA PLAZA — aguanta y corre a la salida
(function () {
const C = G.C;
const X0 = 20, Y0 = 34, X1 = 300, Y1 = 166;
const FX = 160, FY = 100, FR = 15;
const DEF = G.GAMES.zombis = {
  id: 'zombis', name: 'Zombis en la plaza', place: 'plaza', icon: 'mi_zombis', music: 'tense',
  intro: 'Los vecinos del barrio han vuelto... de la tumba. Aguanta en la plaza hasta que se abra una salida y corre hacia ella.',
  controls: [['←↑↓→', 'moverte'], ['A', 'esquivar'], ['B', 'lanzar chancla (si la tienes)']],
  items: ['chancla', 'zapatillas', 'reloj', 'azabache', 'casco'],
  cause: 'Los zombis de la plaza te rodearon. Ahora eres un vecino más.',
  create(D) { return new Zombis(D); }
};

function makeBg() {
  const [c, x] = G.makeCanvas(G.W, G.H);
  G.art.cobbles(x, 0, 0, G.W, G.H);
  // tejados alrededor con huecos de calle
  G.art.roofTop(x, 0, 12, 140, 18); G.art.roofTop(x, 180, 12, 140, 18);
  G.art.roofTop(x, 0, 170, 140, 10); G.art.roofTop(x, 180, 170, 140, 10);
  G.art.roofTop(x, 0, 12, 14, 70); G.art.roofTop(x, 0, 118, 14, 62);
  G.art.roofTop(x, 306, 12, 14, 70); G.art.roofTop(x, 306, 118, 14, 62);
  G.rect(x, 0, 30, 140, 2, '#2a1a1a'); G.rect(x, 180, 30, 140, 2, '#2a1a1a');
  G.rect(x, 14, 30, 2, 52, '#2a1a1a'); G.rect(x, 304, 30, 2, 52, '#2a1a1a');
  // calles que salen de la plaza
  G.art.asphalt(x, 140, 12, 40, 20, 4); G.art.asphalt(x, 140, 168, 40, 12, 5);
  G.art.asphalt(x, 0, 82, 16, 36, 6); G.art.asphalt(x, 304, 82, 16, 36, 7);
  // fuente
  G.circ(x, FX, FY + 2, FR + 1, '#14121c');
  G.circ(x, FX, FY, FR, '#6a6a7a');
  G.circ(x, FX, FY, FR - 3, '#1a3a6a');
  G.circ(x, FX, FY, 4, '#8a8a9a');
  G.rect(x, FX - 1, FY - 9, 3, 9, '#8a8a9a');
  // bancos y árboles
  G.art.banco(x, 40, 52); G.art.banco(x, 258, 52); G.art.banco(x, 40, 150); G.art.banco(x, 258, 150);
  G.art.tree(x, 30, 140, 8); G.art.tree(x, 290, 140, 8); G.art.tree(x, 30, 44, 7); G.art.tree(x, 290, 44, 7);
  return c;
}
const GAPS = [
  { side: 'top', x: 160, y: Y0 - 2, win: (p) => p.y < Y0 + 4 && Math.abs(p.x - 160) < 18 },
  { side: 'bottom', x: 160, y: Y1 + 2, win: (p) => p.y > Y1 - 4 && Math.abs(p.x - 160) < 18 },
  { side: 'left', x: X0 - 2, y: 100, win: (p) => p.x < X0 + 4 && Math.abs(p.y - 100) < 18 },
  { side: 'right', x: X1 + 2, y: 100, win: (p) => p.x > X1 - 4 && Math.abs(p.y - 100) < 18 }
];

class Zombis {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    this.p = new G.TopDown(160, 150);
    this.zs = []; this.cracks = [];
    this.spawnT = 0.8; this.coinT = 1.5;
    this.parts = new G.Particles(); this.coins = new G.Coins();
    this.survive = (16 + D * 9) * G.timeMul();
    this.exit = null; this.ch = null;
    this.bg = makeBg();
    this.zSpeed = (15 + D * 18) * G.enemyMul();
    this.hud = { label: 'AGUANTA', prog: 0 };
  }
  solid(x, y) { return G.dist(x, y, FX, FY) < FR + 3; }
  spawn() {
    for (let k = 0; k < 20; k++) {
      const x = G.rand(X0 + 6, X1 - 6), y = G.rand(Y0 + 6, Y1 - 4);
      if (G.dist(x, y, this.p.x, this.p.y) < 70 || this.solid(x, y)) continue;
      this.zs.push({ x, y, t: 0, rise: 0.9, sp: this.zSpeed * G.rand(0.85, 1.2), seed: Math.random() * 9, face: 1, hp: 1 });
      return;
    }
  }
  update(dt) {
    this.t += dt;
    const p = this.p;
    if (G.Input.hit('a')) p.startDash();
    if (G.Input.hit('b') && G.has('chancla') && !this.ch) {
      let dx = p.dirX, dy = p.dirY; const l = Math.hypot(dx, dy) || 1;
      this.ch = { x: p.x, y: p.cy, vx: dx / l * 230, vy: dy / l * 230, back: false, d: 0, hit: new Set(), rot: 0 };
      G.audio.sfx('throw');
    }
    p.update(dt, { x0: X0, y0: Y0, x1: X1, y1: Y1 }, (x, y) => this.solid(x, y));

    // generación
    const rate = G.lerp(1.25, 0.5, Math.min(1, this.D)) * (this.exit ? 0.75 : 1);
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.zs.length < 26) { this.spawn(); if (this.D > 0.7 && G.chance(0.3)) this.spawn(); this.spawnT = rate; }
    this.coinT -= dt;
    if (this.coinT <= 0) { this.coinT = 2.6; const x = G.rand(X0 + 10, X1 - 10), y = G.rand(Y0 + 10, Y1 - 10); if (!this.solid(x, y)) this.coins.add(x, y); }

    // zombis
    for (const z of this.zs) {
      z.t += dt;
      if (z.t < z.rise) { if (Math.random() < 0.3) this.parts.add({ x: z.x + G.rand(-5, 5), y: z.y, vy: -20, life: 0.4, c: '#4a3a2a' }); continue; }
      let dx = p.x - z.x, dy = p.y - z.y; const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const w = Math.sin(z.t * 2.5 + z.seed) * 0.5;
      const vx = (dx - dy * w) * z.sp, vy = (dy + dx * w) * z.sp;
      z.face = vx >= 0 ? 1 : -1;
      const nx = z.x + vx * dt, ny = z.y + vy * dt;
      if (!this.solid(nx, z.y)) z.x = nx;
      if (!this.solid(z.x, ny)) z.y = ny;
      if (G.dist(z.x, z.y, p.x, p.y) < 8) p.hurtBy(DEF.cause, z.x, z.y);
    }
    // separación
    for (let i = 0; i < this.zs.length; i++) for (let j = i + 1; j < this.zs.length; j++) {
      const a = this.zs[i], b = this.zs[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < 9) { const push = (9 - d) / 2 / d; a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push; }
    }
    // chancla bumerán
    if (this.ch) {
      const c = this.ch;
      c.rot += dt;
      if (!c.back) { c.x += c.vx * dt; c.y += c.vy * dt; c.d += 230 * dt; if (c.d > 110 || c.x < X0 || c.x > X1 || c.y < Y0 - 10 || c.y > Y1) c.back = true; }
      else {
        const dx = p.x - c.x, dy = p.cy - c.y, l = Math.hypot(dx, dy) || 1;
        c.x += dx / l * 260 * dt; c.y += dy / l * 260 * dt;
        if (l < 8) this.ch = null;
      }
      for (const z of this.zs) {
        if (z.t < z.rise || c.hit.has(z) || z.hp <= 0) continue;
        if (G.dist(z.x, z.y - 6, c.x, c.y) < 9) {
          c.hit.add(z); z.hp = 0;
          this.parts.burst(z.x, z.y - 6, 14, [C.lime, C.dgreen, C.lav], 70, 0.5, 120);
          G.audio.sfx('hit'); G.addScore(5); G.run.stats.kills++;
          if (G.chance(0.3)) this.coins.pop(z.x, z.y);
        }
      }
    }
    this.zs = this.zs.filter(z => z.hp > 0);

    this.coins.update(dt, p.x, p.y, this.parts);
    this.parts.update(dt);

    if (!this.exit) {
      this.hud.prog = this.t / this.survive;
      this.hud.label = 'AGUANTA ' + Math.ceil(this.survive - this.t);
      if (this.t >= this.survive) {
        let best = GAPS[0], bd = -1;
        for (const g of GAPS) { const d = G.dist(g.x, g.y, p.x, p.y); if (d > bd) { bd = d; best = g; } }
        this.exit = best; this.exitT = 0;
        G.audio.sfx('go');
      }
    } else {
      this.exitT += dt;
      this.hud.label = '¡A LA SALIDA!'; this.hud.prog = 1;
      if (this.exit.win(p)) this.done = true;
    }
  }
  draw(cx) {
    cx.drawImage(this.bg, 0, 0);
    const t = this.t;
    // agua de la fuente
    for (let i = 0; i < 5; i++) {
      const a = t * 2 + i * 1.3;
      G.rect(cx, FX + Math.cos(a) * 8, FY + Math.sin(a) * 6, 1, 1, C.blue);
    }
    G.rect(cx, FX, FY - 12 + Math.sin(t * 6) * 1, 1, 2, C.blue);
    if (this.exit) {
      const e = this.exit;
      cx.globalAlpha = 0.25 + Math.sin(t * 8) * 0.15;
      G.circ(cx, e.x, e.y, 16, C.green);
      cx.globalAlpha = 1;
      const dir = e.side === 'top' ? 'up' : e.side === 'bottom' ? 'down' : e.side;
      const off = { up: [0, 10], down: [0, -10], left: [10, 0], right: [-10, 0] }[dir];
      G.pointer(cx, e.x + off[0], e.y + off[1], dir, t);
    }
    this.coins.draw(cx);
    const ents = this.zs.map(z => ({ y: z.y, z })).concat([{ y: this.p.y, p: true }]).sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e.p) { this.p.draw(cx); continue; }
      const z = e.z;
      if (z.t < z.rise) {
        const k = z.t / z.rise;
        G.ellipse(cx, z.x, z.y, 6, 2, '#3a2a1a');
        if (k > 0.4) {
          cx.save(); cx.beginPath(); cx.rect(z.x - 6, z.y - 16, 12, 16); cx.clip();
          G.drawFeet(cx, 'zombie0', z.x, z.y + 15 * (1 - (k - 0.4) / 0.6), z.face < 0);
          cx.restore();
        }
        continue;
      }
      G.ellipse(cx, z.x, z.y, 4, 1, '#00000070');
      G.drawFeet(cx, Math.floor(z.t * 5 + z.seed) % 2 ? 'zombie0' : 'zombie1', z.x, z.y + 1, z.face < 0);
    }
    if (this.ch) G.draw(cx, 'chanclaP', this.ch.x - 3, this.ch.y - 2, Math.floor(this.ch.rot * 14) % 2 === 0);
    this.parts.draw(cx);
    if (this.p.dashCd > 0) G.rect(cx, this.p.x - 5, this.p.y + 3, 10 * (1 - this.p.dashCd / 0.9), 1, C.blue);
    if (this.exit && this.exitT < 1.6) G.bigText(cx, '¡CORRE A LA SALIDA!', 70, C.green);
  }
}
})();
