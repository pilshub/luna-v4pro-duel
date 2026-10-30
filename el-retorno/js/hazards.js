'use strict';
// =====================================================================
//  PELIGROS y TRAMOS: todo lo que sale de repente por la calle
//  Las coordenadas son de pantalla. Los objetos con ground:true se
//  desplazan con la calle; (px, py) es el centro del cuerpo de Nico.
// =====================================================================
(function () {
const C = G.C, W = G.W;
const TOPY = G.TOPY = 62, BOTY = G.BOTY = 162;
const LANES = G.LANES = [68, 84, 100, 116, 132, 148];
const HZ = G.HZ = {};
const ry = G.randY = () => G.rand(TOPY + 2, BOTY - 2);
const near = (px, py, x, y, r) => G.dist(px, py, x, y) < r;
const outline = (cx, name, x, y, flip, col) => {
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) G.draw(cx, name, x + ox, y + oy, flip, col);
  G.draw(cx, name, x, y, flip);
};

// ------------------------------------------------------------ zombi
HZ.zombie = (x, y, o = {}) => ({
  type: 'zombie', x, y, ground: true, t: 0, rise: o.walk ? 0 : 0.8, sp: o.sp || 20, seed: Math.random() * 9, face: -1,
  update(dt, S) {
    this.t += dt;
    if (this.t < this.rise) {
      if (Math.random() < 0.3) S.parts.add({ x: this.x + G.rand(-5, 5), y: this.y, vy: -20, life: 0.4, c: '#4a3a2a' });
      return;
    }
    let dx = S.p.x - this.x, dy = S.p.y - this.y;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    const w = Math.sin(this.t * 2.5 + this.seed) * 0.45;
    this.x += (dx - dy * w) * this.sp * dt;
    this.y = G.clamp(this.y + (dy + dx * w) * this.sp * dt, TOPY, BOTY);
    this.face = dx >= 0 ? 1 : -1;
  },
  hit(px, py) { return this.t >= this.rise && near(px, py, this.x, this.y - 6, 7); },
  draw(cx) {
    if (this.t < this.rise) {
      const k = this.t / this.rise;
      G.ellipse(cx, this.x, this.y, 6, 2, '#2a1a10');
      if (k > 0.35) {
        cx.save(); cx.beginPath(); cx.rect(this.x - 6, this.y - 16, 12, 16); cx.clip();
        G.drawFeet(cx, 'zombie0', this.x, this.y + 15 * (1 - (k - 0.35) / 0.65), this.face < 0);
        cx.restore();
      }
      return;
    }
    G.ellipse(cx, this.x, this.y, 4, 1, '#00000070');
    G.drawFeet(cx, Math.floor(this.t * 5 + this.seed) % 2 ? 'zombie0' : 'zombie1', this.x, this.y + 1, this.face < 0);
  }
});

// ------------------------------------------------------------ murciélago
HZ.bat = (y, vx, amp) => ({
  type: 'bat', x: vx < 0 ? W + 10 : -10, y, y0: y, vx, amp, t: Math.random() * 6,
  update(dt) { this.t += dt; this.x += this.vx * dt; this.y = this.y0 + Math.sin(this.t * 4) * this.amp; },
  hit(px, py) { return near(px, py, this.x, this.y - 8, 7); },
  draw(cx) {
    G.ellipse(cx, this.x, this.y, 3, 1, '#00000060');
    outline(cx, Math.floor(this.t * 10) % 2 ? 'bat0' : 'bat1', this.x - 4, this.y - 11, false, '#6a5a9a');
  }
});

// ------------------------------------------------------------ golpe con aviso (lava, maceta, rayo, picado del vampiro, sombra)
const RING = { lava: [C.red, C.orange], maceta: [C.white, C.pink], bolt: [C.yellow, C.lav], dive: [C.red, C.dred], shadow: [C.plum, C.lav] };
HZ.strike = (x, y, o) => ({
  type: 'strike', kind: o.kind, x, y, ground: o.ground !== false, t: 0, warn: o.warn || 1, r: o.r || 10, act: o.act || 0.15,
  src: o.src || null, fired: false, sx: o.sx, sy: o.sy,
  update(dt, S) {
    this.t += dt;
    if (!this.fired && this.t >= this.warn) {
      this.fired = true;
      const k = this.kind;
      if (k === 'lava') { G.audio.sfx('smallboom'); G.shake(2, 0.12); S.parts.burst(this.x, this.y, 16, [C.orange, C.yellow, C.red, C.dgrey], 80, 0.5, 60, 2); S.add(HZ.puddle(this.x, this.y, Math.round(this.r * 0.7))); }
      if (k === 'maceta') { G.audio.sfx('hit'); S.parts.burst(this.x, this.y - 2, 14, [C.brown, C.green, C.red], 70, 0.45, 180); }
      if (k === 'bolt') { G.audio.sfx('zap'); S.parts.burst(this.x, this.y, 10, [C.yellow, C.white], 70, 0.3); }
      if (k === 'dive') { G.audio.sfx('bite'); }
      if (k === 'shadow') { G.audio.sfx('smallboom'); S.parts.burst(this.x, this.y, 12, [C.navy, C.plum, C.lav], 60, 0.4); }
    }
    if (this.t >= this.warn + this.act + 0.35) this.dead = true;
  },
  hit(px, py) { return this.fired && this.t < this.warn + this.act && near(px, py, this.x, this.y - 3, this.r + 3); },
  draw(cx, S) {
    const k = Math.min(1, this.t / this.warn), t = S.t;
    const [c1, c2] = RING[this.kind];
    if (!this.fired) {
      cx.globalAlpha = 0.25 + k * 0.4;
      G.ellipse(cx, this.x, this.y, Math.max(1, Math.round(this.r * k)), Math.max(1, Math.round(this.r * k * 0.55)), '#000');
      cx.globalAlpha = 1;
      G.ring(cx, this.x, this.y, this.r, Math.floor(t * (6 + k * 14)) % 2 ? c1 : c2);
      if (this.kind === 'lava') {
        const sx = this.src ? this.src.x : this.sx, sy = this.src ? this.src.y - 24 : this.sy;
        const x = G.lerp(sx, this.x, k), y = G.lerp(sy, this.y, k) - Math.sin(Math.PI * k) * 60;
        G.circ(cx, x, y, this.r > 12 ? 4 : 3, C.red); G.circ(cx, x, y, this.r > 12 ? 2 : 1, C.yellow);
      } else if (this.kind === 'maceta') {
        G.draw(cx, 'maceta', this.x - 3, G.lerp(16, this.y - 8, k * k));
      } else if (this.kind === 'dive') {
        G.drawScaled(cx, 'vampire', G.lerp(this.x + 50, this.x, k) - 14, G.lerp(-20, this.y - 30, k * k), 2);
      } else if (this.kind === 'bolt') {
        if (Math.random() < 0.4) G.rect(cx, this.x + G.rand(-this.r, this.r), this.y + G.rand(-4, 4), 1, 1, C.yellow);
      } else if (this.kind === 'shadow') {
        G.circ(cx, this.x, G.lerp(-10, this.y - 4, k * k), 3, C.navy);
      }
      return;
    }
    const a = 1 - (this.t - this.warn) / (this.act + 0.35);
    if (this.kind === 'bolt') {
      let px = this.x + G.rand(-6, 6), py = 12;
      for (let i = 1; i <= 6; i++) {
        const qx = i < 6 ? this.x + G.rand(-7, 7) : this.x, qy = G.lerp(12, this.y, i / 6);
        G.line(cx, px, py, qx, qy, C.white); G.line(cx, px + 1, py, qx + 1, qy, C.yellow);
        px = qx; py = qy;
      }
      cx.globalAlpha = Math.max(0, a); G.circ(cx, this.x, this.y, this.r, C.pale); cx.globalAlpha = 1;
    } else if (this.kind === 'dive') {
      G.drawScaled(cx, 'vampire', this.x - 14, this.y - 30 - (this.t - this.warn) * 120, 2);
    } else {
      cx.globalAlpha = Math.max(0, a);
      G.circ(cx, this.x, this.y, this.r, this.kind === 'maceta' ? C.brown : this.kind === 'shadow' ? C.plum : C.orange);
      cx.globalAlpha = 1;
    }
  }
});

HZ.puddle = (x, y, r) => ({
  type: 'puddle', x, y, r, ground: true, t: 2.2, under: true,
  update(dt) { this.t -= dt; if (this.t <= 0) this.dead = true; },
  hit(px, py) { return this.t > 0.3 && near(px, py + 5, this.x, this.y, this.r); },
  draw(cx) {
    const hot = this.t > 0.6;
    G.circ(cx, this.x, this.y, this.r, hot ? C.dred : '#5a1a1a');
    G.circ(cx, this.x, this.y, Math.max(1, this.r - 3), hot ? '#ff6c24' : '#7a2a1a');
    if (hot && Math.random() < 0.3) G.rect(cx, this.x + G.rand(-this.r, this.r) * 0.6, this.y + G.rand(-3, 3), 1, 1, C.yellow);
  }
});

// ------------------------------------------------------------ volcán que brota del asfalto
HZ.volcano = (y) => ({
  type: 'volcano', x: W + 40, y, ground: true, t: 0, fire: 0.5, under: true,
  update(dt, S) {
    this.t += dt;
    if (Math.random() < dt * 8) S.parts.add({ x: this.x + G.rand(-4, 4), y: this.y - 26, vx: G.rand(-6, 6), vy: -14, life: 1.2, c: '#5f574f', s: 2 });
    if (this.x > W - 30 || this.x < 30) return;
    this.fire -= dt;
    if (this.fire <= 0) {
      this.fire = G.lerp(1.0, 0.45, S.k);
      const aim = G.chance(0.6);
      const tx = G.clamp(aim ? S.p.x + G.rand(-25, 45) : G.rand(20, W - 20), 10, W - 10);
      const ty = G.clamp(aim ? S.p.y + G.rand(-22, 22) : ry(), TOPY, BOTY);
      S.add(HZ.strike(tx, ty, { kind: 'lava', warn: 1.1, r: G.chance(S.k * 0.35) ? 14 : 10, src: this }));
      for (let i = 0; i < 4; i++) S.parts.add({ x: this.x + G.rand(-4, 4), y: this.y - 24, vx: G.rand(-30, 30), vy: G.rand(-60, -20), g: 120, life: 0.6, c: G.pick([C.orange, C.yellow, C.red]) });
    }
  },
  hit(px, py) { return py + 5 > this.y - 24 && near(px, py, this.x, this.y - 8, 15); },
  draw(cx, S) {
    for (let j = 0; j < 24; j++) {
      const w = 5 + j * 1.25;
      G.rect(cx, this.x - w, this.y - 24 + j, w, 1, j < 2 ? '#3a1a10' : j % 6 === 0 ? '#3e3030' : '#5a4440');
      G.rect(cx, this.x, this.y - 24 + j, w, 1, j < 2 ? '#3a1a10' : j % 6 === 0 ? '#1e1616' : '#33282a');
    }
    G.ellipse(cx, this.x, this.y - 24, 5, 1, Math.floor(S.t * 8) % 2 ? C.orange : C.yellow);
    for (let j = 0; j < 14; j++) G.rect(cx, this.x - 3 + Math.sin(j * 0.7 + this.t * 3), this.y - 22 + j, 1, 1, j % 3 ? '#ff6c24' : C.red);
    for (let i = 0; i < 6; i++) G.rect(cx, this.x - 30 + i * 12, this.y + 1, 6, 1, '#120a0a');
  }
});

// ------------------------------------------------------------ cosas que cruzan en línea recta
const SIZES = { toro: [9, 5], taxi: [12, 5], bus: [23, 6], lobo: [9, 5], cat: [4, 3], compana: [4, 6] };
HZ.runner = (kind, x, y, vx, vy = 0, o = {}) => ({
  type: 'runner', kind, x, y, vx, vy, ground: !!o.ground, t: Math.random(), hw: SIZES[kind][0], hh: SIZES[kind][1],
  update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; },
  hit(px, py) { return Math.abs(px - this.x) < this.hw + 2 && Math.abs(py - (this.y - this.hh)) < this.hh + 3; },
  draw(cx, S) {
    const x = Math.round(this.x), y = Math.round(this.y), left = this.vx < 0;
    G.ellipse(cx, x, y, this.hw, 1, '#00000060');
    if (this.kind === 'toro') {
      cx.globalAlpha = 0.85;
      G.drawFeet(cx, Math.floor(this.t * 8) % 2 ? 'toro0' : 'toro1', x, y, left);
      cx.globalAlpha = 0.3;
      G.drawFeet(cx, 'toro0', x - Math.sign(this.vx) * 4, y, left, C.blue);
      cx.globalAlpha = 1;
    } else if (this.kind === 'taxi' || this.kind === 'bus') {
      const w = this.hw * 2, h = this.kind === 'bus' ? 13 : 11, l = x - this.hw, tp = y - h;
      cx.globalAlpha = 0.85;
      if (this.kind === 'taxi') {
        G.rect(cx, l, tp, w, h, '#e0ecff');
        G.rect(cx, l + 5, tp + 1, w - 10, h - 2, '#9ab0d0');
        G.rect(cx, l + 8, tp + 2, w - 16, h - 4, '#e0ecff');
        G.rect(cx, x - 1, tp + 4, 3, 3, Math.floor(S.t * 4) % 2 ? C.green : '#0a6a2a');
      } else {
        G.rect(cx, l, tp, w, h, '#3a6ab0'); G.rect(cx, l + 1, tp + 1, w - 2, h - 2, '#4a8ad0');
        for (let i = 4; i < w - 4; i += 6) G.rect(cx, l + i, tp + 2, 4, 2, '#ffd27a');
        G.text(cx, 'BÚHO', x, tp + 4, C.white, { align: 'center' });
      }
      G.rect(cx, left ? l : l + w - 1, tp + 1, 1, 2, C.yellow); G.rect(cx, left ? l : l + w - 1, tp + h - 3, 1, 2, C.yellow);
      cx.globalAlpha = 1;
    } else if (this.kind === 'lobo') {
      G.drawFeet(cx, Math.floor(this.t * 12) % 2 ? 'lobo0' : 'lobo1', x, y + 1, left);
    } else if (this.kind === 'cat') {
      G.drawFeet(cx, 'cat', x, y + 1, Math.floor(this.t * 10) % 2 === 0);
    } else if (this.kind === 'compana') {
      cx.globalAlpha = 0.9;
      G.drawFeet(cx, 'compana', x, y + Math.sin(this.t * 4) * 1, false);
      cx.globalAlpha = 1;
      G.rect(cx, x + 4, y - 8, 1, 2, Math.random() < 0.5 ? C.yellow : C.orange);
    }
  }
});

