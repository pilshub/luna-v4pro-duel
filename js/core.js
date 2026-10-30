'use strict';
// =====================================================================
//  EL RETORNO — núcleo: pantalla, entrada, fuente pixel, sprites, audio
// =====================================================================
(function () {
const G = window.G = {};
const W = G.W = 180, H = G.H = 320;

// ---------------------------------------------------------------- utils
G.rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
G.irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
G.chance = p => Math.random() < p;
G.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
G.lerp = (a, b, t) => a + (b - a) * t;
G.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
G.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
G.approach = (v, t, d) => v < t ? Math.min(v + d, t) : Math.max(v - d, t);
G.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
G.pad2 = n => (n < 10 ? '0' : '') + n;

// --------------------------------------------------------------- canvas
const canvas = G.canvas = document.getElementById('screen');
canvas.width = W; canvas.height = H;
const ctx = G.ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

G.makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return [c, x];
};

function resize() {
  const stage = document.getElementById('stage');
  const r = stage.getBoundingClientRect();
  // en móvil horizontal se deja hueco a los lados para la cruceta y los botones
  const touch = document.body.classList.contains('touch'), land = window.innerWidth > window.innerHeight;
  let availW = r.width, availH = r.height;
  // en vertical se reserva la franja de abajo para el joystick
  if (touch && !land) { availW = window.innerWidth; availH = Math.max(H, window.innerHeight - 170); }
  let s = Math.min(availW / W, availH / H);
  if (s >= 3) s = Math.floor(s);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
}
G.resize = resize;
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 120));

// --------------------------------------------------------------- input
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'a', KeyZ: 'a', Enter: 'a', KeyJ: 'a', NumpadEnter: 'a',
  KeyX: 'b', KeyK: 'b', ShiftLeft: 'b', ShiftRight: 'b', Backspace: 'b',
  Escape: 'pause', KeyP: 'pause', KeyM: 'mute'
};
const src = { kb: {}, touch: {} };
const Input = G.Input = {
  pressed: {}, released: {}, tap: null, lastDevice: 'kb',
  down(k) { return !!(src.kb[k] || src.touch[k]); },
  hit(k) { return !!this.pressed[k]; },
  up(k) { return !!this.released[k]; },
  analog: null,
  axis() {
    if (this.analog) return { x: this.analog.x, y: this.analog.y };
    let x = (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0);
    let y = (this.down('down') ? 1 : 0) - (this.down('up') ? 1 : 0);
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return { x, y };
  },
  anyHit() { return this.pressed.a || this.pressed.b || !!this.tap; },
  set(source, k, v) {
    const before = this.down(k);
    src[source][k] = v;
    const after = this.down(k);
    if (!before && after) { this.pressed[k] = true; G.audio.init(); }
    if (before && !after) this.released[k] = true;
  },
  endFrame() { this.pressed = {}; this.released = {}; this.tap = null; },
  clearAll() { src.kb = {}; src.touch = {}; this.pressed = {}; this.released = {}; }
};
window.addEventListener('keydown', e => {
  if (G.scene && G.scene.onKey && !e.repeat && G.scene.onKey(e)) { e.preventDefault(); return; }
  const k = KEYMAP[e.code];
  if (!k) return;
  e.preventDefault();
  Input.lastDevice = 'kb';
  if (e.repeat) return;
  Input.set('kb', k, true);
});
window.addEventListener('keyup', e => {
  const k = KEYMAP[e.code];
  if (!k) return;
  e.preventDefault();
  Input.set('kb', k, false);
});
window.addEventListener('blur', () => { src.kb = {}; src.touch = {}; Input.analog = null; });

// pantalla táctil / ratón sobre el canvas
canvas.addEventListener('pointerdown', e => {
  const r = canvas.getBoundingClientRect();
  Input.tap = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  G.audio.init();
  e.preventDefault();
});

