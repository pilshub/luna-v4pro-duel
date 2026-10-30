'use strict';
// LA TUNA ZOMBI — sigue el ritmo (juego musical)
(function () {
const C = G.C;
const HIT = 150, TOPY = 16;
const LANES = [
  { k: 'left', x: 194, col: C.pink, a: '←' }, { k: 'down', x: 220, col: C.blue, a: '↓' },
  { k: 'up', x: 246, col: C.green, a: '↑' }, { k: 'right', x: 272, col: C.orange, a: '→' }
];
const LW = 24;
const SCALE = ['E4', 'F4', 'G#4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G#5'];
const BASS = ['A2', 'G2', 'F2', 'E2'];
const DEF = G.GAMES.tuna = {
  id: 'tuna', name: 'La tuna zombi', place: 'plaza', icon: 'mi_tuna', music: null,
  intro: 'Una tuna de zombis te ha rodeado y no te deja pasar hasta que les acompañes. Pulsa cada flecha justo cuando llegue a la línea.',
  controls: [['←↑↓→', 'tocar la nota'], ['TOCAR', 'pulsa el carril']],
  items: ['auriculares', 'reloj', 'casco'],
  cause: 'La tuna zombi te reclutó. Ahora tocas la pandereta por las noches. Para siempre.',
  create(D) { return new Tuna(D); }
};

function makeBg() {
  const [c, x] = G.makeCanvas(G.W, G.H);
  G.art.sky(x, G.W, G.H);
  G.art.stars(x, 180, 40, 8);
  G.art.facade(x, -6, 18, 92, 132, 5150, { lit: 0.5, shopType: 'TABERNA' });
  G.art.facade(x, 86, 30, 90, 120, 5151, { lit: 0.4 });
  G.art.cobbles(x, 0, 150, 180, 30);
  G.art.lamp(x, 82, 152, true, 40);
  // carriles
  G.rect(x, 180, 12, 140, 168, '#0b0b1acc');
  G.rect(x, 180, 12, 1, 168, '#3a3a5a');
  for (const l of LANES) {
    G.rect(x, l.x, 12, LW, 168, '#14142a');
    G.rect(x, l.x, 12, 1, 168, '#22224a');
  }
  return c;
}

class Tuna {
  constructor(D) {
    this.D = D = Math.min(1.15, D); this.t = 0; this.done = false;
    this.bpm = G.lerp(100, 136, Math.min(1, D));
    this.sd = 60 / this.bpm / 2;
    this.tt = G.lerp(1.7, 1.25, Math.min(1, D));
    this.lead = this.tt + 0.6;
    const len = (22 + D * 4) * G.timeMul();
    const steps = Math.floor(len / this.sd);
    this.notes = [];
    let prev = -1;
    for (let i = 4; i < steps; i++) {
      const on = i % 2 === 0;
      const p = on ? G.lerp(0.55, 0.78, D) : G.lerp(0.1, 0.38, D);
      if (!G.chance(p)) continue;
      let lane = G.irand(0, 3);
      if (lane === prev && G.chance(0.6)) lane = (lane + G.irand(1, 3)) % 4;
      prev = lane;
      this.notes.push({ time: this.lead + i * this.sd, lane, i, hit: false, miss: false });
      if (D > 0.8 && on && G.chance(0.08)) this.notes.push({ time: this.lead + i * this.sd, lane: (lane + 2) % 4, i, hit: false, miss: false });
    }
    this.end = this.lead + steps * this.sd + 0.8;
    const aur = G.has('auriculares') ? 1.6 : 1;
    this.wPerfect = 0.065 * aur; this.wGood = 0.14 * aur;
    this.misses = 0; this.combo = 0; this.best = 0;
    this.step = -1;
    this.fx = []; this.press = [0, 0, 0, 0];
    this.parts = new G.Particles();
    this.bg = makeBg();
    this.tomato = 0;
    this.hud = { label: 'RITMO', prog: 0 };
  }
  hitLane(li) {
    this.press[li] = 0.12;
    let best = null, bd = 9;
    for (const n of this.notes) {
      if (n.hit || n.miss || n.lane !== li) continue;
      const d = Math.abs(n.time - this.t);
      if (d < bd) { bd = d; best = n; }
    }
    const lx = LANES[li].x + LW / 2;
    if (best && bd <= this.wGood) {
      best.hit = true;
      const perfect = bd <= this.wPerfect;
      G.audio.sfx('note', SCALE[(best.lane * 2 + best.i) % SCALE.length]);
      this.combo++; this.best = Math.max(this.best, this.combo);
      G.addScore(perfect ? 15 : 8);
      this.fx.push({ txt: perfect ? '¡OLÉ!' : 'BIEN', c: perfect ? C.yellow : C.green, t: 0, x: lx });
      this.parts.burst(lx, HIT, perfect ? 10 : 5, [LANES[li].col, C.white], 60, 0.35);
    } else {
      G.audio.sfx('sour', 180 + li * 20);
      this.addMiss(0.5);
      this.combo = 0;
    }
  }
  addMiss(n) {
    this.misses += n;
    if (this.misses >= 4) {
      this.misses -= 4;
      this.tomato = 0.5;
      G.hurt(DEF.cause);
    }
  }
  update(dt) {
    this.t += dt;
    for (let i = 0; i < 4; i++) this.press[i] = Math.max(0, this.press[i] - dt);
    if (this.tomato > 0) this.tomato -= dt;
    // ritmo de fondo
    const st = Math.floor((this.t - this.lead + 4 * this.sd) / this.sd);
    if (st !== this.step && this.t < this.end - 0.5) {
      this.step = st;
      if (st >= 0) {
        const bar = Math.floor(st / 8) % 4;
        if (st % 2 === 0) { G.audio.tone(110, 0.1, { type: 'sine', vol: 0.3, slide: -70 }); }
        if (st % 4 === 0) G.audio.tone(BASS[bar], this.sd * 3.6, { type: 'triangle', vol: 0.32 });
        if (st % 4 === 2) G.audio.tone(G.freq(BASS[bar]) * 1.5, this.sd * 1.6, { type: 'triangle', vol: 0.22 });
        if (st % 8 === 4) G.audio.noise(0.1, { vol: 0.12, filter: 'bandpass', freq: 1800 });
        G.audio.noise(0.03, { vol: 0.05, filter: 'highpass', freq: 6000 });
      }
    }
    const keys = ['left', 'down', 'up', 'right'];
    keys.forEach((k, i) => { if (G.Input.hit(k)) this.hitLane(i); });
    if (G.Input.tap && G.Input.tap.x > 186) {
      const li = LANES.findIndex(l => G.Input.tap.x >= l.x - 1 && G.Input.tap.x < l.x + LW + 1);
      if (li >= 0) this.hitLane(li);
    }
    for (const n of this.notes) {
      if (!n.hit && !n.miss && this.t - n.time > this.wGood) {
        n.miss = true; this.combo = 0;
        this.fx.push({ txt: 'FALLO', c: C.red, t: 0, x: LANES[n.lane].x + LW / 2 });
        this.addMiss(1);
      }
    }
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter(f => f.t < 0.5);
    this.parts.update(dt);
    this.hud.label = 'COMBO ' + this.combo;
    this.hud.prog = Math.min(1, this.t / this.end);
    if (this.t >= this.end) this.done = true;
  }
  draw(cx) {
    cx.drawImage(this.bg, 0, 0);
    const t = this.t;
    const beat = this.t > this.lead - 4 * this.sd ? ((this.t - this.lead) / (this.sd * 2)) : 0;
    const bob = Math.abs(Math.sin(beat * Math.PI));
    // tunos zombis
    [[26, 0], [64, 1], [112, 0]].forEach(([x, k], i) => {
      const y = 166 - Math.round(bob * 3 * (i % 2 ? 1 : 0.6));
      G.ellipse(cx, x + 6, 166, 6, 1, '#00000080');
      G.draw(cx, (Math.floor(beat) + k) % 2 ? 'tuna0' : 'tuna1', x, y - 16, i === 2);
      if (Math.floor(beat * 2 + i) % 3 === 0) G.text(cx, '♪', x + 12 + Math.sin(t * 3 + i) * 3, y - 26 - (beat * 10 % 10), G.pick([C.yellow, C.pink, C.blue]), { shadow: true });
    });
    // Nico (bailando)
    G.drawFeet(cx, Math.floor(beat) % 2 ? 'nico1' : 'nico2', 150, 168 - Math.round(bob * 2), true);
    if (this.tomato > 0) G.circ(cx, 150, 160 - this.tomato * 30, 3, C.red);
    // receptores
    LANES.forEach((l, i) => {
      const pressed = this.press[i] > 0 || G.Input.down(l.k);
      G.rect(cx, l.x + 1, HIT - 8, LW - 1, 16, pressed ? l.col : '#2a2a4a');
      G.rect(cx, l.x + 3, HIT - 6, LW - 5, 12, pressed ? C.white : '#14142a');
      G.text(cx, l.a, l.x + LW / 2, HIT - 3, pressed ? l.col : '#6a6a8a', { align: 'center', scale: 1 });
    });
    // notas
    for (const n of this.notes) {
      if (n.hit) continue;
      const k = (n.time - t) / this.tt;
      if (k > 1.05 || k < -0.3) continue;
      const y = Math.round(HIT - k * (HIT - TOPY));
      const l = LANES[n.lane];
      const col = n.miss ? '#4a4a5a' : l.col;
      G.rect(cx, l.x + 3, y - 6, LW - 5, 12, '#000');
      G.rect(cx, l.x + 2, y - 7, LW - 5, 12, col);
      G.rect(cx, l.x + 4, y - 5, LW - 9, 8, n.miss ? '#2a2a3a' : '#fff1e880');
      G.text(cx, l.a, l.x + LW / 2 - 1, y - 4, n.miss ? '#6a6a7a' : C.ink, { align: 'center' });
    }
    for (const f of this.fx) G.text(cx, f.txt, f.x, HIT - 22 - f.t * 20, f.c, { align: 'center', shadow: true });
    this.parts.draw(cx);
    // fallos
    G.text(cx, 'FALLOS', 8, 16, C.pink, { shadow: true });
    for (let i = 0; i < 4; i++) G.text(cx, i < Math.floor(this.misses) ? '●' : '○', 48 + i * 6, 16, i < Math.floor(this.misses) ? C.red : C.lav, { shadow: true });
    if (this.t < this.lead - 0.2) G.bigText(cx, '¡A TOCAR!', 70, C.yellow);
  }
}
})();
