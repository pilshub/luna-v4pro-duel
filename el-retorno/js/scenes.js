'use strict';
// =====================================================================
//  ESCENAS: título, mapa, pruebas, tienda, fuente, eventos, finales,
//  nombre y ranking
// =====================================================================
(function () {
const C = G.C, W = G.W, H = G.H, art = G.art;

// ------------------------------------------------------------ menús
class Menu {
  constructor(items, o = {}) {
    this.items = items; this.x = o.x || 0; this.y = o.y || 0; this.w = o.w || 120; this.lh = o.lh || 12;
    this.align = o.align || 'left';
    this.i = Math.max(0, items.findIndex(it => !it.disabled));
  }
  move(d) {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const j = ((this.i + d * k) % n + n) % n;
      if (!this.items[j].disabled) { this.i = j; G.audio.sfx('move'); return; }
    }
  }
  rect(j) {
    const x = this.align === 'center' ? this.x - this.w / 2 : this.x;
    return { x: x - 6, y: this.y + j * this.lh - 3, w: this.w + 12, h: this.lh };
  }
  update() {
    if (G.Input.hit('up')) this.move(-1);
    if (G.Input.hit('down')) this.move(1);
    const tp = G.Input.tap;
    if (tp) {
      this.items.forEach((it, j) => {
        const r = this.rect(j);
        if (tp.x >= r.x && tp.x < r.x + r.w && tp.y >= r.y && tp.y < r.y + r.h) {
          if (it.disabled) { G.audio.sfx('deny'); return; }
          this.i = j; this.fire();
        }
      });
    } else if (G.Input.hit('a')) this.fire();
  }
  fire() {
    const it = this.items[this.i];
    if (!it || it.disabled) { G.audio.sfx('deny'); return; }
    G.audio.sfx(it.sfx || 'ok');
    if (it.fn) it.fn();
  }
  draw(cx) {
    this.items.forEach((it, j) => {
      const sel = j === this.i, y = this.y + j * this.lh;
      const col = it.disabled ? '#5a5a6a' : sel ? C.yellow : C.white;
      const r = this.rect(j);
      if (sel) {
        G.rect(cx, r.x, r.y, r.w, r.h - 1, '#ffffff18');
        G.text(cx, '>', r.x + 1 + (Math.floor(G.time * 4) % 2), y, C.yellow);
      }
      const tx = this.align === 'center' ? this.x : this.x + 2;
      G.text(cx, it.label, tx, y, col, { align: this.align === 'center' ? 'center' : 'left', shadow: true });
      if (it.right) G.text(cx, it.right, r.x + r.w - 3, y, it.disabled ? '#5a5a6a' : (it.rightC || C.yellow), { align: 'right', shadow: true });
    });
  }
}
G.Menu = Menu;

// barra superior: corazones, euros y etiqueta
G.drawTopBar = (cx, o = {}) => {
  const r = G.run;
  G.rect(cx, 0, 0, W, 12, '#000000d0');
  if (!r) return;
  let x = 3 + art.hearts(cx, 3, 3, r.hp, r.maxHp);
  if (r.shield > 0) { G.draw(cx, 'it_casco', x + 1, 2); x += 12; }
  G.text(cx, r.money + ' €', W - 4, 3, C.yellow, { align: 'right' });
  if (o.label) G.text(cx, o.label, o.labelX || W / 2 + 10, 3, C.white, { align: 'center' });
  if (o.right) G.text(cx, o.right, W - 40, 3, o.rightC || C.lav, { align: 'right' });
  if (o.prog !== undefined) {
    G.rect(cx, 0, 11, W, 1, '#2a2a4a');
    G.rect(cx, 0, 11, W * G.clamp(o.prog, 0, 1), 1, C.green);
  }
};

const titleFont = (cx, str, x, y, scale, col = C.yellow, sh = C.dred) => {
  G.text(cx, str, x, y + scale, '#000', { align: 'center', scale });
  G.text(cx, str, x, y, col, { align: 'center', scale, shadow: sh, outline: true });
};
const typed = (str, t, speed = 45) => str.slice(0, Math.floor(t * speed));
const node = id => G.run.map.nodes[id];
const backToMap = () => G.go(new MapScene());
const checkDeath = () => { if (G.run.hp <= 0) { G.go(new GameOverScene()); return true; } return false; };

// ------------------------------------------------------------ fondo de calle animado
class StreetBg {
  constructor(seed = 1) {
    [this.sky, this.skx] = G.makeCanvas(W, H);
    art.sky(this.skx, W, H);
    art.moon(this.skx, 300, 22, 11);
    [this.far, this.fx] = G.makeCanvas(W * 2, H);
    art.skyline(this.fx, W * 2, 128, seed + 5, '#141838', '#3a3060');
    [this.row, this.rx] = G.makeCanvas(W * 2, H);
    let bx = 0, s = seed * 100;
    while (bx < W * 2) { const w = G.irand(70, 100); art.facade(this.rx, bx, G.irand(54, 74), w, 146 - 60, s++); bx += w; }
    art.tiles(this.rx, 0, 146, W * 2, 8);
    art.cobbles(this.rx, 0, 154, W * 2, 26, '#24222f', '#1b1a24', '#2e2c3c');
    for (let i = 40; i < W * 2; i += 106) art.lamp(this.rx, i, 150, true, 46);
  }
  draw(cx, t, speed = 14) {
    cx.drawImage(this.sky, 0, 0);
    art.stars(cx, W, 70, 9, t);
    const f = Math.floor(t * speed * 0.3) % (W * 2 - W), r = Math.floor(t * speed) % W;
    cx.drawImage(this.far, f % W, 0, W, H, 0, 0, W, H);
    cx.drawImage(this.row, r, 0, W, H, 0, 0, W, H);
    for (let i = 40; i < W * 2; i += 106) {
      const x = i - r;
      if (x > -40 && x < W + 40) art.lightCone(cx, x, 104, 154, 22, 0.12);
    }
  }
}

// ------------------------------------------------------------ TÍTULO
class TitleScene {
  enter() {
    this.t = 0;
    this.bg = new StreetBg(3);
    G.audio.play('night');
    const sv = G.save.data;
    this.menu = new Menu([
      { label: 'NUEVA NOCHE', fn: () => { G.newRun(); G.go(new IntroScene()); } },
      { label: 'RÉCORDS', fn: () => G.go(new RankingScene(null)) },
      { label: 'CÓMO SE JUEGA', fn: () => G.go(new HowToScene()) },
      { label: 'SONIDO', right: G.audio.muted ? 'NO' : 'SÍ', fn: () => { G.audio.toggleMute(); this.menu.items[3].right = G.audio.muted ? 'NO' : 'SÍ'; }, sfx: 'move' }
    ], { x: 160, y: 104, w: 120, lh: 12, align: 'center' });
    this.best = sv.scores && sv.scores.length ? sv.scores[0] : null;
    this.zom = 0;
  }
  update(dt) { this.t += dt; this.zom += dt; this.menu.update(); }
  draw(cx) {
    const t = this.t;
    this.bg.draw(cx, t);
    // zombi que asoma por una alcantarilla
    const zk = (this.zom % 9);
    G.ellipse(cx, 236, 168, 9, 2, '#111');
    if (zk > 5 && zk < 8) {
      const k = Math.sin((zk - 5) / 3 * Math.PI);
      cx.save(); cx.beginPath(); cx.rect(220, 140, 34, 28); cx.clip();
      G.drawFeet(cx, 'zombie0', 236, 168 + 15 - k * 12, true);
      cx.restore();
    }
    G.drawFeet(cx, Math.floor(t * 8) % 2 ? 'nico1' : 'nico2', 120, 166, false);
    G.ellipse(cx, 120, 166, 5, 1, '#00000080');
    cx.globalAlpha = 0.55; G.rect(cx, 70, 96, 180, 54, '#000'); cx.globalAlpha = 1;
    titleFont(cx, 'EL RETORNO', 160, 30 + Math.round(Math.sin(t * 2) * 1.5), 4);
    G.text(cx, 'UNA NOCHE CUALQUIERA. UNA CIUDAD CUALQUIERA.', 160, 66, C.lav, { align: 'center', shadow: true });
    G.text(cx, 'AYUDA A NICO A VOLVER A CASA', 160, 78, C.white, { align: 'center', shadow: true });
    this.menu.draw(cx);
    if (this.best) G.text(cx, 'RÉCORD: ' + this.best.name + ' · ' + this.best.score, 160, 158, C.yellow, { align: 'center', shadow: true });
    G.text(cx, G.Input.lastDevice === 'touch' ? 'A = ELEGIR' : 'FLECHAS + ESPACIO · M = SONIDO', 160, 170, '#8a8aa8', { align: 'center', shadow: true });
  }
}
G.TitleScene = TitleScene;

// ------------------------------------------------------------ CÓMO SE JUEGA
class HowToScene {
  enter() { this.t = 0; this.page = 0; }
  update(dt) {
    this.t += dt;
    if (G.Input.hit('right') || G.Input.hit('a') || G.Input.tap) { G.audio.sfx('move'); this.page++; if (this.page > 1) G.go(new TitleScene()); }
    if (G.Input.hit('left') && this.page > 0) { this.page--; G.audio.sfx('move'); }
    if (G.Input.hit('b')) G.go(new TitleScene());
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    art.panel(cx, 8, 8, W - 16, H - 16, '#111d35', '#83769c');
    if (this.page === 0) {
      G.text(cx, 'CÓMO SE JUEGA', 160, 16, C.yellow, { align: 'center', shadow: true });
      G.textBox(cx, 'Nico tiene que cruzar la ciudad de noche para llegar a casa. Cada noche el mapa es distinto: elige tu camino cruce a cruce.', 18, 32, 284, C.white, { lh: 10 });
      const rows = [
        ['mi_zombis', 'PRUEBA: un minijuego. Supéralo y gana euros.'],
        ['mi_volcan', 'BORDE ROJO: prueba difícil. Premio: un objeto.'],
        ['mi_shop', 'BAZAR 24H: compra objetos y comida.'],
        ['mi_rest', 'FUENTE: descansa y recupera vida.'],
        ['mi_event', 'ALGO RARO: un encuentro con decisiones.'],
        ['mi_boss', 'TU PORTAL: el jefe final te espera.']
      ];
      rows.forEach(([ic, tx], i) => { G.draw(cx, ic, 22, 66 + i * 14); G.text(cx, tx, 36, 67 + i * 14, C.white); });
      G.text(cx, '1/2  →', W - 18, 160, C.lav, { align: 'right' });
    } else {
      G.text(cx, 'VIDA, EUROS Y PUNTOS', 160, 16, C.yellow, { align: 'center', shadow: true });
      G.textBox(cx, '♥ Cada golpe quita un corazón. Si te quedas sin corazones, se acaba la noche y empiezas de cero con otro mapa (es un roguelike).', 18, 32, 284, C.white, { lh: 10 });
      G.textBox(cx, '€ Los euros se ganan en las pruebas y recogiendo monedas. Gástalos en el bazar.', 18, 64, 284, C.yellow, { lh: 10 });
      G.textBox(cx, '★ Los puntos suben con cada prueba, moneda y bicho derrotado. Al final guarda tu nombre en el ranking.', 18, 86, 284, C.green, { lh: 10 });
      G.textBox(cx, 'CONTROLES: flechas o WASD para moverte. ESPACIO / Z = A. X = B. P = pausa. En el móvil usa la cruceta y los botones.', 18, 118, 284, C.lav, { lh: 10 });
      G.text(cx, '←  2/2  (A) VOLVER', W - 18, 160, C.lav, { align: 'right' });
    }
  }
}

// ------------------------------------------------------------ INTRO
const INTRO = [
  'Sábado, 00:40.\nSales del cumpleaños de Rubén, en la otra punta de la ciudad.',
  'Tu madre fue muy clara:\n"A la una en casa. NI UN MINUTO MÁS."',
  'Solo tienes que cruzar la ciudad.\nFácil... ¿no?',
  'Pero esta noche la ciudad está rara.\nMuy, muy rara.'
];
class IntroScene {
  enter() { this.t = 0; this.page = 0; this.bg = new StreetBg(7); G.audio.play('night'); }
  update(dt) {
    this.t += dt;
    if (G.Input.anyHit()) {
      const full = typed(INTRO[this.page], this.t).length >= INTRO[this.page].length;
      if (!full) this.t = 99;
      else {
        this.page++; this.t = 0; G.audio.sfx('move');
        if (this.page >= INTRO.length) G.go(new RewardScene('Antes de salir, coges algo de la mochila de Rubén:', G.itemChoices(3), backToMap, true));
      }
    }
  }
  draw(cx) {
    this.bg.draw(cx, G.time, this.page >= 3 ? 30 : 8);
    if (this.page >= 3) { cx.globalAlpha = 0.2 + Math.sin(G.time * 8) * 0.1; G.rect(cx, 0, 0, W, H, C.plum); cx.globalAlpha = 1; }
    G.drawFeet(cx, 'nico0', 120, 166, false);
    art.panel(cx, 16, 24, W - 32, 56, '#000000e0', '#83769c');
    const s = INTRO[this.page] || '';
    G.textBox(cx, typed(s, this.t), 26, 34, W - 52, C.white, { lh: 11 });
    if (typed(s, this.t).length >= s.length && Math.floor(G.time * 3) % 2) G.text(cx, '↓', W - 28, 68, C.yellow);
  }
}

// ------------------------------------------------------------ ELEGIR OBJETO
class RewardScene {
  constructor(title, choices, after, start = false) { this.title = title; this.choices = choices.filter(Boolean); this.after = after; this.start = start; }
  enter() { this.t = 0; this.i = 0; this.taken = false; if (!this.choices.length) { const v = G.gain(25); this.none = v; } }
  update(dt) {
    this.t += dt;
    if (this.none !== undefined) { if (G.Input.anyHit() && this.t > 0.3) this.after(); return; }
    if (this.taken) { if (this.t > 0.9) this.after(); return; }
    if (G.Input.hit('left')) { this.i = (this.i + this.choices.length - 1) % this.choices.length; G.audio.sfx('move'); }
    if (G.Input.hit('right')) { this.i = (this.i + 1) % this.choices.length; G.audio.sfx('move'); }
    const tp = G.Input.tap;
    let pick = G.Input.hit('a') && this.t > 0.3;
    if (tp) this.choices.forEach((c, j) => { const x = this.cardX(j); if (tp.x > x && tp.x < x + 96 && tp.y > 34 && tp.y < 164) { if (this.i === j) pick = true; this.i = j; } });
    if (pick) {
      const id = this.choices[this.i];
      G.giveItem(id);
      G.audio.sfx('item');
      this.taken = true; this.t = 0;
    }
  }
  cardX(j) { const n = this.choices.length; return 160 - (n * 100 - 4) / 2 + j * 100; }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    art.stars(cx, W, H, 31, G.time);
    G.drawTopBar(cx);
    G.textBox(cx, this.title, 20, 20, W - 40, C.yellow, { align: 'center', lh: 10 });
    if (this.none !== undefined) { G.text(cx, 'Ya lo tienes todo. Te llevas ' + this.none + ' €.', 160, 90, C.white, { align: 'center' }); return; }
    this.choices.forEach((id, j) => {
      const it = G.ITEMS[id], x = this.cardX(j), sel = j === this.i;
      const y = 36 - (sel ? 2 : 0);
      art.panel(cx, x, y, 96, 128, sel ? '#2b2b52' : '#161630', sel ? C.yellow : '#4a4a6a');
      if (this.taken && sel) { cx.globalAlpha = 0.4 + Math.sin(this.t * 20) * 0.3; G.rect(cx, x, y, 96, 128, C.yellow); cx.globalAlpha = 1; }
      art.icon(cx, it.icon, x + 33, y + 5, 3);
      G.textBox(cx, it.name, x + 4, y + 38, 88, sel ? C.yellow : C.white, { align: 'center', lh: 9 });
      G.textBox(cx, it.desc, x + 5, y + 60, 86, '#b8b8d0', { lh: 9 });
    });
    G.text(cx, '← → ELEGIR   A COGER', 160, 168, C.lav, { align: 'center' });
  }
}