function setupTouch() {
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  // joystick analógico flotante: aparece donde pones el dedo
  const zone = document.getElementById('joy');
  const base = zone.querySelector('.base'), knob = zone.querySelector('.knob');
  let id = null, ox = 0, oy = 0;
  const R = 44;
  const dirs = (x, y) => {
    const st = { left: x < -0.5, right: x > 0.5, up: y < -0.5, down: y > 0.5 };
    for (const k in st) Input.set('touch', k, st[k]);
  };
  const move = e => {
    const r = zone.getBoundingClientRect();
    let dx = e.clientX - r.left - ox, dy = e.clientY - r.top - oy;
    const len = Math.hypot(dx, dy);
    if (len > R) { dx *= R / len; dy *= R / len; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    let ax = dx / R, ay = dy / R;
    if (Math.hypot(ax, ay) < 0.15) { ax = 0; ay = 0; }
    Input.analog = { x: ax, y: ay };
    dirs(ax, ay);
  };
  const end = e => {
    if (e.pointerId !== id) return;
    id = null;
    Input.analog = null;
    dirs(0, 0);
    knob.style.transform = '';
    base.style.left = ''; base.style.top = '';
    zone.classList.remove('active');
  };
  zone.addEventListener('pointerdown', e => {
    if (id !== null) return;
    id = e.pointerId;
    try { zone.setPointerCapture(id); } catch (err) { /* sin captura */ }
    const r = zone.getBoundingClientRect();
    ox = e.clientX - r.left; oy = e.clientY - r.top;
    base.style.left = ox + 'px'; base.style.top = oy + 'px';
    zone.classList.add('active');
    Input.lastDevice = 'touch';
    G.audio.init();
    move(e);
    e.preventDefault();
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
  document.querySelectorAll('#ab .btn').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { b.setPointerCapture(e.pointerId); Input.lastDevice = 'touch'; Input.set('touch', k, true); b.classList.add('on'); e.preventDefault(); });
    const up = () => { Input.set('touch', k, false); b.classList.remove('on'); };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
  });
  document.getElementById('btn-pause').addEventListener('pointerdown', e => { Input.pressed.pause = true; e.preventDefault(); });
  document.getElementById('btn-mute').addEventListener('click', () => { G.audio.init(); G.audio.toggleMute(); });
  document.addEventListener('contextmenu', e => e.preventDefault());
}
G.setupTouch = setupTouch;

// --------------------------------------------------------------- paleta
G.PAL = {
  '0': '#000000', '1': '#1d2b53', '2': '#7e2553', '3': '#008751', '4': '#ab5236', '5': '#5f574f',
  '6': '#c2c3c7', '7': '#fff1e8', '8': '#ff004d', '9': '#ffa300', 'a': '#ffec27', 'b': '#00e436',
  'c': '#29adff', 'd': '#83769c', 'e': '#ff77a8', 'f': '#ffccaa', 'g': '#291814', 'h': '#111d35',
  'i': '#422136', 'j': '#a8e72e', 'k': '#742f29', 'l': '#be1250', 'm': '#065ab5', 'n': '#ff6c24',
  'o': '#a28879', 'q': '#125359', 'r': '#754665', 's': '#f3ef7d', 't': '#1e1e2e', 'u': '#3a3a5a',
  'v': '#e8b796', 'w': '#5a3826', 'x': '#2c4a2c', 'y': '#8a5a3a', 'z': '#404070'
};
const C = G.C = {
  black: '#000000', navy: '#1d2b53', plum: '#7e2553', dgreen: '#008751', brown: '#ab5236', dgrey: '#5f574f',
  grey: '#c2c3c7', white: '#fff1e8', red: '#ff004d', orange: '#ffa300', yellow: '#ffec27', green: '#00e436',
  blue: '#29adff', lav: '#83769c', pink: '#ff77a8', peach: '#ffccaa', night: '#0b0b1a', ink: '#111d35',
  lime: '#a8e72e', dred: '#be1250', pale: '#f3ef7d', slate: '#3a3a5a', deep: '#1e1e2e', teal: '#125359'
};

// --------------------------------------------------------------- sprites
const SPR = G.SPR = {};
G.defSprite = (name, rows) => {
  const w = Math.max(...rows.map(r => r.length));
  SPR[name] = { rows: rows.map(r => r.padEnd(w, '.')), w, h: rows.length, cache: {} };
};
G.mirror = (rows, odd) => rows.map(r => r + [...r].reverse().join('').slice(odd ? 1 : 0));
function buildSprite(s, flip, tint) {
  const [c, x] = G.makeCanvas(s.w, s.h);
  for (let j = 0; j < s.h; j++) {
    const row = s.rows[j];
    for (let i = 0; i < s.w; i++) {
      const ch = row[i];
      if (ch === '.' || ch === ' ') continue;
      x.fillStyle = tint || G.PAL[ch] || '#f0f';
      x.fillRect(flip ? s.w - 1 - i : i, j, 1, 1);
    }
  }
  return c;
}
G.spr = (name, flip = false, tint = null) => {
  const s = SPR[name];
  if (!s) return null;
  const key = (flip ? 'f' : 'n') + (tint || '');
  return s.cache[key] || (s.cache[key] = buildSprite(s, flip, tint));
};
G.sprW = name => SPR[name] ? SPR[name].w : 0;
G.sprH = name => SPR[name] ? SPR[name].h : 0;
G.draw = (cx, name, x, y, flip = false, tint = null) => {
  const img = G.spr(name, flip, tint);
  if (img) cx.drawImage(img, Math.round(x), Math.round(y));
};
G.drawScaled = (cx, name, x, y, s, flip = false, tint = null) => {
  const img = G.spr(name, flip, tint);
  if (img) cx.drawImage(img, Math.round(x), Math.round(y), img.width * s, img.height * s);
};
// dibuja con el punto (x,y) en el centro-abajo del sprite
G.drawFeet = (cx, name, x, y, flip = false, tint = null) => {
  const s = SPR[name];
  if (s) G.draw(cx, name, x - (s.w >> 1), y - s.h, flip, tint);
};

