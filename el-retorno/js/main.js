'use strict';
// =====================================================================
//  Arranque
// =====================================================================
(function () {
G.save.load();
G.audio.muted = !!G.save.data.muted;
G.setupTouch();
G.resize();
const b = document.getElementById('btn-mute');
if (b) b.textContent = G.audio.muted ? '×' : '♪';

// atajos de prueba: ?game=zombis&d=0.5  ·  ?scene=map|shop|rest|event|end|over|name|rank
const q = new URLSearchParams(location.search);
let first = new G.TitleScene();
if (q.get('game') && G.GAMES[q.get('game')]) {
  G.newRun();
  const d = parseFloat(q.get('d') || '0.3');
  const id = q.get('game');
  const n = G.run.map.nodes.find(x => x.row === Math.min(8, Math.round(d * 8))) || G.run.map.nodes[0];
  n.type = id === 'coco' ? 'boss' : 'game'; n.game = id;
  if (id === 'coco') n.id = G.run.map.nodes[G.run.map.nodes.length - 1].id;
  first = q.get('card') ? new G.CardScene(n, d) : new G.MinigameScene(n, G.GAMES[id], d);
} else if (q.get('scene')) {
  G.newRun();
  const s = q.get('scene');
  const r = G.run;
  if (q.get('items')) q.get('items').split(',').forEach(i => G.giveItem(i));
  if (s === 'map') first = new G.MapScene();
  else {
    const n = r.map.nodes.find(x => x.row === 3) || r.map.nodes[0];
    r.node = n.id; r.row = n.row;
    const scenes = G.debugScenes || {};
    if (scenes[s]) first = scenes[s](n);
  }
}
G.start(first);
})();
