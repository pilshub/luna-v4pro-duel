'use strict';
// =====================================================================
//  LA PARTIDA (pantalla vertical 9:16): la calle sube sola y el chico
//  esquiva lo que viene. 6 tramos al azar + El Coco en el portal.
// =====================================================================
(function () {
const C = G.C, W = G.W, H = G.H, art = G.art;
const LEFT = G.LEFT, RIGHT = G.RIGHT;
const STAGES = 6, DUR = 20, INTRO = 2.4, CLEAR = 1.8;
G.STAGES = STAGES;

G.newRun = () => {
  G.run = { hp: 3, maxHp: 5, score: 0, coins: 0, stage: 0, hits: 0, won: false, cause: '' };
  G.save.data.runs = (G.save.data.runs || 0) + 1;
  G.save.write();
};
G.addScore = n => { if (G.run) G.run.score += n; };

// texto grande centrado con contorno; si no cabe, más pequeño
G.bigText = (cx, str, y, color = C.yellow, scale = 2) => {
  while (scale > 1 && G.textW(str, scale) > W - 8) scale--;
  G.text(cx, str, W / 2, y, color, { align: 'center', scale, shadow: true, outline: true });
};

// ------------------------------------------------------------ la calle vista desde arriba, por trozos
// x: 0-26 edificios · 26-40 acera · 40-140 calzada · 140-154 acera · 154-180 edificios
const AWN = [['#ff004d', '#fff1e8'], ['#008751', '#fff1e8'], ['#29adff', '#1d2b53'], ['#ffa300', '#7e2553'], ['#7e2553', '#ff77a8']];
function roofs(x, x0, w, y0, h, r) {
  const flat = r() < 0.35;
  if (flat) {
    G.rect(x, x0, y0, w, h, '#4a4a5a');
    for (let j = y0; j < y0 + h; j += 4) G.rect(x, x0, j, w, 1, '#42424f');
    if (h > 30 && r() < 0.7) { const cy = y0 + 8 + r() * (h - 20); G.circ(x, x0 + w / 2, cy, 5, '#6a6a7a'); G.circ(x, x0 + w / 2, cy, 3, '#8a8a9a'); }
    if (r() < 0.5) { const ly = y0 + 4 + r() * (h - 12); G.rect(x, x0 + 2, ly, w - 4, 1, '#888'); for (let i = 0; i < 3; i++) G.rect(x, x0 + 3 + i * 7, ly + 1, 4, 5, G.pick(['#ff77a8', '#29adff', '#fff1e8', '#ffec27'])); }
  } else {
    art.roofTop(x, x0, y0, w, h);
    if (r() < 0.6) { const cy = y0 + 4 + r() * (h - 12); G.rect(x, x0 + 6 + r() * (w - 16), cy, 6, 6, '#5a2a1a'); }
    if (r() < 0.3) { const cy = y0 + 4 + r() * (h - 12); G.rect(x, x0 + 4 + r() * (w - 14), cy, 8, 5, '#2a4a6a'); }
  }
  G.rect(x, x0, y0, w, 1, '#1a0e0a');
}
function makeSeg(h, seed, kind) {
  if (kind === 'portal') return makePortal(h);
  const r = G.srand(seed);
  const [c, x] = G.makeCanvas(W, h);
  art.asphalt(x, 40, 0, 100, h, seed);
  for (let j = 4; j < h; j += 20) G.rect(x, 89, j, 2, 10, '#c8c8c8');
  const cross = r() < 0.18;
  // calle lateral (cruce)
  const sideL = !cross && r() < 0.15, sideR = !cross && r() < 0.15;
  art.tiles(x, 26, 0, 14, h); art.tiles(x, 140, 0, 14, h);
  G.rect(x, 40, 0, 2, h, '#8a8a9a'); G.rect(x, 138, 0, 2, h, '#8a8a9a');
  if (sideL) { art.asphalt(x, 0, h / 2 - 16, 42, 32, seed + 1); for (let j = 0; j < 4; j++) G.rect(x, 28, h / 2 - 14 + j * 8, 10, 4, '#9a9aa8'); }
  else roofs(x, 0, 26, 0, h, r);
  if (sideR) { art.asphalt(x, 138, h / 2 - 16, 42, 32, seed + 2); for (let j = 0; j < 4; j++) G.rect(x, 142, h / 2 - 14 + j * 8, 10, 4, '#9a9aa8'); }
  else roofs(x, 154, 26, 0, h, r);
  if (sideL) roofs(x, 0, 26, 0, h / 2 - 16, r), roofs(x, 0, 26, h / 2 + 16, h / 2 - 16, r);
  if (sideR) roofs(x, 154, 26, 0, h / 2 - 16, r), roofs(x, 154, 26, h / 2 + 16, h / 2 - 16, r);
  G.rect(x, 25, 0, 1, h, '#140c0a'); G.rect(x, 154, 0, 1, h, '#140c0a');
  // paso de cebra
  if (cross) { const zy = Math.round(h / 2 - 10); for (let i = 44; i < 136; i += 8) G.rect(x, i, zy, 4, 20, '#9a9aa8'); }
  // toldos de tiendas y neón de farmacia
  for (const side of [0, 1]) {
    if (r() < 0.55) {
      const [a, b] = AWN[r() * AWN.length | 0], ay = Math.round(4 + r() * (h - 34)), ax = side ? 150 : 26;
      for (let j = 0; j < 24; j += 4) G.rect(x, ax, ay + j, 4, 2, a), G.rect(x, ax, ay + j + 2, 4, 2, b);
      if (r() < 0.25) { const nx = side ? 146 : 31; G.rect(x, nx + 1, ay - 7, 1, 5, C.green); G.rect(x, nx - 1, ay - 5, 5, 1, C.green); }
    }
  }
  // farolas con su charco de luz
  for (const side of [0, 1]) {
    if (r() < 0.6) {
      const lx = side ? 146 : 34, ly = Math.round(8 + r() * (h - 16));
      x.globalAlpha = 0.09; G.circ(x, lx, ly, 13, '#ffd27a'); x.globalAlpha = 0.06; G.circ(x, lx, ly, 19, '#ffd27a'); x.globalAlpha = 1;
      G.rect(x, lx - 1, ly - 1, 3, 3, '#1a1a24'); G.rect(x, lx, ly, 1, 1, C.yellow);
    }
  }
  if (r() < 0.4) art.tree(x, r() < 0.5 ? 33 : 147, Math.round(10 + r() * (h - 20)), 6);
  if (r() < 0.3) { const by = 6 + r() * (h - 24); G.rect(x, 43, by, 9, 14, G.pick(['#2c6a3a', '#a08a20', '#1d4a8a'])); G.rect(x, 43, by, 9, 2, '#111'); }
  if (r() < 0.3) { const mx = 50 + r() * 80, my = 6 + r() * (h - 12); G.circ(x, mx, my, 4, '#1c1c2a'); G.ring(x, mx, my, 4, '#4a4a5a'); }
  return c;
}
// tu portal: fachada de frente cerrando la calle
function makePortal(h) {
  const [c, x] = G.makeCanvas(W, h);
  art.asphalt(x, 40, 0, 100, h, 9);
  art.tiles(x, 26, 0, 14, h); art.tiles(x, 140, 0, 14, h);
  roofs(x, 0, 26, 0, h, G.srand(3)); roofs(x, 154, 26, 0, h, G.srand(4));
  G.rect(x, 40, 70, 2, h - 70, '#8a8a9a'); G.rect(x, 138, 70, 2, h - 70, '#8a8a9a');
  // fachada
  G.rect(x, 0, 0, W, 60, '#5a4a40');
  for (let i = 0; i < 400; i++) G.rect(x, Math.random() * W, Math.random() * 60, 1, 1, '#00000030');
  G.rect(x, 0, 0, W, 3, '#2a2240');
  for (const wx of [14, 44, 124, 154]) {
    G.rect(x, wx - 1, 8, 14, 16, '#1a1428'); G.rect(x, wx, 9, 12, 14, '#ffd27a'); G.rect(x, wx, 9, 12, 5, '#8a6a30');
    G.rect(x, wx - 3, 24, 18, 2, '#111'); for (let b = 0; b < 18; b += 3) G.rect(x, wx - 3 + b, 20, 1, 4, '#111');
  }
  G.rect(x, 74, 26, 32, 34, '#2a1a10');
  G.rect(x, 76, 28, 28, 32, '#ffd27a');
  G.rect(x, 89, 28, 2, 32, '#c89a4a');
  G.rect(x, 82, 14, 16, 9, '#1d2b53');
  G.text(x, 'Nº7', 90, 15, C.white, { align: 'center' });
  art.tiles(x, 0, 60, W, 10);
  G.rect(x, 0, 60, W, 1, '#1a1428');
  return c;
}
G.makeSeg = makeSeg;

class Street {
  constructor() { this.segs = []; this.end = 0; this.seed = G.irand(1, 1e6); this.stop = false; }
  add(kind) {
    const h = kind === 'portal' ? 150 : G.irand(70, 120);
    const s = { d: this.end, h, c: makeSeg(h, this.seed++, kind), kind };
    this.segs.push(s);
    this.end += h;
    return s;
  }
  ensure(cam) {
    while (!this.stop && this.end < cam + H + 60) this.add();
    this.segs = this.segs.filter(s => s.d + s.h > cam - 4);
  }
  // distancia D de la calle -> y en pantalla
  draw(cx, cam) { for (const s of this.segs) cx.drawImage(s.c, 0, Math.round(H - (s.d + s.h - cam))); }
}
G.Street = Street;

// ------------------------------------------------------------ el chico
class Chico {
  constructor() {
    this.x = 90; this.y = 262; this.face = 1; this.t = 0; this.inv = 1.2;
    this.dash = 0; this.dashCd = 0; this.dx = 0; this.dy = -1; this.speed = 90; this.moving = false; this.ax = 0;
    this.minY = 70;
  }
  update(dt, walking) {
    const a = G.Input.axis();
    const m = Math.hypot(a.x, a.y);
    if (m > 0.1) { this.dx = a.x / m; this.dy = a.y / m; }
    if (G.Input.hit('a') && this.dashCd <= 0) {
      this.dash = 0.18; this.dashCd = 0.9;
      if (m <= 0.1) { this.dx = 0; this.dy = -1; }
      G.audio.sfx('dash');
    }
    let vx = a.x * this.speed, vy = a.y * this.speed;
    if (this.dash > 0) { vx = this.dx * this.speed * 2.8; vy = this.dy * this.speed * 2.8; this.dash -= dt; }
    this.x = G.clamp(this.x + vx * dt, LEFT, RIGHT);
    this.y = G.clamp(this.y + vy * dt, this.minY, H - 10);
    this.ax = a.x;
    if (a.x > 0.15) this.face = 1; else if (a.x < -0.15) this.face = -1;
    this.moving = m > 0.1 || walking;
    this.t += dt * (m > 0.1 ? 1.2 : 1);
    if (this.inv > 0) this.inv -= dt;
    if (this.dashCd > 0) this.dashCd -= dt;
  }
  safe() { return this.inv > 0 || this.dash > 0; }
  draw(cx) {
    G.ellipse(cx, this.x, this.y, 4, 1, '#00000080');
    if (this.inv > 0 && Math.floor(this.inv * 16) % 2) return;
    const step = Math.floor(this.t * 9) % 2;
    let f;
    if (Math.abs(this.ax) > 0.6) f = step ? 'chico1' : 'chico2';
    else f = this.moving ? (step ? 'chicoBack1' : 'chicoBack2') : 'chicoBack0';
    if (this.dash > 0) { cx.globalAlpha = 0.4; G.drawFeet(cx, f, this.x - this.dx * 7, this.y + 1 - this.dy * 7, this.face < 0, C.blue); cx.globalAlpha = 1; }
    G.drawFeet(cx, f, this.x, this.y + 1, this.face < 0);
  }
}
G.Chico = Chico;

// ------------------------------------------------------------ El Coco (jefe final)
const HZ = () => G.HZ;
class Coco {
  constructor() { this.x = 90; this.y = -40; this.hp = this.max = 8; this.t = 0; this.flash = 0; this.atk = 2.2; this.state = 'enter'; this.st = 0; }
  get phase() { return this.hp > 5 ? 1 : this.hp > 2 ? 2 : 3; }
  update(dt, S) {
    this.t += dt; this.st += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.state === 'enter') { this.y = G.lerp(-40, 124, Math.min(1, this.st / 1.6)); if (this.st > 1.8) { this.state = 'fight'; this.st = 0; } return; }
    if (this.state === 'dying') { if (Math.random() < 0.5) S.parts.burst(this.x + G.rand(-20, 20), this.y - 24 + G.rand(-20, 20), 4, [C.navy, C.plum, C.yellow, C.black], 60, 0.6); return; }
    const ph = this.phase;
    this.x = 90 + Math.sin(this.t * (0.6 + ph * 0.2)) * 46;
    this.y = 124 + Math.sin(this.t * 1.3) * 6;
    this.atk -= dt;
    if (this.atk <= 0) this.attack(S);
  }
  shoot(S, a, sp) { S.add(HZ().bullet(this.x, this.y - 12, Math.cos(a) * 75 * sp, Math.sin(a) * 75 * sp)); }
  aim(S) { return Math.atan2(S.p.y - 5 - (this.y - 12), S.p.x - this.x); }
  attack(S) {
    const ph = this.phase, sp = 1 + (ph - 1) * 0.12;
    const list = ph === 1 ? ['aim', 'fan', 'fan', 'rain'] : ph === 2 ? ['fan', 'ring', 'aim3', 'rain', 'minions'] : ['ring', 'aim3', 'fan', 'rain', 'minions', 'spiral'];
    const a = G.pick(list), aim = this.aim(S);
    if (a === 'aim') this.shoot(S, aim, sp * 1.2);
    if (a === 'aim3') for (let i = 0; i < 3; i++) S.later(i * 0.2, () => this.shoot(S, this.aim(S), sp * 1.25));
    if (a === 'fan') for (let i = -2; i <= 2; i++) this.shoot(S, aim + i * 0.26, sp);
    if (a === 'ring') { const o = Math.random(); for (let i = 0; i < 12; i++) this.shoot(S, o + i / 12 * Math.PI * 2, sp * 0.9); }
    if (a === 'spiral') for (let i = 0; i < 16; i++) S.later(i * 0.09, () => this.shoot(S, Math.PI / 2 + Math.sin(i * 0.5) * 1.2, sp));
    if (a === 'rain') for (let i = 0; i < 4 + ph * 2; i++) S.add(HZ().strike(G.randX(), G.rand(170, H - 12), { kind: 'shadow', warn: 1.0 + i * 0.08, r: 10, ground: false }));
    if (a === 'minions' && S.hz.filter(h => h.type === 'sombra').length < 3) for (let i = 0; i < Math.min(2, ph); i++) S.add(HZ().sombra(this.x + G.rand(-14, 14), this.y + 10));
    G.audio.sfx('throw');
    this.atk = G.lerp(1.8, 1.0, (ph - 1) / 2) * G.rand(0.85, 1.15);
  }
  hitBy(S) {
    this.hp--; this.flash = 0.15;
    G.addScore(100);
    G.audio.sfx('hit'); G.shake(2, 0.12);
    S.parts.text(this.x, this.y - 54, G.pick(['¡AY!', '¡AUCH!', '¡LA CHANCLA NO!', '¡MAMÁÁÁ!']), C.white);
    if (this.hp <= 0) { this.state = 'dying'; this.st = 0; G.audio.sfx('roar'); G.shake(6, 1.2); }
  }
  draw(cx, S) {
    if (this.state === 'dying') {
      const k = Math.min(1, this.st / 2.2), s = 2 * (1 - k) + 0.01;
      if (k < 1) {
        const img = G.spr(Math.floor(S.t * 20) % 2 ? 'cocoHurt' : 'coco');
        cx.drawImage(img, Math.round(this.x - 12 * s), Math.round(this.y - 24 * s), Math.round(24 * s), Math.round(24 * s));
      } else {
        G.drawFeet(cx, 'gatito', this.x, this.y);
        if (this.st > 2.5) G.text(cx, '¿MIAU?', this.x, this.y - 18, C.white, { align: 'center', shadow: true });
      }
      return;
    }
    cx.globalAlpha = 0.35; G.ellipse(cx, this.x, this.y + 4, 18, 3, '#000'); cx.globalAlpha = 1;
    G.drawScaled(cx, this.flash > 0 ? 'cocoHurt' : 'coco', this.x - 24, this.y - 48, 2, false, this.flash > 0 && Math.floor(S.t * 30) % 2 ? C.white : null);
    if (Math.random() < 0.3) S.parts.add({ x: this.x + G.rand(-22, 22), y: this.y - 4, vy: G.rand(5, 20), life: 0.6, c: G.pick([C.navy, '#111d35']), s: 2 });
  }
}

// ------------------------------------------------------------ escena de juego
class GameScene {
  enter() {
    document.body.classList.add('playing');
    this.t = 0; this.cam = 0; this.v = 0; this.k = 0;
    this.street = new Street();
    this.street.ensure(0);
    this.p = new Chico();
    this.hz = []; this.items = []; this.shots = []; this.queue = [];
    this.parts = new G.Particles();
    [this.fog, this.fogCtx] = G.makeCanvas(W, H);
    this.order = G.shuffle(G.THEMES.slice()).slice(0, STAGES);
    const dbg = (G.debugThemes || []).map(id => G.THEMES.find(t => t.id === id)).filter(Boolean);
    if (dbg.length) this.order = dbg.concat(this.order.filter(t => !dbg.includes(t))).slice(0, STAGES);
    this.coinT = 1.5;
    this.paused = false;
    this.pmenu = new G.Menu([
      { label: 'CONTINUAR', fn: () => { this.paused = false; } },
      { label: 'SONIDO', fn: () => G.audio.toggleMute(), sfx: 'move' },
      { label: 'SALIR', fn: () => G.go(new G.TitleScene()) }
    ], { x: 90, y: 150, w: 100, lh: 14, align: 'center' });
    G.audio.play('tense');
    this.startStage(0);
    if ((G.debugThemes || []).includes('coco')) { this.stage = STAGES - 1; this.phase = 'clear'; this.pt = CLEAR; }
  }
  exit() { document.body.classList.remove('playing'); }
  add(h) { this.hz.push(h); return h; }
  later(dt, fn) { this.queue.push({ at: this.t + dt, fn }); }
  startStage(i) {
    this.stage = i;
    this.def = this.order[i];
    this.st = {};
    this.phase = 'intro'; this.pt = 0; this.stageHits = 0;
    this.heartAt = G.run.hp < G.run.maxHp && G.chance(0.7) ? G.rand(4, DUR - 4) : -1;
    G.run.stage = i + 1;
  }
  hurt() {
    if (this.p.safe() || this.phase === 'dead' || this.phase === 'win') return;
    const r = G.run;
    r.hp--; r.hits++; this.stageHits++;
    this.p.inv = 1.4;
    G.audio.sfx('hurt'); G.flash(C.red, 0.22); G.shake(4, 0.3);
    this.parts.burst(this.p.x, this.p.y - 6, 12, [C.red, C.white], 60, 0.4);
    if (r.hp <= 0) {
      r.cause = this.phase === 'boss' || this.phase === 'approach' ? 'El Coco te metió en su saco.' : this.def.cause;
      this.phase = 'dead'; this.pt = 0;
      G.audio.play(null); G.audio.sfx('lose');
    }
  }
  spawnCoins() {
    const pat = G.irand(0, 2), x0 = G.rand(LEFT + 10, RIGHT - 10);
    for (let i = 0; i < 5; i++) {
      let x = x0, y = -10 - i * 13;
      if (pat === 1) x = G.clamp(x0 + Math.sin(i / 4 * Math.PI) * 18, LEFT, RIGHT);
      if (pat === 2) { x = LEFT + 10 + i * ((RIGHT - LEFT - 20) / 4); y = -10 - (i % 2) * 6; }
      this.items.push({ kind: 'coin', x, y, t: Math.random() * 3 });
    }
  }
  update(dt) {
    if (G.Input.hit('pause') && this.phase !== 'dead') { this.paused = !this.paused; G.audio.sfx('back'); return; }
    if (this.paused) { this.pmenu.items[1].right = G.audio.muted ? 'NO' : 'SÍ'; this.pmenu.update(); return; }
    if (this.phase === 'dead') {
      this.pt += dt;
      this.parts.update(dt * 0.4);
      if (this.pt > 1.8) G.go(new G.GameOverScene());
      return;
    }
    this.t += dt; this.pt += dt;
    const r = G.run;
    // avance de la calle
    let vt = 36 + this.stage * 7;
    if (this.phase === 'approach') {
      const target = this.portal.d + this.portal.h - H + 12;
      vt = G.clamp((target - this.cam) * 0.9, 0, 80);
      if (target - this.cam < 0.5) {
        this.cam = target; this.v = 0; this.phase = 'boss'; this.pt = 0;
        this.coco = new Coco(); this.p.minY = 160; this.chT = 2.5;
        G.audio.play('boss'); G.audio.sfx('roar');
      }
    }
    if (this.phase === 'boss' || this.phase === 'win') vt = 0;
    this.v = this.phase === 'approach' ? vt : G.approach(this.v, vt, 30 * dt);
    this.cam += this.v * dt;
    G.addScore(this.v * dt / 10);
    this.street.ensure(this.cam);
    this.p.update(dt, this.v > 5);

    // fases de cada tramo
    this.k = G.clamp(this.stage / (STAGES - 1), 0, 1) * 0.8 + G.clamp(this.pt / DUR, 0, 1) * 0.2;
    if (this.phase === 'intro') {
      if (this.pt >= INTRO) { this.phase = 'play'; this.pt = 0; if (this.def.start) this.def.start(this, this.st); }
    } else if (this.phase === 'play') {
      this.def.update(dt, this, this.st, this.k);
      if (this.heartAt > 0 && this.pt >= this.heartAt) { this.heartAt = -1; this.items.push({ kind: 'heart', x: G.randX(), y: -10, t: 0 }); }
      if (this.pt >= DUR) {
        this.phase = 'clear'; this.pt = 0;
        G.addScore(300 + (this.stageHits ? 0 : 200));
        this.clearText = this.stageHits ? '+300' : '+300 · SIN GOLPES +200';
        G.audio.sfx('win');
      }
    } else if (this.phase === 'clear') {
      if (this.pt >= CLEAR) {
        if (this.stage + 1 < STAGES) this.startStage(this.stage + 1);
        else {
          this.phase = 'approach'; this.pt = 0;
          this.street.ensure(this.cam);
          this.portal = this.street.add('portal');
          this.street.stop = true;
        }
      }
    } else if (this.phase === 'boss') {
      this.coco.update(dt, this);
      if (this.coco.state === 'fight' && G.dist(this.p.x, this.p.y - 5, this.coco.x, this.coco.y - 22) < 20) this.hurt();
      this.chT -= dt;
      if (this.chT <= 0 && this.coco.state === 'fight') {
        this.chT = 2.0;
        if (this.items.filter(i => i.kind === 'chancla').length < 2) this.items.push({ kind: 'chancla', x: G.randX(), y: G.rand(180, H - 20), t: 0, ground: false });
      }
      if (this.coco.state === 'dying' && this.coco.st > 3) { this.phase = 'win'; this.pt = 0; G.addScore(3000); G.audio.sfx('win'); }
    } else if (this.phase === 'win') {
      if (this.pt > 1.5) { r.won = true; G.go(new G.EndScene()); return; }
    }
    // monedas
    if (this.phase === 'play' || this.phase === 'intro') {
      this.coinT -= dt;
      if (this.coinT <= 0) { this.coinT = G.rand(2.4, 4); this.spawnCoins(); }
    }
    for (const q of this.queue) if (this.t >= q.at && !q.done) { q.done = true; q.fn(); }
    this.queue = this.queue.filter(q => !q.done);

    // peligros
    const px = this.p.x, py = this.p.y - 5;
    for (const h of this.hz) {
      if (h.ground) h.y += this.v * dt;
      h.update(dt, this);
      if (!h.dead && h.hit(px, py)) this.hurt();
      if (h.x < -90 || h.x > W + 90 || h.y < -120 || h.y > H + 40) h.dead = true;
    }
    this.hz = this.hz.filter(h => !h.dead);
    // objetos que se recogen
    for (const it of this.items) {
      it.t += dt;
      if (it.ground !== false) it.y += this.v * dt;
      if (G.dist(it.x, it.y - 3, px, py) < 10) {
        it.got = true;
        if (it.kind === 'coin') { r.coins++; G.addScore(25); G.audio.sfx('coin'); this.parts.text(it.x, it.y - 12, '+25', C.yellow); }
        if (it.kind === 'heart') { r.hp = Math.min(r.maxHp, r.hp + 1); G.audio.sfx('heal'); this.parts.text(it.x, it.y - 12, '+1 ♥', C.red); }
        if (it.kind === 'chancla' && this.coco) {
          const a = Math.atan2(this.coco.y - 24 - py, this.coco.x - px);
          this.shots.push({ x: px, y: py, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, t: 0 });
          G.audio.sfx('throw');
        }
      }
    }
    this.items = this.items.filter(it => !it.got && it.y < H + 20);
    for (const s of this.shots) {
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (this.coco && this.coco.state === 'fight' && G.dist(s.x, s.y, this.coco.x, this.coco.y - 24) < 20) {
        s.dead = true; this.coco.hitBy(this);
        this.parts.burst(s.x, s.y, 12, [C.yellow, C.white, C.blue], 70, 0.4);
        if (this.coco.state === 'dying') this.hz = [];
      }
      for (const h of this.hz) if (h.type === 'sombra' && G.dist(h.x, h.y - 4, s.x, s.y) < 8) { h.dead = true; this.parts.burst(h.x, h.y, 10, [C.navy, C.lav], 50, 0.4); }
    }
    this.shots = this.shots.filter(s => !s.dead && s.x > -10 && s.x < W + 10 && s.y > -10 && s.y < H);
    this.parts.update(dt);
  }
  draw(cx) {
    const t = this.t;
    this.street.draw(cx, this.cam);
    if (this.def.draw && this.phase === 'play') this.def.draw(cx, this);
    for (const h of this.hz) if (h.under) h.draw(cx, this);
    for (const it of this.items) {
      const bob = Math.sin(it.t * 4) * 1.5;
      G.ellipse(cx, it.x, it.y, 3, 1, '#00000060');
      if (it.kind === 'coin') {
        const w = [6, 4, 2, 4][Math.floor(it.t * 8) % 4];
        cx.drawImage(G.spr('coin'), 0, 0, 6, 6, Math.round(it.x - w / 2), Math.round(it.y - 9 + bob), w, 6);
      } else if (it.kind === 'heart') { G.draw(cx, 'it_bocadillo', it.x - 5, it.y - 10 + bob); if (Math.floor(t * 4) % 2) G.ring(cx, it.x, it.y - 6, 8, C.red); }
      else { G.draw(cx, 'chanclaP', it.x - 3, it.y - 7 + bob); if (Math.floor(t * 4) % 2) G.ring(cx, it.x, it.y - 5, 8, C.white); }
    }
    const list = this.hz.filter(h => !h.under).concat([{ y: this.p.y, me: true }]);
    if (this.coco) list.push({ y: this.coco.y, boss: true });
    list.sort((a, b) => a.y - b.y);
    for (const h of list) {
      if (h.me) this.p.draw(cx);
      else if (h.boss) this.coco.draw(cx, this);
      else h.draw(cx, this);
    }
    for (const s of this.shots) G.draw(cx, 'chanclaP', s.x - 3, s.y - 2, Math.floor(s.t * 20) % 2 === 0);
    this.parts.draw(cx);
    if (this.def.over && this.phase !== 'clear' && this.phase !== 'approach' && this.phase !== 'boss' && this.phase !== 'win') this.def.over(cx, this, this.st);
    if (this.p.dashCd > 0) G.rect(cx, this.p.x - 5, this.p.y + 3, 10 * (1 - this.p.dashCd / 0.9), 1, C.blue);
    this.drawHud(cx);
    if (this.paused) {
      cx.globalAlpha = 0.7; G.rect(cx, 0, 0, W, H, '#000'); cx.globalAlpha = 1;
      art.panel(cx, 30, 124, 120, 76, '#111d35', '#83769c');
      G.text(cx, 'PAUSA', 90, 132, C.yellow, { align: 'center', shadow: true });
      this.pmenu.draw(cx);
    }
  }
  drawHud(cx) {
    const r = G.run;
    G.rect(cx, 0, 0, W, 12, '#000000d0');
    for (let i = 0; i < r.maxHp; i++) if (i < r.hp || i < 3) G.draw(cx, i < r.hp ? 'heart' : 'heartE', 3 + i * 8, 3);
    G.text(cx, String(Math.floor(r.score)), W - 3, 3, C.yellow, { align: 'right' });
    const boss = this.phase === 'boss' || this.phase === 'win' || this.phase === 'approach';
    G.text(cx, boss ? 'CASA' : (this.stage + 1) + '/' + STAGES, 98, 3, C.white, { align: 'center' });
    const prog = boss ? 1 : (this.stage + (this.phase === 'intro' ? 0 : this.phase === 'clear' ? 1 : this.pt / DUR)) / STAGES;
    G.rect(cx, 0, 12, W, 1, '#2a2a4a'); G.rect(cx, 0, 12, W * prog, 1, C.green);
    if (this.phase === 'intro') {
      const a = Math.min(1, this.pt * 3, (INTRO - this.pt) * 3);
      cx.globalAlpha = a * 0.75; G.rect(cx, 0, 104, W, 78, '#000'); cx.globalAlpha = 1;
      if (a > 0.3) {
        G.text(cx, 'TRAMO ' + (this.stage + 1) + ' DE ' + STAGES, 90, 110, C.lav, { align: 'center', shadow: true });
        G.drawScaled(cx, this.def.icon, 81, 122, 2);
        G.bigText(cx, this.def.name, 144, C.yellow, 2);
        G.textBox(cx, this.def.sub, 10, 164, W - 20, C.white, { align: 'center', shadow: true });
      }
    }
    if (this.phase === 'clear') {
      G.bigText(cx, '¡SUPERADO!', 130, C.green, 2);
      G.text(cx, this.clearText, 90, 150, C.yellow, { align: 'center', shadow: true });
    }
    if (this.phase === 'approach') G.bigText(cx, 'CASI EN CASA', 140, C.yellow, 2);
    if (this.coco) {
      G.rect(cx, 30, 16, 120, 6, '#000');
      G.rect(cx, 31, 17, 118 * Math.max(0, this.coco.hp) / this.coco.max, 4, this.coco.phase === 3 ? C.red : this.coco.phase === 2 ? C.orange : C.plum);
      if (this.phase === 'boss' && this.coco.state !== 'dying' && this.pt < 5) G.textBox(cx, 'COGE LAS CHANCLAS DEL SUELO: ¡SE LANZAN SOLAS!', 10, 290, W - 20, C.yellow, { align: 'center', shadow: true });
      if (this.phase === 'boss' && this.pt < 1.8) G.bigText(cx, '¡EL COCO!', 200, C.red, 3);
    }
    if (this.phase === 'dead') {
      cx.globalAlpha = Math.min(0.6, this.pt * 0.6); G.rect(cx, 0, 0, W, H, C.dred); cx.globalAlpha = 1;
      G.bigText(cx, '¡AY!', 140, C.white, 4);
    }
    if (this.phase === 'win') G.bigText(cx, '¡LO CONSEGUISTE!', 200, C.green, 2);
    if (this.t < 3 && this.stage === 0 && !this.coco) G.textBox(cx, G.Input.lastDevice === 'touch' ? 'JOYSTICK PARA MOVERTE · A PARA ESQUIVAR' : 'FLECHAS PARA MOVERTE · ESPACIO PARA ESQUIVAR', 10, 292, W - 20, C.white, { align: 'center', shadow: true });
  }
}
G.GameScene = GameScene;
})();