// --------------------------------------------------------------- primitivas
G.rect = (cx, x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
G.frame = (cx, x, y, w, h, c) => {
  G.rect(cx, x, y, w, 1, c); G.rect(cx, x, y + h - 1, w, 1, c);
  G.rect(cx, x, y, 1, h, c); G.rect(cx, x + w - 1, y, 1, h, c);
};
G.circ = (cx, x0, y0, r, c) => {
  cx.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0);
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
    cx.fillRect(x0 - w, y0 + y, w * 2 + 1, 1);
  }
};
G.ellipse = (cx, x0, y0, rx, ry, c) => {
  cx.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0);
  for (let y = -ry; y <= ry; y++) {
    const t = 1 - (y * y) / (ry * ry + 0.5);
    if (t < 0) continue;
    const w = Math.floor(rx * Math.sqrt(t));
    cx.fillRect(x0 - w, y0 + y, w * 2 + 1, 1);
  }
};
G.ring = (cx, x0, y0, r, c) => {
  cx.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0);
  let x = r, y = 0, err = 1 - r;
  while (x >= y) {
    const pts = [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]];
    for (const [a, b] of pts) cx.fillRect(x0 + a, y0 + b, 1, 1);
    y++;
    if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
  }
};
G.line = (cx, x0, y0, x1, y1, c) => {
  cx.fillStyle = c;
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  while (n++ < 2000) {
    cx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
};
// rejilla de puntos (tramado) para sombras pixeladas
G.dither = (cx, x, y, w, h, c, phase = 0) => {
  cx.fillStyle = c;
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < h; j++) for (let i = (j + phase) & 1; i < w; i += 2) cx.fillRect(x + i, y + j, 1, 1);
};

