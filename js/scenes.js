'use strict';
// =====================================================================
//  ESCENAS (vertical 9:16): título, cómo se juega, finales, nombre y récords
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
const blink = () => Math.floor(G.time * 3) % 2;
const startRun = () => { G.newRun(); G.go(new G.GameScene()); };
const night = (cx, seed) => { G.rect(cx, 0, 0, W, H, C.night); art.stars(cx, W, H, seed, G.time); };

// calle que sube sola de fondo (título)
class StreetBg {
  constructor() { this.street = new G.Street(); this.cam = 0; this.street.ensure(0); }
  draw(cx, dt) {
    this.cam += dt * 22;
    this.street.ensure(this.cam);
    this.street.draw(cx, this.cam);
  }
}

// ------------------------------------------------------------ TÍTULO
class TitleScene {
  enter() {
    this.t = 0;
    this.bg = new StreetBg();
    G.audio.play('night');
    this.menu = new Menu([
      { label: 'JUGAR', fn: startRun },
      { label: 'RÉCORDS', fn: () => G.go(new RankingScene(null)) },
      { label: 'CÓMO SE JUEGA', fn: () => G.go(new HowToScene()) },
      { label: 'SONIDO', right: G.audio.muted ? 'NO' : 'SÍ', fn: () => { G.audio.toggleMute(); this.menu.items[3].right = G.audio.muted ? 'NO' : 'SÍ'; }, sfx: 'move' }
    ], { x: 90, y: 132, w: 110, lh: 16, align: 'center' });
    const sc = G.save.data.scores;
    this.best = sc && sc.length ? sc[0] : null;
    this.dt = 0;
  }
  update(dt) { this.t += dt; this.dt = dt; this.menu.update(); }
  draw(cx) {
    const t = this.t;
    this.bg.draw(cx, this.dt);
    cx.globalAlpha = 0.5; G.rect(cx, 0, 0, W, H, '#05050f'); cx.globalAlpha = 1;
    G.ellipse(cx, 90, 262, 5, 1, '#00000080');
    G.drawFeet(cx, Math.floor(t * 8) % 2 ? 'chicoBack1' : 'chicoBack2', 90, 262, false);
    art.moon(cx, 150, 30, 9);
    titleFont(cx, 'EL', 90, 36 + Math.round(Math.sin(t * 2) * 1.5), 3);
    titleFont(cx, 'RETORNO', 90, 62 + Math.round(Math.sin(t * 2 + 0.6) * 1.5), 3);
    cx.globalAlpha = 0.6; G.rect(cx, 24, 122, W - 48, 70, '#000'); cx.globalAlpha = 1;
    this.menu.draw(cx);
    if (this.best) G.text(cx, 'RÉCORD: ' + this.best.name + ' · ' + this.best.score, 90, 212, C.yellow, { align: 'center', shadow: true });
    G.textBox(cx, G.Input.lastDevice === 'touch' ? 'TOCA "JUGAR" PARA EMPEZAR' : 'FLECHAS + ESPACIO · M = SONIDO', 10, 296, W - 20, '#9a9ab8', { align: 'center', shadow: true });
  }
}
G.TitleScene = TitleScene;

// ------------------------------------------------------------ CÓMO SE JUEGA
class HowToScene {
  enter() { this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 0.3 && G.Input.anyHit()) G.go(new TitleScene()); }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    art.panel(cx, 6, 8, W - 12, H - 16, '#111d35', '#83769c');
    G.text(cx, 'CÓMO SE JUEGA', 90, 18, C.yellow, { align: 'center', shadow: true });
    let y = 34;
    y += G.textBox(cx, 'La calle avanza sola. Lleva al chico hasta casa esquivando todo lo que sale. Si te toca algo, pierdes un corazón.', 14, y, W - 28, C.white, { lh: 10 }) + 8;
    const rows = [
      ['mi_zombis', 'Cada partida: 6 tramos distintos, al azar.'],
      ['coin', 'Las monedas suman puntos.'],
      ['it_bocadillo', 'Los bocadillos dan un corazón.'],
      ['chanclaP', 'Al final, El Coco: coge chanclas y se lanzan solas.']
    ];
    for (const [ic, tx] of rows) {
      art.icon(cx, ic, 14, y - 2, 1);
      y += G.textBox(cx, tx, 30, y, W - 44, C.white, { lh: 10 }) + 6;
    }
    y += 6;
    G.text(cx, 'MÓVIL', 14, y, C.green); y += 11;
    y += G.textBox(cx, 'Joystick para moverte (donde pongas el dedo). Botón A para esquivar.', 14, y, W - 28, C.lav, { lh: 10 }) + 6;
    G.text(cx, 'TECLADO', 14, y, C.green); y += 11;
    G.textBox(cx, 'Flechas o WASD para moverte. Espacio para esquivar. P pausa. M sonido.', 14, y, W - 28, C.lav, { lh: 10 });
    G.text(cx, 'A: VOLVER', 90, 298, C.yellow, { align: 'center' });
  }
}