// ------------------------------------------------------------ MAPA
const NODE_COL = { game: '#29adff', elite: '#ff004d', shop: '#00e436', rest: '#29adff', event: '#ffec27', boss: '#ff004d' };
const NODE_INFO = n => {
  if (n.type === 'game') return G.GAMES[n.game].name;
  if (n.type === 'elite') return '¡DIFÍCIL! ' + G.GAMES[n.game].name;
  if (n.type === 'shop') return 'Bazar 24 horas';
  if (n.type === 'rest') return 'Fuente: descansa un rato';
  if (n.type === 'event') return 'Algo raro pasa aquí...';
  if (n.type === 'boss') return 'Tu casa... y El Coco';
  return '';
};
const nodeIcon = n => n.type === 'game' || n.type === 'elite' ? G.GAMES[n.game].icon : n.type === 'boss' ? 'mi_boss' : 'mi_' + n.type;

let mapBgCache = null;
function mapBg() {
  if (mapBgCache) return mapBgCache;
  const [c, x] = G.makeCanvas(W, 360);
  G.rect(x, 0, 0, W, 360, '#0d0d22');
  const r = G.srand(42);
  for (let by = 0; by < 360; by += 30) for (let bx = -10; bx < W; bx += 46) {
    const ox = (by / 30) % 2 ? 23 : 0;
    const w = 38, h = 22;
    const park = r() < 0.1;
    G.rect(x, bx + ox, by, w, h, park ? '#12301e' : '#17173a');
    if (park) for (let k = 0; k < 4; k++) G.circ(x, bx + ox + 6 + r() * 26, by + 5 + r() * 12, 3, '#1a4a2a');
    else for (let k = 0; k < 8; k++) if (r() < 0.6) G.rect(x, bx + ox + 3 + (r() * 32 | 0), by + 3 + (r() * 16 | 0), 2, 1, r() < 0.3 ? '#8a6a30' : '#2a2a5a');
  }
  mapBgCache = c;
  return c;
}

