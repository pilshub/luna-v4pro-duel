// Ranking mundial de El Retorno.
// Función de Vercel que guarda las puntuaciones en Redis (Upstash) usando su API REST.
// Variables de entorno (las crea Vercel al conectar una base de datos Upstash/KV al proyecto):
//   KV_REST_API_URL + KV_REST_API_TOKEN   o   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// Sin ellas responde 503 y el juego usa solo el ranking local del dispositivo.
const KEY = 'elretorno:scores';
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmds) {
  const r = await fetch(url.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return r.json();
}

function clean(b) {
  if (!b || typeof b !== 'object') return null;
  const name = String(b.name || '').toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚÜ .!-]/g, '').trim().slice(0, 12);
  const score = Math.floor(Number(b.score));
  if (!name || !Number.isFinite(score) || score < 0 || score > 100000) return null;
  return {
    name,
    score,
    won: !!b.won,
    row: Math.max(0, Math.min(10, Math.floor(Number(b.row) || 0))),
    time: /^\d\d:\d\d$/.test(String(b.time)) ? String(b.time) : '',
    date: new Date().toISOString().slice(0, 10),
    id: Math.random().toString(36).slice(2, 10)
  };
}

async function top() {
  const [res] = await redis([['ZREVRANGE', KEY, '0', '9', 'WITHSCORES']]);
  const arr = (res && res.result) || [];
  const out = [];
  for (let i = 0; i < arr.length; i += 2) {
    try {
      const e = JSON.parse(arr[i]);
      e.score = Number(arr[i + 1]);
      delete e.id;
      out.push(e);
    } catch (err) { /* entrada corrupta: se ignora */ }
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!url || !token) return res.status(503).json({ error: 'ranking no configurado' });
  try {
    if (req.method === 'GET') return res.status(200).json({ scores: await top() });
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (err) { body = null; } }
      const e = clean(body);
      if (!e) return res.status(400).json({ error: 'datos no válidos' });
      const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
      const rl = 'elretorno:rl:' + ip;
      const [hits] = await redis([['INCR', rl], ['EXPIRE', rl, '60']]);
      if (hits && hits.result > 12) return res.status(429).json({ error: 'demasiados envíos, espera un minuto' });
      const member = JSON.stringify(e);
      const out = await redis([['ZADD', KEY, String(e.score), member], ['ZREVRANK', KEY, member], ['ZREMRANGEBYRANK', KEY, '0', '-501']]);
      const rank = out[1] && out[1].result !== null && out[1].result !== undefined ? out[1].result + 1 : null;
      return res.status(200).json({ ok: true, rank, scores: await top() });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'método no permitido' });
  } catch (err) {
    return res.status(502).json({ error: 'ranking no disponible' });
  }
};