// --------------------------------------------------------------- fuente pixel 5x7
const GLYPHS = {
  'A': '01110 10001 10001 11111 10001 10001 10001', 'B': '11110 10001 10001 11110 10001 10001 11110',
  'C': '01110 10001 10000 10000 10000 10001 01110', 'D': '11110 10001 10001 10001 10001 10001 11110',
  'E': '11111 10000 10000 11110 10000 10000 11111', 'F': '11111 10000 10000 11110 10000 10000 10000',
  'G': '01110 10001 10000 10111 10001 10001 01111', 'H': '10001 10001 10001 11111 10001 10001 10001',
  'I': '111 010 010 010 010 010 111', 'J': '00111 00010 00010 00010 00010 10010 01100',
  'K': '10001 10010 10100 11000 10100 10010 10001', 'L': '10000 10000 10000 10000 10000 10000 11111',
  'M': '10001 11011 10101 10101 10001 10001 10001', 'N': '10001 10001 11001 10101 10011 10001 10001',
  'O': '01110 10001 10001 10001 10001 10001 01110', 'P': '11110 10001 10001 11110 10000 10000 10000',
  'Q': '01110 10001 10001 10001 10101 10010 01101', 'R': '11110 10001 10001 11110 10100 10010 10001',
  'S': '01111 10000 10000 01110 00001 00001 11110', 'T': '11111 00100 00100 00100 00100 00100 00100',
  'U': '10001 10001 10001 10001 10001 10001 01110', 'V': '10001 10001 10001 10001 10001 01010 00100',
  'W': '10001 10001 10001 10101 10101 10101 01010', 'X': '10001 10001 01010 00100 01010 10001 10001',
  'Y': '10001 10001 01010 00100 00100 00100 00100', 'Z': '11111 00001 00010 00100 01000 10000 11111',
  '0': '01110 10001 10011 10101 11001 10001 01110', '1': '010 110 010 010 010 010 111',
  '2': '01110 10001 00001 00010 00100 01000 11111', '3': '11111 00010 00100 00010 00001 10001 01110',
  '4': '00010 00110 01010 10010 11111 00010 00010', '5': '11111 10000 11110 00001 00001 10001 01110',
  '6': '00110 01000 10000 11110 10001 10001 01110', '7': '11111 00001 00010 00100 01000 01000 01000',
  '8': '01110 10001 10001 01110 10001 10001 01110', '9': '01110 10001 10001 01111 00001 00010 01100',
  '.': '0 0 0 0 0 0 1', ',': '00 00 00 00 00 01 10', '!': '1 1 1 1 1 0 1', '¡': '1 0 1 1 1 1 1',
  '?': '01110 10001 00001 00010 00100 00000 00100', '¿': '00100 00000 00100 01000 10000 10001 01110',
  ':': '0 0 1 0 0 1 0', ';': '00 00 01 00 00 01 10', '-': '000 000 000 111 000 000 000',
  '+': '000 000 010 111 010 000 000', "'": '1 1 0 0 0 0 0', '"': '101 101 000 000 000 000 000',
  '(': '01 10 10 10 10 10 01', ')': '10 01 01 01 01 01 10',
  '/': '00001 00010 00010 00100 01000 01000 10000', '%': '11001 11010 00010 00100 01000 01011 10011',
  '€': '00111 01000 11110 01000 11110 01000 00111', '*': '00000 10101 01110 11111 01110 10101 00000',
  '=': '000 000 111 000 111 000 000', '>': '1000 0100 0010 0001 0010 0100 1000',
  '<': '0001 0010 0100 1000 0100 0010 0001', '_': '00000 00000 00000 00000 00000 00000 11111',
  '#': '01010 11111 01010 01010 01010 11111 01010', 'º': '010 101 010 000 111 000 000',
  '♥': '00000 01010 11111 11111 01110 00100 00000', '↑': '00100 01110 10101 00100 00100 00100 00100',
  '↓': '00100 00100 00100 00100 10101 01110 00100', '→': '00000 00100 00010 11111 00010 00100 00000',
  '←': '00000 00100 01000 11111 01000 00100 00000', '·': '0 0 0 1 0 0 0',
  '…': '00000 00000 00000 00000 00000 00000 10101', '—': '00000 00000 00000 11111 00000 00000 00000', '★': '00100 00100 11111 01110 01010 10001 00000',
  '♪': '00110 00101 00100 00100 01100 11100 01000', '×': '000 000 101 010 101 000 000',
  '●': '0000 0110 1111 1111 0110 0000 0000', '○': '0000 0110 1001 1001 0110 0000 0000'
};
const ACCENTS = {
  'Á': ['A', 'acute'], 'É': ['E', 'acute'], 'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ú': ['U', 'acute'],
  'Ñ': ['N', 'tilde'], 'Ü': ['U', 'diaer'], 'À': ['A', 'grave'], 'È': ['E', 'grave'], 'Ò': ['O', 'grave'], 'Ç': ['C', 'cedil']
};
const font = { glyphs: {}, atlas: null, tints: {} };
(function buildFont() {
  const all = Object.assign({}, GLYPHS);
  for (const k in ACCENTS) all[k] = GLYPHS[ACCENTS[k][0]];
  let total = 0;
  const list = [];
  for (const ch in all) {
    const rows = all[ch].split(' ');
    const w = rows[0].length;
    list.push([ch, rows, w]);
    total += w + 1;
  }
  const [c, x] = G.makeCanvas(total, 11);
  x.fillStyle = '#fff';
  let ox = 0;
  for (const [ch, rows, w] of list) {
    rows.forEach((r, j) => { for (let i = 0; i < w; i++) if (r[i] === '1') x.fillRect(ox + i, j + 2, 1, 1); });
    const acc = ACCENTS[ch] && ACCENTS[ch][1];
    const mid = w >> 1;
    if (acc === 'acute') { x.fillRect(ox + mid + 1, 0, 1, 1); x.fillRect(ox + mid, 1, 1, 1); }
    if (acc === 'grave') { x.fillRect(ox + mid - 1, 0, 1, 1); x.fillRect(ox + mid, 1, 1, 1); }
    if (acc === 'tilde') { [1, 2, 4].forEach(i => x.fillRect(ox + i, 0, 1, 1)); [0, 3].forEach(i => x.fillRect(ox + i, 1, 1, 1)); }
    if (acc === 'diaer') { x.fillRect(ox + 1, 1, 1, 1); x.fillRect(ox + w - 2, 1, 1, 1); }
    if (acc === 'cedil') { x.fillRect(ox + mid, 9, 1, 1); x.fillRect(ox + mid - 1, 10, 1, 1); }
    font.glyphs[ch] = { x: ox, w };
    ox += w + 1;
  }
  font.atlas = c;
})();
function tinted(color) {
  if (font.tints[color]) return font.tints[color];
  const [c, x] = G.makeCanvas(font.atlas.width, font.atlas.height);
  x.drawImage(font.atlas, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return (font.tints[color] = c);
}
const norm = s => String(s).replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/–/g, '-').toUpperCase();
G.textW = (str, scale = 1) => {
  str = norm(str);
  let w = 0;
  for (const ch of str) {
    if (ch === ' ') { w += 4; continue; }
    const g = font.glyphs[ch] || font.glyphs['?'];
    w += g.w + 1;
  }
  return Math.max(0, w - 1) * scale;
};
// x,y = esquina superior izquierda de las mayúsculas (los acentos sobresalen 2px hacia arriba)
G.text = (cx, str, x, y, color = C.white, opt = {}) => {
  const scale = opt.scale || 1;
  str = norm(str);
  let w = G.textW(str, scale);
  if (opt.align === 'center') x -= w / 2;
  else if (opt.align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  if (opt.shadow) {
    const o = Object.assign({}, opt, { shadow: null, align: 'left' });
    const sc = opt.shadow === true ? C.black : opt.shadow;
    if (opt.outline) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) G.text(cx, str, x + dx * scale, y + dy * scale, sc, o);
    } else G.text(cx, str, x + scale, y + scale, sc, o);
  }
  const img = tinted(color);
  let px = x;
  for (const ch of str) {
    if (ch === ' ') { px += 4 * scale; continue; }
    const g = font.glyphs[ch] || font.glyphs['?'];
    cx.drawImage(img, g.x, 0, g.w, 11, px, y - 2 * scale, g.w * scale, 11 * scale);
    px += (g.w + 1) * scale;
  }
  return w;
};
G.wrap = (str, maxW, scale = 1) => {
  const out = [];
  for (const para of String(str).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const wd of words) {
      const test = line ? line + ' ' + wd : wd;
      if (G.textW(test, scale) > maxW && line) { out.push(line); line = wd; }
      else line = test;
    }
    out.push(line);
  }
  return out;
};
G.textBox = (cx, str, x, y, maxW, color = C.white, opt = {}) => {
  const lh = opt.lh || 10;
  const lines = G.wrap(str, maxW, opt.scale || 1);
  lines.forEach((l, i) => G.text(cx, l, opt.align === 'center' ? x + maxW / 2 : x, y + i * lh, color, opt));
  return lines.length * lh;
};