class MapScene {
  enter() {
    this.t = 0; this.moving = null; this.inv = false; this.invI = 0;
    G.run.shield = 0;
    G.audio.play('night');
    this.avail = this.available();
    const cur = G.run.node !== null ? node(G.run.node) : null;
    this.sel = 0;
    if (cur) { let best = 9e9; this.avail.forEach((n, i) => { const d = Math.abs(n.col - cur.col); if (d < best) { best = d; this.sel = i; } }); }
    this.cam = this.targetCam(); this.view = 0;
  }
  available() {
    const r = G.run;
    if (r.node === null) return r.map.nodes.filter(n => n.row === 0);
    return node(r.node).next.map(i => node(i));
  }
  pos(n) { return { x: n.type === 'boss' ? 160 : 64 + n.col * 48, y: 128 - n.row * 30 }; }
  startPos() { return { x: 160, y: 154 }; }
  targetCam() { return G.clamp((G.run.row + 1) * 30 - 36, 0, 176); }
  update(dt) {
    this.t += dt;
    if (this.inv) { this.updateInv(); return; }
    if (this.moving) {
      const m = this.moving;
      m.t += dt;
      if (m.t >= 0.6) this.enterNode(m.node);
      return;
    }
    if (G.Input.hit('left')) { this.sel = (this.sel + this.avail.length - 1) % this.avail.length; G.audio.sfx('move'); this.view = 0; }
    if (G.Input.hit('right')) { this.sel = (this.sel + 1) % this.avail.length; G.audio.sfx('move'); this.view = 0; }
    if (G.Input.down('up')) this.view = Math.min(this.view + 120 * dt, 176 - this.cam);
    if (G.Input.down('down')) this.view = Math.max(this.view - 120 * dt, -this.cam);
    if (G.Input.hit('b')) { this.inv = true; this.invI = 0; G.audio.sfx('ok'); return; }
    const tp = G.Input.tap;
    let go = G.Input.hit('a');
    if (tp) {
      if (tp.y > 158 && tp.x > 236) { this.inv = true; this.invI = 0; return; }
      if (tp.y > 158 && tp.x > 190) go = true;
      this.avail.forEach((n, i) => { const p = this.pos(n); if (G.dist(tp.x, tp.y, p.x, p.y + this.cam + this.view) < 13) { if (this.sel === i) go = true; else { this.sel = i; G.audio.sfx('move'); } } });
    }
    if (go) {
      const n = this.avail[this.sel];
      const from = G.run.node !== null ? this.pos(node(G.run.node)) : this.startPos();
      this.moving = { from, to: this.pos(n), t: 0, node: n };
      this.view = 0;
      G.audio.sfx('ok');
    }
    this.cam += (this.targetCam() - this.cam) * Math.min(1, dt * 6);
  }
  updateInv() {
    const items = G.run.items;
    const n = items.length;
    if (G.Input.hit('b') || G.Input.hit('a') || G.Input.hit('pause') || (G.Input.tap && G.Input.tap.y > 160)) { this.inv = false; G.audio.sfx('back'); return; }
    if (!n) return;
    if (G.Input.hit('right')) { this.invI = (this.invI + 1) % n; G.audio.sfx('move'); }
    if (G.Input.hit('left')) { this.invI = (this.invI + n - 1) % n; G.audio.sfx('move'); }
    if (G.Input.hit('down')) { this.invI = Math.min(n - 1, this.invI + 8); G.audio.sfx('move'); }
    if (G.Input.hit('up')) { this.invI = Math.max(0, this.invI - 8); G.audio.sfx('move'); }
    const tp = G.Input.tap;
    if (tp) items.forEach((id, i) => { const x = 28 + (i % 8) * 34, y = 40 + Math.floor(i / 8) * 30; if (tp.x > x - 4 && tp.x < x + 26 && tp.y > y - 4 && tp.y < y + 26) this.invI = i; });
  }
  enterNode(n) {
    const r = G.run;
    r.node = n.id; r.row = n.row;
    r.path = r.path || [];
    r.path.push(n.id);
    r.minutes += G.irand(18, 30);
    G.addScore(25);
    G.save.data.bestFloor = Math.max(G.save.data.bestFloor || 0, n.row + 1);
    if (n.type === 'game' || n.type === 'elite' || n.type === 'boss') G.go(new CardScene(n));
    else if (n.type === 'shop') G.go(new ShopScene(n));
    else if (n.type === 'rest') G.go(new RestScene(n));
    else G.go(new EventScene(n));
  }
  draw(cx) {
    const cam = Math.round(this.cam + this.view), t = this.t;
    cx.drawImage(mapBg(), 0, cam - 180);
    const nodes = G.run.map.nodes, path = G.run.path || [];
    const onPath = (a, b) => { const i = path.indexOf(a); return i >= 0 && path[i + 1] === b; };
    // inicio
    const sp = this.startPos();
    for (const n of nodes.filter(n => n.row === 0)) {
      const p = this.pos(n);
      this.road(cx, sp.x, sp.y + cam - 8, p.x, p.y + cam, path[0] === n.id);
    }
    for (const n of nodes) for (const id of n.next) {
      const a = this.pos(n), b = this.pos(node(id));
      this.road(cx, a.x, a.y + cam, b.x, b.y + cam, onPath(n.id, id));
    }
    for (const n of nodes) {
      const p = this.pos(n), y = p.y + cam;
      if (y < -20 || y > 190) continue;
      const av = this.avail.includes(n) && !this.moving;
      const sel = av && this.avail[this.sel] === n;
      const big = n.type === 'boss';
      const rr = big ? 11 : 8;
      if (sel) { cx.globalAlpha = 0.35 + Math.sin(t * 8) * 0.2; G.circ(cx, p.x, y, rr + 5, C.yellow); cx.globalAlpha = 1; }
      G.circ(cx, p.x, y + 1, rr + 1, '#000');
      G.circ(cx, p.x, y, rr + 1, n.done ? '#3a3a4a' : (av ? C.white : NODE_COL[n.type]));
      G.circ(cx, p.x, y, rr, n.done ? '#22222e' : '#1a1a33');
      if (n.type === 'elite') G.ring(cx, p.x, y, rr - 1, C.red);
      G.draw(cx, nodeIcon(n), p.x - 4, y - 4);
      if (n.done) { cx.globalAlpha = 0.55; G.circ(cx, p.x, y, rr, '#0d0d22'); cx.globalAlpha = 1; }
      if (av && !sel && Math.floor(t * 3) % 2) G.ring(cx, p.x, y, rr + 3, C.yellow);
    }
    // Nico
    let np = G.run.node !== null ? this.pos(node(G.run.node)) : this.startPos();
    if (this.moving) { const k = Math.min(1, this.moving.t / 0.5); np = { x: G.lerp(this.moving.from.x, this.moving.to.x, k), y: G.lerp(this.moving.from.y, this.moving.to.y, k) }; }
    G.drawFeet(cx, this.moving ? (Math.floor(t * 10) % 2 ? 'nico1' : 'nico2') : 'nico0', np.x, np.y + cam - 6 - Math.abs(Math.sin(t * 3)) * 2, this.moving && this.moving.to.x < this.moving.from.x);
    // barra superior
    G.drawTopBar(cx, { label: G.clock(), labelX: 150, right: G.run.score + ' PTS', rightC: C.green });
    // panel inferior
    const n = this.avail[this.sel];
    G.rect(cx, 0, 159, W, 21, '#000000e0');
    G.rect(cx, 0, 159, W, 1, '#4a4a6a');
    if (this.inv) { this.drawInv(cx); return; }
    if (n) {
      G.circ(cx, 12, 169, 8, '#1a1a33'); G.ring(cx, 12, 169, 8, NODE_COL[n.type]);
      G.draw(cx, nodeIcon(n), 8, 165);
      G.text(cx, n.name, 26, 162, C.white);
      G.text(cx, NODE_INFO(n), 26, 172, n.type === 'elite' || n.type === 'boss' ? C.red : C.yellow);
    }
    G.text(cx, 'A: IR', 214, 167, C.green, { shadow: true });
    G.text(cx, 'B: MOCHILA', 314, 167, C.lav, { align: 'right', shadow: true });
    if (G.run.bono) G.text(cx, 'BONOS: ' + G.run.bono, 314, 15, C.blue, { align: 'right', shadow: true });
  }
  road(cx, x0, y0, x1, y1, lit) {
    const n = Math.ceil(G.dist(x0, y0, x1, y1) / 3);
    for (let i = 0; i <= n; i++) {
      const x = G.lerp(x0, x1, i / n), y = G.lerp(y0, y1, i / n);
      if (y < -4 || y > 184) continue;
      G.rect(cx, x - 1, y - 1, 3, 3, lit ? '#8a6a30' : '#26264a');
      if (i % 2 === 0) G.rect(cx, x, y, 1, 1, lit ? C.yellow : '#3a3a6a');
    }
  }
  drawInv(cx) {
    art.panel(cx, 10, 18, W - 20, 138, '#111d35', '#83769c');
    G.text(cx, 'MOCHILA', 160, 24, C.yellow, { align: 'center', shadow: true });
    const items = G.run.items;
    if (!items.length) G.text(cx, 'Vacía. Compra cosas en el bazar.', 160, 70, C.lav, { align: 'center' });
    items.forEach((id, i) => {
      const x = 28 + (i % 8) * 34, y = 40 + Math.floor(i / 8) * 30;
      if (i === this.invI) G.frame(cx, x - 3, y - 3, 26, 26, C.yellow);
      art.icon(cx, G.ITEMS[id].icon, x, y, 2);
    });
    const it = G.ITEMS[items[this.invI]];
    if (it) { G.text(cx, it.name, 20, 110, C.yellow); G.textBox(cx, it.desc, 20, 122, W - 40, C.white, { lh: 10 }); }
    G.text(cx, 'B: CERRAR', 314, 166, C.lav, { align: 'right', shadow: true });
    if (G.run.bono) G.text(cx, 'BONOS DE METRO: ' + G.run.bono, 12, 166, C.blue);
  }
}
G.MapScene = MapScene;

