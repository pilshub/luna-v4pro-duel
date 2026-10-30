'use strict';
// =====================================================================
//  DATOS: objetos, eventos, partida (run) y generación del mapa
// =====================================================================
(function () {
const C = G.C;
G.GAMES = {}; // cada minijuego se registra aquí

// ------------------------------------------------------------ objetos permanentes (reliquias)
G.ITEMS = {
  ajo: { name: 'Ristra de ajos', desc: 'El vampiro tarda mucho más en atacarte cuando estás a oscuras.', price: 20 },
  linterna: { name: 'Linterna', desc: 'Ves más lejos en la niebla y tu destello alcanza también las ventanas de al lado.', price: 26 },
  zapatillas: { name: 'Zapatillas nuevas', desc: 'Corres un 18% más rápido en todas las pruebas.', price: 30 },
  chancla: { name: 'La chancla de la abuela', desc: 'Pulsa B para lanzarla. Tumba zombis y vuelve sola. El Coco le tiene pánico.', price: 32 },
  casco: { name: 'Casco de moto', desc: 'Ignoras el primer golpe que recibes en cada prueba.', price: 40 },
  reloj: { name: 'Reloj del abuelo', desc: 'Las pruebas de aguantar duran un 20% menos y la Meiga conjura más despacio.', price: 28 },
  auriculares: { name: 'Auriculares', desc: 'Llevas el ritmo: la Tuna te perdona mucho más los fallos.', price: 18 },
  monedero: { name: 'Monedero de cuero', desc: 'Ganas un 50% más de euros con cada recompensa.', price: 25 },
  estampita: { name: 'Estampita de la abuela', desc: 'Si caes, te levantas con 2 ♥. Solo una vez.', price: 45 },
  decimo: { name: 'Décimo de lotería', desc: 'Tras cada prueba, 25% de que toque: +15 €.', price: 20 },
  azabache: { name: 'Azabache', desc: 'Amuleto gallego: todo lo sobrenatural va un 15% más lento.', price: 38 },
  pipas: { name: 'Bolsa de pipas', desc: 'Superar una prueba sin recibir daño te cura 1 ♥.', price: 24 },
  gafas: { name: 'Gafas de visión nocturna', desc: 'Ves venir el peligro: los avisos duran más y ves más lejos en la niebla.', price: 26 }
};
for (const k in G.ITEMS) G.ITEMS[k].icon = 'it_' + k;

// consumibles de la tienda
G.CONSUMABLES = {
  bocadillo: { name: 'Bocadillo de calamares', desc: 'Recupera 2 ♥.', price: 12, icon: 'it_bocadillo' },
  churros: { name: 'Churros con chocolate', desc: '+1 ♥ máximo y te cura 1 ♥.', price: 28, icon: 'it_churros' },
  bono: { name: 'Bono de metro', desc: 'Te permite saltarte una prueba (sin recompensa).', price: 18, icon: 'it_bono' }
};

// ------------------------------------------------------------ partida
G.newRun = () => {
  G.run = {
    hp: 5, maxHp: 5, money: 10, items: [], bono: 0,
    map: G.genMap(), node: null, row: -1, minutes: 40,
    stats: { won: 0, perfect: 0, coins: 0, hits: 0, kills: 0, earned: 0 },
    revived: false, shield: 0, cause: '', mamaVisto: false, log: [],
    score: 0, won: false
  };
  G.save.data.runs++;
  G.save.write();
};
G.addScore = n => { if (G.run) G.run.score = Math.max(0, G.run.score + Math.round(n)); };
G.has = id => !!(G.run && G.run.items.includes(id));
G.speedMul = () => G.has('zapatillas') ? 1.18 : 1;
G.enemyMul = () => G.has('azabache') ? 0.85 : 1;
G.timeMul = () => G.has('reloj') ? 0.8 : 1;
G.warnMul = () => G.has('gafas') ? 1.3 : 1;
G.clock = () => {
  const m = G.run ? G.run.minutes : 0;
  return G.pad2(Math.floor(m / 60) % 24) + ':' + G.pad2(m % 60);
};
G.gain = (n, mult = true) => {
  const v = Math.round(n * (mult && G.has('monedero') ? 1.5 : 1));
  G.run.money += v;
  G.run.stats.earned += Math.max(0, v);
  return v;
};
G.heal = n => {
  const before = G.run.hp;
  G.run.hp = Math.min(G.run.maxHp, G.run.hp + n);
  return G.run.hp - before;
};
G.giveItem = id => {
  if (!id || G.has(id)) return false;
  G.run.items.push(id);
  return true;
};
G.randomItem = (exclude = []) => {
  const pool = Object.keys(G.ITEMS).filter(k => !G.has(k) && !exclude.includes(k));
  return pool.length ? G.pick(pool) : null;
};
G.itemChoices = n => {
  const pool = G.shuffle(Object.keys(G.ITEMS).filter(k => !G.has(k)));
  return pool.slice(0, n);
};
// devuelve 'blocked' | 'hit' | 'saved' | 'dead'
G.hurt = (cause) => {
  const r = G.run;
  if (r.shield > 0) {
    r.shield--;
    G.audio.sfx('block');
    G.flash(C.blue, 0.15);
    G.shake(2, 0.15);
    return 'blocked';
  }
  r.hp--;
  r.stats.hits++;
  r.gameHits = (r.gameHits || 0) + 1;
  G.audio.sfx('hurt');
  G.flash(C.red, 0.22);
  G.shake(4, 0.3);
  if (r.hp <= 0) {
    if (G.has('estampita')) {
      r.items = r.items.filter(i => i !== 'estampita');
      r.hp = 2;
      r.revived = true;
      G.flash(C.yellow, 0.5);
      G.audio.sfx('heal');
      return 'saved';
    }
    r.cause = cause || 'Te has quedado tirado en mitad de la calle.';
    return 'dead';
  }
  return 'hit';
};

// ------------------------------------------------------------ calles
G.PLACES = {
  plaza: ['Plaza Mayor', 'Plaza de la Iglesia', 'Plaza del Mercado', 'Plaza de Abastos', 'Plaza del Ayuntamiento', 'Plaza de los Naranjos'],
  calle: ['Calle Mayor', 'Calle del Pez', 'Calle de la Luna', 'Calle Ancha', 'Calle Real', 'Calle del Carmen', 'Calle Nueva', 'Calle Cervantes', 'Calle del Reloj', 'Calle de San Juan'],
  callejon: ['Callejón del Gato', 'Travesía del Silencio', 'Callejón de las Ánimas', 'Pasaje del Olvido', 'Callejón de la Sangre'],
  avenida: ['Gran Vía', 'Avenida de la Constitución', 'Paseo de las Acacias', 'Ronda de la Muralla', 'Avenida del Puerto', 'Glorieta de los Patos'],
  viejo: ['Casco Antiguo', 'Barrio de la Judería', 'Cuesta de los Ciegos', 'Barrio Viejo', 'Las Callejas'],
  alto: ['Los Tejados', 'Azoteas del Centro', 'Tejados de San Pedro'],
  cruce: ['La Encrucijada', 'El Cruce de los Cuatro Caminos', 'Rotonda de la Fuente']
};

// ------------------------------------------------------------ mapa estilo roguelike
const ROWS = 9, COLS = 5;
G.MAP_ROWS = ROWS;
const EASY = ['zombis', 'meiga', 'fantasmas', 'encierro', 'tuna', 'volcan'];
G.genMap = () => {
  const cells = [];
  for (let r = 0; r < ROWS; r++) cells.push(new Array(COLS).fill(false));
  const edges = new Set();
  const starts = G.shuffle([0, 1, 2, 3, 4]).slice(0, 2);
  for (let p = 0; p < 6; p++) {
    let c = p < 2 ? starts[p] : G.irand(0, COLS - 1);
    for (let r = 0; r < ROWS; r++) {
      cells[r][c] = true;
      if (r === ROWS - 1) break;
      const opts = G.shuffle([c - 1, c, c + 1].filter(x => x >= 0 && x < COLS));
      let nc = opts.find(x => x === c || !edges.has(`${r},${x}>${c}`));
      if (nc === undefined) nc = c;
      edges.add(`${r},${c}>${nc}`);
      c = nc;
    }
  }
  const nodes = [], byPos = {};
  let id = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (cells[r][c]) {
    const n = { id: id++, row: r, col: c, next: [], prev: [], type: 'game', game: null, done: false };
    nodes.push(n); byPos[r + ',' + c] = n;
  }
  for (const e of edges) {
    const [a, b] = e.split('>');
    const [r, c] = a.split(',').map(Number);
    const from = byPos[r + ',' + c], to = byPos[(r + 1) + ',' + b];
    if (from && to && !from.next.includes(to.id)) { from.next.push(to.id); to.prev.push(from.id); }
  }
  const boss = { id: id++, row: ROWS, col: 2, next: [], prev: [], type: 'boss', game: 'coco', done: false };
  nodes.push(boss);
  nodes.filter(n => n.row === ROWS - 1).forEach(n => { n.next.push(boss.id); boss.prev.push(n.id); });

  // tipos de casilla
  const parentsOf = n => n.prev.map(i => nodes[i]);
  const W = (r) => {
    const w = { game: 46, event: 24 };
    if (r >= 2) { w.elite = 12; w.shop = 11; }
    if (r >= 3 && r !== ROWS - 2) w.rest = 9;
    return w;
  };
  const roll = w => { let t = 0; for (const k in w) t += w[k]; let x = Math.random() * t; for (const k in w) { x -= w[k]; if (x < 0) return k; } return 'game'; };
  for (const n of nodes) {
    if (n.type === 'boss') continue;
    if (n.row === 0) { n.type = 'game'; continue; }
    if (n.row === ROWS - 1) { n.type = 'rest'; continue; }
    for (let t = 0; t < 12; t++) {
      const ty = roll(W(n.row));
      if (['shop', 'elite', 'rest'].includes(ty) && parentsOf(n).some(p => p.type === ty)) continue;
      n.type = ty; break;
    }
  }
  if (!nodes.some(n => n.type === 'shop')) {
    const mid = nodes.filter(n => n.row === 4 || n.row === 5);
    if (mid.length) G.pick(mid).type = 'shop';
  }
  // asignar minijuegos equilibrando el uso
  const use = {};
  const ids = Object.keys(G.GAMES).filter(k => k !== 'coco');
  ids.forEach(k => use[k] = 0);
  for (const n of nodes) {
    if (n.type !== 'game' && n.type !== 'elite') continue;
    const banned = new Set(parentsOf(n).map(p => p.game).filter(Boolean));
    let pool = (n.row === 0 ? EASY : ids).filter(k => !banned.has(k) && use[k] !== undefined);
    if (!pool.length) pool = ids.slice();
    const min = Math.min(...pool.map(k => use[k]));
    const g = G.pick(pool.filter(k => use[k] <= min + 1));
    n.game = g; use[g]++;
  }
  // nombres de calle
  for (const n of nodes) {
    let kind = 'calle';
    if (n.game) kind = G.GAMES[n.game] ? G.GAMES[n.game].place : 'calle';
    if (n.type === 'shop') kind = 'calle';
    if (n.type === 'rest') kind = 'plaza';
    if (n.type === 'boss') { n.name = 'Tu portal'; continue; }
    n.name = G.pick(G.PLACES[kind] || G.PLACES.calle);
  }
  return { nodes, rows: ROWS, cols: COLS };
};

// dificultad de 0 a ~1.1 según la fila
G.diffFor = n => G.clamp(n.row / (ROWS - 1), 0, 1) * 0.85 + (n.type === 'elite' ? 0.3 : 0);

// ------------------------------------------------------------ eventos
const pct = p => Math.random() < p;
G.EVENTS = [
  {
    id: 'churro', title: 'Un señor en pijama', icon: 'it_churros',
    text: 'Un señor en pijama y zapatillas de cuadros te ofrece un churro.\n—Están recién hechos... del martes.',
    choices: [
      { label: 'Comérmelo', fx: () => pct(0.55) ? (G.run.maxHp++, G.heal(1), '¡Estaba buenísimo! Te sientes invencible. +1 ♥ máximo.') : (G.hurt('Un churro del martes acabó contigo.') === 'dead' ? '' : 'Era de plastilina. Te duele la tripa. -1 ♥.') },
      { label: 'No, gracias', fx: () => 'El señor se encoge de hombros y se lo come él. Crunch.' }
    ]
  },
  {
    id: 'vending', title: 'Máquina de refrescos', icon: 'it_movil',
    text: 'Una máquina de refrescos parpadea en la oscuridad. Un cartel pegado con celo dice: "NO FUNSIONA".',
    choices: [
      { label: 'Darle un golpe', fx: () => { const x = Math.random(); if (x < 0.5) { const v = G.gain(12); return `¡Escupe un montón de monedas! +${v} €.`; } if (x < 0.8) return 'Hace "clonk". No pasa nada más.'; return G.hurt('Te cayó encima una máquina de refrescos.') === 'dead' ? '' : 'Te cae una lata en el pie. -1 ♥.'; } },
      { label: 'Meter 5 €', cond: () => G.run.money >= 5, fx: () => { G.run.money -= 5; const it = pct(0.5) && G.randomItem(); if (it) { G.giveItem(it); return `¡Sale ${G.ITEMS[it].name.toLowerCase()}! Qué máquina más rara.`; } G.heal(1); return 'Sale un bote de aceitunas. Te las comes. +1 ♥.'; } },
      { label: 'Pasar de largo', fx: () => 'Mejor no tentar a la suerte.' }
    ]
  },
  {
    id: 'bar', title: 'Bar Esqueleto', icon: 'it_bocadillo',
    text: 'Un bar sigue abierto. Detrás de la barra, un camarero esqueleto seca vasos.\n—¿Qué va a ser, chaval?',
    choices: [
      { label: 'Un Cola Cao (6 €)', cond: () => G.run.money >= 6, fx: () => { G.run.money -= 6; G.heal(2); return 'Calentito y con grumos, como debe ser. +2 ♥.'; } },
      { label: 'Tragaperras (5 €)', cond: () => G.run.money >= 5, fx: () => { G.run.money -= 5; if (pct(0.28)) { const v = G.gain(30, false); return `¡TRES CEREZAS! Ganas ${v} €.`; } return 'Limón, campana, calavera. Nada.'; } },
      { label: 'Preguntar el camino', fx: () => '—Todo recto y a la izquierda. O a la derecha. No me acuerdo, llevo muerto desde el 87.' }
    ]
  },
  {
    id: 'decimo', title: 'Un décimo en el suelo', icon: 'it_decimo',
    text: 'En un charco hay un décimo de lotería. El número acaba en 13.',
    choices: [
      { label: 'Cogerlo', fx: () => { if (G.giveItem('decimo')) return 'Te lo guardas en el bolsillo. Ojalá toque. (Objeto: Décimo de lotería)'; const v = G.gain(8); return `Ya tenías uno. Lo vendes a un vecino insomne por ${v} €.`; } },
      { label: 'Dejarlo', fx: () => 'Lo dejas donde estaba. Karma +1 (no sirve de nada, pero mola).' }
    ]
  },
  {
    id: 'mama', title: 'Mensaje de mamá', icon: 'it_movil',
    text: 'Tu móvil vibra.\nMAMÁ: ¿¿DÓNDE ESTÁS?? YA HABLAREMOS TÚ Y YO.',
    choices: [
      { label: 'Mandar un audio de 3 min', fx: () => { G.heal(1); return 'Le cuentas lo de los zombis. Te desahogas. +1 ♥.'; } },
      { label: '"Estoy con Rubén"', fx: () => { const v = G.gain(10); return `Rubén te hace un bizum por cubrirle a él también. +${v} €.`; } },
      { label: 'Dejarla en visto', fx: () => { G.run.mamaVisto = true; return 'Mala idea. Muy mala idea. Lo sabes.'; } }
    ]
  },
  {
    id: 'vidente', title: 'La vidente', icon: 'it_estampita',
    text: 'En un portal, una vidente con una bola de cristal:\n—Te leo el futuro por 10 euros, cariño.',
    choices: [
      { label: 'Pagar 10 €', cond: () => G.run.money >= 10, fx: () => { G.run.money -= 10; G.run.maxHp++; G.heal(1); return '—Veo... que llegarás a casa. Te sientes más fuerte. +1 ♥ máximo.'; } },
      { label: 'Regatear', fx: () => pct(0.5) ? (G.heal(2), '—Anda, por ser tú, te lo leo gratis. Te sientes bien. +2 ♥.') : (G.hurt('Te echó mal de ojo una vidente.') === 'dead' ? '' : '—¡Fuera de aquí! Te echa mal de ojo. -1 ♥.') },
      { label: 'Irse', fx: () => '—Tú te lo pierdes, rey.' }
    ]
  },
  {
    id: 'alcantarilla', title: 'La alcantarilla', icon: 'mi_event',
    text: 'Una alcantarilla abierta brilla con luz verde. Desde abajo se oye una flauta.',
    choices: [
      { label: 'Bajar a mirar', fx: () => { const it = G.randomItem(); const h = G.hurt('Te comió un cocodrilo de alcantarilla.'); if (h === 'dead') return ''; if (it) { G.giveItem(it); return `Un cocodrilo con gafas te muerde (-1 ♥), pero encuentras: ${G.ITEMS[it].name}.`; } const v = G.gain(15); return `Un cocodrilo te muerde (-1 ♥), pero encuentras ${v} €.`; } },
      { label: 'Tirar 1 € dentro', cond: () => G.run.money >= 1, fx: () => { G.run.money -= 1; if (pct(0.5)) { const v = G.gain(10, false); return `Te devuelven ${v} € y una nota: "GRASIAS".`; } return 'Plinc. Silencio.'; } },
      { label: 'Seguir andando', fx: () => 'La flauta deja de sonar. Mejor así.' }
    ]
  },
  {
    id: 'domino', title: 'Los abuelos del dominó', icon: 'it_pipas',
    text: 'Cuatro abuelos juegan al dominó en un banco a las tantas.\n—¿Echas una partida, chaval?',
    choices: [
      { label: 'Jugar (10 €)', cond: () => G.run.money >= 10, fx: () => pct(0.5) ? (G.run.money += 10, '¡Cierras con el seis doble! Ganas 10 €.') : (G.run.money -= 10, 'Te dan una paliza. Pierdes 10 €.') },
      { label: 'Pedir consejo', fx: () => { if (G.giveItem('estampita')) return '—Toma, era de mi difunta Pura. Te protegerá. (Objeto: Estampita)'; G.heal(1); return '—Abrígate, que refresca. Te dan una galleta. +1 ♥.'; } },
      { label: 'Saludar e irse', fx: () => '—¡Adiós, majo! ¡Recuerdos a tu madre!' }
    ]
  },
  {
    id: 'gato', title: 'Un gato negro', icon: 'cat',
    text: 'Un gato negro se sienta delante de ti y te mira fijamente. Mucho rato.',
    choices: [
      { label: 'Acariciarlo', fx: () => { if (pct(0.6)) { if (G.giveItem('azabache')) return 'Ronronea y deja a tus pies una piedra negra. (Objeto: Azabache)'; const v = G.gain(6); return `Ronronea y te trae ${v} € que había por ahí.`; } return G.hurt('Te arañó un gato negro. Y luego otras cosas.') === 'dead' ? '' : '¡Te araña! -1 ♥.'; } },
      { label: 'Dar un rodeo', fx: () => 'Das la vuelta a la manzana. El gato sigue mirando.' }
    ]
  },
  {
    id: 'turista', title: 'Un turista perdido', icon: 'it_gafas',
    text: '—Excuse me... ¿la catedral? Lleva una cámara, una gorra y chanclas con calcetines a las tres de la mañana.',
    choices: [
      { label: 'Acompañarle', fx: () => { G.run.minutes += 30; const v = G.gain(15); return `Te da ${v} € de propina, pero pierdes media hora.`; } },
      { label: 'Indicarle el camino', fx: () => { const v = G.gain(5); return `—¡Thank you! Te da ${v} €.`; } },
      { label: '"No hablo inglés"', fx: () => '—Oh... ¿Gracias? Se va igual de perdido.' }
    ]
  },
  {
    id: 'contenedor', title: 'El contenedor amarillo', icon: 'mi_event',
    text: 'Un contenedor amarillo se mueve solo. Desde dentro se oye: "grrrr".',
    choices: [
      { label: 'Abrirlo', fx: () => { const it = G.randomItem(); if (it && pct(0.5)) { G.giveItem(it); return `Entre latas encuentras: ${G.ITEMS[it].name}.`; } return G.hurt('Te mordió una rata zombi del contenedor amarillo.') === 'dead' ? '' : '¡Una rata zombi! -1 ♥. Recicla, pero con cuidado.'; } },
      { label: 'Darle una patada', fx: () => { const v = G.gain(3); return `Sale rodando calle abajo. Debajo había ${v} €.`; } },
      { label: 'Alejarse despacito', fx: () => 'Despacito... despacito... ya.' }
    ]
  },
  {
    id: 'deseos', title: 'La fuente de los deseos', icon: 'mi_rest',
    text: 'Una fuente brilla con luz dorada. En el fondo hay un montón de monedas.',
    choices: [
      { label: 'Pedir un deseo (5 €)', cond: () => G.run.money >= 5, fx: () => { G.run.money -= 5; G.run.hp = G.run.maxHp; G.audio.sfx('heal'); return '"Quiero llegar a casa". El agua te envuelve. ¡Vida al máximo!'; } },
      { label: 'Coger monedas', fx: () => { const v = G.gain(12, false); if (pct(0.4)) return G.hurt('Te mordió un pez fantasma.') === 'dead' ? '' : `Coges ${v} € pero un pez fantasma te muerde. -1 ♥.`; return `Coges ${v} €. Nadie te ha visto. Creo.`; } },
      { label: 'Irse', fx: () => 'Los deseos, para otro día.' }
    ]
  },
  {
    id: 'sereno', title: 'El sereno', icon: 'it_bono',
    text: 'Un sereno con gorra y un manojo de llaves te corta el paso.\n—¡Alto! ¿Adónde vas tú a estas horas?',
    choices: [
      { label: 'Contarle la verdad', fx: () => { G.heal(2); return '—¿Zombis? ¡Anda ya! Toma, para el camino. Te da medio bocadillo. +2 ♥.'; } },
      { label: 'Pedirle un atajo (8 €)', cond: () => G.run.money >= 8, fx: () => { G.run.money -= 8; G.run.bono++; return 'Te da una llave que abre portales. +1 BONO para saltarte una prueba.'; } },
      { label: 'Salir corriendo', fx: () => '—¡SERENOOO! ...ah, no, que el sereno soy yo.' }
    ]
  }
];
})();