// aviso parpadeante en el borde antes de que algo cruce
HZ.warn = (side, pos, dur, then) => ({
  type: 'warn', side, x: side === 'left' ? 0 : W, y: pos, t: 0, dur, under: true,
  update(dt, S) { this.t += dt; if (this.t >= this.dur) { this.dead = true; then(S); } },
  hit() { return false; },
  draw(cx, S) {
    const on = Math.floor(this.t * 10) % 2 === 0;
    cx.globalAlpha = on ? 0.28 : 0.12;
    if (this.side === 'left') G.rect(cx, 0, this.y - 12, 90, 12, C.red);
    else if (this.side === 'right') G.rect(cx, W - 90, this.y - 12, 90, 12, C.red);
    else G.rect(cx, this.y - 6, TOPY - 8, 12, BOTY - TOPY + 8, C.red);
    cx.globalAlpha = 1;
    if (!on) return;
    if (this.side === 'left') G.text(cx, '→!', 3, this.y - 10, C.red, { shadow: true });
    else if (this.side === 'right') G.text(cx, '!←', W - 3, this.y - 10, C.red, { align: 'right', shadow: true });
    else G.text(cx, this.side === 'top' ? '↓' : '↑', this.y, this.side === 'top' ? TOPY - 4 : BOTY - 10, C.red, { align: 'center', shadow: true });
  }
});

