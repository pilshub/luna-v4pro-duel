'use strict';
// =====================================================================
//  ESCENAS: título, cómo se juega, intro, finales, nombre y ranking
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

const titleFont = (cx, str, x, y, scale, col = C.yellow, sh = C.dred) => {
  G.text(cx, str, x, y + scale, '#000', { align: 'center', scale });
  G.text(cx, str, x, y, col, { align: 'center', scale, shadow: sh, outline: true });
};
const typed = (str, t, speed = 45) => str.slice(0, Math.floor(t * speed));
const startRun = () => { G.newRun(); G.go(new IntroScene()); };

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
    this.menu = new Menu([
      { label: 'JUGAR', fn: startRun },
      { label: 'RÉCORDS', fn: () => G.go(new RankingScene(null)) },
      { label: 'CÓMO SE JUEGA', fn: () => G.go(new HowToScene()) },
      { label: 'SONIDO', right: G.audio.muted ? 'NO' : 'SÍ', fn: () => { G.audio.toggleMute(); this.menu.items[3].right = G.audio.muted ? 'NO' : 'SÍ'; }, sfx: 'move' }
    ], { x: 160, y: 104, w: 120, lh: 12, align: 'center' });
    const sc = G.save.data.scores;
    this.best = sc && sc.length ? sc[0] : null;
  }
  update(dt) { this.t += dt; this.menu.update(); }
  draw(cx) {
    const t = this.t;
    this.bg.draw(cx, t);
    // un zombi asoma por la alcantarilla de vez en cuando
    const zk = t % 9;
    G.ellipse(cx, 236, 168, 9, 2, '#111');
    if (zk > 5 && zk < 8) {
      const k = Math.sin((zk - 5) / 3 * Math.PI);
      cx.save(); cx.beginPath(); cx.rect(220, 140, 34, 28); cx.clip();
      G.drawFeet(cx, 'zombie0', 236, 168 + 15 - k * 12, true);
      cx.restore();
    }
    G.drawFeet(cx, Math.floor(t * 8) % 2 ? 'chico1' : 'chico2', 120, 166, false);
    G.ellipse(cx, 120, 166, 5, 1, '#00000080');
    cx.globalAlpha = 0.55; G.rect(cx, 70, 96, 180, 54, '#000'); cx.globalAlpha = 1;
    titleFont(cx, 'EL RETORNO', 160, 30 + Math.round(Math.sin(t * 2) * 1.5), 4);
    G.text(cx, 'UNA NOCHE CUALQUIERA. UNA CIUDAD CUALQUIERA.', 160, 66, C.lav, { align: 'center', shadow: true });
    G.text(cx, 'AYUDA AL CHICO A VOLVER A CASA', 160, 78, C.white, { align: 'center', shadow: true });
    this.menu.draw(cx);
    if (this.best) G.text(cx, 'RÉCORD: ' + this.best.name + ' · ' + this.best.score, 160, 158, C.yellow, { align: 'center', shadow: true });
    G.text(cx, G.Input.lastDevice === 'touch' ? 'TOCA "JUGAR" PARA EMPEZAR' : 'FLECHAS + ESPACIO · M = SONIDO', 160, 170, '#8a8aa8', { align: 'center', shadow: true });
  }
}
G.TitleScene = TitleScene;

// ------------------------------------------------------------ CÓMO SE JUEGA
class HowToScene {
  enter() { this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 0.3 && G.Input.anyHit()) G.go(new TitleScene()); }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    art.panel(cx, 8, 8, W - 16, H - 16, '#111d35', '#83769c');
    G.text(cx, 'CÓMO SE JUEGA', 160, 16, C.yellow, { align: 'center', shadow: true });
    G.textBox(cx, 'La calle avanza sola. Lleva al chico hasta casa esquivando todo lo que sale de repente. Si te tocan, pierdes un corazón.', 18, 30, 284, C.white, { lh: 10 });
    const rows = [
      ['mi_zombis', 'Cada noche son 6 tramos distintos, al azar.'],
      ['coin', 'Coge monedas: suman puntos.'],
      ['it_bocadillo', 'Los bocadillos te dan un corazón.'],
      ['chanclaP', 'Al final, El Coco: coge chanclas y se las tiras.']
    ];
    rows.forEach(([ic, tx], i) => { art.icon(cx, ic, 18, 66 + i * 14, 1); G.text(cx, tx, 34, 68 + i * 14, C.white); });
    G.textBox(cx, 'MÓVIL: joystick para moverte, botón A para esquivar.\nTECLADO: flechas o WASD para moverte, ESPACIO para esquivar, P pausa, M sonido.', 18, 126, 284, C.lav, { lh: 10 });
    G.text(cx, 'A: VOLVER', W - 18, 164, C.yellow, { align: 'right' });
  }
}