// --------------------------------------------------------------- partículas
class Particles {
  constructor() { this.list = []; }
  add(p) {
    this.list.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0.6, t: 0, c: C.white, s: 1, drag: 0 }, p));
  }
  burst(x, y, n, colors, speed = 60, life = 0.5, g = 0, size = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random() * 0.7);
      this.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g, life: life * (0.6 + Math.random() * 0.6), c: G.pick(colors), s: size });
    }
  }
  text(x, y, str, c = C.yellow) { this.add({ x, y, vy: -22, life: 0.9, txt: str, c }); }
  update(dt) {
    for (const p of this.list) {
      p.t += dt; p.vy += p.g * dt;
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    this.list = this.list.filter(p => p.t < p.life);
  }
  draw(cx, ox = 0, oy = 0) {
    for (const p of this.list) {
      if (p.txt) { G.text(cx, p.txt, p.x - ox, p.y - oy, p.c, { align: 'center', shadow: true }); continue; }
      const s = p.shrink ? Math.max(1, Math.round(p.s * (1 - p.t / p.life))) : p.s;
      G.rect(cx, p.x - ox - (s >> 1), p.y - oy - (s >> 1), s, s, p.c);
    }
  }
}
G.Particles = Particles;

// --------------------------------------------------------------- guardado
const SAVE_KEY = 'elretorno.v1';
G.save = {
  data: { runs: 0, wins: 0, bestFloor: 0, bestTime: null, muted: false, seen: {} },
  load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d) Object.assign(this.data, d); } catch (e) { /* sin almacenamiento */ } },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* sin almacenamiento */ } }
};

