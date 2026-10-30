'use strict';
// =====================================================================
//  LA PARTIDA: la calle avanza sola y el chico esquiva lo que sale.
//  6 tramos al azar + El Coco en el portal de casa.
// =====================================================================
(function () {
const C = G.C, W = G.W, H = G.H, art = G.art;
const TOPY = G.TOPY, BOTY = G.BOTY;
const STAGES = 6, DUR = 20, INTRO = 2.4, CLEAR = 1.8;
G.STAGES = STAGES;

// texto grande centrado con contorno
G.bigText = (cx, str, y, color = C.yellow, scale = 2) => {
  G.text(cx, str, W / 2, y, color, { align: 'center', scale, shadow: true, outline: true });
};

G.newRun = () => {
  G.run = { hp: 3, maxHp: 5, score: 0, coins: 0, stage: 0, minutes: 40, hits: 0, won: false, cause: '' };
  G.save.data.runs = (G.save.data.runs || 0) + 1;
  G.save.write();
};
G.addScore = n => { if (G.run) G.run.score += n; };
G.clock = () => {
  const m = G.run ? G.run.minutes : 0;
  return G.pad2(Math.floor(m / 60) % 24) + ':' + G.pad2(m % 60);
};

// ------------------------------------------------------------ la calle (se genera por trozos)
const WALLS = ['#3b3355', '#45374f', '#3a4250', '#4a3c3c', '#3d3a4f', '#4b4048'];
function makeSeg(w, seed, kind) {
  const r = G.srand(seed);
  const [c, x] = G.makeCanvas(w, H);
  // fachada
  const wall = WALLS[r() * WALLS.length | 0];
  G.rect(x, 0, 12, w, 38, wall);
  for (let i = 0; i < w * 3; i++) G.rect(x, r() * w, 12 + r() * 38, 1, 1, '#00000030');
  G.rect(x, 0, 12, w, 2, '#2a2240'); G.rect(x, 0, 14, w, 1, '#5a5070');
  const cols = Math.max(1, Math.floor(w / 22)), gap = (w - cols * 8) / (cols + 1);
  for (let i = 0; i < cols; i++) {
    const wx = Math.round(gap + i * (8 + gap)), lit = r() < 0.3;
    G.rect(x, wx - 1, 16, 10, 12, '#1a1428');
    G.rect(x, wx, 17, 8, 10, lit ? '#ffd27a' : (r() < 0.5 ? '#2f4a3a' : '#4a3a2a'));
    if (lit) G.rect(x, wx, 17, 8, 4, '#8a6a30');
    else for (let k = 18; k < 27; k += 2) G.rect(x, wx, k, 8, 1, '#00000040');
    G.rect(x, wx - 3, 27, 14, 1, '#111');
    for (let b = 0; b < 14; b += 3) G.rect(x, wx - 3 + b, 27, 1, 3, '#111');
    if (r() < 0.25) { G.rect(x, wx + 8, 24, 3, 3, '#ab5236'); G.rect(x, wx + 8, 22, 3, 2, r() < 0.5 ? C.red : C.green); }
  }
  G.rect(x, 0, 31, w, 1, '#2a2240');
  if (kind === 'portal') {
    const dx = (w >> 1) - 11;
    G.rect(x, dx - 2, 30, 26, 20, '#2a1a10');
    G.rect(x, dx, 32, 22, 18, '#ffd27a');
    G.rect(x, dx + 10, 32, 2, 18, '#c89a4a');
    G.rect(x, dx + 4, 22, 14, 7, '#1d2b53');
    G.text(x, 'Nº7', dx + 11, 22, C.white, { align: 'center' });
    G.text(x, 'TU CASA', 18, 36, C.yellow);
  } else if (w >= 56 && r() < 0.8) {
    const shop = art.SHOPS[r() * art.SHOPS.length | 0];
    const tw = G.textW(shop.t), sw = Math.min(w - 6, tw + 8), sx = Math.round((w - sw) / 2);
    G.rect(x, sx, 33, sw, 10, shop.bg);
    if (tw <= sw - 4) G.text(x, shop.t, sx + sw / 2, 35, shop.fg, { align: 'center' });
    if (shop.cross && sx + sw + 9 < w) { G.rect(x, sx + sw + 4, 33, 3, 9, C.green); G.rect(x, sx + sw + 2, 36, 7, 3, C.green); }
    G.rect(x, 4, 44, w - 8, 6, '#6a6a7a');
    for (let k = 45; k < 50; k += 2) G.rect(x, 4, k, w - 8, 1, '#4a4a5a');
  } else {
    const dx = (w >> 1) - 6;
    G.rect(x, dx, 36, 12, 14, '#5a3a20'); G.rect(x, dx + 5, 36, 1, 14, '#2a1a10');
  }
  G.rect(x, w - 1, 12, 1, 38, '#00000070');
  // acera de arriba, calzada, acera de abajo, tejados
  art.tiles(x, 0, 50, w, 10);
  G.rect(x, 0, 60, w, 2, '#8a8a9a');
  art.asphalt(x, 0, 62, w, 88, seed);
  for (let i = 4; i < w; i += 20) G.rect(x, i, 104, 10, 1, '#c8c8c8');
  if (kind !== 'portal' && r() < 0.14) for (let yy = 64; yy < 148; yy += 8) G.rect(x, (w >> 1) - 10, yy, 20, 4, '#9a9aa8');
  if (r() < 0.3) { const mx = 10 + r() * (w - 20), my = 72 + r() * 70; G.circ(x, mx, my, 4, '#1c1c2a'); G.ring(x, mx, my, 4, '#4a4a5a'); }
  G.rect(x, 0, 150, w, 2, '#8a8a9a');
  art.tiles(x, 0, 152, w, 12);
  art.roofTop(x, 0, 164, w, 16);
  G.rect(x, 0, 164, w, 1, '#2a1a14');
  if (r() < 0.5) { const cx = 6 + r() * (w - 14); G.rect(x, cx, 167, 6, 6, '#5a2a1a'); G.rect(x, cx + 1, 168, 4, 4, '#111'); }
  // farola + charco de luz
  if (r() < 0.65) {
    const lx = Math.round(8 + r() * (w - 16));
    x.globalAlpha = 0.1; G.ellipse(x, lx, 63, 20, 6, '#ffd27a'); x.globalAlpha = 1;
    art.lamp(x, lx, 60, true, 24);
  }
  if (r() < 0.35) art.tree(x, 8 + r() * (w - 16), 158, 6);
  else if (r() < 0.3) { const bx = 6 + r() * (w - 24); G.rect(x, bx, 153, 14, 9, G.pick(['#2c6a3a', '#a08a20', '#1d4a8a'])); G.rect(x, bx, 153, 14, 2, '#111'); }
  return c;
}

class Street {
  constructor() { this.segs = []; this.end = 0; this.seed = G.irand(1, 1e6); this.stop = false; }
  add(kind) {
    const w = kind === 'portal' ? 150 : G.irand(56, 110);
    const s = { x: this.end, w, c: makeSeg(w, this.seed++, kind), kind };
    this.segs.push(s);
    this.end += w;
    return s;
  }
  ensure(cam) {
    while (!this.stop && this.end < cam + W + 120) this.add();
    this.segs = this.segs.filter(s => s.x + s.w > cam - 4);
  }
  draw(cx, cam) { for (const s of this.segs) cx.drawImage(s.c, Math.round(s.x - cam), 0); }
}

// ------------------------------------------------------------ el chico
class Chico {
  constructor() {
    this.x = 70; this.y = 110; this.face = 1; this.t = 0; this.inv = 1.2;
    this.dash = 0; this.dashCd = 0; this.dx = 1; this.dy = 0; this.speed = 90; this.moving = false;
  }
  update(dt, walking) {
    const a = G.Input.axis();
    const m = Math.hypot(a.x, a.y);
    if (m > 0.1) { this.dx = a.x / m; this.dy = a.y / m; }
    if (G.Input.hit('a') && this.dashCd <= 0) {
      this.dash = 0.18; this.dashCd = 0.9;
      if (m <= 0.1) { this.dx = 1; this.dy = 0; }
      G.audio.sfx('dash');
    }
    let vx = a.x * this.speed, vy = a.y * this.speed;
    if (this.dash > 0) { vx = this.dx * this.speed * 2.8; vy = this.dy * this.speed * 2.8; this.dash -= dt; }
    this.x = G.clamp(this.x + vx * dt, 8, W - 8);
    this.y = G.clamp(this.y + vy * dt, TOPY, BOTY);
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
    const f = this.moving ? (Math.floor(this.t * 9) % 2 ? 'chico1' : 'chico2') : 'chico0';
    if (this.dash > 0) { cx.globalAlpha = 0.4; G.drawFeet(cx, f, this.x - this.dx * 7, this.y + 1 - this.dy * 7, this.face < 0, C.blue); cx.globalAlpha = 1; }
    G.drawFeet(cx, f, this.x, this.y + 1, this.face < 0);
  }
}

// ------------------------------------------------------------ El Coco (jefe final)
class Coco {
  constructor() { this.x = W + 40; this.y = 104; this.hp = this.max = 8; this.t = 0; this.flash = 0; this.atk = 2.2; this.state = 'enter'; this.st = 0; }
  get phase() { return this.hp > 5 ? 1 : this.hp > 2 ? 2 : 3; }
  update(dt, S) {
    this.t += dt; this.st += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.state === 'enter') { this.x = G.lerp(W + 40, 262, Math.min(1, this.st / 1.6)); if (this.st > 1.8) { this.state = 'fight'; this.st = 0; } return; }
    if (this.state === 'dying') { if (Math.random() < 0.5) S.parts.burst(this.x + G.rand(-20, 20), this.y + G.rand(-20, 20), 4, [C.navy, C.plum, C.yellow, C.black], 60, 0.6); return; }
    const ph = this.phase;
    this.y = 106 + Math.sin(this.t * (0.6 + ph * 0.2)) * 38;
    this.x = 262 + Math.sin(this.t * 0.9) * 10;
    this.atk -= dt;
    if (this.atk <= 0) this.attack(S);
  }
  shoot(S, a, sp) { S.add(HZ().bullet(this.x - 14, this.y - 20, Math.cos(a) * 75 * sp, Math.sin(a) * 75 * sp)); }
  attack(S) {
    const ph = this.phase, sp = 1 + (ph - 1) * 0.12;
    const aim = Math.atan2(S.p.y - 5 - (this.y - 20), S.p.x - (this.x - 14));
    const list = ph === 1 ? ['aim', 'fan', 'fan', 'rain'] : ph === 2 ? ['fan', 'ring', 'aim3', 'rain', 'minions'] : ['ring', 'aim3', 'fan', 'rain', 'minions', 'spiral'];
    const a = G.pick(list);
    if (a === 'aim') this.shoot(S, aim, sp * 1.2);
    if (a === 'aim3') for (let i = 0; i < 3; i++) S.later(i * 0.2, () => this.shoot(S, Math.atan2(S.p.y - 5 - (this.y - 20), S.p.x - (this.x - 14)), sp * 1.25));
    if (a === 'fan') for (let i = -2; i <= 2; i++) this.shoot(S, aim + i * 0.26, sp);
    if (a === 'ring') { const o = Math.random(); for (let i = 0; i < 12; i++) this.shoot(S, o + i / 12 * Math.PI * 2, sp * 0.9); }
    if (a === 'spiral') for (let i = 0; i < 16; i++) S.later(i * 0.09, () => { this.shoot(S, Math.PI + Math.sin(i * 0.5) * 1.3, sp); });
    if (a === 'rain') for (let i = 0; i < 4 + ph * 2; i++) S.add(HZ().strike(G.rand(16, 220), G.randY(), { kind: 'shadow', warn: 1.0 + i * 0.08, r: 10, ground: false }));
    if (a === 'minions' && S.hz.filter(h => h.type === 'sombra').length < 3) for (let i = 0; i < Math.min(2, ph); i++) S.add(HZ().sombra(this.x - 20, this.y + G.rand(-10, 10)));
    G.audio.sfx('throw');
    this.atk = G.lerp(1.8, 1.0, (ph - 1) / 2) * G.rand(0.85, 1.15);
  }
  hitBy(S) {
    this.hp--; this.flash = 0.15;
    G.addScore(100);
    G.audio.sfx('hit'); G.shake(2, 0.12);
    S.parts.text(this.x, this.y - 34, G.pick(['¡AY!', '¡AUCH!', '¡LA CHANCLA NO!', '¡MAMÁÁÁ!']), C.white);
    if (this.hp <= 0) { this.state = 'dying'; this.st = 0; G.audio.sfx('roar'); G.shake(6, 1.2); }
  }
  draw(cx, S) {
    if (this.state === 'dying') {
      const k = Math.min(1, this.st / 2.2), s = 2 * (1 - k) + 0.01;
      if (k < 1) {
        const img = G.spr(Math.floor(S.t * 20) % 2 ? 'cocoHurt' : 'coco');
        cx.drawImage(img, Math.round(this.x - 12 * s), Math.round(this.y - 24 * s), Math.round(24 * s), Math.round(24 * s));
      } else {
        G.drawFeet(cx, 'gatito', this.x, this.y + 4);
        if (this.st > 2.5) G.text(cx, '¿MIAU?', this.x, this.y - 14, C.white, { align: 'center', shadow: true });
      }
      return;
    }
    cx.globalAlpha = 0.35; G.ellipse(cx, this.x, this.y + 6, 18, 3, '#000'); cx.globalAlpha = 1;
    G.drawScaled(cx, this.flash > 0 ? 'cocoHurt' : 'coco', this.x - 24, this.y - 48, 2, false, this.flash > 0 && Math.floor(S.t * 30) % 2 ? C.white : null);
    if (Math.random() < 0.3) S.parts.add({ x: this.x + G.rand(-22, 22), y: this.y - 4, vy: G.rand(5, 20), life: 0.6, c: G.pick([C.navy, '#111d35']), s: 2 });
  }
}
const HZ = () => G.HZ;

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
      { label: 'SALIR AL TÍTULO', fn: () => G.go(new G.TitleScene()) }
    ], { x: 160, y: 84, w: 120, lh: 12, align: 'center' });
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
    this.place = G.pick(this.def.places);
    this.heartAt = G.run.hp < G.run.maxHp && G.chance(0.7) ? G.rand(4, DUR - 4) : -1;
    G.run.stage = i + 1;
    if (i > 0) G.run.minutes += G.irand(24, 34);
  }
  hurt() {
    if (this.p.safe() || this.phase === 'dead' || this.phase === 'win') return;
    const r = G.run;
    r.hp--; r.hits++; this.stageHits++;
    this.p.inv = 1.4;
    G.audio.sfx('hurt'); G.flash(C.red, 0.22); G.shake(4, 0.3);
    this.parts.burst(this.p.x, this.p.y - 6, 12, [C.red, C.white], 60, 0.4);
    if (r.hp <= 0) {
      r.cause = this.phase === 'boss' || this.phase === 'approach' ? 'El Coco te metió en su saco. A las 8 te devolvió, pero tu madre no se lo creyó.' : this.def.cause;
      this.phase = 'dead'; this.pt = 0;
      G.audio.play(null); G.audio.sfx('lose');
    }
  }
  spawnCoins() {
    const pat = G.irand(0, 2), y0 = G.LANES[G.irand(0, G.LANES.length - 1)];
    for (let i = 0; i < 5; i++) {
      let x = W + 10 + i * 13, y = y0;
      if (pat === 1) y = y0 - Math.sin(i / 4 * Math.PI) * 14;
      if (pat === 2) { x = W + 10 + (i % 2) * 6; y = G.clamp(TOPY + 10 + i * 18, TOPY, BOTY); }
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
    let vt = 34 + this.stage * 7;
    if (this.phase === 'approach') {
      const target = this.portal.x + this.portal.w - W;
      vt = G.clamp((target - this.cam) * 0.9, 0, 80);
      if (target - this.cam < 0.5) { this.cam = target; this.v = 0; this.phase = 'boss'; this.pt = 0; this.coco = new Coco(); G.audio.play('boss'); G.audio.sfx('roar'); this.chT = 2.5; }
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
      if (this.heartAt > 0 && this.pt >= this.heartAt) { this.heartAt = -1; this.items.push({ kind: 'heart', x: W + 10, y: G.randY(), t: 0 }); }
      if (this.pt >= DUR) {
        this.phase = 'clear'; this.pt = 0;
        const bonus = 300 + (this.stageHits ? 0 : 200);
        G.addScore(bonus);
        this.clearText = this.stageHits ? '+300' : '+300  SIN UN RASGUÑO +200';
        G.audio.sfx('win');
      }
    } else if (this.phase === 'clear') {
      if (this.pt >= CLEAR) {
        if (this.stage + 1 < STAGES) this.startStage(this.stage + 1);
        else {
          this.phase = 'approach'; this.pt = 0;
          G.run.minutes += G.irand(20, 30);
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
        if (this.items.filter(i => i.kind === 'chancla').length < 2) this.items.push({ kind: 'chancla', x: G.rand(24, 200), y: G.randY(), t: 0, ground: false });
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
      if (h.ground) h.x -= this.v * dt;
      h.update(dt, this);
      if (!h.dead && h.hit(px, py)) this.hurt();
      if (h.x < -90 || h.x > W + 170 || h.y < -50 || h.y > H + 50) h.dead = true;
    }
    this.hz = this.hz.filter(h => !h.dead);
    // objetos que se recogen
    for (const it of this.items) {
      it.t += dt;
      if (it.ground !== false) it.x -= this.v * dt;
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
    this.items = this.items.filter(it => !it.got && it.x > -20);
    for (const s of this.shots) {
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (this.coco && this.coco.state === 'fight' && G.dist(s.x, s.y, this.coco.x, this.coco.y - 24) < 20) {
        s.dead = true; this.coco.hitBy(this);
        this.parts.burst(s.x, s.y, 12, [C.yellow, C.white, C.blue], 70, 0.4);
        if (this.coco.state === 'dying') this.hz = [];
      }
      for (const h of this.hz) if (h.type === 'sombra' && G.dist(h.x, h.y - 4, s.x, s.y) < 8) { h.dead = true; this.parts.burst(h.x, h.y, 10, [C.navy, C.lav], 50, 0.4); }
    }
    this.shots = this.shots.filter(s => !s.dead && s.x > -10 && s.x < W + 10 && s.y > 0 && s.y < H);
    this.parts.update(dt);
  }
  draw(cx) {
    const t = this.t;
    this.street.draw(cx, this.cam);
    if (this.def.draw && this.phase === 'play') this.def.draw(cx, this);
    // objetos y peligros del suelo
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
    // ordenar por profundidad
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
      art.panel(cx, 90, 56, 140, 70, '#111d35', '#83769c');
      G.text(cx, 'PAUSA', 160, 64, C.yellow, { align: 'center', shadow: true });
      this.pmenu.draw(cx);
    }
  }
  drawHud(cx) {
    const r = G.run, t = this.t;
    G.rect(cx, 0, 0, W, 12, '#000000d0');
    for (let i = 0; i < r.maxHp; i++) if (i < r.hp || i < 3) G.draw(cx, i < r.hp ? 'heart' : 'heartE', 3 + i * 8, 3);
    G.text(cx, String(Math.floor(r.score)), W - 4, 3, C.yellow, { align: 'right' });
    let label = 'TRAMO ' + (this.stage + 1) + '/' + STAGES + ' · ' + this.def.name.replace(/[¡!]/g, '');
    if (this.phase === 'approach') label = 'YA SE VE TU PORTAL...';
    if (this.phase === 'boss' || this.phase === 'win') label = 'EL COCO';
    G.text(cx, label, 168, 3, C.white, { align: 'center' });
    const prog = this.phase === 'boss' || this.phase === 'win' || this.phase === 'approach' ? 1 : (this.stage + (this.phase === 'intro' ? 0 : this.phase === 'clear' ? 1 : this.pt / DUR)) / STAGES;
    G.rect(cx, 0, 11, W, 1, '#2a2a4a'); G.rect(cx, 0, 11, W * prog, 1, C.green);
    if (this.phase === 'intro') {
      const a = Math.min(1, this.pt * 3, (INTRO - this.pt) * 3);
      cx.globalAlpha = a * 0.75; G.rect(cx, 0, 64, W, 50, '#000'); cx.globalAlpha = 1;
      if (a > 0.3) {
        G.text(cx, G.clock() + ' · ' + this.place.toUpperCase(), 160, 68, C.lav, { align: 'center', shadow: true });
        G.drawScaled(cx, this.def.icon, 160 - G.textW(this.def.name, 2) / 2 - 24, 80, 2);
        G.bigText(cx, this.def.name, 80, C.yellow, 2);
        G.text(cx, this.def.sub, 160, 100, C.white, { align: 'center', shadow: true });
      }
    }
    if (this.phase === 'clear') {
      G.bigText(cx, '¡TRAMO SUPERADO!', 76, C.green, 2);
      G.text(cx, this.clearText, 160, 96, C.yellow, { align: 'center', shadow: true });
    }
    if (this.phase === 'approach') G.bigText(cx, 'CASI EN CASA...', 80, C.yellow, 2);
    if (this.coco) {
      G.rect(cx, 100, 15, 120, 6, '#000');
      G.rect(cx, 101, 16, 118 * Math.max(0, this.coco.hp) / this.coco.max, 4, this.coco.phase === 3 ? C.red : this.coco.phase === 2 ? C.orange : C.plum);
      if (this.phase === 'boss' && this.coco.state !== 'dying' && this.pt < 4.5) G.text(cx, 'COGE LAS CHANCLAS DEL SUELO: ¡SE LANZAN SOLAS!', 160, 168, C.yellow, { align: 'center', shadow: true });
      if (this.phase === 'boss' && this.pt < 1.8) G.bigText(cx, '¡EL COCO!', 70, C.red, 3);
    }
    if (this.phase === 'dead') {
      cx.globalAlpha = Math.min(0.6, this.pt * 0.6); G.rect(cx, 0, 0, W, H, C.dred); cx.globalAlpha = 1;
      G.bigText(cx, '¡AY!', 76, C.white, 4);
    }
    if (this.phase === 'win') G.bigText(cx, '¡LO CONSEGUISTE!', 70, C.green, 2);
    if (t < 3 && this.stage === 0 && !this.coco) G.text(cx, G.Input.lastDevice === 'touch' ? 'JOYSTICK PARA MOVERTE · A PARA ESQUIVAR' : 'FLECHAS PARA MOVERTE · ESPACIO PARA ESQUIVAR', 160, 168, C.white, { align: 'center', shadow: true });
  }
}
G.GameScene = GameScene;
})();
