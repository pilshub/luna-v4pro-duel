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

// atajos de prueba: ?tema=zombis,volcan (empieza la partida con esos tramos) · ?tema=coco (directo al jefe)
//                   ?scene=end|over|name|rank|howto|game
const q = new URLSearchParams(location.search);
let first = new G.TitleScene();
const s = q.get('scene');
if (q.get('tema')) {
  G.newRun();
  G.debugThemes = q.get('tema').split(',');
  first = new G.GameScene();
} else if (s && G.debugScenes[s]) {
  G.newRun();
  first = G.debugScenes[s]();
}
G.start(first);
})();