// --------------------------------------------------------------- audio (síntesis 8 bits)
const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
G.freq = n => {
  if (typeof n === 'number') return n;
  const m = /^([A-G][#b]?)(-?\d)$/.exec(n);
  if (!m) return 440;
  const midi = NOTE_IDX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
};
const audio = G.audio = {
  ctx: null, master: null, sfxGain: null, musicGain: null, noiseBuf: null, muted: false,
  track: null, trackName: null, step: 0, nextTime: 0, timer: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.55; this.master.connect(c.destination);
    this.sfxGain = c.createGain(); this.sfxGain.gain.value = 0.55; this.sfxGain.connect(this.master);
    this.musicGain = c.createGain(); this.musicGain.gain.value = 0.32; this.musicGain.connect(this.master);
    const len = c.sampleRate * 1;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.pending) { const p = this.pending; this.pending = null; this.play(p); }
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.02);
    const b = document.getElementById('btn-mute');
    if (b) b.textContent = m ? '×' : '♪';
    G.save.data.muted = m; G.save.write();
  },
  toggleMute() { this.setMuted(!this.muted); },
  tone(f, dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + (o.delay || 0) + (o.at || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(G.freq(f), t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, G.freq(f) + o.slide), t + dur);
    const v = o.vol === undefined ? 0.25 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.bus || this.sfxGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  },
  noise(dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + (o.delay || 0) + (o.at || 0);
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.filter || 'lowpass'; f.frequency.setValueAtTime(o.freq || 3000, t);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, (o.freq || 3000) + o.slide), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(o.vol === undefined ? 0.3 : o.vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.bus || this.sfxGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  sfx(name, arg) {
    if (!this.ctx) return;
    const T = (f, d, o) => this.tone(f, d, o), N = (d, o) => this.noise(d, o);
    switch (name) {
      case 'move': T(620, 0.04, { vol: 0.08 }); break;
      case 'ok': T(880, 0.06, { vol: 0.12 }); T(1320, 0.1, { vol: 0.12, delay: 0.05 }); break;
      case 'back': T(500, 0.06, { vol: 0.1 }); T(330, 0.1, { vol: 0.1, delay: 0.05 }); break;
      case 'deny': T(140, 0.18, { type: 'sawtooth', vol: 0.12 }); break;
      case 'coin': T(988, 0.05, { vol: 0.1 }); T(1319, 0.14, { vol: 0.1, delay: 0.05 }); break;
      case 'buy': T('C6', 0.06, { vol: 0.1 }); T('E6', 0.06, { vol: 0.1, delay: 0.06 }); T('G6', 0.14, { vol: 0.1, delay: 0.12 }); break;
      case 'hurt': N(0.25, { vol: 0.35, freq: 2000, slide: -1700 }); T(240, 0.28, { type: 'sawtooth', vol: 0.16, slide: -170 }); break;
      case 'block': T(1400, 0.05, { type: 'triangle', vol: 0.2 }); T(900, 0.15, { type: 'triangle', vol: 0.15, delay: 0.04 }); break;
      case 'jump': T(300, 0.13, { vol: 0.08, slide: 380 }); break;
      case 'dash': N(0.14, { vol: 0.2, filter: 'bandpass', freq: 1500, slide: 2500 }); break;
      case 'throw': T(700, 0.12, { type: 'triangle', vol: 0.16, slide: -420 }); N(0.06, { vol: 0.08, freq: 4000 }); break;
      case 'hit': N(0.12, { vol: 0.3, freq: 1800 }); T(160, 0.1, { vol: 0.12, slide: -80 }); break;
      case 'poof': N(0.2, { vol: 0.18, filter: 'highpass', freq: 1200 }); T(500, 0.15, { type: 'triangle', vol: 0.1, slide: 600 }); break;
      case 'boom': N(0.6, { vol: 0.45, freq: 900, slide: -820 }); T(90, 0.4, { type: 'triangle', vol: 0.3, slide: -50 }); break;
      case 'smallboom': N(0.28, { vol: 0.22, freq: 1200, slide: -1000 }); break;
      case 'flash': T(1100, 0.12, { type: 'triangle', vol: 0.12, slide: 900 }); break;
      case 'zap': N(0.35, { vol: 0.3, filter: 'highpass', freq: 800 }); T(90, 0.35, { type: 'sawtooth', vol: 0.18 }); break;
      case 'bite': N(0.1, { vol: 0.3, freq: 2500 }); T(200, 0.2, { type: 'sawtooth', vol: 0.15, slide: -120, delay: 0.05 }); break;
      case 'tick': T(1000, 0.04, { vol: 0.1 }); break;
      case 'go': T('C5', 0.08, { vol: 0.14 }); T('G5', 0.2, { vol: 0.14, delay: 0.08 }); break;
      case 'step': N(0.03, { vol: 0.05, freq: 900 }); break;
      case 'rune': T(['E4', 'G#4', 'B4', 'E5'][arg | 0], 0.32, { type: 'triangle', vol: 0.22 }); T(['E5', 'G#5', 'B5', 'E6'][arg | 0], 0.25, { vol: 0.05 }); break;
      case 'note': T(arg, 0.22, { type: 'square', vol: 0.12 }); T(arg, 0.3, { type: 'triangle', vol: 0.1 }); break;
      case 'sour': T(arg || 233, 0.2, { type: 'sawtooth', vol: 0.12, slide: -30 }); break;
      case 'laugh': for (let i = 0; i < 6; i++) T(i % 2 ? 620 : 760, 0.08, { type: 'sawtooth', vol: 0.08, delay: i * 0.09 }); break;
      case 'scream': T(900, 0.4, { type: 'sawtooth', vol: 0.1, slide: -500 }); N(0.3, { vol: 0.1, filter: 'bandpass', freq: 2200 }); break;
      case 'win': ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => T(n, 0.14, { vol: 0.12, delay: i * 0.08 })); break;
      case 'lose': ['A4', 'F4', 'D4', 'A3'].forEach((n, i) => T(n, 0.25, { type: 'triangle', vol: 0.2, delay: i * 0.16 })); break;
      case 'heal': ['E5', 'G#5', 'B5', 'E6'].forEach((n, i) => T(n, 0.12, { type: 'triangle', vol: 0.15, delay: i * 0.06 })); break;
      case 'item': ['A4', 'C#5', 'E5', 'A5', 'C#6'].forEach((n, i) => T(n, 0.12, { vol: 0.1, delay: i * 0.06 })); break;
      case 'roar': N(0.8, { vol: 0.35, freq: 600, slide: -450 }); T(70, 0.8, { type: 'sawtooth', vol: 0.2, slide: -20 }); break;
    }
  },
  // ---- música por pasos (corcheas)
  play(name) {
    if (this.trackName === name) return;
    this.stop();
    this.trackName = name;
    if (!name) return;
    if (!this.ctx) { this.pending = name; return; }
    this.track = G.TRACKS[name];
    if (!this.track) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 25);
  },
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null; this.track = null; this.trackName = null; this.pending = null;
  },
  schedule() {
    const c = this.ctx, tr = this.track;
    if (!c || !tr) return;
    const stepDur = 60 / tr.bpm / 2;
    while (this.nextTime < c.currentTime + 0.15) {
      const at = this.nextTime - c.currentTime;
      for (const ch of tr.ch) {
        const seq = ch.seq;
        const tok = seq[this.step % seq.length];
        if (!tok || tok === '-' || tok === '.') continue;
        if (ch.type === 'kick') this.tone(110, 0.12, { type: 'sine', vol: ch.vol, slide: -70, at, bus: this.musicGain });
        else if (ch.type === 'hat') this.noise(0.04, { vol: ch.vol, filter: 'highpass', freq: 6000, at, bus: this.musicGain });
        else if (ch.type === 'snare') this.noise(0.12, { vol: ch.vol, filter: 'bandpass', freq: 1800, at, bus: this.musicGain });
        else {
          let len = 1;
          while (seq[(this.step + len) % seq.length] === '.' && len < 8) len++;
          this.tone(tok, stepDur * len * 0.92, { type: ch.type, vol: ch.vol, at, bus: this.musicGain, attack: 0.01 });
        }
      }
      this.step++;
      this.nextTime += stepDur;
    }
  }
};
const seq = s => s.trim().split(/\s+/);
G.TRACKS = {
  // cadencia andaluza: Lam - Sol - Fa - Mi
  night: { bpm: 96, ch: [
    { type: 'triangle', vol: 0.5, seq: seq('A2 - E3 - A2 - E3 - G2 - D3 - G2 - D3 - F2 - C3 - F2 - C3 - E2 - B2 - E2 - G#2 -') },
    { type: 'square', vol: 0.07, seq: seq('E4 . . C5 B4 A4 . . D4 . . B4 A4 G4 . . C4 . A4 . G4 F4 . E4 G#4 . . . B4 . E4 . A4 . . C5 B4 A4 . E5 D5 . C5 . B4 A4 . . C5 . A4 . G4 F4 . E4 E4 . F4 . G#4 . . .') },
    { type: 'hat', vol: 0.04, seq: seq('- - x - - - x - - - x - - - x -') }
  ] },
  tense: { bpm: 138, ch: [
    { type: 'triangle', vol: 0.55, seq: seq('A2 A2 C3 A2 D3 A2 C3 B2 A2 A2 C3 A2 E3 D3 C3 B2 F2 F2 A2 F2 G2 F2 E2 F2 E2 E2 G#2 E2 B2 A2 G#2 E2') },
    { type: 'square', vol: 0.05, seq: seq('E5 - - E5 F5 - E5 - D5 - C5 - B4 - - - E5 - - E5 F5 - G#5 - A5 - G#5 - F5 E5 - - C5 - - C5 D5 - C5 - B4 - A4 - G#4 - - - B4 - C5 - D5 - E5 - F5 E5 D5 C5 B4 - G#4 -') },
    { type: 'kick', vol: 0.3, seq: seq('x - - - x - - - x - - - x - x -') },
    { type: 'hat', vol: 0.035, seq: seq('- x - x - x - x') },
    { type: 'snare', vol: 0.08, seq: seq('- - - - x - - - - - - - x - - -') }
  ] },
  boss: { bpm: 162, ch: [
    { type: 'sawtooth', vol: 0.12, seq: seq('E2 E2 F2 E2 G#2 E2 A2 G#2 E2 E2 F2 E2 B2 A2 G#2 F2 D2 D2 F2 D2 E2 D2 C2 D2 E2 E2 F2 G#2 A2 G#2 F2 E2') },
    { type: 'square', vol: 0.05, seq: seq('E5 . F5 E5 D5 . C5 . B4 . C5 . D5 . E5 . F5 . E5 D5 C5 . B4 . A4 . G#4 . . . . . E5 . G#5 . A5 . G#5 F5 E5 . F5 E5 D5 . C5 . D5 . C5 B4 A4 . B4 . G#4 . . . E4 . . .') },
    { type: 'kick', vol: 0.35, seq: seq('x - - x x - - - x - - x x - x -') },
    { type: 'snare', vol: 0.1, seq: seq('- - x - - - x - - - x - - - x x') },
    { type: 'hat', vol: 0.04, seq: seq('x x x x x x x x') }
  ] },
  // pasodoble de kiosko
  shop: { bpm: 116, ch: [
    { type: 'triangle', vol: 0.5, seq: seq('C3 - G2 - C3 - G2 - F2 - C3 - F2 - C3 - G2 - D3 - G2 - D3 - C3 - G2 - C3 - - -') },
    { type: 'square', vol: 0.06, seq: seq('E5 . D5 C5 G4 . E4 . A4 . C5 . F5 . E5 D5 D5 . B4 G4 F5 . E5 D5 C5 . . . G4 . . .') },
    { type: 'hat', vol: 0.04, seq: seq('- x - x') }
  ] },
  dawn: { bpm: 84, ch: [
    { type: 'triangle', vol: 0.5, seq: seq('C3 G3 C4 G3 A2 E3 A3 E3 F2 C3 F3 C3 G2 D3 G3 D3') },
    { type: 'square', vol: 0.06, seq: seq('E5 . . D5 C5 . . . E5 . . G5 A5 . . . F5 . . E5 D5 . C5 . D5 . . . . . . . E5 . . D5 C5 . . . E5 . G5 . C6 . . . A5 . G5 . F5 . E5 . D5 . E5 . C5 . . .') }
  ] },
  dead: { bpm: 70, ch: [
    { type: 'triangle', vol: 0.5, seq: seq('A2 . . . F2 . . . D2 . . . E2 . . .') },
    { type: 'square', vol: 0.05, seq: seq('C5 . B4 . A4 . . . A4 . G4 . F4 . . . F4 . E4 . D4 . . . E4 . . . G#4 . . .') }
  ] }
};

