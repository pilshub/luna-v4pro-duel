'use strict';
// HUIDA POR LOS TEJADOS — carrera automática perseguido por el lobishome
(function () {
const C = G.C;
const PX = 84;
const DEF = G.GAMES.tejados = {
  id: 'tejados', name: 'Huida por los tejados', place: 'alto', icon: 'mi_tejados', music: 'tense',
  intro: '¡El lobishome te persigue! Escapa corriendo por los tejados: salta chimeneas y huecos, y agáchate bajo las gárgolas.',
  controls: [['A', 'saltar (mantén = más alto)'], ['↓', 'agacharse / deslizar']],
  items: ['zapatillas', 'reloj', 'azabache', 'casco'],
  cause: 'El lobishome te alcanzó en los tejados. Ahora aúllas a la luna.',
  create(D) { return new Tejados(D); }
};

class Tejados {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    this.speed = G.lerp(88, 126, Math.min(1, D)) * (G.has('zapatillas') ? 1.06 : 1);
    this.goal = (1500 + Math.min(1, D) * 900) * (G.has('reloj') ? 0.85 : 1);
    this.dist = 0;
    this.p = { y: 120, vy: 0, ground: true, slide: 0, inv: 0, coyote: 0, t: 0 };
    this.blds = []; this.obs = []; this.parts = new G.Particles(); this.coins = new G.Coins();
    this.genX = 0;
    this.addBuilding(0, 300, 120, true);
    while (this.genX < G.W + 200) this.gen();
    [this.sky, this.skyX] = G.makeCanvas(G.W, G.H);
    G.art.sky(this.skyX, G.W, G.H);
    G.art.stars(this.skyX, G.W, 90, 61);
    G.art.moon(this.skyX, 60, 40, 16);
    [this.far, this.farX] = G.makeCanvas(G.W * 2, G.H);
    G.art.skyline(this.farX, G.W * 2, 150, 88, '#141838', '#2a2a50');
    [this.mid, this.midX] = G.makeCanvas(G.W * 2, G.H);
    G.art.skyline(this.midX, G.W * 2, 170, 99, '#1b1f44', '#4a3a60');
    this.wolf = { x: 18, t: 0, lunge: 0 };
    this.hud = { label: 'HUIDA', prog: 0 };
  }
  addBuilding(x, w, top, first) {
    const b = { x, w, top, col: G.pick(['#4a3c3c', '#3d3a4f', '#45374f', '#3a4250']), seed: G.irand(1, 99999) };
    this.blds.push(b);
    if (!first && w > 70) {
      const n = G.irand(0, w > 140 ? 2 : 1);
      for (let i = 0; i < n; i++) {
        const ox = x + 30 + G.rand(0, w - 60);
        const r = Math.random();
        if (r < 0.45) this.obs.push({ type: 'chimenea', x: ox, y: top, w: 10, h: 14 });
        else if (r < 0.7 && this.D > 0.15) this.obs.push({ type: 'gato', x: ox, y: top, base: top, w: 9, h: 7, t: Math.random() * 3 });
        else if (this.D > 0.05) this.obs.push({ type: 'gargola', x: ox, y: top - 18, w: 12, h: 8, t: Math.random() * 3 });
      }
    }
    if (G.chance(0.5)) for (let i = 0; i < 3; i++) this.coins.add(x + w / 2 - 12 + i * 12, top - 12, 999);
  }
  gen() {
    const last = this.blds[this.blds.length - 1];
    const gap = G.chance(0.75) ? G.rand(22, G.lerp(40, 56, Math.min(1, this.D))) : 0;
    let top = last.top + G.irand(-22, 22);
    top = G.clamp(top, 98, 150);
    const w = G.irand(70, 190);
    const x = last.x + last.w + gap;
    if (gap > 0 && G.chance(0.6)) for (let i = 0; i < 3; i++) this.coins.add(last.x + last.w + gap / 2 - 10 + i * 10, Math.min(last.top, top) - 22 - Math.sin((i + 0.5) / 3 * Math.PI) * 8, 999);
    this.addBuilding(x, w, top);
    this.genX = x + w;
  }
  groundAt(wx) {
    for (const b of this.blds) if (wx >= b.x && wx <= b.x + b.w) return b.top;
    return null;
  }
  update(dt) {
    this.t += dt;
    const p = this.p;
    const dx = this.speed * dt;
    this.dist += dx;
    const wx = this.dist + PX;
    while (this.genX < this.dist + G.W + 220) this.gen();
    this.blds = this.blds.filter(b => b.x + b.w > this.dist - 40);
    this.obs = this.obs.filter(o => o.x > this.dist - 40);
    p.t += dt;
    if (p.inv > 0) p.inv -= dt;
    // controles
    const down = G.Input.down('down');
    if ((G.Input.hit('a') || G.Input.hit('up')) && (p.ground || p.coyote > 0)) { p.vy = -232; p.ground = false; p.coyote = 0; p.slide = 0; G.audio.sfx('jump'); }
    if (down && p.ground) p.slide = 0.12; else if (p.slide > 0) p.slide -= dt;
    const holding = G.Input.down('a') || G.Input.down('up');
    p.vy += (p.vy < 0 && holding ? 560 : 980) * dt;
    if (down && !p.ground) p.vy += 600 * dt;
    const prevY = p.y;
    p.y += p.vy * dt;
    const gy = this.groundAt(wx);
    const gy2 = this.groundAt(wx - 3);
    const g = gy !== null ? gy : gy2;
    if (g !== null && p.vy >= 0 && prevY <= g + 2 && p.y >= g) { p.y = g; p.vy = 0; if (!p.ground) this.parts.burst(PX, g, 4, ['#6a6a7a'], 30, 0.25); p.ground = true; }
    else if (p.ground && (g === null || p.y < g - 1)) { p.ground = false; p.coyote = 0.08; }
    if (g !== null && p.y > g + 3 && prevY > g + 2) { // chocó contra la pared de un edificio más alto
      if (p.inv <= 0) { G.hurt(DEF.cause); p.inv = 1.2; this.wolf.lunge = 0.6; this.parts.burst(PX, p.y - 8, 10, [C.white, '#6a3a2a'], 60, 0.4); }
      p.y = g; p.vy = 0; p.ground = true;
    }
    if (!p.ground && p.coyote > 0) p.coyote -= dt;
    // caída al vacío
    if (p.y > G.H + 20) {
      G.hurt('Te caíste entre dos tejados. El lobishome se rió mucho.');
      this.wolf.lunge = 0.6;
      let nb = this.blds.find(b => b.x > wx - 10) || this.blds[this.blds.length - 1];
      this.dist = nb.x - PX + 8;
      p.y = nb.top - 30; p.vy = 0; p.inv = 1.5;
    }
    // obstáculos
    const sliding = p.slide > 0 && p.ground;
    const ph = sliding ? 7 : 14;
    const box = { x: wx - 4, y: p.y - ph, w: 8, h: ph };
    for (const o of this.obs) {
      if (o.type === 'gato') { o.t += dt; o.y = o.base - (Math.floor(o.t * 1.5) % 2 ? Math.abs(Math.sin(o.t * 6)) * 6 : 0); }
      if (o.type === 'gargola') o.t += dt;
      const oy = o.type === 'gargola' ? o.y + Math.sin(o.t * 4) * 2 : o.y - o.h;
      if (p.inv <= 0 && !o.hit && G.overlap(box, { x: o.x - o.w / 2 + 1, y: oy + 1, w: o.w - 2, h: o.h - 2 })) {
        o.hit = true; p.inv = 1.2;
        G.hurt(DEF.cause);
        this.wolf.lunge = 0.6;
        this.parts.burst(wx - this.dist, p.y - 8, 10, [C.white, C.red], 60, 0.4);
      }
    }
    this.coins.update(dt, wx, p.y - 6, this.parts, 10);
    this.parts.update(dt);
    this.wolf.t += dt;
    if (this.wolf.lunge > 0) this.wolf.lunge -= dt;
    this.hud.prog = this.dist / this.goal;
    this.hud.label = 'HUIDA ' + Math.max(0, Math.round((this.goal - this.dist) / 10)) + ' M';
    if (this.dist >= this.goal) this.done = true;
  }
  draw(cx) {
    const cam = this.dist, t = this.t;
    cx.drawImage(this.sky, 0, 0);
    const fx = Math.round(cam * 0.15) % (G.W), mx = Math.round(cam * 0.35) % (G.W);
    cx.drawImage(this.far, fx, 0, G.W, G.H, 0, 0, G.W, G.H);
    cx.drawImage(this.mid, mx, 0, G.W, G.H, 0, 0, G.W, G.H);
    // edificios
    for (const b of this.blds) {
      const x = Math.round(b.x - cam);
      if (x > G.W || x + b.w < 0) continue;
      G.rect(cx, x, b.top + 4, b.w, G.H - b.top, b.col);
      // tejado de teja (vista lateral)
      G.rect(cx, x - 2, b.top, b.w + 4, 5, '#7a3b2e');
      for (let i = 0; i < b.w + 4; i += 4) G.rect(cx, x - 2 + i, b.top + 1, 2, 3, '#9a5040');
      G.rect(cx, x - 2, b.top + 5, b.w + 4, 1, '#3a1a14');
      const r = G.srand(b.seed);
      for (let wy = b.top + 12; wy < G.H; wy += 18) for (let wx2 = x + 8; wx2 < x + b.w - 10; wx2 += 18) {
        const lit = r() < 0.3;
        G.rect(cx, wx2, wy, 8, 10, lit ? '#ffd27a' : '#1a1428');
      }
      G.rect(cx, x + b.w - 1, b.top + 6, 1, G.H, '#00000060');
      if (r() < 0.6) { G.rect(cx, x + 12, b.top - 10, 1, 10, '#111'); G.rect(cx, x + 8, b.top - 8, 9, 1, '#111'); G.rect(cx, x + 9, b.top - 5, 7, 1, '#111'); }
    }
    this.coins.draw(cx, cam, 0);
    for (const o of this.obs) {
      const x = Math.round(o.x - cam);
      if (x < -20 || x > G.W + 20) continue;
      if (o.type === 'chimenea') {
        G.rect(cx, x - 5, o.y - o.h, 10, o.h, '#6a3a2a'); G.rect(cx, x - 6, o.y - o.h, 12, 3, '#4a2a1a');
        for (let j = 3; j < o.h; j += 3) G.rect(cx, x - 5, o.y - o.h + j, 10, 1, '#5a2a1a');
        if (Math.random() < 0.15) this.parts.add({ x: o.x, y: o.y - o.h - 2, vy: -15, vx: -20, life: 1, c: '#5f574f', s: 2 });
      } else if (o.type === 'gato') {
        G.draw(cx, 'cat', x - 5, o.y - 7);
      } else {
        const y = o.y + Math.sin(o.t * 4) * 2;
        G.draw(cx, Math.floor(o.t * 8) % 2 ? 'bat0' : 'bat1', x - 4, y + 1, false, '#6a6a7a');
        G.rect(cx, x - 6, y + 2, 12, 5, '#5a5a6a'); G.rect(cx, x - 2, y, 4, 3, '#5a5a6a');
        G.rect(cx, x - 1, y + 1, 1, 1, C.red); G.rect(cx, x + 1, y + 1, 1, 1, C.red);
        if (Math.floor(t * 3) % 2) G.text(cx, '↓', x, y - 12, C.yellow, { align: 'center', shadow: true });
      }
    }
    // Nico
    const p = this.p;
    if (!(p.inv > 0 && Math.floor(p.inv * 16) % 2)) {
      if (p.slide > 0 && p.ground) G.draw(cx, 'nicoSlide', PX - 9, p.y - 8);
      else G.drawFeet(cx, !p.ground ? 'nicoJump' : Math.floor(p.t * 12) % 2 ? 'nico1' : 'nico2', PX, p.y + 1, false);
    }
    // lobishome
    const wl = this.wolf;
    const wx = 2 + Math.sin(wl.t * 2) * 4 + (wl.lunge > 0 ? Math.sin(wl.lunge / 0.6 * Math.PI) * 30 : 0);
    const wy = (this.groundAt(cam + wx + 10) || 140);
    G.draw(cx, Math.floor(wl.t * 10) % 2 ? 'lobo0' : 'lobo1', wx, wy - 12 - Math.abs(Math.sin(wl.t * 10)) * 2);
    this.parts.draw(cx, cam, 0);
    if (t < 2) G.bigText(cx, '¡CORRE!', 60, C.yellow);
  }
}
})();