// ------------------------------------------------------------ VICTORIA
let portalCanvas = null;
class EndScene {
  enter() {
    const r = G.run;
    G.save.data.wins = (G.save.data.wins || 0) + 1; G.save.write();
    this.t = 0;
    const base = Math.floor(r.score);
    this.lines = [['CAMINO', base], ['VIDA ' + r.hp + ' × 500', r.hp * 500]];
    if (!r.hits) this.lines.push(['SIN GOLPES', 2000]);
    this.total = this.lines.reduce((a, l) => a + l[1], 0);
    portalCanvas = portalCanvas || G.makeSeg(150, 0, 'portal');
    G.audio.play('dawn');
  }
  update(dt) {
    this.t += dt;
    if (!G.Input.anyHit() || this.t < 0.8) return;
    if (this.t < 0.8 + this.lines.length * 0.3) { this.t = 99; return; }
    G.go(new NameScene(this.total, true));
  }
  draw(cx) {
    G.rect(cx, 0, 0, W, H, C.night);
    cx.drawImage(portalCanvas, 0, 0);
    cx.globalAlpha = 0.25; G.rect(cx, 0, 0, W, 150, C.orange); cx.globalAlpha = 1;
    G.drawFeet(cx, 'chicoBack0', 90, 84, false);
    art.panel(cx, 12, 108, W - 24, 196, '#111d35', C.yellow);
    G.textBox(cx, '¡HAS LLEGADO A CASA!', 20, 118, W - 40, C.yellow, { align: 'center', shadow: true });
    const n = Math.min(this.lines.length, Math.floor(this.t / 0.3));
    this.lines.slice(0, n).forEach(([a, b], i) => { G.text(cx, a, 22, 140 + i * 14, C.white); G.text(cx, String(b), W - 22, 140 + i * 14, C.green, { align: 'right' }); });
    if (n >= this.lines.length) {
      const y = 144 + n * 14;
      G.rect(cx, 22, y, W - 44, 1, '#4a4a6a');
      G.text(cx, 'TOTAL', 90, y + 8, C.lav, { align: 'center' });
      G.text(cx, String(this.total), 90, y + 20, C.yellow, { align: 'center', scale: 2, shadow: true });
      G.text(cx, G.run.coins + ' MONEDAS', 90, y + 42, C.lav, { align: 'center' });
      G.textBox(cx, 'PULSA A PARA GUARDAR TU NOMBRE', 20, 278, W - 40, C.white, { align: 'center' });
    }
  }
}
G.EndScene = EndScene;

// ------------------------------------------------------------ FIN DE LA PARTIDA
class GameOverScene {
  enter() { this.t = 0; G.audio.play('dead'); this.total = Math.floor(G.run.score); }
  update(dt) { this.t += dt; if (this.t > 1 && G.Input.anyHit()) G.go(new NameScene(this.total, false)); }
  draw(cx) {
    night(cx, 66);
    G.text(cx, 'SE ACABÓ', 90, 30, C.red, { align: 'center', scale: 3, shadow: true, outline: true });
    G.drawScaled(cx, 'chicoHurt', 75, 70, 3);
    G.textBox(cx, G.run.cause || 'Te quedaste por el camino.', 14, 126, W - 28, C.white, { align: 'center', lh: 10 });
    G.text(cx, 'TRAMO ' + G.run.stage + ' DE ' + G.STAGES, 90, 174, C.lav, { align: 'center' });
    G.text(cx, G.run.coins + ' MONEDAS', 90, 186, C.lav, { align: 'center' });
    G.text(cx, 'PUNTOS', 90, 206, C.yellow, { align: 'center' });
    G.text(cx, String(this.total), 90, 218, C.yellow, { align: 'center', scale: 2, shadow: true });
    if (this.t > 1) G.textBox(cx, 'PULSA A PARA GUARDAR TU NOMBRE', 20, 280, W - 40, C.white, { align: 'center' });
  }
}
G.GameOverScene = GameOverScene;

// ------------------------------------------------------------ ESCRIBIR NOMBRE (estilo recreativa)
const KEYS = ['ABCDEFGHIJ', 'KLMNÑOPQRS', 'TUVWXYZ-.!', '0123456789'].map(r => Array.from(r))
  .concat([G.EMOTES.slice(0, 10), G.EMOTES.slice(10, 20)]);