// ------------------------------------------------------------ FICHA PREVIA A UNA PRUEBA
class CardScene {
  constructor(n, debugD) {
    this.n = n; this.def = G.GAMES[n.game];
    this.D = debugD !== undefined ? debugD : n.type === 'boss' ? 1 : G.diffFor(n);
  }
  enter() {
    this.t = 0;
    G.audio.play(this.n.type === 'boss' ? null : 'night');
    if (this.n.type === 'boss') G.audio.sfx('roar');
    const items = [{ label: '¡VAMOS!', fn: () => G.go(new MinigameScene(this.n, this.def, this.D)) }];
    if (G.run.bono > 0 && this.n.type !== 'boss') items.push({ label: 'USAR BONO DE METRO (' + G.run.bono + ')', fn: () => { G.run.bono--; this.n.done = true; G.run.minutes += 5; backToMap(); } });
    this.menu = new Menu(items, { x: 160, y: 150, w: 170, lh: 12, align: 'center' });
  }
  update(dt) { this.t += dt; if (this.t > 0.25) this.menu.update(); }
  draw(cx) {
    const d = this.def, boss = this.n.type === 'boss';
    G.rect(cx, 0, 0, W, H, boss ? '#1a0510' : C.night);
    art.stars(cx, W, H, 77, G.time);
    G.drawTopBar(cx, { label: G.clock(), labelX: 150 });
    art.panel(cx, 8, 16, W - 16, 158, '#111d35', boss ? C.red : this.n.type === 'elite' ? C.red : '#83769c');
    G.circ(cx, 36, 44, 20, '#1a1a33'); G.ring(cx, 36, 44, 20, NODE_COL[this.n.type] || C.blue);
    G.drawScaled(cx, d.icon, 36 - 13, 44 - 13 + Math.round(Math.sin(G.time * 3)), 3);
    G.text(cx, this.n.name.toUpperCase(), 64, 24, C.lav);
    const title = d.name.toUpperCase();
    const sc = G.textW(title, 2) <= 236 ? 2 : 1;
    G.text(cx, title, 64, 36, boss ? C.red : C.yellow, { scale: sc, shadow: true });
    if (this.n.type === 'elite') G.text(cx, '¡PRUEBA DIFÍCIL! PREMIO: UN OBJETO', 64, 56, C.red);
    else if (!boss) G.text(cx, 'DIFICULTAD ' + '★'.repeat(1 + Math.round(this.D * 4)), 64, 56, '#8a8aa8');
    G.textBox(cx, d.intro, 18, 72, W - 36, C.white, { lh: 10 });
    let y = 116;
    for (const [k, v] of d.controls) { G.text(cx, k, 18, y, C.green); G.text(cx, v, 74, y, C.white); y += 9; }
    const help = d.items.filter(i => G.has(i));
    if (help.length) {
      G.text(cx, 'TE AYUDA:', 196, 116, C.blue);
      help.forEach((id, i) => art.icon(cx, G.ITEMS[id].icon, 196 + i * 13, 126, 1));
    }
    this.menu.draw(cx);
  }
}
G.CardScene = CardScene;