// --------------------------------------------------------------- escenas + bucle
G.scene = null;
let pendingScene = null, trans = 0, transDir = 0;
G.shakeT = 0; G.shakeA = 0; G.flashT = 0; G.flashC = C.red;
G.time = 0;
let queuedScene = null;
G.go = (scene) => {
  if (pendingScene) { if (transDir < 0) queuedScene = scene; return; }
  pendingScene = scene;
  transDir = 1;
  trans = 0;
};
G.goNow = (scene) => {
  if (G.scene && G.scene.exit) G.scene.exit();
  G.scene = scene;
  Input.clearAll();
  if (scene.enter) scene.enter();
};
G.shake = (a = 3, t = 0.25) => { G.shakeA = Math.max(G.shakeA, a); G.shakeT = Math.max(G.shakeT, t); };
G.flash = (c = C.red, t = 0.18) => { G.flashC = c; G.flashT = t; };
G.paused = false;

function drawTransition(p) {
  // persianas pixeladas
  const bands = 12, bh = Math.ceil(H / bands);
  ctx.fillStyle = '#000';
  for (let i = 0; i < bands; i++) {
    const h = Math.ceil(bh * G.clamp(p * 1.6 - i / bands * 0.6, 0, 1));
    ctx.fillRect(0, i * bh, W, h);
  }
}

