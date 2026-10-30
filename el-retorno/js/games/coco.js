'use strict';
// JEFE FINAL: EL COCO en el portal de casa
(function () {
const C = G.C;
const X0 = 18, X1 = 302, Y0 = 80, Y1 = 172;
const DEF = G.GAMES.coco = {
  id: 'coco', name: 'El Coco', place: 'calle', icon: 'mi_boss', music: 'boss', boss: true,
  intro: '"Duérmete niño, duérmete ya, que viene el Coco..." Y ha venido. Está en tu portal. Recoge chanclas del suelo y lánzaselas. Esquiva sus sombras.',
  controls: [['←↑↓→', 'moverte'], ['A', 'lanzar chancla'], ['B', 'esquivar']],
  items: ['chancla', 'zapatillas', 'azabache', 'casco'],
  cause: 'El Coco te llevó en su saco. A las 8 te devolvió, pero tu madre no se lo creyó.',
  create(D) { return new Coco(D); }
};

function makeBg() {
  const [c, x] = G.makeCanvas(G.W, G.H);
  G.art.sky(x, G.W, 40);
  G.art.facade(x, -10, 12, 120, 62, 7001, { lit: 0.3, shop: false, groundH: 14 });
  G.art.facade(x, 210, 12, 120, 62, 7002, { lit: 0.3, shop: false, groundH: 14 });
  // tu edificio
  G.rect(x, 110, 12, 100, 62, '#5a4a40');
  for (let i = 0; i < 300; i++) G.rect(x, 110 + Math.random() * 100, 12 + Math.random() * 62, 1, 1, '#00000030');
  G.rect(x, 110, 12, 100, 3, '#2a2240');
  for (const wx of [122, 186]) { G.rect(x, wx, 20, 12, 14, '#ffd27a'); G.rect(x, wx, 20, 12, 6, '#8a6a30'); G.rect(x, wx - 3, 34, 18, 2, '#111'); }
  G.rect(x, 140, 30, 40, 44, '#2a1a10');
  G.rect(x, 143, 33, 34, 41, '#6a4a2a');
  G.rect(x, 159, 33, 2, 41, '#2a1a10');
  G.rect(x, 146, 36, 10, 14, '#ffd27a80'); G.rect(x, 164, 36, 10, 14, '#ffd27a80');
  G.rect(x, 152, 22, 16, 7, '#1d2b53'); G.text(x, '7', 160, 22, C.white, { align: 'center' });
  G.art.tiles(x, 0, 74, G.W, 10);
  G.rect(x, 0, 84, G.W, 2, '#6a6a7a');
  G.art.cobbles(x, 0, 86, G.W, 94, '#24222f', '#1b1a24', '#2e2c3c');
  G.art.lamp(x, 30, 84, true, 50); G.art.lamp(x, 290, 84, true, 50);
  return c;
}

class Coco {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    this.p = new G.TopDown(160, 150);
    this.maxHp = 15; this.hp = this.maxHp;
    this.x = 160; this.y = 46; this.flash = 0;
    this.state = 'intro'; this.st = 0;
    this.atkT = 1.4; this.queue = [];
    this.bullets = []; this.drops = []; this.minions = []; this.pickups = []; this.shots = [];
    this.ammo = G.has('chancla') ? 3 : 1;
    this.regen = 0; this.pickT = 1.5;
    this.parts = new G.Particles();
    this.bg = makeBg();
    this.lastPhase = 1;
    this.bsp = 72 * G.enemyMul();
    this.hud = { label: 'EL COCO', prog: 0 };
    G.audio.sfx('roar');
  }
  get phase() { return this.hp > this.maxHp * 2 / 3 ? 1 : this.hp > this.maxHp / 3 ? 2 : 3; }
  shoot(a, sp = 1) { this.bullets.push({ x: this.x, y: this.y + 10, vx: Math.cos(a) * this.bsp * sp, vy: Math.sin(a) * this.bsp * sp, t: 0 }); }
  aim() { return Math.atan2(this.p.cy - (this.y + 10), this.p.x - this.x); }
  later(dt, fn) { this.queue.push({ at: this.t + dt, fn }); }
  attack() {
    const ph = this.phase;
    const list = ph === 1 ? ['aimed', 'fan', 'fan', 'minions'] : ph === 2 ? ['fan', 'ring', 'aimed3', 'rain', 'minions'] : ['ring2', 'spiral', 'rain', 'aimed3', 'fan', 'minions'];
    const a = G.pick(list);
    const spd = 1 + (ph - 1) * 0.12;
    if (a === 'aimed') { this.shoot(this.aim(), spd * 1.2); }
    if (a === 'aimed3') for (let i = 0; i < 3; i++) this.later(i * 0.18, () => this.shoot(this.aim(), spd * 1.25));
    if (a === 'fan') { const b = this.aim(); for (let i = -2; i <= 2; i++) this.shoot(b + i * 0.26, spd); }
    if (a === 'ring') { const o = Math.random(); for (let i = 0; i < 12; i++) this.shoot(o + i / 12 * Math.PI * 2, spd * 0.9); }
    if (a === 'ring2') { for (let k = 0; k < 2; k++) this.later(k * 0.35, () => { const o = k * 0.2; for (let i = 0; i < 14; i++) this.shoot(o + i / 14 * Math.PI * 2, spd * 0.85); }); }
    if (a === 'spiral') for (let i = 0; i < 18; i++) this.later(i * 0.08, () => { this.shoot(this.t * 5, spd * 0.9); this.shoot(this.t * 5 + Math.PI, spd * 0.9); });
    if (a === 'rain') for (let i = 0; i < 5 + ph * 2; i++) this.drops.push({ x: G.rand(X0 + 6, X1 - 6), y: G.rand(Y0 + 4, Y1 - 4), t: -i * 0.1, dur: 1.0 * G.warnMul() });
    if (a === 'minions' && this.minions.length < 4) for (let i = 0; i < 1 + Math.min(2, ph); i++) this.minions.push({ x: this.x + G.rand(-20, 20), y: this.y + 20, t: 0, life: 8 });
    G.audio.sfx('throw');
    this.atkT = G.lerp(1.8, 1.05, (ph - 1) / 2) * G.rand(0.85, 1.15);
  }
  update(dt) {
    this.t += dt; this.st += dt;
    const p = this.p;
    if (this.flash > 0) this.flash -= dt;
    if (this.state === 'dying') {
      this.parts.update(dt);
      if (Math.random() < 0.5) this.parts.burst(this.x + G.rand(-20, 20), this.y + G.rand(-20, 20), 4, [C.navy, C.plum, C.yellow, C.black], 60, 0.6);
      p.update(dt, { x0: X0, y0: Y0, x1: X1, y1: Y1 });
      if (this.st > 3.2) this.done = true;
      return;
    }
    if (G.Input.hit('b')) p.startDash();
    p.update(dt, { x0: X0, y0: Y0, x1: X1, y1: Y1 });
    // lanzar chancla
    if (G.Input.hit('a') && this.ammo > 0 && this.state === 'fight') {
      const a = Math.atan2(this.y - p.cy, this.x - p.x);
      this.shots.push({ x: p.x, y: p.cy, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, t: 0 });
      this.ammo--;
      G.audio.sfx('throw');
    }
    if (G.has('chancla') && this.ammo < 3) { this.regen += dt; if (this.regen > 1.1) { this.regen = 0; this.ammo++; } }
    // chanclas en el suelo
    if (!G.has('chancla')) {
      this.pickT -= dt;
      if (this.pickT <= 0 && this.pickups.filter(k => k.kind === 'chancla').length < 2) { this.pickups.push({ kind: 'chancla', x: G.rand(X0 + 10, X1 - 10), y: G.rand(Y0 + 14, Y1 - 6), t: 0 }); this.pickT = 2.4; }
    }
    for (const k of this.pickups) {
      k.t += dt;
      if (G.dist(k.x, k.y, p.x, p.y) < 10) {
        k.got = true;
        if (k.kind === 'chancla') { this.ammo = Math.min(4, this.ammo + 1); G.audio.sfx('coin'); this.parts.text(k.x, k.y - 12, '+CHANCLA', C.blue); }
        else { G.heal(1); G.audio.sfx('heal'); this.parts.text(k.x, k.y - 12, '+1 ♥', C.red); }
      }
    }
    this.pickups = this.pickups.filter(k => !k.got);

    // movimiento del Coco
    const ph = this.phase;
    if (ph !== this.lastPhase) {
      this.lastPhase = ph;
      G.audio.sfx('roar'); G.shake(5, 0.5);
      this.pickups.push({ kind: 'bocata', x: G.rand(X0 + 20, X1 - 20), y: G.rand(Y0 + 20, Y1 - 10), t: 0 });
      this.bullets = [];
    }
    this.x = 160 + Math.sin(this.t * (0.55 + ph * 0.2)) * 105;
    this.y = 46 + Math.sin(this.t * 1.7) * 4;
    if (this.state === 'intro') { if (this.st > 1.6) { this.state = 'fight'; this.st = 0; } }
    else {
      this.atkT -= dt;
      if (this.atkT <= 0) this.attack();
    }
    for (const q of this.queue) if (this.t >= q.at && !q.done) { q.done = true; q.fn(); }
    this.queue = this.queue.filter(q => !q.done);

    // balas
    for (const b of this.bullets) {
      b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (G.dist(b.x, b.y, p.x, p.cy) < 6 && p.inv <= 0 && p.dash <= 0) { b.dead = true; p.hurtBy(DEF.cause, b.x, b.y); }
    }
    this.bullets = this.bullets.filter(b => !b.dead && b.x > -10 && b.x < G.W + 10 && b.y > 0 && b.y < G.H + 10);
    for (const d of this.drops) {
      d.t += dt;
      if (d.t >= d.dur && !d.boom) {
        d.boom = true;
        this.parts.burst(d.x, d.y, 10, [C.navy, C.plum, C.lav], 60, 0.4);
        G.audio.sfx('smallboom');
        if (G.dist(d.x, d.y, p.x, p.cy) < 11) p.hurtBy(DEF.cause, d.x, d.y);
      }
    }
    this.drops = this.drops.filter(d => !d.boom);
    for (const m of this.minions) {
      m.t += dt; m.life -= dt;
      const dx = p.x - m.x, dy = p.y - m.y, l = Math.hypot(dx, dy) || 1;
      const sp = (m.t < 0.6 ? 10 : 36) * G.enemyMul();
      m.x += dx / l * sp * dt; m.y += dy / l * sp * dt;
      if (l < 8) { p.hurtBy(DEF.cause, m.x, m.y); }
    }
    this.minions = this.minions.filter(m => m.life > 0 && !m.dead);
    // chanclas lanzadas
    for (const s of this.shots) {
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      for (const m of this.minions) if (G.dist(m.x, m.y - 4, s.x, s.y) < 8) { m.dead = true; this.parts.burst(m.x, m.y, 10, [C.navy, C.lav], 50, 0.4); G.addScore(15); G.audio.sfx('poof'); }
      if (G.dist(s.x, s.y, this.x, this.y) < 20) {
        s.dead = true; this.hp--; this.flash = 0.15;
        G.addScore(60);
        G.audio.sfx('hit'); G.shake(2, 0.12);
        this.parts.burst(s.x, s.y, 12, [C.yellow, C.white, C.blue], 70, 0.4);
        this.parts.text(this.x, this.y - 30, G.pick(['¡AY!', '¡AUCH!', '¡LA CHANCLA NO!', '¡MAMÁÁÁ!']), C.white);
        if (this.hp <= 0) {
          this.state = 'dying'; this.st = 0; this.bullets = []; this.drops = []; this.minions = [];
          G.audio.sfx('roar'); G.shake(6, 1.2);
        }
      }
    }
    this.shots = this.shots.filter(s => !s.dead && s.y > -10 && s.x > -10 && s.x < G.W + 10 && s.y < G.H + 10);
    this.parts.update(dt);
    this.hud.label = 'EL COCO';
    this.hud.prog = 1 - this.hp / this.maxHp;
  }
  draw(cx) {
    cx.drawImage(this.bg, 0, 0);
    const t = this.t;
    for (const d of this.drops) {
      if (d.t < 0) continue;
      const k = d.t / d.dur;
      cx.globalAlpha = 0.3 + k * 0.4;
      G.ellipse(cx, d.x, d.y, Math.round(10 * k), Math.round(6 * k), '#000');
      cx.globalAlpha = 1;
      G.ring(cx, d.x, d.y, 10, Math.floor(t * 12) % 2 ? C.plum : C.lav);
      G.circ(cx, d.x, d.y - (1 - k) * 90, 3, C.navy);
    }
    for (const k of this.pickups) {
      const by = Math.sin(k.t * 5) * 1.5;
      G.ellipse(cx, k.x, k.y, 4, 1, '#00000080');
      if (k.kind === 'chancla') G.draw(cx, 'chanclaP', k.x - 3, k.y - 6 + by);
      else G.draw(cx, 'it_bocadillo', k.x - 5, k.y - 8 + by);
      if (Math.floor(k.t * 4) % 2) G.ring(cx, k.x, k.y - 3, 7, C.white);
    }
    for (const m of this.minions) {
      G.ellipse(cx, m.x, m.y, 4, 1, '#00000080');
      G.drawFeet(cx, 'sombra', m.x, m.y + Math.sin(m.t * 8), false);
    }
    this.p.draw(cx);
    // Coco
    if (this.state === 'dying') {
      const k = Math.min(1, this.st / 2.2);
      const s = 2 * (1 - k) + 0.01;
      if (k < 1) {
        const img = G.spr(Math.floor(t * 20) % 2 ? 'cocoHurt' : 'coco');
        cx.drawImage(img, Math.round(this.x - 12 * s), Math.round(this.y - 12 * s), Math.round(24 * s), Math.round(24 * s));
      } else {
        G.draw(cx, 'gatito', this.x - 4, this.y + 20);
        if (this.st > 2.5) G.text(cx, '¿MIAU?', this.x, this.y + 6, C.white, { align: 'center', shadow: true });
      }
    } else {
      const intro = this.state === 'intro' ? Math.min(1, this.st / 1.2) : 1;
      cx.globalAlpha = 0.3;
      G.ellipse(cx, this.x, 78, 20, 3, '#000');
      cx.globalAlpha = intro;
      G.drawScaled(cx, this.flash > 0 ? 'cocoHurt' : 'coco', this.x - 24, this.y - 24, 2, false, this.flash > 0 && Math.floor(t * 30) % 2 ? C.white : null);
      cx.globalAlpha = 1;
      if (Math.random() < 0.3) this.parts.add({ x: this.x + G.rand(-22, 22), y: this.y + 20, vy: G.rand(5, 20), life: 0.6, c: G.pick([C.navy, '#111d35']), s: 2 });
    }
    for (const b of this.bullets) { G.circ(cx, b.x, b.y, 3, C.plum); G.circ(cx, b.x, b.y, 1, C.pink); }
    for (const s of this.shots) G.draw(cx, 'chanclaP', s.x - 3, s.y - 2, Math.floor(s.t * 20) % 2 === 0);
    this.parts.draw(cx);
    // barra de vida
    G.rect(cx, 80, 15, 160, 6, '#000');
    G.rect(cx, 81, 16, 158 * Math.max(0, this.hp) / this.maxHp, 4, this.phase === 3 ? C.red : this.phase === 2 ? C.orange : C.plum);
    // munición
    G.text(cx, 'CHANCLAS', 8, 168, C.blue, { shadow: true });
    for (let i = 0; i < this.ammo; i++) G.draw(cx, 'chanclaP', 58 + i * 9, 169);
    if (this.state === 'intro') G.bigText(cx, '¡EL COCO!', 100, C.red);
    if (this.state === 'fight' && this.st < 2.5 && !G.has('chancla')) G.text(cx, 'COGE CHANCLAS Y PULSA A', 160, 100, C.yellow, { align: 'center', shadow: true });
  }
}
})();