// ------------------------------------------------------------ MINIJUEGO
class MinigameScene {
  constructor(n, def, D) { this.n = n; this.def = def; this.D = D; }
  enter() {
    G.run.shield = G.has('casco') ? 1 : 0;
    G.run.gameHits = 0;
    this.inst = this.def.create(this.D);
    this.state = 'count'; this.t = 0; this.tick = -1;
    this.revived = G.run.revived; this.savedT = 0;
    G.audio.play(this.def.music || null);
    this.pmenu = new Menu([
      { label: 'CONTINUAR', fn: () => { this.state = this.prev; } },
      { label: 'SONIDO', fn: () => G.audio.toggleMute(), sfx: 'move' },
      { label: 'RENDIRSE', fn: () => { G.run.hp = 0; G.run.cause = 'Te rendiste y llamaste a tu madre para que viniera a buscarte. En pijama.'; G.audio.stop(); G.go(new GameOverScene()); } }
    ], { x: 160, y: 84, w: 100, lh: 12, align: 'center' });
  }
  update(dt) {
    if (this.state === 'paused') {
      this.pmenu.items[1].right = G.audio.muted ? 'NO' : 'SÍ';
      if (G.Input.hit('pause')) { this.state = this.prev; return; }
      this.pmenu.update();
      return;
    }
    if (G.Input.hit('pause') && (this.state === 'play' || this.state === 'count')) { this.prev = this.state; this.state = 'paused'; G.audio.sfx('back'); return; }
    this.t += dt;
    if (this.savedT > 0) this.savedT -= dt;
    if (this.state === 'count') {
      const k = Math.floor(this.t / 0.5);
      if (k !== this.tick) { this.tick = k; if (k < 3) G.audio.sfx('tick'); else if (k === 3) G.audio.sfx('go'); }
      if (this.t >= 1.75) { this.state = 'play'; this.t = 0; }
    } else if (this.state === 'play') {
      this.inst.update(dt);
      if (G.run.revived && !this.revived) { this.revived = true; this.savedT = 2.2; }
      if (G.run.hp <= 0) { this.state = 'dead'; this.t = 0; G.audio.play(null); G.audio.sfx('lose'); }
      else if (this.inst.done) { this.state = 'clear'; this.t = 0; G.audio.play(null); G.audio.sfx('win'); }
    } else if (this.state === 'dead') {
      if (this.t > 1.8) G.go(new GameOverScene());
    } else if (this.state === 'clear') {
      if (this.inst.parts) this.inst.parts.update(dt);
      if (this.t > 1.5) {
        if (this.n.type === 'boss') G.go(new EndScene());
        else G.go(new ResultScene(this.n, this.inst));
      }
    }
  }
  draw(cx) {
    this.inst.draw(cx);
    const h = this.inst.hud || {};
    G.drawTopBar(cx, { label: h.label || this.def.name, prog: h.prog });
    if (this.state === 'count') {
      const k = Math.floor(this.t / 0.5);
      cx.globalAlpha = 0.45; G.rect(cx, 0, 12, W, H, '#000'); cx.globalAlpha = 1;
      G.bigText(cx, this.def.name.toUpperCase(), 62, C.white, G.textW(this.def.name, 2) < 300 ? 2 : 1);
      G.bigText(cx, k < 3 ? String(3 - k) : '¡YA!', 86, k < 3 ? C.yellow : C.green, 4);
    }
    if (this.savedT > 0) G.bigText(cx, '¡LA ESTAMPITA TE SALVA!', 80, C.yellow, 1);
    if (this.state === 'dead') {
      cx.globalAlpha = Math.min(0.6, this.t * 0.6); G.rect(cx, 0, 0, W, H, C.dred); cx.globalAlpha = 1;
      G.bigText(cx, '¡AY!', 76, C.white, 4);
    }
    if (this.state === 'clear') {
      G.bigText(cx, this.n.type === 'boss' ? '¡VICTORIA!' : '¡SUPERADO!', 76, C.green, 3);
      if (!G.run.gameHits) G.bigText(cx, 'SIN UN RASGUÑO', 104, C.yellow, 1);
    }
    if (this.state === 'paused') {
      cx.globalAlpha = 0.7; G.rect(cx, 0, 0, W, H, '#000'); cx.globalAlpha = 1;
      art.panel(cx, 96, 56, 128, 70, '#111d35', '#83769c');
      G.text(cx, 'PAUSA', 160, 64, C.yellow, { align: 'center', shadow: true });
      this.pmenu.draw(cx);
    }
  }
}
G.MinigameScene = MinigameScene;

// ------------------------------------------------------------ RESULTADO DE UNA PRUEBA
class ResultScene {
  constructor(n, inst) { this.n = n; this.inst = inst; }
  enter() {
    const r = G.run, n = this.n;
    const elite = n.type === 'elite';
    const perfect = !r.gameHits;
    this.lines = [];
    const base = Math.round(6 + n.row * 1.5) + (elite ? 10 : 0);
    const coins = this.inst.coins ? this.inst.coins.got : 0;
    let money = base + coins + (perfect ? 5 : 0);
    this.lines.push(['RECOMPENSA', base + ' €']);
    if (coins) this.lines.push(['MONEDAS RECOGIDAS', '+' + coins + ' €']);
    if (perfect) this.lines.push(['SIN UN RASGUÑO', '+5 €']);
    const got = G.gain(money);
    if (G.has('monedero')) this.lines.push(['MONEDERO DE CUERO', '×1,5']);
    if (G.has('decimo') && G.chance(0.25)) { const v = G.gain(15, false); this.lines.push(['¡TOCÓ EL DÉCIMO!', '+' + v + ' €']); }
    if (perfect && G.has('pipas') && G.heal(1)) this.lines.push(['BOLSA DE PIPAS', '+1 ♥']);
    const pts = Math.round((100 + 50 * n.row) * (elite ? 1.5 : 1)) + (perfect ? 100 : 0);
    G.addScore(pts);
    this.lines.push(['PUNTOS', '+' + pts]);
    this.total = got;
    r.stats.won++;
    if (perfect) r.stats.perfect++;
    n.done = true;
    this.t = 0; this.shown = 0;
    G.audio.play('night');
  }
  update(dt) {
    this.t += dt;
    const s = Math.min(this.lines.length, Math.floor(this.t / 0.3));
    if (s > this.shown) { this.shown = s; G.audio.sfx('coin'); }
    if (G.Input.anyHit()) {
      if (this.shown < this.lines.length) { this.t = 99; return; }
      if (this.n.type === 'elite') G.go(new RewardScene('¡Prueba difícil superada! Elige un objeto:', G.itemChoices(3), backToMap));
      else backToMap();
    }
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    art.stars(cx, W, H, 5, G.time);
    G.drawTopBar(cx, { label: G.clock(), labelX: 150, right: G.run.score + ' PTS', rightC: C.green });
    art.panel(cx, 50, 22, 220, 134, '#111d35', C.green);
    G.text(cx, '¡SUPERADO!', 160, 30, C.green, { align: 'center', scale: 2, shadow: true });
    G.text(cx, G.GAMES[this.n.game].name.toUpperCase(), 160, 50, C.lav, { align: 'center' });
    this.lines.slice(0, this.shown).forEach(([a, b], i) => {
      G.text(cx, a, 62, 66 + i * 12, C.white);
      G.text(cx, b, 258, 66 + i * 12, b.includes('♥') ? C.red : b.includes('€') || b.includes('×') ? C.yellow : C.green, { align: 'right' });
    });
    if (this.shown >= this.lines.length) {
      G.rect(cx, 62, 66 + this.lines.length * 12, 196, 1, '#4a4a6a');
      G.text(cx, 'TOTAL: +' + this.total + ' €', 160, 70 + this.lines.length * 12, C.yellow, { align: 'center' });
      if (Math.floor(G.time * 3) % 2) G.text(cx, 'PULSA A', 160, 146, C.white, { align: 'center' });
    }
  }
}

