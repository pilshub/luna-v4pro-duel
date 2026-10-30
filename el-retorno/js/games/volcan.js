'use strict';
// UN VOLCÁN EN LA GRAN VÍA — esquiva las bombas de lava
(function () {
const C = G.C;
const X0 = 22, X1 = 298, Y0 = 56, Y1 = 170, CX = 160, CY = 26;
const DEF = G.GAMES.volcan = {
  id: 'volcan', name: 'Un volcán en la avenida', place: 'avenida', icon: 'mi_volcan', music: 'tense',
  intro: '¡Ha salido un volcán en mitad de la avenida! Esquiva las bombas de lava mirando dónde van a caer hasta que se calme.',
  controls: [['←↑↓→', 'moverte'], ['A', 'esquivar']],
  items: ['gafas', 'zapatillas', 'reloj', 'casco'],
  cause: 'Una bomba de lava te pilló en plena avenida. Ahora eres parte del asfalto.',
  create(D) { return new Volcan(D); }
};

function makeBg() {
  const [c, x] = G.makeCanvas(G.W, G.H);
  G.art.asphalt(x, 0, 0, G.W, G.H, 11);
  G.art.tiles(x, 14, 12, 26, 168); G.art.tiles(x, 280, 12, 26, 168);
  G.rect(x, 40, 12, 2, 168, '#6a6a7a'); G.rect(x, 278, 12, 2, 168, '#6a6a7a');
  G.art.roofTop(x, 0, 12, 14, 168); G.art.roofTop(x, 306, 12, 14, 168);
  for (let y = 12; y < 180; y += 14) { G.rect(x, 108, y, 2, 8, '#d8d8d8'); G.rect(x, 212, y, 2, 8, '#d8d8d8'); }
  G.rect(x, 158, 12, 1, 168, '#e0c040'); G.rect(x, 161, 12, 1, 168, '#e0c040');
  // grietas
  const r = G.srand(5);
  for (let k = 0; k < 9; k++) {
    let px = CX, py = CY + 14, a = Math.PI * (0.15 + r() * 0.7);
    for (let s = 0; s < 22; s++) { px += Math.cos(a) * 3; py += Math.sin(a) * 3; a += (r() - 0.5) * 0.8; G.rect(x, px, py, 2, 1, '#120a0a'); if (r() < 0.3) G.rect(x, px, py + 1, 1, 1, '#5a1a0a'); }
  }
  // farolas laterales
  for (let y = 40; y < 180; y += 46) { G.rect(x, 27, y, 3, 3, '#111'); G.rect(x, 290, y, 3, 3, '#111'); }
  // el volcán
  for (let j = 0; j < 34; j++) {
    const w = 10 + j * 2.1;
    G.rect(x, CX - w, 12 + j, w, 1, j < 3 ? '#3a1a10' : j % 6 === 0 ? '#3e3030' : '#4e3e3a');
    G.rect(x, CX, 12 + j, w, 1, j < 3 ? '#3a1a10' : j % 6 === 0 ? '#1e1616' : '#2c2222');
  }
  G.rect(x, CX - 82, 45, 164, 2, '#140c0c');
  for (let k = 0; k < 120; k++) G.rect(x, CX - 40 + r() * 80, 18 + r() * 28, 1, 1, r() < 0.5 ? '#4a3a3a' : '#201818');
  G.ellipse(x, CX, 14, 10, 2, '#ff6c24');
  G.ellipse(x, CX, 14, 6, 1, '#ffec27');
  for (let k = 0; k < 4; k++) { const lx = CX + (r() - 0.5) * 40; for (let j = 16; j < 44; j++) G.rect(x, lx + Math.sin(j * 0.5) * 2, j, 1, 1, j % 3 ? '#ff6c24' : '#ff004d'); }
  return c;
}

class Volcan {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    this.p = new G.TopDown(160, 140);
    this.bombs = []; this.pools = [];
    this.parts = new G.Particles(); this.coins = new G.Coins();
    this.survive = (18 + D * 8) * G.timeMul();
    this.spawnT = 1; this.coinT = 1.2;
    this.bg = makeBg();
    this.hud = { label: 'AGUANTA', prog: 0 };
  }
  launch() {
    const p = this.p;
    let tx, ty;
    if (G.chance(0.38)) { tx = p.x + p.dirX * G.rand(0, 30); ty = p.y + p.dirY * G.rand(0, 30); }
    else { tx = G.rand(X0, X1); ty = G.rand(Y0, Y1); }
    tx = G.clamp(tx, X0, X1); ty = G.clamp(ty, Y0, Y1);
    const big = G.chance(this.D * 0.3);
    this.bombs.push({ tx, ty, t: 0, dur: G.lerp(1.35, 0.95, Math.min(1, this.D)) * G.warnMul() * G.rand(0.9, 1.15), r: big ? 15 : 10 });
    for (let i = 0; i < 4; i++) this.parts.add({ x: CX + G.rand(-6, 6), y: 14, vx: G.rand(-30, 30), vy: G.rand(-60, -20), g: 120, life: 0.6, c: G.pick([C.orange, C.yellow, C.red]) });
  }
  update(dt) {
    this.t += dt;
    const p = this.p;
    if (G.Input.hit('a')) p.startDash();
    p.update(dt, { x0: X0, y0: Y0, x1: X1, y1: Y1 });
    const calm = this.t > this.survive - 1.2;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && !calm) {
      this.launch();
      if (this.D > 0.6 && G.chance(0.35)) this.launch();
      this.spawnT = G.lerp(0.75, 0.3, Math.min(1, this.D)) * G.rand(0.8, 1.2);
    }
    for (const b of this.bombs) {
      b.t += dt;
      if (b.t >= b.dur && !b.boom) {
        b.boom = true;
        G.audio.sfx('smallboom'); G.shake(b.r > 12 ? 3 : 2, 0.15);
        this.parts.burst(b.tx, b.ty, 18, [C.orange, C.yellow, C.red, C.dgrey], 90, 0.5, 60, 2);
        this.pools.push({ x: b.tx, y: b.ty, r: Math.round(b.r * 0.7), t: 2.2 });
        if (G.dist(p.x, p.cy, b.tx, b.ty) < b.r + 3) p.hurtBy(DEF.cause, b.tx, b.ty);
      }
    }
    this.bombs = this.bombs.filter(b => !b.boom);
    for (const l of this.pools) {
      l.t -= dt;
      if (l.t > 0.3 && G.dist(p.x, p.y, l.x, l.y) < l.r + 1) p.hurtBy('Pisaste lava. Las zapatillas no lo aguantaron. Tú tampoco.', l.x, l.y);
    }
    this.pools = this.pools.filter(l => l.t > 0);
    this.coinT -= dt;
    if (this.coinT <= 0) { this.coinT = 2.2; this.coins.add(G.rand(X0 + 8, X1 - 8), G.rand(Y0 + 8, Y1 - 8), 6); }
    if (Math.random() < dt * 14) this.parts.add({ x: G.rand(0, G.W), y: 12, vx: G.rand(-8, 8), vy: G.rand(20, 40), life: 4, c: G.pick(['#ff6c24', '#ffa300', '#5f574f']) });
    if (Math.random() < dt * 6) this.parts.add({ x: CX + G.rand(-5, 5), y: 12, vx: G.rand(-6, 6), vy: -10, life: 1.2, c: '#5f574f', s: 2 });
    this.coins.update(dt, p.x, p.y, this.parts);
    this.parts.update(dt);
    this.hud.prog = this.t / this.survive;
    this.hud.label = calm ? '¡SE CALMA!' : 'AGUANTA ' + Math.ceil(this.survive - this.t);
    if (this.t >= this.survive && !this.bombs.length) this.done = true;
  }
  draw(cx) {
    cx.drawImage(this.bg, 0, 0);
    const t = this.t;
    // brillo del cráter
    cx.globalAlpha = 0.25 + Math.sin(t * 7) * 0.12;
    G.ellipse(cx, CX, 16, 22, 6, C.orange);
    cx.globalAlpha = 1;
    for (const l of this.pools) {
      const k = Math.min(1, l.t);
      G.circ(cx, l.x, l.y, l.r, k > 0.5 ? '#be1250' : '#5a1a1a');
      G.circ(cx, l.x, l.y, Math.max(1, l.r - 3), k > 0.5 ? '#ff6c24' : '#7a2a1a');
      if (k > 0.5 && Math.random() < 0.3) G.rect(cx, l.x + G.rand(-l.r, l.r) * 0.6, l.y + G.rand(-3, 3), 1, 1, C.yellow);
    }
    // avisos en el suelo
    for (const b of this.bombs) {
      const k = b.t / b.dur;
      cx.globalAlpha = 0.25 + k * 0.45;
      G.ellipse(cx, b.tx, b.ty, Math.round(b.r * k), Math.round(b.r * k * 0.6), '#000');
      cx.globalAlpha = 1;
      if (Math.floor(t * (6 + k * 14)) % 2) G.ring(cx, b.tx, b.ty, b.r, C.red);
      else G.ring(cx, b.tx, b.ty, b.r, C.orange);
    }
    this.coins.draw(cx);
    this.p.draw(cx);
    // proyectiles en parábola
    for (const b of this.bombs) {
      const k = b.t / b.dur;
      const x = G.lerp(CX, b.tx, k), y = G.lerp(CY - 8, b.ty, k) - Math.sin(Math.PI * k) * 70;
      G.circ(cx, x, y, b.r > 12 ? 4 : 3, C.red);
      G.circ(cx, x, y, b.r > 12 ? 2 : 1, C.yellow);
      if (Math.random() < 0.6) this.parts.add({ x, y, vx: G.rand(-10, 10), vy: G.rand(-10, 10), life: 0.3, c: G.pick([C.orange, C.dgrey]) });
    }
    this.parts.draw(cx);
    cx.globalAlpha = 0.06 + Math.sin(t * 3) * 0.03;
    G.rect(cx, 0, 0, G.W, G.H, C.red);
    cx.globalAlpha = 1;
  }
}
})();