// ------------------------------------------------------------ fantasma que flota hacia ti
HZ.ghost = (y, sp) => ({
  type: 'ghost', x: W + 12, y, t: Math.random() * 6, sp,
  update(dt, S) { this.t += dt; this.x -= this.sp * dt; this.y += G.clamp(S.p.y - this.y, -1, 1) * 16 * dt + Math.cos(this.t * 3) * 0.4; },
  hit(px, py) { return near(px, py, this.x, this.y - 9, 7); },
  draw(cx) {
    G.ellipse(cx, this.x, this.y, 4, 1, '#00000050');
    cx.globalAlpha = 0.85;
    G.draw(cx, Math.floor(this.t * 2) % 3 ? 'ghost' : 'ghostAngry', this.x - 5, this.y - 18 + Math.sin(this.t * 4) * 2);
    cx.globalAlpha = 1;
  }
});

// ------------------------------------------------------------ tuno zombi que dispara notas
const SCALE = ['E5', 'F5', 'G#5', 'A5', 'B5', 'C6'];
HZ.tuno = (y) => ({
  type: 'tuno', x: W + 14, y, ground: true, t: 0, fire: G.rand(0.4, 1),
  update(dt, S) {
    this.t += dt;
    this.x -= 10 * dt;
    if (this.x > W - 14 || this.x < 10) return;
    this.fire -= dt;
    if (this.fire <= 0) {
      this.fire = G.lerp(1.7, 0.9, S.k);
      const a = Math.atan2(S.p.y - 5 - (this.y - 9), S.p.x - this.x);
      const n = S.k > 0.55 ? 3 : 2, sp = 62 + S.k * 25;
      for (let i = 0; i < n; i++) {
        const b = a + (i - (n - 1) / 2) * 0.32;
        S.add(HZ.note(this.x, this.y - 9, Math.cos(b) * sp, Math.sin(b) * sp));
      }
      G.audio.sfx('note', G.pick(SCALE));
    }
  },
  hit(px, py) { return near(px, py, this.x, this.y - 7, 7); },
  draw(cx) {
    G.ellipse(cx, this.x, this.y, 5, 1, '#00000070');
    G.drawFeet(cx, Math.floor(this.t * 4) % 2 ? 'tuna0' : 'tuna1', this.x, this.y + 1, true);
  }
});
HZ.note = (x, y, vx, vy) => ({
  type: 'note', x, y, vx, vy, t: 0, c: G.pick([C.yellow, C.pink, C.blue, C.green]),
  update(dt) { this.t += dt; this.x += this.vx * dt; this.y += this.vy * dt; },
  hit(px, py) { return near(px, py, this.x, this.y, 5); },
  draw(cx) { G.text(cx, '♪', this.x - 2, this.y - 4 + Math.sin(this.t * 10), this.c, { shadow: true }); }
});