// ------------------------------------------------------------ BAZAR 24H
class ShopScene {
  constructor(n) { this.n = n; }
  enter() {
    this.t = 0;
    G.audio.play('shop');
    this.say = '¡Buenas noches! Bueno, buenas... lo que sea. ¿Qué te pongo?';
    this.stock = G.itemChoices(3).map(id => ({ id, kind: 'item', price: Math.round(G.ITEMS[id].price * G.rand(0.9, 1.15)) }));
    for (const k of ['bocadillo', 'churros', 'bono']) this.stock.push({ id: k, kind: 'cons', price: G.CONSUMABLES[k].price });
    this.build();
  }
  build(keep) {
    const items = this.stock.map(s => {
      const info = s.kind === 'item' ? G.ITEMS[s.id] : G.CONSUMABLES[s.id];
      return { label: info.name, right: s.sold ? 'VENDIDO' : s.price + ' €', disabled: !!s.sold, s, fn: () => this.buy(s) };
    });
    items.push({ label: 'SALIR', fn: () => { this.n.done = true; backToMap(); }, sfx: 'back' });
    const prev = this.menu ? this.menu.i : 0;
    this.menu = new Menu(items, { x: 138, y: 36, w: 170, lh: 12 });
    if (keep) { this.menu.i = prev; if (this.menu.items[prev].disabled) this.menu.move(1); }
  }
  buy(s) {
    const r = G.run;
    if (r.money < s.price) { this.say = 'No te llega, chaval. Aquí no se fía.'; G.audio.sfx('deny'); return; }
    if (s.id === 'bocadillo' && r.hp >= r.maxHp) { this.say = 'Si estás lleno, hombre. Guárdate el dinero.'; G.audio.sfx('deny'); return; }
    r.money -= s.price;
    G.audio.sfx('buy');
    if (s.kind === 'item') { G.giveItem(s.id); s.sold = true; this.say = G.pick(['Buena elección. Sin devoluciones.', '¡Eso es calidad!', 'Me lo trajo mi primo de Cuenca.']); }
    else if (s.id === 'bocadillo') { G.heal(2); s.price = Math.round(s.price * 1.4); this.say = 'Con su limoncito. ¡Que aproveche!'; }
    else if (s.id === 'churros') { r.maxHp++; G.heal(1); s.price = Math.round(s.price * 1.5); this.say = '¡Recién hechos! Bueno, de esta tarde.'; }
    else if (s.id === 'bono') { r.bono++; s.price = Math.round(s.price * 1.4); this.say = 'Diez viajes no, uno. Pero te salta una calle.'; }
    this.build(true);
  }
  update(dt) {
    this.t += dt;
    if (G.Input.hit('b')) { this.n.done = true; backToMap(); return; }
    this.menu.update();
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, '#1a1030');
    // estanterías
    for (let y = 22; y < 140; y += 22) {
      G.rect(cx, 0, y + 16, 130, 3, '#5a3a20');
      for (let x = 4; x < 126; x += 7) { const c = ['#ff004d', '#29adff', '#ffec27', '#00e436', '#ff77a8', '#ffa300', '#fff1e8'][(x * 7 + y) % 7]; G.rect(cx, x, y + 6 + (x % 3), 5, 10 - (x % 3), c); G.rect(cx, x + 1, y + 8, 3, 2, '#ffffff60'); }
    }
    G.rect(cx, 0, 132, 130, 48, '#6a4a2a'); G.rect(cx, 0, 132, 130, 3, '#8a6a3a');
    // Paco, el dependiente fantasma
    G.drawScaled(cx, 'ghost', 44, 92 + Math.sin(this.t * 2) * 2, 3);
    G.rect(cx, 46, 88 + Math.sin(this.t * 2) * 2, 26, 4, '#ff004d'); G.rect(cx, 66, 90 + Math.sin(this.t * 2) * 2, 10, 2, '#ff004d');
    G.text(cx, 'PACO', 59, 140, C.yellow, { align: 'center' });
    // neón
    G.text(cx, 'BAZAR 24H', 65, 168, Math.floor(this.t * 2) % 7 ? C.pink : '#4a1030', { align: 'center', shadow: true });
    // bocadillo
    const lines = G.wrap(this.say, 110);
    art.panel(cx, 6, 18, 120, lines.length * 9 + 6, C.white, '#000');
    lines.forEach((l, i) => G.text(cx, l, 10, 22 + i * 9, C.ink));
    // lista
    G.drawTopBar(cx, { label: G.clock(), labelX: 150 });
    art.panel(cx, 128, 16, 188, 160, '#111d35', '#83769c');
    G.text(cx, 'PRODUCTOS', 222, 22, C.yellow, { align: 'center' });
    this.menu.draw(cx);
    const it = this.menu.items[this.menu.i];
    if (it && it.s) {
      const info = it.s.kind === 'item' ? G.ITEMS[it.s.id] : G.CONSUMABLES[it.s.id];
      G.rect(cx, 132, 128, 180, 1, '#4a4a6a');
      art.icon(cx, info.icon, 134, 134, 2);
      G.textBox(cx, info.desc, 160, 134, 150, C.white, { lh: 9 });
    } else G.textBox(cx, 'B: SALIR DEL BAZAR', 136, 140, 170, C.lav);
  }
}

// ------------------------------------------------------------ FUENTE / DESCANSO
class RestScene {
  constructor(n) { this.n = n; }
  enter() {
    this.t = 0; this.result = null;
    G.audio.play('night');
    this.menu = new Menu([
      { label: 'Beber agua y descansar', right: '+2 ♥', rightC: C.red, fn: () => { const h = G.heal(2); G.audio.sfx('heal'); this.done(h ? 'Agua fresquita. Te sientes mucho mejor. +' + h + ' ♥.' : 'Ya estabas como una rosa. Pero el agua está buena.'); } },
      { label: 'Rebuscar en la papelera', right: '¿?', fn: () => {
        const x = Math.random();
        if (x < 0.45) { const v = G.gain(G.irand(6, 14)); this.done('Encuentras ' + v + ' € entre envoltorios de pipas.'); }
        else if (x < 0.75) { const it = G.randomItem(); if (it) { G.giveItem(it); G.audio.sfx('item'); this.done('¡Alguien ha tirado esto! Consigues: ' + G.ITEMS[it].name + '.'); } else { const v = G.gain(15); this.done('Encuentras ' + v + ' €.'); } }
        else { const r = G.hurt('Te mordió una rata zombi en una papelera. Qué forma más tonta de acabar.'); this.done(r === 'dead' ? '' : '¡Una rata zombi! Te muerde y huye. -1 ♥.'); }
      } },
      { label: 'Mojarte la cara y seguir', right: '+50 PTS', rightC: C.green, fn: () => { G.addScore(50); G.run.minutes -= 10; this.done('Te espabilas y ganas diez minutos. +50 puntos.'); } }
    ], { x: 24, y: 120, w: 270, lh: 12 });
  }
  done(txt) { this.result = txt; this.t = 0; this.n.done = true; }
  update(dt) {
    this.t += dt;
    if (this.result !== null) { if (checkDeath()) return; if (G.Input.anyHit() && this.t > 0.3) backToMap(); return; }
    this.menu.update();
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    art.sky(cx, W, 90);
    art.stars(cx, W, 60, 21, G.time);
    art.moon(cx, 270, 30, 9);
    art.cobbles(cx, 0, 90, W, 90);
    const fx = 160, fy = 80, t = this.t;
    G.ellipse(cx, fx, fy + 10, 46, 12, '#4a4a5a');
    G.ellipse(cx, fx, fy + 8, 42, 10, '#1a3a6a');
    for (let i = 0; i < 6; i++) G.rect(cx, fx - 30 + i * 12 + Math.sin(t * 2 + i) * 2, fy + 6 + Math.cos(t * 3 + i), 3, 1, '#4a8ad0');
    G.rect(cx, fx - 3, fy - 30, 6, 38, '#6a6a7a'); G.ellipse(cx, fx, fy - 30, 10, 3, '#7a7a8a');
    for (let i = 0; i < 8; i++) { const k = (t * 1.5 + i / 8) % 1; G.rect(cx, fx + (i % 2 ? 1 : -1) * k * 12, fy - 32 + k * k * 36 - k * 10, 1, 2, C.blue); }
    art.banco(cx, 40, 104); art.banco(cx, 258, 104);
    art.lamp(cx, 22, 106, true, 50); art.lamp(cx, 298, 106, true, 50);
    G.drawFeet(cx, 'nico0', 90, 108, false);
    G.drawTopBar(cx, { label: G.clock(), labelX: 150 });
    art.panel(cx, 8, 112, W - 16, 64, '#000000e0', '#29adff');
    G.text(cx, 'LA FUENTE DE LA PLAZA', 160, 16, C.blue, { align: 'center', shadow: true });
    if (this.result !== null) {
      G.textBox(cx, this.result, 18, 122, W - 36, C.white, { lh: 10 });
      if (Math.floor(G.time * 3) % 2) G.text(cx, 'PULSA A', 160, 164, C.yellow, { align: 'center' });
    } else this.menu.draw(cx);
  }
}

// ------------------------------------------------------------ EVENTO
class EventScene {
  constructor(n) { this.n = n; }
  enter() {
    const r = G.run;
    r.seenEv = r.seenEv || [];
    let pool = G.EVENTS.filter(e => !r.seenEv.includes(e.id));
    if (!pool.length) { r.seenEv = []; pool = G.EVENTS.slice(); }
    this.ev = G.pick(pool);
    r.seenEv.push(this.ev.id);
    this.t = 0; this.result = null;
    G.audio.play('night');
    this.menu = new Menu(this.ev.choices.map(c => ({ label: c.label, disabled: c.cond ? !c.cond() : false, fn: () => { this.result = c.fx(); this.t = 0; this.n.done = true; } })), { x: 24, y: 132, w: 270, lh: 12 });
  }
  update(dt) {
    this.t += dt;
    if (this.result !== null) { if (checkDeath()) return; if (G.Input.anyHit() && this.t > 0.3) backToMap(); return; }
    if (this.t > 0.3) this.menu.update();
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, '#100a1e');
    art.stars(cx, W, H, 13, G.time);
    G.drawTopBar(cx, { label: G.clock(), labelX: 150 });
    art.panel(cx, 8, 16, W - 16, 160, '#111d35', C.yellow);
    G.circ(cx, 34, 40, 17, '#1a1a33'); G.ring(cx, 34, 40, 17, C.yellow);
    art.icon(cx, this.ev.icon, 24, 30, 2);
    G.text(cx, this.ev.title.toUpperCase(), 60, 26, C.yellow, { shadow: true });
    G.text(cx, this.n.name.toUpperCase(), 60, 38, C.lav);
    G.textBox(cx, typed(this.ev.text, this.t, 70), 18, 62, W - 36, C.white, { lh: 10 });
    if (this.result !== null) {
      G.rect(cx, 16, 118, W - 32, 1, '#4a4a6a');
      G.textBox(cx, this.result, 18, 124, W - 36, C.green, { lh: 10 });
      if (Math.floor(G.time * 3) % 2) G.text(cx, 'PULSA A', 160, 166, C.yellow, { align: 'center' });
    } else this.menu.draw(cx);
  }
}