const NR = KEYS.length, MAXN = 10, KX = 16, KY = 118, KW = 15, KH = 17;
const rowY = j => KY + j * KH + (j >= 4 ? 12 : 0);
const BY = rowY(NR - 1) + KH + 4;
const BTNS = [['ESPACIO', 12, 54], ['BORRAR', 70, 46], ['OK', 120, 48]];
const chars = s => Array.from(s);
class NameScene {
  constructor(score, won) { this.score = score; this.won = won; }
  enter() {
    this.t = 0;
    this.name = (G.save.data.lastName || '').slice(0, MAXN);
    this.cx = 0; this.cy = this.name ? NR : 0; this.bx = 2;
    this.sent = false;
  }
  onKey(e) {
    if (this.sent || this.t < 0.6) return false;
    const k = e.key;
    if (k === 'Enter') { this.submit(); return true; }
    if (k === 'Backspace') { this.erase(); return true; }
    // la barra espaciadora pulsa la tecla marcada (para elegir emotes); el espacio se escribe con ESPACIO
    if (k.length === 1 && /[a-zA-Z0-9ñÑ\-\.!]/.test(k)) { this.type(k.toUpperCase()); return true; }
    const emo = k.replace(/\uFE0F/g, '');
    if (G.isEmote(emo)) { this.type(emo); return true; }
    return false;
  }
  type(ch) {
    if (chars(this.name).length < MAXN) { this.name += ch; G.audio.sfx('move'); } else G.audio.sfx('deny');
  }
  erase() { this.name = chars(this.name).slice(0, -1).join(''); G.audio.sfx('back'); }
  submit() {
    const nm = this.name.trim();
    if (!nm) { G.audio.sfx('deny'); return; }
    this.sent = true;
    G.save.data.lastName = nm; G.save.write();
    G.audio.sfx('ok');
    const r = G.run;
    const entry = { name: nm, score: this.score, won: this.won, row: r.won ? G.STAGES + 1 : r.stage, time: '', date: new Date().toISOString().slice(0, 10) };
    G.scores.submit(entry);
    G.go(new RankingScene(entry));
  }
  press() {
    if (this.cy < NR) this.type(KEYS[this.cy][this.cx]);
    else if (this.bx === 0) this.type(' ');
    else if (this.bx === 1) this.erase();
    else this.submit();
  }
  update(dt) {
    this.t += dt;
    if (this.sent || this.t < 0.6) return;
    const I = G.Input;
    if (I.hit('left')) { if (this.cy < NR) this.cx = (this.cx + 9) % 10; else this.bx = (this.bx + 2) % 3; G.audio.sfx('move'); }
    if (I.hit('right')) { if (this.cy < NR) this.cx = (this.cx + 1) % 10; else this.bx = (this.bx + 1) % 3; G.audio.sfx('move'); }
    if (I.hit('up')) { this.cy = (this.cy + NR) % (NR + 1); G.audio.sfx('move'); }
    if (I.hit('down')) { this.cy = (this.cy + 1) % (NR + 1); G.audio.sfx('move'); }
    if (I.hit('b')) this.erase();
    const tp = I.tap;
    if (tp) {
      for (let j = 0; j < NR; j++) for (let i = 0; i < 10; i++) {
        const x = KX + i * KW, y = rowY(j);
        if (tp.x >= x && tp.x < x + KW && tp.y >= y - 3 && tp.y < y + KH - 3) { this.cx = i; this.cy = j; this.press(); return; }
      }
      BTNS.forEach(([, x, w], i) => { if (tp.x >= x && tp.x < x + w && tp.y >= BY && tp.y < BY + 16) { this.cy = NR; this.bx = i; this.press(); } });
      return;
    }
    if (I.hit('a')) this.press();
  }
  draw(cx) {
    night(cx, 99);
    G.textBox(cx, this.won ? '¡HAS VUELTO A CASA!' : 'GUARDA TU PUNTUACIÓN', 10, 26, W - 20, this.won ? C.yellow : C.lav, { align: 'center', shadow: true });
    G.text(cx, String(this.score), 90, 46, C.green, { align: 'center', scale: 2, shadow: true });
    G.text(cx, 'PUNTOS', 90, 64, C.green, { align: 'center' });
    G.text(cx, 'TU NOMBRE:', 20, 84, C.lav);
    art.panel(cx, 16, 94, W - 32, 15, '#000', C.yellow);
    G.text(cx, this.name + (blink() && chars(this.name).length < MAXN ? '_' : ''), 22, 98, C.white);
    for (let j = 0; j < NR; j++) for (let i = 0; i < 10; i++) {
      const x = KX + i * KW, y = rowY(j), sel = this.cy === j && this.cx === i, emo = j >= 4;
      G.rect(cx, x + 1, y - 3, KW - 2, KH - 3, sel ? C.yellow : emo ? '#24244a' : '#1a1a33');
      G.text(cx, KEYS[j][i], x + KW / 2, y + 1, sel ? C.ink : C.white, { align: 'center' });
    }
    G.text(cx, 'EMOTES', 90, rowY(4) - 13, '#8a8aa8', { align: 'center' });
    BTNS.forEach(([l, x, w], i) => {
      const sel = this.cy === NR && this.bx === i;
      G.rect(cx, x, BY, w, 16, sel ? (i === 2 ? C.green : C.yellow) : '#1a1a33');
      G.text(cx, l, x + w / 2, BY + 5, sel ? C.ink : i === 2 ? C.green : C.white, { align: 'center' });
    });
    G.textBox(cx, G.Input.lastDevice === 'touch' ? 'TOCA LETRAS Y EMOTES Y LUEGO OK' : 'ESCRIBE CON EL TECLADO. ESPACIO ELIGE EMOTE. ENTER GUARDA', 14, BY + 26, W - 28, '#9a9ab8', { align: 'center' });
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
    if (G.Input.hit('left') || G.Input.hit('right') || (G.Input.tap && G.Input.tap.y < 60)) { this.tab = this.tab === 'global' ? 'local' : 'global'; G.audio.sfx('move'); return; }
    if ((G.Input.hit('a') || G.Input.hit('b') || (G.Input.tap && G.Input.tap.y > 280)) && this.t > 0.4) G.go(new TitleScene());
  }
  draw(cx) {
    night(cx, 17);
    G.text(cx, 'RÉCORDS', 90, 14, C.yellow, { align: 'center', scale: 2, shadow: true });
    [['global', 'MUNDIAL', 50], ['local', 'ESTE MÓVIL', 128]].forEach(([k, l, x]) => {
      const sel = this.tab === k;
      G.text(cx, l, x, 40, sel ? C.yellow : '#6a6a8a', { align: 'center', shadow: true });
      if (sel) G.rect(cx, x - G.textW(l) / 2, 49, G.textW(l), 1, C.yellow);
    });
    art.panel(cx, 6, 58, W - 12, 222, '#111d35', '#83769c');
    const list = this.tab === 'global' ? this.global : G.scores.local();
    if (this.tab === 'global' && this.loading) G.text(cx, 'CARGANDO...', 90, 160, C.lav, { align: 'center' });
    else if (this.tab === 'global' && !list) G.textBox(cx, 'El ranking mundial no está disponible aquí. Tus puntos se guardan en este dispositivo.', 16, 140, W - 32, C.lav, { align: 'center', lh: 10 });
    else if (!list || !list.length) G.textBox(cx, 'TODAVÍA NO HAY NADIE. ¡SÉ EL PRIMERO!', 16, 160, W - 32, C.lav, { align: 'center' });
    else {
      list.slice(0, 10).forEach((e, i) => {
        const y = 68 + i * 20;
        const me = this.entry && e.name === this.entry.name && e.score === this.entry.score && e.date === this.entry.date;
        const col = me ? (blink() ? C.yellow : C.white) : i === 0 ? C.yellow : C.white;
        if (me) G.rect(cx, 9, y - 3, W - 18, 19, '#ffec2722');
        G.text(cx, String(i + 1), 18, y, col, { align: 'right' });
        G.text(cx, chars(String(e.name)).slice(0, 12).join(''), 24, y, col);
        G.text(cx, String(e.score), W - 12, y, col, { align: 'right' });
        G.text(cx, e.won ? '★ LLEGÓ A CASA' : 'TRAMO ' + (e.row || 0) + ' DE ' + G.STAGES, 24, y + 9, e.won ? C.green : '#8a8aa8');
      });
    }
    G.textBox(cx, '← → CAMBIAR · A: VOLVER', 10, 292, W - 20, C.lav, { align: 'center' });
  }
}
G.RankingScene = RankingScene;

// accesos directos para probar pantallas sueltas (?scene=...)
G.debugScenes = {
  end: () => new EndScene(), over: () => { G.run.cause = 'Los zombis te rodearon.'; return new GameOverScene(); },
  name: () => new NameScene(4321, true), rank: () => new RankingScene(null),
  howto: () => new HowToScene(), game: () => new G.GameScene()
};
})();