// ------------------------------------------------------------ INTRO
const INTRO = [
  'Sábado, 00:40.\nSales del cumpleaños de Rubén, en la otra punta de la ciudad.',
  'Tu madre fue muy clara:\n"A la una en casa. NI UN MINUTO MÁS."',
  'Pero esta noche la ciudad está rara.\nMuy, muy rara...'
];
class IntroScene {
  enter() { this.t = 0; this.page = 0; this.bg = new StreetBg(7); G.audio.play('night'); }
  update(dt) {
    this.t += dt;
    if (G.Input.anyHit()) {
      const full = typed(INTRO[this.page], this.t).length >= INTRO[this.page].length;
      if (!full) { this.t = 99; return; }
      this.page++; this.t = 0; G.audio.sfx('move');
      if (this.page >= INTRO.length) G.go(new G.GameScene());
    }
  }
  draw(cx) {
    this.bg.draw(cx, G.time, this.page >= 2 ? 30 : 8);
    if (this.page >= 2) { cx.globalAlpha = 0.2 + Math.sin(G.time * 8) * 0.1; G.rect(cx, 0, 0, W, H, C.plum); cx.globalAlpha = 1; }
    G.drawFeet(cx, 'chico0', 120, 166, false);
    art.panel(cx, 16, 24, W - 32, 56, '#000000e0', '#83769c');
    const s = INTRO[this.page] || '';
    G.textBox(cx, typed(s, this.t), 26, 34, W - 52, C.white, { lh: 11 });
    if (typed(s, this.t).length >= s.length && Math.floor(G.time * 3) % 2) G.text(cx, '↓', W - 28, 68, C.yellow);
    G.text(cx, 'A: SEGUIR', W - 8, 170, '#8a8aa8', { align: 'right', shadow: true });
  }
}

// ------------------------------------------------------------ VICTORIA
class EndScene {
  enter() {
    const r = G.run;
    G.save.data.wins = (G.save.data.wins || 0) + 1; G.save.write();
    this.t = 0; this.page = 0;
    this.pages = [
      'Son las ' + G.clock() + '.\nEl Coco se ha hecho pequeñito... era la sombra del gato del 3ºB.',
      'Subes las escaleras de puntillas. La luz del salón está encendida.',
      '—¿Tú sabes qué hora es?\n—Mamá... no te lo vas a creer.'
    ];
    const base = Math.floor(r.score);
    this.lines = [['PUNTOS DEL CAMINO', base], ['VIDA RESTANTE ' + r.hp + ' × 500', r.hp * 500]];
    if (!r.hits) this.lines.push(['¡SIN UN SOLO GOLPE!', 2000]);
    this.total = this.lines.reduce((a, l) => a + l[1], 0);
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
    if (this.t < 0.3 + this.lines.length * 0.3) { this.t = 99; return; }
    G.go(new NameScene(this.total, true));
  }
  draw(cx) {
    const k = Math.min(1, this.page / this.pages.length);
    G.rect(cx, 0, 0, W, H, '#0b0b1a');
    const sky = ['#0b0b1a', '#1d2b53', '#7e2553', '#ff77a8', '#ffa300'];
    const bands = Math.round(k * 4);
    for (let i = 0; i <= bands; i++) G.rect(cx, 0, 120 - i * 24, W, 24, sky[Math.min(4, bands - i)]);
    art.skyline(cx, W, 140, 3, '#141020', '#ffd27a');
    art.cobbles(cx, 0, 140, W, 40);
    G.rect(cx, 174, 112, 30, 48, '#2a1a10'); G.rect(cx, 176, 114, 26, 46, '#ffd27a');
    G.drawFeet(cx, 'chico0', 150, 160, false);
    if (this.page < this.pages.length) {
      art.panel(cx, 16, 18, W - 32, 62, '#000000e0', C.yellow);
      G.textBox(cx, typed(this.pages[this.page], this.t), 26, 28, W - 52, C.white, { lh: 11 });
      return;
    }
    art.panel(cx, 40, 16, 240, 150, '#111d35', C.yellow);
    G.text(cx, '¡HAS LLEGADO A CASA!', 160, 26, C.yellow, { align: 'center', shadow: true });
    const n = Math.min(this.lines.length, Math.floor(this.t / 0.3));
    this.lines.slice(0, n).forEach(([a, b], i) => { G.text(cx, a, 52, 46 + i * 12, C.white); G.text(cx, String(b), 268, 46 + i * 12, C.green, { align: 'right' }); });
    if (n >= this.lines.length) {
      G.rect(cx, 52, 48 + n * 12, 216, 1, '#4a4a6a');
      G.text(cx, 'TOTAL ' + this.total, 160, 56 + n * 12, C.yellow, { align: 'center', scale: 2, shadow: true });
      G.text(cx, G.run.coins + ' MONEDAS · LLEGADA ' + G.clock(), 160, 130, C.lav, { align: 'center' });
      if (Math.floor(G.time * 3) % 2) G.text(cx, 'PULSA A PARA GUARDAR TU NOMBRE', 160, 150, C.white, { align: 'center' });
    }
  }
}
G.EndScene = EndScene;