// ------------------------------------------------------------ PUNTUACIÓN FINAL
function finalScore(won) {
  const r = G.run;
  const lines = [['PUNTOS DE LA NOCHE', r.score]];
  if (won) {
    lines.push(['LLEGAR A CASA', 2000]);
    lines.push(['VIDA RESTANTE ' + r.hp + ' × 150', r.hp * 150]);
    lines.push(['EUROS ' + r.money + ' × 3', r.money * 3]);
    const p = Math.max(0, 420 - r.minutes) * 3;
    lines.push(['PUNTUALIDAD', p]);
  }
  const total = lines.reduce((a, l) => a + l[1], 0);
  return { lines, total };
}

// ------------------------------------------------------------ VICTORIA
class EndScene {
  enter() {
    const r = G.run;
    r.won = true;
    r.minutes += G.irand(5, 15);
    G.save.data.wins = (G.save.data.wins || 0) + 1; G.save.write();
    this.t = 0; this.page = 0;
    this.pages = [
      'Son las ' + G.clock() + '.\nEl Coco se ha hecho pequeñito... era solo la sombra del gato del 3ºB.',
      'Metes la llave en el portal. Subes las escaleras de puntillas.',
      r.mamaVisto ? 'Tu madre está sentada en el sofá, a oscuras, con el móvil en la mano y el doble check azul.' : 'La luz del salón está encendida. Tu madre está en el sofá con los brazos cruzados.',
      '—¿Tú sabes qué hora es?\n—Mamá... no te lo vas a creer.'
    ];
    this.fs = finalScore(true);
    G.audio.play('dawn');
  }
  update(dt) {
    this.t += dt;
    if (!G.Input.anyHit() || this.t < 0.3) return;
    if (this.page < this.pages.length) {
      const s = this.pages[this.page];
      if (typed(s, this.t).length < s.length) { this.t = 99; return; }
      this.page++; this.t = 0; G.audio.sfx('move');
      return;
    }
    if (this.t < 0.3 + this.fs.lines.length * 0.3) { this.t = 99; return; }
    G.go(new NameScene(this.fs.total, true));
  }
  draw(cx) {
    const k = Math.min(1, this.page / this.pages.length);
    G.rect(cx, 0, 0, W, H, '#0b0b1a');
    // amanecer
    const sky = ['#0b0b1a', '#1d2b53', '#7e2553', '#ff77a8', '#ffa300'];
    const bands = Math.round(k * 4);
    for (let i = 0; i <= bands; i++) G.rect(cx, 0, 120 - i * 24, W, 24, sky[Math.min(4, bands - i)]);
    art.skyline(cx, W, 140, 3, '#141020', '#ffd27a');
    art.cobbles(cx, 0, 140, W, 40);
    G.drawFeet(cx, 'nico0', 150, 160, false);
    if (this.page >= 1) { G.rect(cx, 174, 112, 30, 48, '#2a1a10'); G.rect(cx, 176, 114, 26, 46, '#ffd27a'); }
    if (this.page < this.pages.length) {
      art.panel(cx, 16, 18, W - 32, 62, '#000000e0', C.yellow);
      const s = this.pages[this.page];
      G.textBox(cx, typed(s, this.t), 26, 28, W - 52, C.white, { lh: 11 });
      return;
    }
    art.panel(cx, 40, 16, 240, 156, '#111d35', C.yellow);
    G.text(cx, '¡HAS LLEGADO A CASA!', 160, 24, C.yellow, { align: 'center', scale: 1, shadow: true });
    const n = Math.min(this.fs.lines.length, Math.floor(this.t / 0.3));
    this.fs.lines.slice(0, n).forEach(([a, b], i) => { G.text(cx, a, 52, 42 + i * 12, C.white); G.text(cx, String(b), 268, 42 + i * 12, C.green, { align: 'right' }); });
    if (n >= this.fs.lines.length) {
      G.rect(cx, 52, 44 + n * 12, 216, 1, '#4a4a6a');
      G.text(cx, 'TOTAL ' + this.fs.total, 160, 50 + n * 12, C.yellow, { align: 'center', scale: 2, shadow: true });
      const s = G.run.stats;
      G.text(cx, s.won + ' PRUEBAS · ' + s.perfect + ' PERFECTAS · ' + s.coins + ' MONEDAS', 160, 140, C.lav, { align: 'center' });
      if (Math.floor(G.time * 3) % 2) G.text(cx, 'PULSA A PARA GUARDAR TU NOMBRE', 160, 156, C.white, { align: 'center' });
    }
  }
}

// ------------------------------------------------------------ FIN DE LA NOCHE
class GameOverScene {
  enter() {
    this.t = 0;
    G.audio.play('dead');
    this.fs = finalScore(false);
    const r = G.run;
    const n = r.node !== null ? node(r.node) : null;
    this.where = n ? n.name : 'la puerta de Rubén';
  }
  update(dt) {
    this.t += dt;
    if (this.t > 1 && G.Input.anyHit()) G.go(new NameScene(this.fs.total, false));
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, '#0a0510');
    art.stars(cx, W, H, 66, G.time);
    G.drawScaled(cx, 'nicoHurt', 140, 116, 3);
    G.text(cx, 'FIN DE LA NOCHE', 160, 20, C.red, { align: 'center', scale: 3, shadow: true, outline: true });
    G.textBox(cx, G.run.cause || 'Te quedaste por el camino.', 30, 50, 260, C.white, { align: 'center', lh: 10 });
    const s = G.run.stats;
    G.text(cx, 'LLEGASTE HASTA: ' + this.where.toUpperCase(), 160, 80, C.lav, { align: 'center' });
    G.text(cx, 'HORA: ' + G.clock() + ' · ' + s.won + ' PRUEBAS · ' + s.coins + ' MONEDAS', 160, 92, C.lav, { align: 'center' });
    G.text(cx, 'PUNTOS: ' + this.fs.total, 160, 104, C.yellow, { align: 'center', scale: 1, shadow: true });
    if (this.t > 1 && Math.floor(G.time * 3) % 2) G.text(cx, 'PULSA A PARA GUARDAR TU NOMBRE', 160, 168, C.white, { align: 'center' });
  }
}

