'use strict';
// LA MEIGA DE LA ENCRUCIJADA — repite el conjuro (memoria)
(function () {
const C = G.C;
const DEF = G.GAMES.meiga = {
  id: 'meiga', name: 'La meiga de la encrucijada', place: 'cruce', icon: 'mi_meiga', music: 'night',
  intro: 'Una meiga te cierra el paso: "Repite mi conxuro, rapaz". Memoriza el orden en que brillan las runas y repítelo.',
  controls: [['←↑↓→', 'tocar la runa'], ['TOCAR', 'también vale con el dedo']],
  items: ['reloj', 'casco'],
  cause: 'La meiga te convirtió en sapo. Croac.',
  create(D) { return new Meiga(D); }
};
G.defSprite('rune0', ['...777...', '..77.....', '.77......', '.77......', '.77......', '.77......', '..77.....', '...777...']);
G.defSprite('rune1', ['.........', '...777...', '.77...77.', '7..777..7', '7..7.7..7', '.77...77.', '...777...', '.........']);
G.defSprite('rune2', ['..7.7.7..', '..7.7.7.7', '..7.7.7.7', '7.7777777', '777777777', '.7777777.', '..77777..', '...777...']);
G.defSprite('rune3', ['....7....', '....7....', '...777...', '7777777777'.slice(0, 9), '..77777..', '.77...77.', '.7.....7.', '.........']);
const RUNES = [
  { dir: 'up', x: 226, y: 54, col: C.yellow, glow: '#ffec27', name: 'LUNA' },
  { dir: 'right', x: 270, y: 96, col: C.blue, glow: '#29adff', name: 'OJO' },
  { dir: 'down', x: 226, y: 138, col: C.green, glow: '#00e436', name: 'MANO' },
  { dir: 'left', x: 182, y: 96, col: C.pink, glow: '#ff77a8', name: 'ESTRELLA' }
];
const RS = 26;

function makeBg() {
  const [c, x] = G.makeCanvas(G.W, G.H);
  G.art.sky(x, G.W, G.H, '#0b0b1a', '#1a1030');
  G.art.stars(x, G.W, 90, 404);
  G.art.moon(x, 150, 30, 8);
  // bosque de fondo
  for (let i = 0; i < G.W; i += 7) { const h = 30 + Math.sin(i * 0.3) * 8 + (i * 13) % 11; G.rect(x, i, 140 - h, 8, h, '#0d1a14'); G.rect(x, i + 3, 140 - h - 4, 2, 4, '#0d1a14'); }
  G.rect(x, 140, 140, 0, 0, '#000');
  G.rect(x, 0, 140, G.W, 40, '#1a1a14');
  // caminos que se cruzan
  for (let j = 0; j < 40; j++) { G.rect(x, 0, 140 + j, G.W, 1, j % 2 ? '#2a261a' : '#2e2a1e'); }
  G.rect(x, 0, 152, G.W, 10, '#3a3426');
  // cruceiro de piedra
  G.rect(x, 140, 70, 6, 72, '#5a5a6a'); G.rect(x, 128, 84, 30, 6, '#5a5a6a');
  G.rect(x, 134, 140, 18, 6, '#4a4a5a'); G.rect(x, 141, 70, 2, 72, '#6a6a7a');
  return c;
}

class Meiga {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    this.rounds = 3 + (D > 0.75 ? 1 : 0);
    this.round = 0;
    this.seq = [];
    const L0 = 3 + Math.floor(Math.min(1, D) * 2);
    for (let i = 0; i < L0; i++) this.seq.push(G.irand(0, 3));
    this.step = G.lerp(0.58, 0.36, Math.min(1, D)) * (G.has('reloj') ? 1.3 : 1);
    this.state = 'intro'; this.st = 0; this.idx = 0; this.input = 0;
    this.light = [0, 0, 0, 0];
    this.bolt = 0; this.parts = new G.Particles();
    this.bg = makeBg();
    this.say = 'Repite mi conxuro, rapaz...';
    this.hud = { label: 'RONDA 1/' + this.rounds, prog: 0 };
  }
  press(i) {
    if (this.state !== 'input') return;
    this.light[i] = 0.25;
    if (this.seq[this.input] === i) {
      G.audio.sfx('rune', i);
      this.parts.burst(RUNES[i].x, RUNES[i].y, 8, [RUNES[i].col, C.white], 50, 0.4);
      this.input++;
      if (this.input >= this.seq.length) {
        this.round++;
        G.addScore(25 * this.seq.length);
        if (this.round >= this.rounds) { this.state = 'win'; this.st = 0; this.say = '¡Meu Deus! ¡Rompiches o feitizo!'; G.audio.sfx('laugh'); }
        else { this.state = 'pause'; this.st = 0; this.say = 'Non está mal... ¡Outra máis!'; }
      }
    } else {
      G.audio.sfx('zap');
      this.state = 'fail'; this.st = 0; this.bolt = 0.4;
      this.say = '¡Trabucáchesche! ¡Outra vez!';
      G.hurt(DEF.cause);
      this.parts.burst(120, 150, 16, [C.yellow, C.white, C.lav], 80, 0.5);
    }
  }
  update(dt) {
    this.t += dt; this.st += dt;
    for (let i = 0; i < 4; i++) this.light[i] = Math.max(0, this.light[i] - dt);
    if (this.bolt > 0) this.bolt -= dt;
    if (this.state === 'intro' && this.st > 1.0) { this.state = 'show'; this.st = 0; this.idx = 0; this.say = 'Mira ben...'; }
    else if (this.state === 'show') {
      const k = Math.floor(this.st / this.step);
      if (k !== this.idx && k <= this.seq.length) this.idx = k;
      if (this.idx < this.seq.length) {
        const local = this.st - this.idx * this.step;
        const r = this.seq[this.idx];
        if (local < this.step * 0.7) { if (this.light[r] <= 0.01) G.audio.sfx('rune', r); this.light[r] = 0.05 + (this.step * 0.7 - local) * 0; this.lit = r; }
      } else if (this.st > (this.seq.length + 0.3) * this.step) {
        this.state = 'input'; this.st = 0; this.input = 0; this.say = '¡Agora ti!';
      }
    } else if (this.state === 'input') {
      const map = { up: 0, right: 1, down: 2, left: 3 };
      for (const k in map) if (G.Input.hit(k)) this.press(map[k]);
      const tp = G.Input.tap;
      if (tp) RUNES.forEach((r, i) => { if (Math.abs(tp.x - r.x) < RS / 2 + 3 && Math.abs(tp.y - r.y) < RS / 2 + 3) this.press(i); });
    } else if (this.state === 'fail' && this.st > 1.3) { this.state = 'show'; this.st = 0; this.idx = 0; this.say = 'Mira ben... outra vez.'; }
    else if (this.state === 'pause' && this.st > 0.9) { this.seq.push(G.irand(0, 3)); this.state = 'show'; this.st = 0; this.idx = 0; this.say = 'Mira ben...'; }
    else if (this.state === 'win' && this.st > 1.4) this.done = true;
    this.parts.update(dt);
    this.hud.label = 'RONDA ' + Math.min(this.rounds, this.round + 1) + '/' + this.rounds;
    this.hud.prog = this.round / this.rounds;
  }
  draw(cx) {
    cx.drawImage(this.bg, 0, 0);
    const t = this.t;
    // caldero
    const mx = 62, my = 150;
    const fade = this.state === 'win' ? Math.max(0, 1 - this.st / 1.2) : 1;
    cx.globalAlpha = fade;
    G.drawScaled(cx, this.bolt > 0 ? 'meigaZap' : 'meiga', mx - 14, my - 62 + Math.sin(t * 2) * 1, 2);
    cx.globalAlpha = 1;
    G.ellipse(cx, mx, my - 4, 18, 4, '#111');
    G.ellipse(cx, mx, my - 10, 18, 10, '#1a1a1a');
    G.ellipse(cx, mx, my - 18, 16, 3, '#2a2a2a');
    G.ellipse(cx, mx, my - 18, 14, 2, '#3ae070');
    for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; G.circ(cx, mx - 8 + i * 8, my - 20 - k * 22, Math.round(2 - k * 2) + 1, '#2a8a4a'); }
    G.rect(cx, mx - 14, my - 2, 4, 3, C.orange); G.rect(cx, mx + 6, my - 2, 4, 3, C.orange);
    // bocadillo de texto
    if (this.say) {
      const lines = G.wrap(this.say, 100);
      const h = lines.length * 9 + 6;
      G.art.panel(cx, 10, 16, 108, h, '#fff1e8', '#000');
      lines.forEach((l, i) => G.text(cx, l, 14, 20 + i * 9, C.ink));
    }
    // runas
    RUNES.forEach((r, i) => {
      const on = this.light[i] > 0 || (this.state === 'show' && this.lit === i && this.idx < this.seq.length && (this.st - this.idx * this.step) < this.step * 0.7);
      const x = r.x - RS / 2, y = r.y - RS / 2;
      if (on) { cx.globalAlpha = 0.35; G.circ(cx, r.x, r.y, 20, r.glow); cx.globalAlpha = 1; }
      G.rect(cx, x + 1, y + 2, RS, RS, '#000');
      G.rect(cx, x, y, RS, RS, on ? r.col : '#3a3a4a');
      G.rect(cx, x + 2, y + 2, RS - 4, RS - 4, on ? C.white : '#2a2a3a');
      G.drawScaled(cx, 'rune' + i, r.x - 9, r.y - 8, 2, false, on ? r.col : '#5a5a6a');
      const dirArrow = { up: '↑', right: '→', down: '↓', left: '←' }[r.dir];
      G.text(cx, dirArrow, r.x + (r.dir === 'left' ? -22 : r.dir === 'right' ? 18 : -2), r.y + (r.dir === 'up' ? -24 : r.dir === 'down' ? 17 : -3), on ? r.col : '#6a6a7a');
    });
    // progreso de la secuencia
    if (this.state === 'input') {
      for (let i = 0; i < this.seq.length; i++) G.rect(cx, 226 - this.seq.length * 4 + i * 8, 168, 6, 4, i < this.input ? RUNES[this.seq[i]].col : '#3a3a4a');
    }
    // Nico
    const nx = 132, ny = 172;
    G.drawFeet(cx, this.bolt > 0 ? 'nicoHurt' : 'nico0', nx, ny, true);
    if (this.bolt > 0) {
      let px = mx + 10, py = 96;
      for (let i = 1; i <= 8; i++) {
        const qx = G.lerp(mx + 10, nx, i / 8) + (i < 8 ? G.rand(-8, 8) : 0), qy = G.lerp(96, ny - 8, i / 8) + (i < 8 ? G.rand(-6, 6) : 0);
        G.line(cx, px, py, qx, qy, C.yellow); G.line(cx, px + 1, py, qx + 1, qy, C.white);
        px = qx; py = qy;
      }
    }
    this.parts.draw(cx);
    if (this.state === 'show' || this.state === 'intro') G.text(cx, 'MIRA...', 226, 170, C.lav, { align: 'center', shadow: true });
  }
}
})();
