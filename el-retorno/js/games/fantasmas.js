'use strict';
// FANTASMAS EN LAS VENTANAS — deslumbra a los fantasmas, ¡no a las abuelas!
(function () {
const C = G.C;
const COLS = 4, ROWS = 3, WW = 30, WH = 28;
const wx = c => 34 + c * 72, wy = r => 24 + r * 42;
const DEF = G.GAMES.fantasmas = {
  id: 'fantasmas', name: 'Fantasmas en las ventanas', place: 'calle', icon: 'mi_fantasmas', music: 'tense',
  intro: 'Los fantasmas se asoman a los balcones. Deslúmbralos con la linterna del móvil. ¡Pero ojo! Si deslumbras a una abuela, te tira la maceta.',
  controls: [['←↑↓→', 'apuntar'], ['A', 'deslumbrar'], ['TOCAR', 'apuntar y deslumbrar']],
  items: ['linterna', 'gafas', 'azabache', 'casco'],
  cause: 'Los fantasmas del 2º te dieron tal susto que te quedaste ahí plantado hasta el amanecer.',
  create(D) { return new Fantasmas(D); }
};

function makeBg() {
  const [c, x] = G.makeCanvas(G.W, G.H);
  G.art.sky(x, G.W, 40);
  G.art.stars(x, G.W, 20, 12);
  G.rect(x, 8, 14, G.W - 16, 140, '#45374f');
  for (let i = 0; i < 600; i++) G.rect(x, 8 + Math.random() * (G.W - 16), 14 + Math.random() * 140, 1, 1, '#00000030');
  G.rect(x, 4, 12, G.W - 8, 4, '#2a2240'); G.rect(x, 4, 16, G.W - 8, 1, '#5a5070');
  for (let r = 0; r < ROWS; r++) G.rect(x, 8, wy(r) + WH + 10, G.W - 16, 2, '#3a2e48');
  G.rect(x, 8, 150, G.W - 16, 4, '#2a2240');
  G.art.tiles(x, 0, 154, G.W, 26);
  // portal y comercio
  G.rect(x, 140, 128, 40, 26, '#2a1a10'); G.rect(x, 142, 130, 36, 24, '#5a3a20'); G.rect(x, 159, 130, 2, 24, '#2a1a10');
  G.text(x, 'Nº 13', 160, 120, C.yellow, { align: 'center' });
  G.art.contenedor(x, 20, 142, '#2c6a3a'); G.art.contenedor(x, 284, 142, '#a08a20');
  return c;
}

class Fantasmas {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    this.goal = 10 + Math.round(Math.min(1, D) * 6);
    this.count = 0; this.fear = 0;
    this.cc = 1; this.cr = 1; this.cd = 0; this.beam = 0;
    this.wins = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) this.wins.push({ c, r, s: 'closed', t: 0, dur: 0 });
    this.spawnT = 0.8; this.potList = [];
    this.parts = new G.Particles(); this.coins = new G.Coins();
    this.bg = makeBg();
    this.hud = { label: '', prog: 0 };
  }
  win(c, r) { return this.wins[r * COLS + c]; }
  spawn() {
    const busy = this.wins.filter(w => w.s === 'ghost' || w.s === 'abuela').length;
    if (busy >= 1 + Math.floor(Math.min(1, this.D) * 2.5)) return;
    const free = this.wins.filter(w => w.s === 'closed');
    if (!free.length) return;
    const w = G.pick(free);
    const ab = G.chance(0.14 + this.D * 0.08);
    w.s = ab ? 'abuela' : 'ghost'; w.t = 0;
    w.dur = ab ? 1.6 : G.lerp(1.75, 0.95, Math.min(1, this.D)) / G.enemyMul() * (G.has('gafas') ? 1.2 : 1);
  }
  flash(c, r) {
    if (this.cd > 0) return;
    this.cd = 0.22; this.beam = 0.15; this.bc = c; this.br = r;
    G.audio.sfx('flash');
    const targets = [[c, r]];
    if (G.has('linterna')) { targets.push([c - 1, r], [c + 1, r]); }
    for (const [tc, tr] of targets) {
      if (tc < 0 || tc >= COLS) continue;
      const w = this.win(tc, tr);
      const cx = wx(tc) + WW / 2, cy = wy(tr) + WH / 2;
      if (w.s === 'ghost' && w.t > 0.12) {
        w.s = 'poof'; w.t = 0; this.count++;
        G.addScore(10); G.run.stats.kills++;
        this.parts.burst(cx, cy, 16, [C.white, C.lav, C.blue], 70, 0.5);
        G.audio.sfx('poof');
        if (G.chance(0.25)) { this.coins.got++; G.run.stats.coins++; G.addScore(10); this.parts.text(cx, cy - 8, '+1 €'); }
      } else if (w.s === 'abuela') {
        w.s = 'angry'; w.t = 0;
        G.audio.sfx('deny');
      }
    }
  }
  update(dt) {
    this.t += dt;
    if (this.cd > 0) this.cd -= dt;
    if (this.beam > 0) this.beam -= dt;
    if (G.Input.hit('left')) { this.cc = Math.max(0, this.cc - 1); G.audio.sfx('move'); }
    if (G.Input.hit('right')) { this.cc = Math.min(COLS - 1, this.cc + 1); G.audio.sfx('move'); }
    if (G.Input.hit('up')) { this.cr = Math.max(0, this.cr - 1); G.audio.sfx('move'); }
    if (G.Input.hit('down')) { this.cr = Math.min(ROWS - 1, this.cr + 1); G.audio.sfx('move'); }
    if (G.Input.hit('a')) this.flash(this.cc, this.cr);
    const tp = G.Input.tap;
    if (tp) for (const w of this.wins) if (tp.x > wx(w.c) - 8 && tp.x < wx(w.c) + WW + 8 && tp.y > wy(w.r) - 6 && tp.y < wy(w.r) + WH + 8) { this.cc = w.c; this.cr = w.r; this.flash(w.c, w.r); }

    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawn(); this.spawnT = G.lerp(0.95, 0.5, Math.min(1, this.D)) * G.rand(0.7, 1.3); }
    for (const w of this.wins) {
      w.t += dt;
      if ((w.s === 'ghost' || w.s === 'abuela') && w.t > w.dur) {
        if (w.s === 'ghost') {
          this.fear++; G.audio.sfx('scream');
          this.parts.add({ x: wx(w.c) + 15, y: wy(w.r) + 10, vy: -60, life: 0.8, txt: '¡BUUU!', c: C.lav });
          if (this.fear >= 3) { this.fear = 0; G.hurt(DEF.cause); }
        }
        w.was = w.s; w.s = 'closing'; w.t = 0;
      } else if (w.s === 'angry' && w.t > 0.5) {
        this.potList.push({ x: wx(w.c) + 15, y: wy(w.r) + 20, sx: wx(w.c) + 15, sy: wy(w.r) + 20, t: 0 });
        w.was = 'abuela'; w.s = 'closing'; w.t = 0;
      } else if ((w.s === 'poof' || w.s === 'closing') && w.t > 0.35) { w.s = 'closed'; w.t = 0; }
    }
    for (const p of this.potList) {
      p.t += dt;
      const k = Math.min(1, p.t / 0.55);
      p.x = G.lerp(p.sx, 160, k); p.y = G.lerp(p.sy, 166, k * k);
      if (k >= 1 && !p.hit) {
        p.hit = true;
        G.hurt('Una abuela te tiró una maceta de geranios. Con razón.');
        this.parts.burst(160, 160, 16, [C.brown, C.green, C.red], 80, 0.5, 200);
        G.audio.sfx('hit');
      }
    }
    this.potList = this.potList.filter(p => !p.hit);
    this.parts.update(dt);
    this.hud.label = 'FANTASMAS ' + this.count + '/' + this.goal;
    this.hud.prog = this.count / this.goal;
    if (this.count >= this.goal) this.done = true;
  }
  draw(cx) {
    cx.drawImage(this.bg, 0, 0);
    const t = this.t;
    for (const w of this.wins) {
      const x = wx(w.c), y = wy(w.r);
      G.rect(cx, x - 2, y - 2, WW + 4, WH + 4, '#1a1428');
      const open = w.s !== 'closed';
      let k = 1;
      if (w.s === 'closing') k = 1 - Math.min(1, w.t / 0.3);
      else if (w.s === 'ghost' || w.s === 'abuela') k = Math.min(1, w.t / 0.15);
      const warm = w.s === 'abuela' || w.s === 'angry' || (w.s === 'closing' && w.was === 'abuela');
      G.rect(cx, x, y, WW, WH, warm ? '#ffd27a' : open ? '#2a1a4a' : '#2f4a3a');
      if (w.s === 'abuela' || w.s === 'angry') {
        G.drawScaled(cx, w.s === 'angry' ? 'abuelaAngry' : 'abuela', x + 3, y + WH - 24 * k, 2);
        if (w.s === 'angry') G.text(cx, '¡NIÑO!', x + WW / 2, y - 10, C.red, { align: 'center', shadow: true });
      } else if (w.s === 'ghost') {
        cx.globalAlpha = 0.9;
        const urgent = w.t > w.dur * 0.7;
        G.drawScaled(cx, urgent ? 'ghostAngry' : 'ghost', x + 5, y + WH - 22 * k + Math.sin(t * 6) * 1.5, 2);
        cx.globalAlpha = 1;
      }
      // persiana
      const ph = open ? Math.round(WH * (1 - k) * 0.85) + 3 : WH;
      G.rect(cx, x, y, WW, ph, '#3a5a46');
      for (let j = 1; j < ph; j += 2) G.rect(cx, x, y + j, WW, 1, '#2a4232');
      // balcón de forja
      G.rect(cx, x - 6, y + WH + 8, WW + 12, 2, '#111');
      G.rect(cx, x - 6, y + WH + 1, WW + 12, 1, '#111');
      for (let b = 0; b < WW + 12; b += 3) G.rect(cx, x - 6 + b, y + WH + 1, 1, 8, '#111');
    }
    // cursor
    const x = wx(this.cc), y = wy(this.cr);
    const blink = Math.floor(t * 6) % 2;
    const cc = blink ? C.yellow : C.white;
    for (const [ox, oy, w, h] of [[-5, -5, 8, 2], [-5, -5, 2, 8], [WW - 3, -5, 8, 2], [WW + 3, -5, 2, 8], [-5, WH + 3, 8, 2], [-5, WH - 3, 2, 8], [WW - 3, WH + 3, 8, 2], [WW + 3, WH - 3, 2, 8]]) G.rect(cx, x + ox, y + oy, w, h, cc);
    // haz de luz
    if (this.beam > 0) {
      cx.globalAlpha = this.beam / 0.15 * 0.6;
      cx.fillStyle = C.pale;
      const tx = wx(this.bc) + WW / 2, ty = wy(this.br) + WH / 2, wide = G.has('linterna') ? 50 : 18;
      cx.beginPath(); cx.moveTo(163, 158); cx.lineTo(tx - wide, ty); cx.lineTo(tx + wide, ty); cx.fill();
      cx.globalAlpha = 1;
    }
    // macetas cayendo
    for (const p of this.potList) G.draw(cx, 'maceta', p.x - 3, p.y - 4);
    G.drawFeet(cx, 'nico0', 160, 176, false);
    G.rect(cx, 163, 160, 3, 2, '#111');
    this.parts.draw(cx);
    // miedo
    G.text(cx, 'MIEDO', 8, 168, C.lav, { shadow: true });
    for (let i = 0; i < 3; i++) G.text(cx, i < this.fear ? '●' : '○', 44 + i * 6, 168, i < this.fear ? C.pink : C.lav, { shadow: true });
  }
}
})();