// ------------------------------------------------------------ FIN DE LA NOCHE
class GameOverScene {
  enter() { this.t = 0; G.audio.play('dead'); this.total = Math.floor(G.run.score); }
  update(dt) { this.t += dt; if (this.t > 1 && G.Input.anyHit()) G.go(new NameScene(this.total, false)); }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, '#0a0510');
    art.stars(cx, W, H, 66, G.time);
    G.drawScaled(cx, 'chicoHurt', 145, 118, 3);
    G.text(cx, 'FIN DE LA NOCHE', 160, 18, C.red, { align: 'center', scale: 3, shadow: true, outline: true });
    G.textBox(cx, G.run.cause || 'Te quedaste por el camino.', 30, 48, 260, C.white, { align: 'center', lh: 10 });
    G.text(cx, 'LLEGASTE AL TRAMO ' + G.run.stage + ' DE ' + G.STAGES + ' · ' + G.run.coins + ' MONEDAS', 160, 80, C.lav, { align: 'center' });
    G.text(cx, 'PUNTOS: ' + this.total, 160, 94, C.yellow, { align: 'center', scale: 2, shadow: true });
    if (this.t > 1 && Math.floor(G.time * 3) % 2) G.text(cx, 'PULSA A PARA GUARDAR TU NOMBRE', 160, 168, C.white, { align: 'center' });
  }
}
G.GameOverScene = GameOverScene;

// ------------------------------------------------------------ ESCRIBIR NOMBRE (estilo recreativa)
const KEYS = ['ABCDEFGHIJ', 'KLMNÑOPQRS', 'TUVWXYZ-.!', '0123456789'];
const MAXN = 10;
class NameScene {
  constructor(score, won) { this.score = score; this.won = won; }
  enter() {
    this.t = 0;
    this.name = (G.save.data.lastName || '').slice(0, MAXN);
    this.cx = 0; this.cy = this.name ? 4 : 0; this.bx = 2; this.fresh = true;
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
    const entry = { name: nm, score: this.score, won: this.won, row: r.won ? G.STAGES + 1 : r.stage, time: G.clock(), date: new Date().toISOString().slice(0, 10) };
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
        G.text(cx, e.won ? '★ ' + (e.time || '') : 'TRAMO ' + (e.row || 0), 196, y, e.won ? C.green : '#8a8aa8', { align: 'center' });
        G.text(cx, String(e.score), 290, y, col, { align: 'right' });
      });
    }
    G.text(cx, '← → CAMBIAR   A: VOLVER', 160, 164, C.lav, { align: 'center' });
  }
}
G.RankingScene = RankingScene;

// accesos directos para probar pantallas sueltas (?scene=...)
G.debugScenes = {
  end: () => new EndScene(), over: () => { G.run.cause = 'Los zombis te rodearon.'; return new GameOverScene(); },
  name: () => new NameScene(4321, true), rank: () => new RankingScene(null), intro: () => new IntroScene(),
  howto: () => new HowToScene(), game: () => new G.GameScene()
};
})();
