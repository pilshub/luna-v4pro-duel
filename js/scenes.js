'use strict';
// =====================================================================
//  ESCENAS (vertical 9:16): título, cómo se juega y finales
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
      { label: 'CÓMO SE JUEGA', fn: () => G.go(new HowToScene()) },
      { label: 'SONIDO', right: G.audio.muted ? 'NO' : 'SÍ', fn: () => { G.audio.toggleMute(); this.menu.items[3].right = G.audio.muted ? 'NO' : 'SÍ'; }, sfx: 'move' }
    ], { x: 90, y: 132, w: 110, lh: 16, align: 'center' });
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
    cx.globalAlpha = 0.6; G.rect(cx, 24, 122, W - 48, 54, '#000'); cx.globalAlpha = 1;
    this.menu.draw(cx);
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
    startRun();
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
      G.textBox(cx, 'PULSA A PARA JUGAR OTRA VEZ', 20, 278, W - 40, C.white, { align: 'center' });
    }
  }
}
G.EndScene = EndScene;

// ------------------------------------------------------------ FIN DE LA PARTIDA
class GameOverScene {
  enter() { this.t = 0; G.audio.play('dead'); this.total = Math.floor(G.run.score); }
  update(dt) { this.t += dt; if (this.t > 1 && G.Input.anyHit()) startRun(); }
  draw(cx) {
    night(cx, 66);
    G.text(cx, 'SE ACABÓ', 90, 30, C.red, { align: 'center', scale: 3, shadow: true, outline: true });
    G.drawScaled(cx, 'chicoHurt', 75, 70, 3);
    G.textBox(cx, G.run.cause || 'Te quedaste por el camino.', 14, 126, W - 28, C.white, { align: 'center', lh: 10 });
    G.text(cx, 'TRAMO ' + G.run.stage + ' DE ' + G.STAGES, 90, 174, C.lav, { align: 'center' });
    G.text(cx, G.run.coins + ' MONEDAS', 90, 186, C.lav, { align: 'center' });
    G.text(cx, 'PUNTOS', 90, 206, C.yellow, { align: 'center' });
    G.text(cx, String(this.total), 90, 218, C.yellow, { align: 'center', scale: 2, shadow: true });
    if (this.t > 1) G.textBox(cx, 'PULSA A PARA JUGAR OTRA VEZ', 20, 280, W - 40, C.white, { align: 'center' });
  }
}
G.GameOverScene = GameOverScene;

// accesos directos para probar pantallas sueltas (?scene=...)
G.debugScenes = {
  end: () => new EndScene(), over: () => { G.run.cause = 'Los zombis te rodearon.'; return new GameOverScene(); },
  howto: () => new HowToScene(), game: () => new G.GameScene()
};
})();
