'use strict';
// LA SANTA COMPAÑA — laberinto con niebla y una procesión de ánimas que te sigue
(function () {
const C = G.C;
const T = 16;
const DEF = G.GAMES.compana = {
  id: 'compana', name: 'La Santa Compaña', place: 'viejo', icon: 'mi_compana', music: 'night',
  intro: 'La niebla cubre el casco antiguo y la Santa Compaña camina detrás de ti siguiendo tus pasos. Encuentra la salida: está arriba a la derecha.',
  controls: [['←↑↓→', 'moverte'], ['A', 'esquivar']],
  items: ['linterna', 'gafas', 'zapatillas', 'azabache', 'casco'],
  cause: 'La Santa Compaña te dio una vela. Ahora caminas con ellos cada noche.',
  create(D) { return new Compana(D); }
};

function genMaze(cw, ch) {
  const tw = cw * 2 + 1, th = ch * 2 + 1;
  const g = [];
  for (let y = 0; y < th; y++) g.push(new Array(tw).fill(1));
  const seen = new Set(), st = [[0, ch - 1]];
  seen.add('0,' + (ch - 1));
  g[(ch - 1) * 2 + 1][1] = 0;
  while (st.length) {
    const [x, y] = st[st.length - 1];
    const nb = G.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]).map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cw && ny < ch && !seen.has(nx + ',' + ny));
    if (!nb.length) { st.pop(); continue; }
    const [nx, ny, dx, dy] = nb[0];
    seen.add(nx + ',' + ny);
    g[y * 2 + 1 + dy][x * 2 + 1 + dx] = 0;
    g[ny * 2 + 1][nx * 2 + 1] = 0;
    st.push([nx, ny]);
  }
  // abrir algunos muros para que haya bucles
  for (let k = 0; k < cw * ch * 0.12; k++) {
    const x = G.irand(1, tw - 2), y = G.irand(1, th - 2);
    if (g[y][x] === 1 && ((g[y][x - 1] === 0 && g[y][x + 1] === 0) || (g[y - 1][x] === 0 && g[y + 1][x] === 0))) g[y][x] = 0;
  }
  return { g, tw, th };
}