// ------------------------------------------------------------ ESCRIBIR NOMBRE (estilo recreativa)
const KEYS = ['ABCDEFGHIJ', 'KLMNÑOPQRS', 'TUVWXYZ-.!', '0123456789'];
const MAXN = 10;
class NameScene {
  constructor(score, won) { this.score = score; this.won = won; }
  enter() {
    this.t = 0;
    this.name = (G.save.data.lastName || 'NICO').slice(0, MAXN);
    this.cx = 0; this.cy = 4; this.bx = 2; this.fresh = true;
    this.sent = false;
  }
  onKey(e) {
    if (this.sent) return false;
    const k = e.key;
    if (k === 'Enter') { this.submit(); return true; }
    if (k === 'Backspace') { this.erase(); return true; }
    if (k.length === 1 && /[a-zA-Z0-9ñÑ\-\.! ]/.test(k)) { this.type(k.toUpperCase()); return true; }
    return false;
  }
  type(ch) {
    if (this.fresh) { this.name = ''; this.fresh = false; }
    if (this.name.length < MAXN) { this.name += ch; G.audio.sfx('move'); } else G.audio.sfx('deny');
  }
  erase() { this.fresh = false; this.name = this.name.slice(0, -1); G.audio.sfx('back'); }
  submit() {
    const nm = this.name.trim();
    if (!nm) { G.audio.sfx('deny'); return; }
    this.sent = true;
    G.save.data.lastName = nm; G.save.write();
    G.audio.sfx('ok');
    const r = G.run;
    const entry = { name: nm, score: this.score, won: this.won, row: Math.max(0, r.row + 1), time: G.clock(), date: new Date().toISOString().slice(0, 10) };
    G.scores.submit(entry);
    G.go(new RankingScene(entry));
  }
  press() {
    if (this.cy < 4) this.type(KEYS[this.cy][this.cx]);
    else if (this.bx === 0) this.type(' ');
    else if (this.bx === 1) this.erase();
    else this.submit();
  }
  update(dt) {
    this.t += dt;
    if (this.sent) return;
    const I = G.Input;
    if (I.hit('left')) { if (this.cy < 4) this.cx = (this.cx + 9) % 10; else this.bx = (this.bx + 2) % 3; G.audio.sfx('move'); }
    if (I.hit('right')) { if (this.cy < 4) this.cx = (this.cx + 1) % 10; else this.bx = (this.bx + 1) % 3; G.audio.sfx('move'); }
    if (I.hit('up')) { this.cy = (this.cy + 4) % 5; G.audio.sfx('move'); }
    if (I.hit('down')) { this.cy = (this.cy + 1) % 5; G.audio.sfx('move'); }
    if (I.hit('b')) this.erase();
    const tp = I.tap;
    if (tp) {
      for (let j = 0; j < 4; j++) for (let i = 0; i < 10; i++) {
        const x = 78 + i * 17, y = 72 + j * 16;
        if (tp.x >= x - 2 && tp.x < x + 14 && tp.y >= y - 3 && tp.y < y + 12) { this.cx = i; this.cy = j; this.press(); return; }
      }
      [[70, 54], [138, 50], [202, 48]].forEach(([x, w], i) => { if (tp.x >= x && tp.x < x + w && tp.y >= 136 && tp.y < 150) { this.cy = 4; this.bx = i; this.press(); } });
      return;
    }
    if (I.hit('a')) this.press();
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    art.stars(cx, W, H, 99, G.time);
    G.text(cx, this.won ? '¡HAS VUELTO A CASA!' : 'GUARDA TU PUNTUACIÓN', 160, 10, this.won ? C.yellow : C.lav, { align: 'center', shadow: true });
    G.text(cx, String(this.score), 160, 22, C.green, { align: 'center', scale: 2, shadow: true });
    G.text(cx, 'PUNTOS', 160, 40, C.green, { align: 'center' });
    // casilla del nombre
    art.panel(cx, 90, 50, 140, 15, '#000', C.yellow);
    if (this.fresh && this.name) G.rect(cx, 95, 52, G.textW(this.name) + 2, 10, '#29adff80');
    G.text(cx, this.name + (Math.floor(G.time * 3) % 2 && this.name.length < MAXN ? '_' : ''), 96, 54, C.white);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 10; i++) {
      const x = 78 + i * 17, y = 72 + j * 16, sel = this.cy === j && this.cx === i;
      G.rect(cx, x - 2, y - 3, 15, 13, sel ? C.yellow : '#1a1a33');
      G.text(cx, KEYS[j][i], x + 5, y, sel ? C.ink : C.white, { align: 'center' });
    }
    [['ESPACIO', 70, 54], ['BORRAR', 138, 50], ['OK', 202, 48]].forEach(([l, x, w], i) => {
      const sel = this.cy === 4 && this.bx === i;
      G.rect(cx, x, 136, w, 14, sel ? (i === 2 ? C.green : C.yellow) : '#1a1a33');
      G.text(cx, l, x + w / 2, 140, sel ? C.ink : i === 2 ? C.green : C.white, { align: 'center' });
    });
    G.text(cx, G.Input.lastDevice === 'touch' ? 'TOCA LAS LETRAS · OK PARA GUARDAR' : 'ESCRIBE CON EL TECLADO · ENTER PARA GUARDAR', 160, 162, '#8a8aa8', { align: 'center' });
  }
}

// ------------------------------------------------------------ RANKING
G.scores = {
  local() { return (G.save.data.scores || []).slice(); },
  addLocal(e) {
    const l = this.local();
    l.push(e);
    l.sort((a, b) => b.score - a.score);
    G.save.data.scores = l.slice(0, 20);
    G.save.write();
  },
  async req(method, body) {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const tm = setTimeout(() => ctl && ctl.abort(), 6000);
    try {
      const res = await fetch('api/scores', { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal: ctl ? ctl.signal : undefined });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) return null;
      return await res.json();
    } catch (e) { return null; } finally { clearTimeout(tm); }
  },
  submit(e) {
    this.addLocal(e);
    this.pending = this.req('POST', e);
    return this.pending;
  },
  async top() {
    if (this.pending) { await this.pending; this.pending = null; }
    const d = await this.req('GET');
    return d && Array.isArray(d.scores) ? d.scores : null;
  }
};

class RankingScene {
  constructor(entry) { this.entry = entry; }
  enter() {
    this.t = 0; this.tab = 'global'; this.global = null; this.loading = true;
    G.audio.play('night');
    G.scores.top().then(s => { this.global = s; this.loading = false; if (!s) this.tab = 'local'; });
  }
  update(dt) {
    this.t += dt;
    if (G.Input.hit('left') || G.Input.hit('right') || (G.Input.tap && G.Input.tap.y < 30)) { this.tab = this.tab === 'global' ? 'local' : 'global'; G.audio.sfx('move'); return; }
    if ((G.Input.hit('a') || G.Input.hit('b') || (G.Input.tap && G.Input.tap.y > 150)) && this.t > 0.4) G.go(new TitleScene());
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    art.stars(cx, W, H, 17, G.time);
    G.text(cx, 'RÉCORDS', 160, 6, C.yellow, { align: 'center', scale: 2, shadow: true });
    const tabs = [['global', 'MUNDIAL'], ['local', 'ESTE DISPOSITIVO']];
    tabs.forEach(([k, l], i) => {
      const x = i ? 196 : 104, sel = this.tab === k;
      G.text(cx, l, x, 26, sel ? C.yellow : '#6a6a8a', { align: 'center', shadow: true });
      if (sel) G.rect(cx, x - G.textW(l) / 2, 34, G.textW(l), 1, C.yellow);
    });
    art.panel(cx, 20, 40, 280, 116, '#111d35', '#83769c');
    let list = this.tab === 'global' ? this.global : G.scores.local();
    if (this.tab === 'global' && this.loading) { G.text(cx, 'CARGANDO...', 160, 90, C.lav, { align: 'center' }); }
    else if (this.tab === 'global' && !list) { G.textBox(cx, 'El ranking mundial no está disponible ahora mismo. Tus puntos se guardan en este dispositivo.', 34, 80, 252, C.lav, { align: 'center', lh: 10 }); }
    else if (!list || !list.length) { G.text(cx, 'TODAVÍA NO HAY NADIE. ¡SÉ EL PRIMERO!', 160, 90, C.lav, { align: 'center' }); }
    else {
      G.text(cx, '#', 30, 46, '#6a6a8a'); G.text(cx, 'NOMBRE', 46, 46, '#6a6a8a'); G.text(cx, 'LLEGÓ', 196, 46, '#6a6a8a', { align: 'center' }); G.text(cx, 'PUNTOS', 290, 46, '#6a6a8a', { align: 'right' });
      list.slice(0, 10).forEach((e, i) => {
        const y = 57 + i * 10;
        const me = this.entry && e.name === this.entry.name && e.score === this.entry.score && e.time === this.entry.time;
        const col = me ? (Math.floor(G.time * 4) % 2 ? C.yellow : C.white) : i === 0 ? C.yellow : C.white;
        if (me) G.rect(cx, 24, y - 2, 272, 9, '#ffec2722');
        G.text(cx, String(i + 1), 30, y, col);
        G.text(cx, String(e.name).slice(0, 12), 46, y, col);
        G.text(cx, e.won ? '★ ' + (e.time || '') : 'FILA ' + (e.row || 0), 196, y, e.won ? C.green : '#8a8aa8', { align: 'center' });
        G.text(cx, String(e.score), 290, y, col, { align: 'right' });
      });
    }
    G.text(cx, '← → CAMBIAR   A: VOLVER', 160, 164, C.lav, { align: 'center' });
  }
}
G.RankingScene = RankingScene;

// accesos directos para probar pantallas sueltas (?scene=...)
G.debugScenes = {
  shop: n => new ShopScene(n), rest: n => new RestScene(n), event: n => new EventScene(n),
  end: () => new EndScene(), over: () => { G.run.cause = 'Los zombis de la plaza te rodearon.'; return new GameOverScene(); },
  name: () => new NameScene(4321, true), rank: () => new RankingScene(null), intro: () => new IntroScene(),
  howto: () => new HowToScene(), reward: () => new RewardScene('Elige un objeto:', G.itemChoices(3), backToMap)
};
})();
