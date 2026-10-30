'use strict';
// =====================================================================
//  ARTE: sprites pixel y escenarios de ciudad española de noche
// =====================================================================
(function () {
const S = G.defSprite, M = G.mirror, C = G.C;

// ------------------------------------------------------------ el chico (sin nombre)
const chicoTop = [
  '...gggg...',
  '..gggggg..',
  '.gggggggg.',
  '.gggffffg.',
  '.ggff0ff0.',
  '..gffffff.',
  '..988888..',
  '.9988888l.',
  '.998888lf.',
  '.99888ll..',
  '..8llll...'
];
S('chico0', chicoTop.concat(['...mmmm...', '...m..m...', '...m..m...', '..77..77..']));
S('chico1', chicoTop.concat(['...mmmm...', '..mm..m...', '..m....m..', '.77....77.']));
S('chico2', chicoTop.concat(['...mmmm...', '...mmm....', '...m.m....', '..77.77...']));
// de espaldas (vista desde arriba, caminando calle arriba)
const backTop = ['...gggg...', '..gggggg..', '.gggggggg.', '.gggggggg.', '.gggggggg.', '..gggggg..', '...ffff...', '..899998..', '.88999988.', '.f899998f.', '..899998..', '...mmmm...'];
S('chicoBack0', backTop.concat(['...m..m...', '...m..m...', '...7..7...']));
S('chicoBack1', backTop.concat(['...m..m...', '...7..m...', '......7...']));
S('chicoBack2', backTop.concat(['...m..m...', '...m..7...', '...7......']));
S('chicoHurt', [
  '...gggg...', '..gggggg..', '.gggggggg.', '.ggg0ff0g.', '.ggff0ff..', '..gf00ff..',
  '8.988888.8', '8998888888', '.99888888.', '.99888ll..', '..8llll...', '...mmmm...', '..mm..mm..', '.mm....mm.', '77......77'
]);

// ------------------------------------------------------------ zombi
const zTop = [
  '..33333...',
  '.3jjjjj3..',
  '.jjjjjjj..',
  '.jjjj8j8..',
  '.jjjjjjj..',
  '..jjj00j..',
  '...jjjj...',
  '..ddddjjjj',
  '.ddddddjjj',
  '.dd5ddd...',
  '.ddddd....'
];
S('zombie0', zTop.concat(['..5555....', '..55.55...', '..5...5...', '.44...44..']));
S('zombie1', zTop.concat(['..5555....', '..555.....', '..5.5.....', '.44.44....']));

// ------------------------------------------------------------ vampiro y murciélagos
S('vampire', M([
  '......0', '....000', '...0066', '...0686', '...0666', '....067', '0....06', '00..008',
  '080.008', '0880008', '0888008', '.088808', '..08880', '...0880', '....080', '.....00'
]));
S('bat0', M(['0...', '00..', '0000', '.008', '..00']));
S('bat1', M(['....', '...0', '.000', '0008', '0..0']));

// ------------------------------------------------------------ fantasma
S('ghost', M(['...77', '..777', '.7777', '.7077', '.6777', '67777', '67770', '67777', '67777', '6.777']));
S('ghostAngry', M(['...77', '..777', '.7777', '.7807', '.6777', '67777', '67700', '67700', '67777', '6.777']));

// ------------------------------------------------------------ abuela en la ventana y maceta
S('maceta', ['..8.8..', '.888b8.', '..b8bb.', '..bbb..', '.44444.', '4444444', '.44444.', '..444..']);

// ------------------------------------------------------------ toro fantasma (encierro)
const toroTop = [
  '...............7..7.',
  '..............67777.',
  '7.77777777777.7777077',
  '.777777777777777777777',
  '.77777777777777777777.',
  '.6777777777777777766..',
  '.66777777777777.......'
];
S('toro0', toroTop.concat(['..777.77...777.77....', '..77..77...77..77....', '..66..66...66..66....']));
S('toro1', toroTop.concat(['..777.77...777.77....', '...77.77....77.77....', '..66...66..66...66...']));

// ------------------------------------------------------------ la meiga
S('meiga', M([
  '......2', '.....22', '.....22', '....222', '....222', '...2222', '..22299', '2222222',
  '..hhjjj', '..hhj0j', '..hhjjj', '..hhjj3', '..hhj00', '...2222', '..22222', '.222d22', '.222222', '2222222'
]));
// ------------------------------------------------------------ tuno zombi
const tunaTop = ['...2222.....', '..jjjjj.....', '..jjj8j8....', '..jjjjjj....', '...jj00j....', '..77777.....', '.0000000....'];
S('tuna0', tunaTop.concat(['e0000000a...', 'c000044444..', 'b0000444j444', 'e0000044....', 'a0000000....', '..00..00....', '..00..00....', '..00..00....', '.000..000...']));
S('tuna1', tunaTop.concat(['e0000000a...', 'c0000444j4..', 'b00004444444', 'e0000044....', 'a0000000....', '..00..00....', '..00...00...', '..00...00...', '.000...000..']));

// ------------------------------------------------------------ Santa Compaña
S('compana', [
  '...6666...', '..677776..', '.67777776.', '.67000076.', '.670a0a76.', '.67000076.', '.6777777..',
  '.6777777.a', '.67777776a', '.677777769', '.6777777.7', '.6777777.7', '.6777777...', '..66.66...'
]);

// ------------------------------------------------------------ El Coco y sus sombras
const cocoHalf = [
  '........hhhh', '......hhh111', '....hhh11111', '...h11111111', '..h111111111', '..h111111111',
  '.h1112aaa111', '.h112aaaaa11', '.h112aa00a11', '.h1112aaa111', 'h11111111111', 'h11111111111',
  'h11000000000', 'h11077070707', 'h11000000000', 'h11000000000', 'h11107070707', 'h11110000000',
  'h11111111111', '.h1111111111', '.h1111111111', '..h11h111h11', '..hh.hh1h.h1', '...h..h.h..h'
];
S('coco', M(cocoHalf));
S('cocoHurt', M(cocoHalf.map((r, i) => i >= 6 && i <= 9 ? r.replace(/a/g, '8').replace(/0/g, '8') : r)));
S('sombra', M(['..hh', '.h11', 'h1a1', 'h111', 'h111', 'h111', '.h1h', '.h.h']));
S('gatito', M(['.0..', '.000', '0a00', '0000', '.000', '..00']));

// ------------------------------------------------------------ lobishome (hombre lobo)
const loboTop = [
  '...............5....', '..............565...', '5............555555.', '55..55555555555a5500',
  '.5555555555555555667', '..5555555555555577..', '..555555555555555...', '..55555555555555....'
];
S('lobo0', loboTop.concat(['..55.555...5555.....', '.55...55...55.55....', '.5....5.....5..5....', '55...55....55..55...']));
S('lobo1', loboTop.concat(['...555.55..555.55...', '...55..55..55..55...', '..55...5..55...5....', '.55...55.55...55....']));
S('cat', ['.0.0......', '.000......', '0a0a0...0.', '.000....0.', '.0000000..', '.0000000..', '.0.0..0.0.']);

// ------------------------------------------------------------ objetos sueltos
S('coin', ['.aaaa.', 'aa77aa', 'a7aa9a', 'aaaa9a', 'aa99aa', '.aaaa.']);
S('heart', ['.88.88.', '8e88888', '8888888', '.88888.', '..888..', '...8...']);
S('heartE', ['.55.55.', '5..5..5', '5.....5', '.5...5.', '..5.5..', '...5...']);
S('chanclaP', ['.cccc..', 'cc1ccc6', 'c1c1c66', '.cccc66']);

// ------------------------------------------------------------ iconos de objetos (10x10)
const IC = {
  bocadillo: ['..9999999.', '.9aa9aa9a9', '9999999999', 'f7f7f7f7f.', '9999999999', '.99999999.']
};
for (const k in IC) S('it_' + k, IC[k]);

// ------------------------------------------------------------ iconos de mapa (9x9)
const MI = {
  zombis: ['..33333..', '.3jjjjj3.', '.jjjjjjj.', '.j8jjj8j.', '.jjjjjjj.', '.jj000jj.', '..jjjjj..', '..j.j.j..'],
  vampiro: ['0.......0', '00.....00', '000.0.000', '000000000', '.0080800.', '..00000..', '...0.0...'],
  volcan: ['...8.a...', '..9.8.9..', '...888...', '...585...', '..55855..', '.5555555.', '555555555'],
  encierro: ['7.......7', '77.....77', '.7777777.', '..70707..', '..77777..', '...767...', '...777...'],
  meiga: ['....2....', '...22....', '...222...', '..2222...', '..22222..', '.2999992.', '222222222'],
  fantasmas: ['..77777..', '.7777777.', '.7077707.', '.7777777.', '.7770777.', '.7777777.', '.7.777.7.'],
  tuna: ['.......55', '......55.', '.....4...', '..4444...', '.444444..', '.440444..', '.444444..', '..4444...'],
  compana: ['....a....', '...a9a...', '...a9a...', '....9....', '...777...', '...777...', '...767...', '...777...', '..66666..'],
  tejados: ['......55.', '......55.', '...44455.', '..444444.', '.44444444', '444444444', '.7777777.', '.7a777a77'],
  boss: ['..11111..', '.1111111.', '11aa1aa11', '11a01a011', '111111111', '107070701', '.1111111.', '..1.1.1..'],
};
for (const k in MI) S('mi_' + k, MI[k]);

// ------------------------------------------------------------ utilidades de escenario
G.srand = seed => {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
};
const art = G.art = {};

art.sky = (cx, w, h, top = '#0b0b1a', bot = '#1d2b53') => {
  const bands = [top, '#10102a', '#131636', '#161c42', bot];
  const bh = Math.ceil(h / bands.length);
  bands.forEach((c, i) => G.rect(cx, 0, i * bh, w, bh + 1, c));
  for (let i = 1; i < bands.length; i++) G.dither(cx, 0, i * bh - 2, w, 2, bands[i], i);
};
art.stars = (cx, w, h, seed, t = 0) => {
  const r = G.srand(seed);
  for (let i = 0; i < w * h / 260; i++) {
    const x = r() * w | 0, y = r() * h | 0, tw = r();
    const on = Math.sin(t * 2 + tw * 20) > -0.6;
    if (on) G.rect(cx, x, y, 1, 1, tw > 0.85 ? C.yellow : tw > 0.5 ? C.white : C.lav);
  }
};
art.moon = (cx, x, y, r = 10) => {
  G.circ(cx, x, y, r + 3, '#1b2147');
  G.circ(cx, x, y, r + 1, '#2a2f5a');
  G.circ(cx, x, y, r, '#f3ef7d');
  G.circ(cx, x - 2, y - 1, r - 2, C.white);
  G.circ(cx, x + r / 3, y + r / 4, 2, '#e4dcb0');
  G.circ(cx, x - r / 3, y - r / 3, 1, '#e4dcb0');
  G.circ(cx, x - r / 4, y + r / 2, 1, '#e4dcb0');
};

// silueta de ciudad lejana (con torre de iglesia y antenas)
art.skyline = (cx, w, baseY, seed, col = '#161a38', win = '#3a3060') => {
  const r = G.srand(seed);
  let x = -4;
  while (x < w) {
    const bw = 14 + (r() * 26 | 0), bh = 16 + (r() * 40 | 0);
    G.rect(cx, x, baseY - bh, bw, bh, col);
    if (r() < 0.12) { // campanario
      const tx = x + bw / 2 - 4;
      G.rect(cx, tx, baseY - bh - 18, 8, 18, col);
      G.rect(cx, tx + 2, baseY - bh - 24, 4, 6, col);
      G.rect(cx, tx + 3, baseY - bh - 29, 2, 5, col);
      G.rect(cx, tx + 2, baseY - bh - 27, 4, 1, col);
      G.rect(cx, tx + 3, baseY - bh - 14, 2, 3, win);
    } else if (r() < 0.3) { // antenas y depósitos
      G.rect(cx, x + 3, baseY - bh - 6, 1, 6, col);
      G.rect(cx, x + 1, baseY - bh - 5, 5, 1, col);
    }
    for (let wy = baseY - bh + 4; wy < baseY - 4; wy += 6)
      for (let wx = x + 3; wx < x + bw - 3; wx += 5)
        if (r() < 0.18) G.rect(cx, wx, wy, 2, 2, r() < 0.3 ? '#8a6a30' : win);
    x += bw + (r() < 0.3 ? 2 : 0);
  }
};

// fachada típica: balcones de forja, persianas, bajo comercial con rótulo
const WALLS = ['#3b3355', '#45374f', '#3a4250', '#4a3c3c', '#3d3a4f', '#4b4048'];
const SHOPS = [
  { t: 'BAR', bg: '#5a1e1e', fg: '#ffec27' }, { t: 'FARMACIA', bg: '#0c3a24', fg: '#00e436', cross: true },
  { t: 'ESTANCO', bg: '#5a3a14', fg: '#ffec27' }, { t: 'PANADERÍA', bg: '#3a2a1a', fg: '#ffccaa' },
  { t: 'LOTERÍAS', bg: '#1d2b53', fg: '#ffec27' }, { t: 'FRUTERÍA', bg: '#1f3a1a', fg: '#a8e72e' },
  { t: 'ULTRAMARINOS', bg: '#2a1a3a', fg: '#ff77a8' }, { t: 'BAZAR 24H', bg: '#4a1030', fg: '#29adff' },
  { t: 'PELUQUERÍA', bg: '#2b2b52', fg: '#fff1e8' }, { t: 'CHURRERÍA', bg: '#5a3010', fg: '#ffa300' },
  { t: 'MERCERÍA', bg: '#3a1a2a', fg: '#ff77a8' }, { t: 'TABERNA', bg: '#3a1010', fg: '#ffa300' }
];
art.SHOPS = SHOPS;
// -------- vista cenital
art.cobbles = (cx, x, y, w, h, base = '#2c2a3e', dark = '#24222f', light = '#35334a') => {
  G.rect(cx, x, y, w, h, base);
  for (let j = 0; j < h; j += 4) {
    const off = (j / 4) % 2 ? 3 : 0;
    for (let i = -off; i < w; i += 6) {
      G.rect(cx, x + i, y + j, 1, 4, dark);
      G.rect(cx, x + i + 1, y + j, 4, 1, light);
    }
    G.rect(cx, x, y + j + 3, w, 1, dark);
  }
};
art.asphalt = (cx, x, y, w, h, seed = 3) => {
  const r = G.srand(seed);
  G.rect(cx, x, y, w, h, '#25253a');
  for (let i = 0; i < w * h / 18; i++) G.rect(cx, x + r() * w, y + r() * h, 1, 1, r() < 0.5 ? '#2c2c44' : '#1f1f30');
};
art.tiles = (cx, x, y, w, h) => { // baldosa de acera
  G.rect(cx, x, y, w, h, '#4a4658');
  for (let j = 0; j < h; j += 8) for (let i = 0; i < w; i += 8) {
    G.rect(cx, x + i, y + j, 8, 1, '#3a3648');
    G.rect(cx, x + i, y + j, 1, 8, '#3a3648');
    G.rect(cx, x + i + 3, y + j + 3, 2, 2, '#55516a');
  }
};
art.roofTop = (cx, x, y, w, h) => { // tejado de teja vista desde arriba
  G.rect(cx, x, y, w, h, '#7a3b2e');
  for (let j = 0; j < h; j += 3) {
    G.rect(cx, x, y + j, w, 1, '#5c2a22');
    const off = (j / 3) % 2 ? 2 : 0;
    for (let i = off; i < w; i += 4) G.rect(cx, x + i, y + j + 1, 1, 2, '#5c2a22');
  }
  for (let i = 0; i < w * h / 30; i++) G.rect(cx, x + Math.random() * w, y + Math.random() * h, 1, 1, '#9a5040');
};
art.tree = (cx, x, y, r = 9) => {
  G.circ(cx, x + 2, y + 3, r, '#0a1a12');
  G.circ(cx, x, y, r, '#1a4a2a');
  G.circ(cx, x - 2, y - 2, r - 3, '#256a35');
  G.circ(cx, x - 3, y - 3, r - 6 > 0 ? r - 6 : 1, '#2f8a45');
};
// charco de luz pixelado (vista cenital)
art.lightPool = (cx, x, y, r, alpha = 0.12) => {
  cx.globalAlpha = alpha;
  G.circ(cx, x, y, r, '#ffd27a');
  G.circ(cx, x, y, Math.round(r * 0.66), '#ffd27a');
  cx.globalAlpha = 1;
};

// -------- interfaz
art.panel = (cx, x, y, w, h, bg = '#111d35', border = '#fff1e8') => {
  G.rect(cx, x + 1, y, w - 2, h, bg);
  G.rect(cx, x, y + 1, w, h - 2, bg);
  G.rect(cx, x + 1, y, w - 2, 1, border);
  G.rect(cx, x + 1, y + h - 1, w - 2, 1, border);
  G.rect(cx, x, y + 1, 1, h - 2, border);
  G.rect(cx, x + w - 1, y + 1, 1, h - 2, border);
  G.rect(cx, x + 1, y + h, w - 2, 1, '#00000080');
};
art.icon = (cx, name, x, y, s = 1) => { // centrado en caja 10x10*s
  const sp = G.SPR[name]; if (!sp) return;
  G.drawScaled(cx, name, x + Math.floor((10 - sp.w) * s / 2), y + Math.floor((10 - sp.h) * s / 2), s);
};
})();