class Compana {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    const cw = 11 + Math.round(Math.min(1, D) * 4), ch = 7 + Math.round(Math.min(1, D) * 3);
    const m = genMaze(cw, ch);
    this.g = m.g; this.tw = m.tw; this.th = m.th;
    this.W = this.tw * T; this.H = this.th * T;
    this.exit = { x: (this.tw - 2) * T + 8, y: T + 8 };
    this.g[0][this.tw - 2] = 2; // hueco de salida
    this.p = new G.TopDown(T + 8, (this.th - 2) * T + 12, { speed: 66 });
    this.trail = [{ x: this.p.x, y: this.p.y }];
    this.trailT = 0;
    this.lead = 0; this.leadPos = { x: this.p.x, y: this.p.y };
    this.delay = 3.2; this.started = false;
    this.ghostSp = this.p.speed * G.lerp(0.6, 0.86, Math.min(1, D)) * G.enemyMul();
    this.vision = 46 * (G.has('linterna') ? 1.5 : 1) * (G.has('gafas') ? 1.2 : 1);
    this.parts = new G.Particles(); this.coins = new G.Coins();
    // monedas en callejones sin salida
    let placed = 0;
    for (let y = 1; y < this.th - 1 && placed < 6; y += 2) for (let x = 1; x < this.tw - 1; x += 2) {
      if (this.g[y][x] !== 0) continue;
      const walls = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => this.g[y + dy][x + dx] === 1).length;
      if (walls === 3 && G.chance(0.45) && placed < 6) { this.coins.add(x * T + 8, y * T + 11, 999); placed++; }
    }
    this.makeBg();
    [this.fog, this.fctx] = G.makeCanvas(G.W, G.H);
    this.hud = { label: 'BUSCA LA SALIDA', prog: 0 };
    this.stun = 0;
  }
  makeBg() {
    [this.map, this.mx] = G.makeCanvas(this.W, this.H);
    const x = this.mx;
    G.art.cobbles(x, 0, 0, this.W, this.H, '#26243a', '#1c1a2a', '#302e46');
    for (let ty = 0; ty < this.th; ty++) for (let tx = 0; tx < this.tw; tx++) {
      const v = this.g[ty][tx];
      if (v === 1) {
        G.rect(x, tx * T, ty * T, T, T, '#3b3355');
        G.rect(x, tx * T, ty * T, T, 2, '#5a5070');
        if (ty + 1 < this.th && this.g[ty + 1][tx] !== 1) { G.rect(x, tx * T, ty * T + T - 5, T, 5, '#241f38'); if ((tx + ty) % 3 === 0) G.rect(x, tx * T + 5, ty * T + T - 4, 4, 3, (tx * 7 + ty) % 5 === 0 ? '#8a6a30' : '#1a1428'); }
        if ((tx * 13 + ty * 7) % 9 === 0) G.rect(x, tx * T + 3, ty * T + 4, 3, 2, '#2a2440');
      }
    }
    const e = this.exit;
    G.rect(x, e.x - 8, 0, T, T + 2, '#5a4a20');
    G.text(x, 'CASA', e.x, 4, C.yellow, { align: 'center' });
  }
  solid(px, py) {
    const pts = [[px - 3, py - 6], [px + 3, py - 6], [px - 3, py], [px + 3, py]];
    for (const [x, y] of pts) {
      const tx = Math.floor(x / T), ty = Math.floor(y / T);
      if (tx < 0 || ty < 0 || tx >= this.tw || ty >= this.th) return true;
      if (this.g[ty][tx] === 1) return true;
    }
    return false;
  }
  update(dt) {
    this.t += dt;
    const p = this.p;
    if (G.Input.hit('a')) p.startDash();
    const bx = p.x, by = p.y;
    p.update(dt, null, (x, y) => this.solid(x, y));
    // ayuda en las esquinas
    const a = G.Input.axis();
    if (a.x && !a.y && Math.abs(p.x - bx) < 0.01) {
      const cy = Math.floor((p.y - 3) / T) * T + 11;
      if (Math.abs(p.y - cy) < 7 && !this.solid(p.x + Math.sign(a.x) * 2, cy)) p.y = G.approach(p.y, cy, p.speed * dt);
    }
    if (a.y && !a.x && Math.abs(p.y - by) < 0.01) {
      const cx = Math.floor(p.x / T) * T + 8;
      if (Math.abs(p.x - cx) < 7 && !this.solid(cx, p.y + Math.sign(a.y) * 2)) p.x = G.approach(p.x, cx, p.speed * dt);
    }
    this.trailT += dt;
    if (this.trailT > 0.05) {
      this.trailT = 0;
      const last = this.trail[this.trail.length - 1];
      if (G.dist(last.x, last.y, p.x, p.y) > 1) this.trail.push({ x: p.x, y: p.y });
    }
    // procesión
    if (!this.started && this.t > this.delay) { this.started = true; G.audio.sfx('scream'); }
    if (this.stun > 0) this.stun -= dt;
    if (this.started && this.stun <= 0) {
      let move = this.ghostSp * dt;
      while (move > 0 && this.lead < this.trail.length - 1) {
        const n = this.trail[Math.floor(this.lead) + 1];
        const d = G.dist(this.leadPos.x, this.leadPos.y, n.x, n.y);
        if (d <= move) { this.leadPos = { x: n.x, y: n.y }; this.lead = Math.floor(this.lead) + 1; move -= d; }
        else { this.leadPos.x += (n.x - this.leadPos.x) / d * move; this.leadPos.y += (n.y - this.leadPos.y) / d * move; move = 0; }
      }
      if (G.dist(this.leadPos.x, this.leadPos.y, p.x, p.y) < 9 && p.inv <= 0 && p.dash <= 0) {
        p.hurtBy(DEF.cause);
        G.audio.sfx('scream');
        this.lead = Math.max(0, Math.floor(this.lead) - 50);
        this.stun = 1.6;
        this.leadPos = { x: this.trail[this.lead].x, y: this.trail[this.lead].y };
        this.parts.burst(p.x, p.y - 6, 12, [C.white, C.lav], 50, 0.6);
      }
    }
    this.coins.update(dt, p.x, p.y - 3, this.parts);
    this.parts.update(dt);
    const d = G.dist(p.x, p.y, this.exit.x, this.exit.y);
    this.hud.prog = 1 - Math.min(1, d / G.dist(T + 8, (this.th - 2) * T + 12, this.exit.x, this.exit.y));
    if (p.y < T + 14 && Math.abs(p.x - this.exit.x) < 8) this.done = true;
  }
  ghostPositions() {
    const out = [];
    if (!this.started) return out;
    out.push({ x: this.leadPos.x, y: this.leadPos.y });
    for (let k = 1; k <= 3 + Math.round(this.D * 2); k++) {
      const i = Math.floor(this.lead) - k * 6;
      if (i < 0) break;
      out.push(this.trail[i]);
    }
    return out;
  }
  draw(cx) {
    const p = this.p;
    const camX = Math.round(G.clamp(p.x - G.W / 2, 0, Math.max(0, this.W - G.W)));
    const camY = Math.round(G.clamp(p.y - 96, -12, Math.max(-12, this.H - G.H)));
    const ox = this.W < G.W ? -Math.floor((G.W - this.W) / 2) : camX;
    cx.drawImage(this.map, -ox, -camY);
    this.coins.draw(cx, ox, camY);
    const gs = this.ghostPositions();
    const ents = gs.map(g => ({ y: g.y, g })).concat([{ y: p.y, p: true }]).sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e.p) { p.draw(cx, ox, camY); continue; }
      cx.globalAlpha = 0.85;
      G.drawFeet(cx, 'compana', e.g.x - ox, e.g.y - camY + Math.sin(this.t * 4 + e.g.x) * 1, false);
      cx.globalAlpha = 1;
    }
    // niebla
    const f = this.fctx;
    f.globalCompositeOperation = 'source-over';
    f.clearRect(0, 0, G.W, G.H);
    f.fillStyle = '#0a0a16';
    f.fillRect(0, 0, G.W, G.H);
    G.dither(f, 0, 0, G.W, G.H, '#1a1a2e', Math.floor(this.t * 2) % 2);
    f.globalCompositeOperation = 'destination-out';
    const v = this.vision + Math.sin(this.t * 3) * 1.5;
    const sx = p.x - ox, sy = p.y - camY - 6;
    f.globalAlpha = 0.45; G.circ(f, sx, sy, Math.round(v), '#000');
    f.globalAlpha = 0.75; G.circ(f, sx, sy, Math.round(v * 0.8), '#000');
    f.globalAlpha = 1; G.circ(f, sx, sy, Math.round(v * 0.6), '#000');
    for (const g of gs) { f.globalAlpha = 0.6; G.circ(f, g.x - ox + 4, g.y - camY - 8, 12, '#000'); }
    f.globalAlpha = 0.8; G.circ(f, this.exit.x - ox, this.exit.y - camY - 6, 18, '#000');
    f.globalAlpha = 1;
    cx.drawImage(this.fog, 0, 0);
    // velas
    for (const g of gs) {
      const fl = Math.random() < 0.5 ? C.yellow : C.orange;
      G.rect(cx, g.x - ox + 4, g.y - camY - 8, 1, 2, fl);
    }
    this.parts.draw(cx, ox, camY);
    if (!this.started) G.text(cx, 'SE OYEN CAMPANAS... ' + Math.ceil(this.delay - this.t), G.W / 2, 160, C.lav, { align: 'center', shadow: true });
    // brújula
    const ang = Math.atan2(this.exit.y - p.y, this.exit.x - p.x);
    G.rect(cx, G.W - 22, 16, 16, 16, '#000000a0');
    G.rect(cx, G.W - 14 + Math.cos(ang) * 5, 24 + Math.sin(ang) * 5, 2, 2, C.yellow);
    G.rect(cx, G.W - 15, 23, 2, 2, C.white);
  }
}
})();