// ------------------------------------------------------------ balas y sombras de El Coco
HZ.bullet = (x, y, vx, vy) => ({
  type: 'bullet', x, y, vx, vy,
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
  hit(px, py) { return near(px, py, this.x, this.y, 5); },
  draw(cx) { G.circ(cx, this.x, this.y, 3, C.plum); G.circ(cx, this.x, this.y, 1, C.pink); }
});
HZ.sombra = (x, y) => ({
  type: 'sombra', x, y, t: 0, life: 8,
  update(dt, S) {
    this.t += dt; this.life -= dt;
    if (this.life <= 0) this.dead = true;
    const dx = S.p.x - this.x, dy = S.p.y - this.y, l = Math.hypot(dx, dy) || 1, sp = this.t < 0.6 ? 10 : 36;
    this.x += dx / l * sp * dt; this.y += dy / l * sp * dt;
  },
  hit(px, py) { return near(px, py, this.x, this.y - 4, 7); },
  draw(cx) { G.ellipse(cx, this.x, this.y, 4, 1, '#00000080'); G.drawFeet(cx, 'sombra', this.x, this.y + Math.sin(this.t * 8), false); }
});

// =====================================================================
//  TRAMOS: cada partida elige 6 al azar y en orden aleatorio
// =====================================================================
const every = (st, key, dt, period, fn) => { st[key] = (st[key] === undefined ? period * 0.4 : st[key]) - dt; if (st[key] <= 0) { st[key] = period; fn(); } };
const laneNear = y => LANES.reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a);

