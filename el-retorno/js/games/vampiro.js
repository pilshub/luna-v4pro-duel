'use strict';
// EL VAMPIRO DEL CALLEJÓN — no te quedes a oscuras
(function () {
const C = G.C;
const GY = 158, LAMP_Y = 70, R = 30;
const DEF = G.GAMES.vampiro = {
  id: 'vampiro', name: 'El vampiro del callejón', place: 'callejon', icon: 'mi_vampiro', music: 'tense',
  intro: 'Un vampiro vigila el callejón. Mientras estés bajo la luz de un farol no se atreve a bajar. Pero los faroles fallan...',
  controls: [['← →', 'andar'], ['A', 'saltar murciélagos']],
  items: ['ajo', 'zapatillas', 'azabache', 'casco'],
  cause: 'El vampiro del callejón te pilló a oscuras. Ahora duermes de día.',
  create(D) { return new Vampiro(D); }
};

class Vampiro {
  constructor(D) {
    this.D = D; this.t = 0; this.done = false;
    this.L = Math.round(1000 + D * 450);
    this.p = { x: 30, y: GY, vy: 0, ground: true, face: 1, t: 0, inv: 0, moving: false };
    this.speed = 64 * G.speedMul();
    this.meter = 0; this.fill = G.lerp(2.3, 1.3, Math.min(1, D)) * (G.has('ajo') ? 1.75 : 1) / G.enemyMul();
    this.vamp = { x: 200, y: 30, state: 'hover', t: 0, sx: 0, sy: 0 };
    this.bats = []; this.batT = 2.5;
    this.parts = new G.Particles(); this.coins = new G.Coins();
    this.lamps = [];
    let x = 70;
    const S = G.lerp(120, 165, Math.min(1, D));
    let prevBroken = true;
    while (x < this.L - 70) {
      const period = G.rand(4.5, 7);
      const broken = !prevBroken && x > 200 && G.chance(D * 0.22);
      this.lamps.push({ x, period, phase: G.rand(0, period), off: Math.min(period - 1.6, G.lerp(1.2, 2.8, Math.min(1, D)) + G.rand(0, 0.6)), broken });
      if (G.chance(0.5)) this.coins.add(x, GY - 26, 999);
      prevBroken = broken;
      x += S + G.rand(-15, 15);
    }
    this.lamps[0].phase = 0; this.lamps[0].broken = false;
    for (let i = 0; i < 4; i++) this.coins.add(G.rand(150, this.L - 80), GY - 2, 999);
    this.makeBg();
    this.hud = { label: 'CALLEJÓN', prog: 0 };
    [this.dark, this.dctx] = G.makeCanvas(G.W, G.H);
  }
  makeBg() {
    [this.sky, this.skyX] = G.makeCanvas(G.W, G.H);
    G.art.sky(this.skyX, G.W, G.H);
    G.art.stars(this.skyX, G.W, 70, 77);
    G.art.moon(this.skyX, 250, 26, 9);
    const L = this.L;
    [this.far, this.farX] = G.makeCanvas(G.W + Math.ceil(L * 0.3), G.H);
    G.art.skyline(this.farX, this.far.width, 120, 31, '#151837');
    [this.world, this.wx] = G.makeCanvas(L + 40, G.H);
    const x = this.wx;
    let bx = -10, seed = 900;
    while (bx < L + 40) {
      const w = G.irand(60, 110), top = G.irand(26, 52);
      G.art.facade(x, bx, top, w, 150 - top, seed++, { lit: 0.18 });
      G.rect(x, bx + w - 1, top, 1, 150 - top, '#00000060');
      bx += w;
    }
    G.art.tiles(x, 0, 150, L + 40, 8);
    G.art.cobbles(x, 0, 158, L + 40, 22, '#24222f', '#1b1a24', '#2e2c3c');
    G.rect(x, 0, 157, L + 40, 1, '#15141c');
    for (let i = 0; i < L / 220; i++) G.art.contenedor(x, G.rand(100, L - 60), 142, G.pick(['#2c6a3a', '#a08a20', '#1d4a8a']));
    // puerta de salida
    const dx = L - 40;
    G.rect(x, dx - 2, 106, 28, 44, '#2a1a10');
    G.rect(x, dx, 108, 24, 42, '#ffd27a');
    G.rect(x, dx + 11, 108, 2, 42, '#c89a4a');
    G.text(x, 'SALIDA', dx + 12, 96, C.green, { align: 'center', shadow: true });
  }
  lampState(l) {
    if (l.broken) return 0;
    const u = (this.t + l.phase) % l.period;
    const offStart = l.period - l.off;
    if (u > offStart) return 0;
    if (u > offStart - 0.7) return Math.floor(this.t * 18) % 2 ? 1 : 0.35;
    return 1;
  }
  inLight(x) {
    for (const l of this.lamps) if (Math.abs(l.x - x) < R && this.lampState(l) > 0.3) return true;
    return x > this.L - 50 || x < 24;
  }
  update(dt) {
    this.t += dt;
    const p = this.p, a = G.Input.axis();
    p.moving = !!a.x;
    if (a.x) p.face = a.x > 0 ? 1 : -1;
    p.x = G.clamp(p.x + a.x * this.speed * dt, 10, this.L - 10);
    if (G.Input.hit('a') && p.ground) { p.vy = -175; p.ground = false; G.audio.sfx('jump'); }
    if (!p.ground) {
      p.vy += (G.Input.down('a') ? 470 : 760) * dt;
      p.y += p.vy * dt;
      if (p.y >= GY) { p.y = GY; p.vy = 0; p.ground = true; }
    }
    p.t += dt;
    if (p.inv > 0) p.inv -= dt;

    // oscuridad
    const lit = this.inLight(p.x);
    this.lit = lit;
    if (lit) this.meter = Math.max(0, this.meter - dt * 0.75);
    else this.meter += dt / this.fill;

    // vampiro
    const v = this.vamp;
    v.t += dt;
    const cam = this.cam();
    if (v.state === 'hover') {
      const tx = p.x + 30 * Math.sin(this.t * 0.7), ty = 30 + Math.sin(this.t * 2) * 4;
      v.x += (tx - v.x) * Math.min(1, dt * 2.5); v.y += (ty - v.y) * Math.min(1, dt * 3);
      if (this.meter >= 1) { v.state = 'dive'; v.t = 0; v.sx = v.x; v.sy = v.y; G.audio.sfx('scream'); }
    } else if (v.state === 'dive') {
      const k = Math.min(1, v.t / 0.35);
      v.x = G.lerp(v.sx, p.x, k); v.y = G.lerp(v.sy, p.y - 14, k * k);
      if (k >= 1) {
        if (p.inv <= 0) { G.hurt(DEF.cause); G.audio.sfx('bite'); p.inv = 1.3; this.parts.burst(p.x, p.y - 10, 12, [C.red, C.dred], 60, 0.5, 100); }
        this.meter = 0.15; v.state = 'rise'; v.t = 0; v.sx = v.x; v.sy = v.y;
      }
    } else if (v.state === 'rise') {
      const k = Math.min(1, v.t / 0.7);
      v.y = G.lerp(v.sy, 30, k); v.x += 40 * dt;
      if (k >= 1) v.state = 'hover';
    }
    void cam;

    // murciélagos
    this.batT -= dt;
    if (this.batT <= 0 && p.x < this.L - 140) {
      this.batT = G.lerp(3.2, 1.4, Math.min(1, this.D)) * G.rand(0.8, 1.25);
      this.bats.push({ x: this.cam() + G.W + 10, y: GY - 8, t: Math.random() * 3, vx: -(55 + this.D * 45) * G.enemyMul() * G.rand(0.9, 1.15) });
    }
    for (const b of this.bats) {
      b.t += dt; b.x += b.vx * dt;
      const by = b.y + Math.sin(b.t * 6) * 2;
      if (p.inv <= 0 && Math.abs(b.x - p.x) < 6 && by > p.y - 14 && by < p.y + 1) {
        G.hurt('Una nube de murciélagos te llevó volando. Muy lejos.');
        p.inv = 1.2; b.dead = true;
        this.parts.burst(b.x, by, 8, [C.black, C.red], 50, 0.4);
      }
    }
    this.bats = this.bats.filter(b => !b.dead && b.x > this.cam() - 20);

    this.coins.update(dt, p.x, p.y - 4, this.parts, 10);
    this.parts.update(dt);
    this.hud.prog = p.x / (this.L - 34);
    this.hud.label = 'CALLEJÓN';
    if (p.x >= this.L - 34) this.done = true;
  }
  cam() { return G.clamp(this.p.x - 110, 0, this.L - G.W); }
  draw(cx) {
    const cam = Math.round(this.cam()), t = this.t;
    cx.drawImage(this.sky, 0, 0);
    cx.drawImage(this.far, Math.round(cam * 0.3), 0, G.W, G.H, 0, 0, G.W, G.H);
    cx.drawImage(this.world, cam, 0, G.W, G.H, 0, 0, G.W, G.H);
    // faroles + conos
    for (const l of this.lamps) {
      const sx = l.x - cam;
      if (sx < -40 || sx > G.W + 40) continue;
      const st = this.lampState(l);
      G.art.wallLamp(cx, sx, LAMP_Y, st > 0.5);
      if (st > 0) G.art.lightCone(cx, sx, LAMP_Y + 8, GY + 4, R, 0.16 * st);
    }
    this.coins.draw(cx, cam, 0);
    // capa de oscuridad
    const d = this.dctx;
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, G.W, G.H);
    d.fillStyle = 'rgba(4,4,18,0.72)';
    d.fillRect(0, 0, G.W, G.H);
    d.globalCompositeOperation = 'destination-out';
    for (const l of this.lamps) {
      const sx = l.x - cam;
      if (sx < -40 || sx > G.W + 40) continue;
      const st = this.lampState(l);
      if (st <= 0) continue;
      d.globalAlpha = st;
      d.beginPath();
      d.moveTo(sx - 3, LAMP_Y + 6); d.lineTo(sx + 3, LAMP_Y + 6); d.lineTo(sx + R, GY + 10); d.lineTo(sx - R, GY + 10);
      d.fill();
      G.circ(d, sx, LAMP_Y + 5, 10, '#000');
    }
    d.globalAlpha = 0.5;
    G.circ(d, this.p.x - cam, this.p.y - 8, 16, '#000');
    d.globalAlpha = 1;
    const ex = this.L - 28 - cam;
    if (ex < G.W + 30) G.circ(d, ex, 130, 30, '#000');
    cx.drawImage(this.dark, 0, 0);

    // murciélagos (con contorno para verlos en la oscuridad)
    for (const b of this.bats) {
      const f = Math.floor(b.t * 10) % 2 ? 'bat0' : 'bat1', bx = b.x - cam - 4, by = b.y + Math.sin(b.t * 6) * 2 - 3;
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) G.draw(cx, f, bx + ox, by + oy, false, '#4a3a6a');
      G.draw(cx, f, bx, by);
    }
    // Nico
    const p = this.p;
    if (!(p.inv > 0 && Math.floor(p.inv * 16) % 2)) {
      let f = 'nico0';
      if (!p.ground) f = 'nicoJump'; else if (p.moving) f = Math.floor(p.t * 9) % 2 ? 'nico1' : 'nico2';
      G.drawFeet(cx, f, p.x - cam, p.y + 1, p.face < 0);
    }
    // vampiro
    const v = this.vamp;
    const vx = v.x - cam;
    if (this.meter > 0.55 && v.state === 'hover') {
      cx.globalAlpha = (this.meter - 0.55) * 1.4 * (0.6 + Math.sin(t * 20) * 0.4);
      G.circ(cx, vx, v.y + 6, 12, C.dred);
      cx.globalAlpha = 1;
    }
    G.drawScaled(cx, 'vampire', vx - 14, v.y - 10 + Math.sin(t * 3) * 1, 2);
    if (this.meter > 0.75 && v.state === 'hover' && Math.floor(t * 6) % 2) G.text(cx, '!', vx, v.y - 20, C.red, { align: 'center', shadow: true, scale: 2 });

    // medidor de oscuridad
    G.rect(cx, 6, 16, 62, 7, '#000000a0');
    G.rect(cx, 7, 17, 60 * Math.min(1, this.meter), 5, this.meter > 0.75 ? C.red : C.plum);
    G.text(cx, this.lit ? 'LUZ' : 'OSCURIDAD', 72, 16, this.lit ? C.yellow : C.pink, { shadow: true });
    this.parts.draw(cx, cam, 0);
  }
}
})();