let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 1 / 20) dt = 1 / 20;
  if (dt < 0) dt = 0;
  G.time += dt;
  if (Input.hit('mute')) audio.toggleMute();

  if (pendingScene) {
    trans += dt / 0.22 * transDir;
    if (transDir > 0 && trans >= 1) {
      G.goNow(pendingScene);
      transDir = -1; trans = 1;
    } else if (transDir < 0 && trans <= 0) {
      pendingScene = null; transDir = 0; trans = 0;
      if (queuedScene) { const q = queuedScene; queuedScene = null; G.go(q); }
    }
  } else if (G.scene && G.scene.update) {
    G.scene.update(dt);
  }
  if (G.shakeT > 0) G.shakeT -= dt; else G.shakeA = 0;
  if (G.flashT > 0) G.flashT -= dt;

  ctx.save();
  if (G.shakeT > 0 && !G.paused) ctx.translate(Math.round(G.rand(-G.shakeA, G.shakeA)), Math.round(G.rand(-G.shakeA, G.shakeA)));
  ctx.fillStyle = '#000';
  ctx.fillRect(-8, -8, W + 16, H + 16);
  if (G.scene && G.scene.draw) G.scene.draw(ctx);
  ctx.restore();
  if (G.flashT > 0) {
    ctx.globalAlpha = Math.min(0.45, G.flashT * 3);
    ctx.fillStyle = G.flashC;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (pendingScene) drawTransition(trans);
  Input.endFrame();
  requestAnimationFrame(frame);
}
G.start = (scene) => {
  G.goNow(scene);
  requestAnimationFrame(t => { last = t; frame(t); });
};
})();