G.THEMES = [
  {
    id: 'zombis', name: '¡ZOMBIS!', sub: 'Los vecinos han vuelto... de la tumba', icon: 'mi_zombis',
    places: ['Plaza Mayor', 'Plaza de la Iglesia', 'Plaza de Abastos'],
    cause: 'Los zombis te rodearon. Ahora eres un vecino más del barrio.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(1.0, 0.42, k), () => {
        for (let i = 0; i < 12; i++) {
          const x = G.rand(W * 0.35, W - 12), y = ry();
          if (G.dist(x, y, S.p.x, S.p.y) > 55) { S.add(HZ.zombie(x, y, { sp: 16 + k * 16 })); break; }
        }
      });
      every(st, 'b', dt, G.lerp(6, 3.5, k), () => {
        const y0 = ry(), n = 3 + Math.round(k * 3);
        for (let i = 0; i < n; i++) S.add(HZ.zombie(W + 10 + i * 14, G.clamp(y0 + G.rand(-20, 20), TOPY, BOTY), { walk: true, sp: 14 + k * 10 }));
      });
    }
  },
  {
    id: 'vampiro', name: '¡EL VAMPIRO!', sub: 'Murciélagos y un conde con mucha hambre', icon: 'mi_vampiro',
    places: ['Callejón del Gato', 'Callejón de las Ánimas', 'Travesía del Silencio'],
    cause: 'El vampiro te dio un mordisco. Ahora duermes de día.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(0.9, 0.38, k), () => {
        const sq = G.chance(0.2 + k * 0.2), y0 = ry(), sp = -(85 + k * 60) * G.rand(0.9, 1.2);
        if (sq) for (let i = 0; i < 3; i++) { const b = HZ.bat(G.clamp(y0 + i * 14 - 14, TOPY, BOTY), sp, 6); b.x += i * 12; S.add(b); }
        else S.add(HZ.bat(y0, sp, G.rand(8, 18)));
      });
      every(st, 'b', dt, G.lerp(3.2, 1.7, k), () => {
        const tx = G.clamp(S.p.x + G.rand(-6, 20), 12, W - 12), ty = G.clamp(S.p.y + G.rand(-8, 8), TOPY, BOTY);
        S.add(HZ.strike(tx, ty, { kind: 'dive', warn: 1.05, r: 11, act: 0.2 }));
        G.audio.sfx('scream');
      });
    },
    draw(cx, S) { if (!S.hz.some(h => h.kind === 'dive')) G.drawScaled(cx, 'vampire', S.p.x + 40 * Math.sin(S.t * 0.7) - 14, 14 + Math.sin(S.t * 2) * 3, 2); }
  },
  {
    id: 'volcan', name: '¡UN VOLCÁN!', sub: 'Ha brotado un volcán en mitad de la avenida', icon: 'mi_volcan',
    places: ['Gran Vía', 'Avenida de la Constitución', 'Paseo de las Acacias'],
    cause: 'Una bomba de lava te pilló en plena avenida.',
    start(S) { S.add(HZ.volcano(G.rand(96, 140))); },
    update(dt, S, st, k) {
      every(st, 'v', dt, G.lerp(6.5, 4, k), () => S.add(HZ.volcano(G.rand(90, 145))));
      every(st, 's', dt, G.lerp(2.2, 1.1, k), () => {
        const tx = G.clamp(S.p.x + G.rand(-40, 60), 10, W - 10);
        S.add(HZ.strike(tx, ry(), { kind: 'lava', warn: 1.2, r: 10, sx: tx + 80, sy: -20 }));
      });
      if (Math.random() < dt * 12) S.parts.add({ x: G.rand(0, W), y: 12, vx: G.rand(-8, 8), vy: G.rand(20, 40), life: 4, c: G.pick(['#ff6c24', '#ffa300', '#5f574f']) });
    },
    over(cx, S) { cx.globalAlpha = 0.07 + Math.sin(S.t * 3) * 0.03; G.rect(cx, 0, 0, W, G.H, C.red); cx.globalAlpha = 1; }
  },
  {
    id: 'encierro', name: '¡ENCIERRO FANTASMA!', sub: 'Toros, taxis y el búho... sin conductor', icon: 'mi_encierro',
    places: ['Avenida del Puerto', 'Ronda de la Muralla', 'Glorieta de los Patos'],
    cause: 'Te pilló el encierro fantasma. Saliste en todas las noticias.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(1.5, 0.7, k), () => {
        const y = G.chance(0.4) ? laneNear(S.p.y) : G.pick(LANES);
        const side = G.chance(0.8) ? 'right' : 'left';
        S.add(HZ.warn(side, y, 0.9, (S2) => {
          const kind = G.pick(['toro', 'toro', 'taxi', 'bus']);
          const sp = (170 + k * 70) * (kind === 'bus' ? 0.75 : 1);
          const n = kind === 'toro' ? 1 + G.irand(0, 1 + Math.round(k)) : 1;
          for (let i = 0; i < n; i++) {
            const x = side === 'right' ? W + 24 + i * 22 : -24 - i * 22;
            S2.add(HZ.runner(kind, x, y, side === 'right' ? -sp : sp));
          }
          G.audio.sfx('roar');
        }));
      });
    }
  },
  {
    id: 'fantasmas', name: '¡FANTASMAS!', sub: 'Y las abuelas tiran las macetas', icon: 'mi_fantasmas',
    places: ['Calle Mayor', 'Calle del Pez', 'Calle Real'],
    cause: 'Una maceta de geranios con muy mala puntería. O muy buena.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(0.8, 0.36, k), () => {
        const aim = G.chance(0.5);
        const x = G.clamp(aim ? S.p.x + G.rand(-18, 40) : G.rand(20, W - 20), 10, W - 10);
        const y = aim ? G.clamp(S.p.y + G.rand(-10, 10), TOPY, BOTY) : G.rand(TOPY, TOPY + 50);
        S.add(HZ.strike(x, y, { kind: 'maceta', warn: 0.9, r: 7 }));
        if (G.chance(0.25)) S.parts.add({ x, y: 30, vy: -10, life: 0.9, txt: '¡NIÑO!', c: C.pink });
      });
      every(st, 'b', dt, G.lerp(2.0, 0.9, k), () => S.add(HZ.ghost(ry(), 38 + k * 26)));
    }
  },
  {
    id: 'compana', name: '¡LA SANTA COMPAÑA!', sub: 'Niebla y una procesión de ánimas', icon: 'mi_compana',
    places: ['Casco Antiguo', 'Cuesta de los Ciegos', 'Barrio Viejo'],
    cause: 'La Santa Compaña te dio una vela. Ahora caminas con ellos.',
    update(dt, S, st, k) {
      st.fog = Math.min(1, (st.fog || 0) + dt * 0.7);
      every(st, 'a', dt, G.lerp(3.0, 1.7, k), () => {
        const y = G.chance(0.35) ? laneNear(S.p.y) : G.pick(LANES);
        const n = 4 + G.irand(0, 2 + Math.round(k * 2));
        for (let i = 0; i < n; i++) S.add(HZ.runner('compana', W + 16 + i * 14, y, -(18 + k * 12), 0, { ground: true }));
        G.audio.sfx('scream');
      });
    },
    over(cx, S, st) {
      const f = S.fogCtx, v = G.lerp(66, 46, S.k);
      f.globalCompositeOperation = 'source-over';
      f.clearRect(0, 0, W, G.H);
      f.fillStyle = '#0a0a16'; f.fillRect(0, 0, W, G.H);
      G.dither(f, 0, 0, W, G.H, '#1a1a2e', Math.floor(S.t * 2) % 2);
      f.globalCompositeOperation = 'destination-out';
      const px = S.p.x, py = S.p.y - 6;
      f.globalAlpha = 0.45; G.circ(f, px, py, Math.round(v), '#000');
      f.globalAlpha = 0.8; G.circ(f, px, py, Math.round(v * 0.78), '#000');
      f.globalAlpha = 1; G.circ(f, px, py, Math.round(v * 0.55), '#000');
      f.globalAlpha = 0.7;
      for (const h of S.hz) if (h.kind === 'compana') G.circ(f, h.x + 4, h.y - 8, 10, '#000');
      f.globalAlpha = 1;
      cx.globalAlpha = (st.fog || 0) * 0.92;
      cx.drawImage(S.fog, 0, 0);
      cx.globalAlpha = 1;
      for (const h of S.hz) if (h.kind === 'compana') G.rect(cx, h.x + 4, h.y - 8, 1, 2, Math.random() < 0.5 ? C.yellow : C.orange);
    }
  },
  {
    id: 'meiga', name: '¡LA MEIGA!', sub: 'Una bruja lanza rayos desde su escoba', icon: 'mi_meiga',
    places: ['La Encrucijada', 'Cruce de los Cuatro Caminos', 'Rotonda de la Fuente'],
    cause: 'La meiga te convirtió en sapo. Croac.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(2.4, 1.3, k), () => {
        const kind = G.pick(['line', 'around', 'rain', 'row']);
        const bolt = (x, y, w = 1.1) => S.add(HZ.strike(G.clamp(x, 8, W - 8), G.clamp(y, TOPY, BOTY), { kind: 'bolt', warn: w, r: 9 }));
        if (kind === 'line') { const x = G.clamp(S.p.x + G.rand(10, 70), 40, W - 20), gap = G.irand(0, LANES.length - 1); LANES.forEach((y, i) => { if (Math.abs(i - gap) > 0) bolt(x, y); }); }
        if (kind === 'around') { bolt(S.p.x, S.p.y, 1.0); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; bolt(S.p.x + Math.cos(a) * 26, S.p.y + Math.sin(a) * 18, 1.0); } }
        if (kind === 'rain') for (let i = 0; i < 5 + Math.round(k * 4); i++) bolt(G.rand(20, W - 20), ry(), 1.2);
        if (kind === 'row') { const y = laneNear(S.p.y); for (let x = 20; x < W; x += 34) bolt(x + G.rand(-4, 4), y, 1.15); }
        G.audio.sfx('laugh');
      });
    },
    draw(cx, S) {
      const x = W + 30 - ((S.t * 50) % (W + 80));
      G.rect(cx, x - 2, 30, 26, 2, '#6a4a2a');
      for (let i = 0; i < 4; i++) G.rect(cx, x + 22 + i, 28 + i, 1, 6 - i, '#c89a4a');
      G.draw(cx, 'meiga', x, 12 + Math.sin(S.t * 3) * 2);
    }
  },
  {
    id: 'tuna', name: '¡LA TUNA ZOMBI!', sub: 'Te disparan serenatas', icon: 'mi_tuna',
    places: ['Plaza de la Universidad', 'Calle de los Estudiantes', 'Plaza del Mercado'],
    cause: 'La tuna zombi te reclutó. Ahora tocas la pandereta para siempre.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(2.6, 1.4, k), () => {
        if (S.hz.filter(h => h.type === 'tuno').length >= 2 + Math.round(k * 2)) return;
        S.add(HZ.tuno(G.chance(0.6) ? G.pick([TOPY + 2, BOTY - 1]) : ry()));
      });
    }
  },
  {
    id: 'lobo', name: '¡EL LOBISHOME!', sub: 'Un hombre lobo te persigue... y gatos negros', icon: 'mi_tejados',
    places: ['Calle de la Luna', 'Barrio de San Pedro', 'Calle del Olvido'],
    cause: 'El lobishome te alcanzó. Ahora aúllas a la luna.',
    start() { G.audio.sfx('roar'); },
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(3.0, 1.5, k), () => {
        const y = laneNear(S.p.y);
        S.add(HZ.warn('left', y, 1.0, S2 => { S2.add(HZ.runner('lobo', -24, y, 230 + k * 70)); G.audio.sfx('roar'); }));
      });
      every(st, 'b', dt, G.lerp(1.6, 0.8, k), () => {
        const x = G.clamp(S.p.x + G.rand(10, 120), 40, W - 16), top = G.chance(0.5);
        S.add(HZ.warn(top ? 'top' : 'bottom', x, 0.55, S2 => S2.add(HZ.runner('cat', x, top ? TOPY - 4 : BOTY + 8, 0, top ? 150 : -150, { ground: true }))));
      });
    }
  }
];
})();
