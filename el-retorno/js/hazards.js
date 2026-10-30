'use strict';
// =====================================================================
//  PELIGROS y TRAMOS: todo lo que sale de repente por la calle.
//  Pantalla vertical: la calle sube, lo que viene de frente baja.
//  Coordenadas de pantalla; (x, y) son los pies. Los objetos con
//  ground:true bajan con la calle; (px, py) es el centro del chico.
// =====================================================================
(function () {
const C = G.C, W = G.W, H = G.H;
const LEFT = G.LEFT = 30, RIGHT = G.RIGHT = 150;
const HZ = G.HZ = {};
const rx = G.randX = () => G.rand(LEFT + 2, RIGHT - 2);
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
    this.x = G.clamp(this.x + (dx - dy * w) * this.sp * dt, LEFT, RIGHT);
    this.y += (dy + dx * w) * this.sp * dt;
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

// ------------------------------------------------------------ murciélago (baja en picado zigzagueando)
HZ.bat = (x, vy, amp) => ({
  type: 'bat', x, x0: x, y: -10, vy, amp, t: Math.random() * 6,
  update(dt) { this.t += dt; this.y += this.vy * dt; this.x = this.x0 + Math.sin(this.t * 4) * this.amp; },
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
      if (k === 'dive') G.audio.sfx('bite');
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
        const x = G.lerp(sx, this.x, k), y = G.lerp(sy, this.y, k) - Math.sin(Math.PI * k) * 50;
        G.circ(cx, x, y, this.r > 12 ? 4 : 3, C.red); G.circ(cx, x, y, this.r > 12 ? 2 : 1, C.yellow);
      } else if (this.kind === 'maceta') {
        G.draw(cx, 'maceta', this.x - 3, G.lerp(this.y - 90, this.y - 8, k * k));
      } else if (this.kind === 'dive') {
        G.drawScaled(cx, 'vampire', G.lerp(this.x + 30, this.x, k) - 14, G.lerp(-40, this.y - 30, k * k), 2);
      } else if (this.kind === 'bolt') {
        if (Math.random() < 0.4) G.rect(cx, this.x + G.rand(-this.r, this.r), this.y + G.rand(-4, 4), 1, 1, C.yellow);
      } else if (this.kind === 'shadow') {
        G.circ(cx, this.x, G.lerp(this.y - 100, this.y - 4, k * k), 3, C.navy);
      }
      return;
    }
    const a = 1 - (this.t - this.warn) / (this.act + 0.35);
    if (this.kind === 'bolt') {
      let px = this.x + G.rand(-6, 6), py = this.y - 90;
      for (let i = 1; i <= 6; i++) {
        const qx = i < 6 ? this.x + G.rand(-7, 7) : this.x, qy = G.lerp(this.y - 90, this.y, i / 6);
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
HZ.volcano = (x) => ({
  type: 'volcano', x, y: -30, ground: true, t: 0, fire: 0.5, under: true,
  update(dt, S) {
    this.t += dt;
    if (Math.random() < dt * 8) S.parts.add({ x: this.x + G.rand(-4, 4), y: this.y - 26, vx: G.rand(-6, 6), vy: -14, life: 1.2, c: '#5f574f', s: 2 });
    if (this.y < 40 || this.y > H - 40) return;
    this.fire -= dt;
    if (this.fire <= 0) {
      this.fire = G.lerp(1.0, 0.45, S.k);
      const aim = G.chance(0.6);
      const tx = G.clamp(aim ? S.p.x + G.rand(-25, 25) : rx(), LEFT, RIGHT);
      const ty = G.clamp(aim ? S.p.y + G.rand(-40, 20) : G.rand(60, H - 20), 40, H - 10);
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
const SIZES = { toro: [9, 5], taxi: [12, 5], bus: [24, 7], lobo: [9, 5], cat: [4, 3], compana: [4, 6] };
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
    } else if (this.kind === 'taxi') {
      const w = 24, h = 11, l = x - 12, tp = y - h;
      cx.globalAlpha = 0.85;
      G.rect(cx, l, tp, w, h, '#e0ecff');
      G.rect(cx, l + 5, tp + 1, w - 10, h - 2, '#9ab0d0');
      G.rect(cx, l + 8, tp + 2, w - 16, h - 4, '#e0ecff');
      G.rect(cx, x - 1, tp + 4, 3, 3, Math.floor(S.t * 4) % 2 ? C.green : '#0a6a2a');
      G.rect(cx, left ? l : l + w - 1, tp + 1, 1, 2, C.yellow); G.rect(cx, left ? l : l + w - 1, tp + h - 3, 1, 2, C.yellow);
      cx.globalAlpha = 1;
    } else if (this.kind === 'bus') {
      // autobús urbano visto de lado, con conductor fantasma
      const w = 48, l = x - 24, tp = y - 18;
      G.rect(cx, l, tp + 2, w, 13, '#c81e3a');
      G.rect(cx, l, tp, w, 3, '#e83a50');
      for (let i = 0; i < 6; i++) G.rect(cx, l + 4 + i * 7, tp + 4, 5, 5, '#9ad0ff');
      const front = left ? l : l + w - 6;
      G.rect(cx, front, tp + 3, 6, 9, '#9ad0ff');
      cx.globalAlpha = 0.8; G.rect(cx, front + 1, tp + 5, 4, 4, C.white); cx.globalAlpha = 1;
      G.rect(cx, l + 2, tp + 10, w - 4, 2, '#7a0a1a');
      G.text(cx, 'BUS', x, tp + 10, C.yellow, { align: 'center' });
      G.rect(cx, l + 6, y - 3, 7, 4, '#111'); G.rect(cx, l + w - 13, y - 3, 7, 4, '#111');
      G.rect(cx, left ? l - 1 : l + w, tp + 9, 1, 3, C.yellow);
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
  draw(cx) {
    const on = Math.floor(this.t * 10) % 2 === 0;
    cx.globalAlpha = on ? 0.3 : 0.12;
    if (this.side === 'left' || this.side === 'right') G.rect(cx, 0, this.y - 14, W, 14, C.red);
    else G.rect(cx, this.y - 7, 14, 14, H - 14, C.red);
    cx.globalAlpha = 1;
    if (!on) return;
    if (this.side === 'left') G.text(cx, '→!', 3, this.y - 11, C.red, { shadow: true });
    else if (this.side === 'right') G.text(cx, '!←', W - 3, this.y - 11, C.red, { align: 'right', shadow: true });
    else G.text(cx, '↓', this.y, 18, C.red, { align: 'center', shadow: true });
  }
});

// ------------------------------------------------------------ fantasma que flota hacia ti
HZ.ghost = (x, sp) => ({
  type: 'ghost', x, y: -6, t: Math.random() * 6, sp,
  update(dt, S) { this.t += dt; this.y += this.sp * dt; this.x += G.clamp(S.p.x - this.x, -1, 1) * 16 * dt + Math.cos(this.t * 3) * 0.4; },
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
HZ.tuno = (x) => ({
  type: 'tuno', x, y: -16, ground: true, t: 0, fire: G.rand(0.4, 1),
  update(dt, S) {
    this.t += dt;
    this.y += 8 * dt;
    if (this.y < 16 || this.y > S.p.y - 20) return;
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
  draw(cx, S) {
    G.ellipse(cx, this.x, this.y, 5, 1, '#00000070');
    G.drawFeet(cx, Math.floor(this.t * 4) % 2 ? 'tuna0' : 'tuna1', this.x, this.y + 1, this.x > S.p.x);
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
    const dx = S.p.x - this.x, dy = S.p.y - this.y, l = Math.hypot(dx, dy) || 1, sp = this.t < 0.6 ? 10 : 34;
    this.x += dx / l * sp * dt; this.y += dy / l * sp * dt;
  },
  hit(px, py) { return near(px, py, this.x, this.y - 4, 7); },
  draw(cx) { G.ellipse(cx, this.x, this.y, 4, 1, '#00000080'); G.drawFeet(cx, 'sombra', this.x, this.y + Math.sin(this.t * 8), false); }
});

// =====================================================================
//  TRAMOS: cada partida elige 6 al azar y en orden aleatorio
// =====================================================================
const every = (st, key, dt, period, fn) => { st[key] = (st[key] === undefined ? period * 0.4 : st[key]) - dt; if (st[key] <= 0) { st[key] = period; fn(); } };
// fila (altura) por la que cruzar algo: cerca del chico o por delante
const crossRow = (S, aim) => G.clamp(aim ? S.p.y + G.rand(-6, 6) : S.p.y - G.rand(20, 110), 60, H - 12);

G.THEMES = [
  {
    id: 'zombis', name: '¡ZOMBIS!', sub: 'Los vecinos han vuelto... de la tumba', icon: 'mi_zombis',
    cause: 'Los zombis te rodearon. Ahora eres un vecino más del barrio.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(1.0, 0.42, k), () => {
        for (let i = 0; i < 12; i++) {
          const x = rx(), y = G.rand(24, S.p.y - 30);
          if (G.dist(x, y, S.p.x, S.p.y) > 60) { S.add(HZ.zombie(x, y, { sp: 16 + k * 16 })); break; }
        }
      });
      every(st, 'b', dt, G.lerp(6, 3.5, k), () => {
        const x0 = rx(), n = 3 + Math.round(k * 3);
        for (let i = 0; i < n; i++) S.add(HZ.zombie(G.clamp(x0 + G.rand(-24, 24), LEFT, RIGHT), -10 - i * 14, { walk: true, sp: 14 + k * 10 }));
      });
    }
  },
  {
    id: 'vampiro', name: '¡EL VAMPIRO!', sub: 'Murciélagos y un conde con hambre', icon: 'mi_vampiro',
    cause: 'El vampiro te dio un mordisco. Ahora duermes de día.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(0.85, 0.36, k), () => {
        const sp = (95 + k * 60) * G.rand(0.9, 1.2);
        if (G.chance(0.2 + k * 0.2)) { const x0 = G.rand(LEFT + 14, RIGHT - 14); for (let i = -1; i <= 1; i++) { const b = HZ.bat(x0 + i * 14, sp, 4); b.y -= Math.abs(i) * 10; S.add(b); } }
        else S.add(HZ.bat(rx(), sp, G.rand(8, 18)));
      });
      every(st, 'b', dt, G.lerp(3.2, 1.7, k), () => {
        const tx = G.clamp(S.p.x + G.rand(-8, 8), LEFT, RIGHT), ty = G.clamp(S.p.y - G.rand(0, 16), 40, H - 10);
        S.add(HZ.strike(tx, ty, { kind: 'dive', warn: 1.05, r: 11, act: 0.2 }));
        G.audio.sfx('scream');
      });
    },
    draw(cx, S) { if (!S.hz.some(h => h.kind === 'dive')) G.drawScaled(cx, 'vampire', G.clamp(S.p.x + 30 * Math.sin(S.t * 0.7), 20, W - 20) - 14, 18 + Math.sin(S.t * 2) * 3, 2); }
  },
  {
    id: 'volcan', name: '¡UN VOLCÁN!', sub: 'Ha brotado en mitad de la avenida', icon: 'mi_volcan',
    cause: 'Una bomba de lava te pilló en plena avenida.',
    start(S) { S.add(HZ.volcano(G.rand(56, 124))); },
    update(dt, S, st, k) {
      every(st, 'v', dt, G.lerp(6.5, 4, k), () => S.add(HZ.volcano(G.rand(52, 128))));
      every(st, 's', dt, G.lerp(2.2, 1.1, k), () => {
        const tx = G.clamp(S.p.x + G.rand(-40, 40), LEFT, RIGHT);
        S.add(HZ.strike(tx, G.clamp(S.p.y - G.rand(0, 80), 40, H - 10), { kind: 'lava', warn: 1.2, r: 10, sx: tx + G.rand(-30, 30), sy: -20 }));
      });
      if (Math.random() < dt * 12) S.parts.add({ x: G.rand(0, W), y: 14, vx: G.rand(-8, 8), vy: G.rand(20, 40), life: 8, c: G.pick(['#ff6c24', '#ffa300', '#5f574f']) });
    },
    over(cx, S) { cx.globalAlpha = 0.07 + Math.sin(S.t * 3) * 0.03; G.rect(cx, 0, 0, W, H, C.red); cx.globalAlpha = 1; }
  },
  {
    id: 'encierro', name: '¡ENCIERRO!', sub: 'Toros, taxis y un autobús... sin conductor', icon: 'mi_encierro',
    cause: 'Te pilló el encierro fantasma. Saliste en todas las noticias.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(1.5, 0.7, k), () => {
        const y = crossRow(S, G.chance(0.45));
        const side = G.chance(0.5) ? 'right' : 'left';
        S.add(HZ.warn(side, y, 0.95, (S2) => {
          const kind = G.pick(['toro', 'toro', 'taxi', 'bus']);
          const sp = (130 + k * 60) * (kind === 'bus' ? 0.8 : 1);
          const n = kind === 'toro' ? 1 + G.irand(0, 1 + Math.round(k)) : 1;
          for (let i = 0; i < n; i++) {
            const x = side === 'right' ? W + 28 + i * 22 : -28 - i * 22;
            S2.add(HZ.runner(kind, x, y, side === 'right' ? -sp : sp));
          }
          G.audio.sfx('roar');
        }));
      });
    }
  },
  {
    id: 'fantasmas', name: '¡FANTASMAS!', sub: 'Y las abuelas tiran las macetas', icon: 'mi_fantasmas',
    cause: 'Una maceta de geranios con muy mala puntería. O muy buena.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(0.8, 0.36, k), () => {
        const aim = G.chance(0.5);
        const x = aim ? G.clamp(S.p.x + G.rand(-16, 16), LEFT, RIGHT) : G.chance(0.6) ? G.pick([G.rand(LEFT, LEFT + 20), G.rand(RIGHT - 20, RIGHT)]) : rx();
        const y = G.clamp(aim ? S.p.y - G.rand(0, 30) : G.rand(50, H - 20), 40, H - 10);
        S.add(HZ.strike(x, y, { kind: 'maceta', warn: 0.9, r: 7 }));
        if (G.chance(0.25)) S.parts.add({ x: x < W / 2 ? 24 : W - 24, y: y - 40, vy: -10, life: 0.9, txt: '¡NIÑO!', c: C.pink });
      });
      every(st, 'b', dt, G.lerp(2.0, 0.9, k), () => S.add(HZ.ghost(rx(), 38 + k * 26)));
    }
  },
  {
    id: 'compana', name: '¡SANTA COMPAÑA!', sub: 'Niebla y procesiones de ánimas', icon: 'mi_compana',
    cause: 'La Santa Compaña te dio una vela. Ahora caminas con ellos.',
    update(dt, S, st, k) {
      st.fog = Math.min(1, (st.fog || 0) + dt * 0.7);
      every(st, 'a', dt, G.lerp(3.2, 1.9, k), () => {
        // una fila de ánimas de lado a lado con un hueco para pasar
        const gap = G.rand(LEFT + 12, RIGHT - 12), gw = G.lerp(22, 15, k);
        for (let x = LEFT - 2; x <= RIGHT + 2; x += 13) if (Math.abs(x - gap) > gw) S.add(HZ.runner('compana', x, -14, 0, 14 + k * 10, { ground: true }));
        G.audio.sfx('scream');
      });
    },
    over(cx, S, st) {
      const f = S.fogCtx, v = G.lerp(66, 48, S.k);
      f.globalCompositeOperation = 'source-over';
      f.clearRect(0, 0, W, H);
      f.fillStyle = '#0a0a16'; f.fillRect(0, 0, W, H);
      G.dither(f, 0, 0, W, H, '#1a1a2e', Math.floor(S.t * 2) % 2);
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
    cause: 'La meiga te convirtió en sapo. Croac.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(2.4, 1.3, k), () => {
        const kind = G.pick(['row', 'around', 'rain', 'column']);
        const bolt = (x, y, w = 1.1) => S.add(HZ.strike(G.clamp(x, LEFT - 4, RIGHT + 4), G.clamp(y, 40, H - 8), { kind: 'bolt', warn: w, r: 9 }));
        if (kind === 'row') { const y = S.p.y - G.rand(10, 50), gap = G.rand(LEFT + 10, RIGHT - 10); for (let x = LEFT - 2; x <= RIGHT + 2; x += 18) if (Math.abs(x - gap) > 16) bolt(x, y); }
        if (kind === 'around') { bolt(S.p.x, S.p.y, 1.0); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; bolt(S.p.x + Math.cos(a) * 24, S.p.y + Math.sin(a) * 22, 1.0); } }
        if (kind === 'rain') for (let i = 0; i < 5 + Math.round(k * 4); i++) bolt(rx(), G.rand(60, H - 20), 1.2);
        if (kind === 'column') for (let y = 50; y < H; y += 32) bolt(S.p.x + G.rand(-3, 3), y + G.rand(-4, 4), 1.15);
        G.audio.sfx('laugh');
      });
    },
    draw(cx, S) {
      const x = W + 30 - ((S.t * 40) % (W + 80));
      G.rect(cx, x - 2, 38, 26, 2, '#6a4a2a');
      for (let i = 0; i < 4; i++) G.rect(cx, x + 22 + i, 36 + i, 1, 6 - i, '#c89a4a');
      G.draw(cx, 'meiga', x, 20 + Math.sin(S.t * 3) * 2);
    }
  },
  {
    id: 'tuna', name: '¡LA TUNA ZOMBI!', sub: 'Te disparan serenatas', icon: 'mi_tuna',
    cause: 'La tuna zombi te reclutó. Ahora tocas la pandereta para siempre.',
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(2.6, 1.4, k), () => {
        if (S.hz.filter(h => h.type === 'tuno').length >= 2 + Math.round(k * 2)) return;
        S.add(HZ.tuno(G.chance(0.6) ? G.pick([LEFT + 2, RIGHT - 2]) : rx()));
      });
    }
  },
  {
    id: 'lobo', name: '¡EL LOBISHOME!', sub: 'Un hombre lobo... y gatos negros', icon: 'mi_tejados',
    cause: 'El lobishome te alcanzó. Ahora aúllas a la luna.',
    start() { G.audio.sfx('roar'); },
    update(dt, S, st, k) {
      every(st, 'a', dt, G.lerp(3.0, 1.5, k), () => {
        const y = crossRow(S, true), side = G.chance(0.5) ? 'left' : 'right';
        S.add(HZ.warn(side, y, 1.0, S2 => { S2.add(HZ.runner('lobo', side === 'left' ? -24 : W + 24, y, (side === 'left' ? 1 : -1) * (200 + k * 60))); G.audio.sfx('roar'); }));
      });
      every(st, 'b', dt, G.lerp(1.5, 0.75, k), () => {
        const x = G.clamp(S.p.x + G.rand(-30, 30), LEFT, RIGHT);
        S.add(HZ.warn('top', x, 0.6, S2 => S2.add(HZ.runner('cat', x, -8, 0, 170))));
      });
    }
  }
];
})();
