'use strict';
// =====================================================================
//  Piezas compartidas por los minijuegos
// =====================================================================
(function () {
const C = G.C;

// Nico visto desde arriba (x,y = pies)
class TopDown {
  constructor(x, y, o = {}) {
    this.x = x; this.y = y; this.face = 1; this.t = 0; this.moving = false; this.inv = 0;
    this.speed = (o.speed || 72) * G.speedMul();
    this.dirX = 1; this.dirY = 0; this.dash = 0; this.dashCd = 0; this.dashX = 0; this.dashY = 0;
    this.kx = 0; this.ky = 0; this.r = 4; this.stepT = 0;
  }
  get cy() { return this.y - 4; }
  startDash() {
    if (this.dashCd > 0) return false;
    const a = G.Input.axis();
    let dx = a.x, dy = a.y;
    if (!dx && !dy) { dx = this.dirX; dy = this.dirY; }
    const l = Math.hypot(dx, dy) || 1;
    this.dashX = dx / l; this.dashY = dy / l;
    this.dash = 0.16; this.dashCd = 0.9;
    G.audio.sfx('dash');
    return true;
  }
  update(dt, b, solid) {
    const a = G.Input.axis();
    if (a.x || a.y) { this.dirX = a.x; this.dirY = a.y; }
    if (a.x) this.face = a.x > 0 ? 1 : -1;
    let vx, vy;
    if (this.dash > 0) { vx = this.dashX * this.speed * 3; vy = this.dashY * this.speed * 3; this.dash -= dt; }
    else { vx = a.x * this.speed; vy = a.y * this.speed; }
    vx += this.kx; vy += this.ky;
    this.kx *= Math.pow(0.002, dt); this.ky *= Math.pow(0.002, dt);
    const nx = this.x + vx * dt;
    if (!solid || !solid(nx, this.y)) this.x = nx;
    const ny = this.y + vy * dt;
    if (!solid || !solid(this.x, ny)) this.y = ny;
    if (b) { this.x = G.clamp(this.x, b.x0, b.x1); this.y = G.clamp(this.y, b.y0, b.y1); }
    this.moving = !!(a.x || a.y);
    this.t += dt;
    if (this.moving) { this.stepT -= dt; if (this.stepT <= 0) { this.stepT = 0.28; G.audio.sfx('step'); } }
    if (this.inv > 0) this.inv -= dt;
    if (this.dashCd > 0) this.dashCd -= dt;
  }
  // devuelve el resultado de G.hurt o false si era invulnerable
  hurtBy(cause, fromX, fromY) {
    if (this.inv > 0 || this.dash > 0) return false;
    const r = G.hurt(cause);
    this.inv = 1.2;
    if (fromX !== undefined) {
      const dx = this.x - fromX, dy = this.y - fromY, l = Math.hypot(dx, dy) || 1;
      this.kx = dx / l * 160; this.ky = dy / l * 160;
    }
    return r;
  }
  draw(cx, ox = 0, oy = 0) {
    G.ellipse(cx, this.x - ox, this.y - oy, 4, 1, '#00000070');
    if (this.inv > 0 && Math.floor(this.inv * 16) % 2) return;
    let f = 'nico0';
    if (this.moving || this.dash > 0) f = Math.floor(this.t * 9) % 2 ? 'nico1' : 'nico2';
    G.drawFeet(cx, f, this.x - ox, this.y - oy + 1, this.face < 0);
    if (this.dash > 0) {
      cx.globalAlpha = 0.4;
      G.drawFeet(cx, f, this.x - ox - this.dashX * 6, this.y - oy + 1 - this.dashY * 6, this.face < 0, C.blue);
      cx.globalAlpha = 1;
    }
  }
}
G.TopDown = TopDown;

// Monedas recogibles
class Coins {
  constructor() { this.list = []; this.got = 0; }
  add(x, y, life = 9) { this.list.push({ x, y, t: Math.random() * 3, life, vy: 0, z: 0 }); }
  pop(x, y) { this.list.push({ x, y, t: 0, life: 7, z: 0, vz: 70 }); }
  update(dt, px, py, parts, radius = 9) {
    for (const c of this.list) {
      c.t += dt; c.life -= dt;
      if (c.vz !== undefined) { c.vz -= 260 * dt; c.z = Math.max(0, c.z + c.vz * dt); if (c.z === 0) c.vz = 0; }
      if (G.dist(c.x, c.y, px, py) < radius) {
        c.life = -1; this.got++;
        G.run.stats.coins++;
        G.addScore(10);
        G.audio.sfx('coin');
        if (parts) { parts.text(c.x, c.y - 10, '+1 €'); parts.burst(c.x, c.y - 3, 6, [C.yellow, C.orange, C.white], 40, 0.3); }
      }
    }
    this.list = this.list.filter(c => c.life > 0);
  }
  draw(cx, ox = 0, oy = 0) {
    const img = G.spr('coin');
    for (const c of this.list) {
      if (c.life < 2 && Math.floor(c.life * 10) % 2) continue;
      const ph = Math.floor(c.t * 8) % 4, w = [6, 4, 2, 4][ph];
      const x = Math.round(c.x - ox - w / 2), y = Math.round(c.y - oy - 7 - (c.z || 0) - Math.sin(c.t * 4) * 1.5);
      G.ellipse(cx, c.x - ox, c.y - oy, 3, 1, '#00000060');
      cx.drawImage(img, 0, 0, 6, 6, x, y, w, 6);
    }
  }
}
G.Coins = Coins;

// texto grande centrado con contorno
G.bigText = (cx, str, y, color = C.yellow, scale = 2) => {
  G.text(cx, str, G.W / 2, y, color, { align: 'center', scale, shadow: true, outline: true });
};
// flecha parpadeante que indica una dirección
G.pointer = (cx, x, y, dir, t) => {
  if (Math.floor(t * 4) % 2) return;
  const s = G.spr('arrowR', dir === 'left');
  if (dir === 'up' || dir === 'down') {
    cx.save();
    cx.translate(Math.round(x), Math.round(y));
    cx.rotate(dir === 'up' ? -Math.PI / 2 : Math.PI / 2);
    cx.drawImage(s, -2, -2);
    cx.restore();
  } else cx.drawImage(s, Math.round(x - 2), Math.round(y - 2));
};
})();
