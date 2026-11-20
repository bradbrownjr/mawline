import { TrackerMusic } from './tracker.js';

const canvas = document.querySelector('#game');
const c = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const lengthEl = document.querySelector('#length');
const stateEl = document.querySelector('#state');
const startButton = document.querySelector('#start');
const W = 28, H = 31, T = 16, SPEED = 96;
const dirs = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] };
const mazeRows = [
  '############################', '#............##............#', '#.####.#####.##.#####.####.#', '#o####.#####.##.#####.####o#', '#..........................#', '#.####.##.########.##.####.#', '#......##....##....##......#', '######.##### ## #####.######', '     #.##          ##.#     ', '######.## ###--### ##.######', '      .   #      #   .      ', '######.## #      # ##.######', '     #.## ######## ##.#     ', '######.##          ##.######', '#............##............#', '#.####.#####.##.#####.####.#', '#o..##................##..o#', '###.##.##.########.##.##.###', '#......##....##....##......#', '#.##########.##.##########.#', '#..........................#', '############################'
];
const grid = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => mazeRows[y - 4]?.[x] ?? '#'));
const inBounds = (x, y) => y >= 0 && y < H && x >= 0 && x < W;
const passable = (x, y) => inBounds(x, y) && grid[y][x] !== '#';
const center = (x) => x * T + T / 2;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let music = new TrackerMusic();
let best = Number(localStorage.getItem('mawline-best') || 0);
let game, last = 0;

function freshGame() {
  const pellets = new Set(); const sparks = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x] === '.') pellets.add(`${x},${y}`);
    if (grid[y][x] === 'o') sparks.add(`${x},${y}`);
  }
  game = { running: false, paused: false, over: false, score: 0, born: 0, pellets, sparks,
    player: { x: center(14), y: center(20), dir: [-1, 0], want: [-1, 0], trail: [], growth: 8 },
    ghosts: [[13, 14, '#ff557f'], [14, 14, '#58e6ed'], [13, 15, '#ff9c4d'], [14, 15, '#c887ff']].map((v, i) => ({ x: center(v[0]), y: center(v[1]), dir: i < 2 ? [1, 0] : [-1, 0], color: v[2], home: [v[0], v[1]], eaten: 0 })),
    fruit: null, power: 0, fruitAt: 70 };
  syncHud();
}
function cell(entity) { return [Math.round((entity.x - T / 2) / T), Math.round((entity.y - T / 2) / T)]; }
function nearCenter(p) { return Math.abs(p.x - center(Math.round((p.x - T / 2) / T))) < 2 && Math.abs(p.y - center(Math.round((p.y - T / 2) / T))) < 2; }
function canMove(p, d) { const [x, y] = cell(p); return passable(x + d[0], y + d[1]); }
function move(p, d, amount) { p.x += d[0] * amount; p.y += d[1] * amount; if (p.x < -T / 2) p.x = canvas.width - T / 2; if (p.x > canvas.width - T / 2) p.x = -T / 2; }
function eatTail() {
  const p = game.player; if (game.power <= 0 || p.trail.length < 20) return false;
  for (let i = 14; i < p.trail.length - 5; i++) if (dist(p, p.trail[i]) < 8) {
    const cut = p.trail.length - i; p.trail.splice(i); p.growth = Math.max(8, p.growth - cut); game.score += cut * 5; return true;
  } return false;
}
function advance(dt) {
  if (!game.running || game.paused || game.over) return;
  const p = game.player; const before = { x: p.x, y: p.y };
  if (nearCenter(p)) { if (canMove(p, p.want)) p.dir = p.want; else if (!canMove(p, p.dir)) return; }
  move(p, p.dir, SPEED * dt); p.trail.unshift(before); while (p.trail.length > p.growth) p.trail.pop();
  const [x, y] = cell(p), key = `${x},${y}`;
  if (game.pellets.delete(key)) { p.growth++; game.score += 10; }
  if (game.sparks.delete(key)) { game.power = 8; game.score += 50; p.growth += 2; }
  if (game.fruit && dist(p, game.fruit) < 10) { p.growth += 20; game.score += 500; game.fruit = null; }
  if (!game.fruit && game.pellets.size < game.fruitAt) { game.fruit = { x: center(14), y: center(17) }; game.fruitAt -= 55; }
  game.power = Math.max(0, game.power - dt); eatTail();
  const elapsed = (performance.now() - game.born) / 1000;
  for (const g of game.ghosts) {
    if (g.eaten > 0) { g.eaten -= dt; continue; }
    if (nearCenter(g)) { const options = [[1,0],[-1,0],[0,1],[0,-1]].filter(d => canMove(g, d) && (d[0] !== -g.dir[0] || d[1] !== -g.dir[1])); g.dir = options[Math.floor(Math.random() * options.length)] || g.dir; }
    move(g, g.dir, (game.power ? 62 : 72 + Math.min(20, elapsed / 8)) * dt);
    if (dist(p, g) < 12) { if (game.power) { g.eaten = 4; p.growth += 10; game.score += 200; } else die(); }
  }
  if (game.pellets.size === 0) { game.score += 1000; freshGame(); start(); }
  game.score += Math.max(0, Math.floor(p.growth / 24 * dt)); syncHud();
}
function die() { game.over = true; game.running = false; stateEl.textContent = 'SYSTEM FAIL'; startButton.textContent = 'RETRY'; music.stop(); if (game.score > best) { best = game.score; localStorage.setItem('mawline-best', String(best)); } syncHud(); }
function start() { if (game.over) freshGame(); game.running = true; game.paused = false; game.born = performance.now(); stateEl.textContent = 'RUN'; startButton.textContent = 'PAUSE'; music.play(); }
function syncHud() { scoreEl.textContent = String(Math.floor(game.score)).padStart(6, '0'); bestEl.textContent = String(best).padStart(6, '0'); lengthEl.textContent = String(game.player.growth).padStart(3, '0'); }
function draw() {
  c.fillStyle = '#030614'; c.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x] === '#') { c.fillStyle = '#2946b7'; c.fillRect(x*T, y*T, T, T); c.fillStyle = '#091345'; c.fillRect(x*T+3, y*T+3, T-6, T-6); }
  }
  c.fillStyle = '#f5d9b5'; for (const key of game.pellets) { const [x,y] = key.split(',').map(Number); c.fillRect(center(x)-2, center(y)-2, 4, 4); }
  for (const key of game.sparks) { const [x,y] = key.split(',').map(Number); c.fillStyle = '#fff'; c.fillRect(center(x)-5, center(y)-5, 10, 10); c.fillStyle = '#68eaff'; c.fillRect(center(x)-2, center(y)-2, 4, 4); }
  if (game.fruit) { c.fillStyle = '#ff557f'; c.fillRect(game.fruit.x-6, game.fruit.y-6, 12, 12); c.fillStyle = '#74e173'; c.fillRect(game.fruit.x-2, game.fruit.y-9, 5, 4); }
  const p = game.player; c.fillStyle = game.power > 0 && Math.floor(game.power*8)%2 ? '#f7f1ff' : '#ffe15b'; for (const pt of p.trail) c.fillRect(Math.round(pt.x)-3, Math.round(pt.y)-3, 6, 6);
  c.beginPath(); c.arc(p.x, p.y, 7, 0.25 + Math.atan2(p.dir[1],p.dir[0]), 6.03 + Math.atan2(p.dir[1],p.dir[0])); c.lineTo(p.x,p.y); c.fill();
  for (const g of game.ghosts) { c.fillStyle = g.eaten > 0 ? '#49629c' : (game.power > 0 ? '#3854c9' : g.color); c.fillRect(g.x-6,g.y-5,12,11); c.fillRect(g.x-5,g.y-7,10,5); c.fillStyle='#fff'; c.fillRect(g.x-4,g.y-3,3,3); c.fillRect(g.x+2,g.y-3,3,3); }
  if (!game.running && !game.over) { c.fillStyle = '#ffe15b'; c.font = 'bold 16px monospace'; c.textAlign='center'; c.fillText('PRESS SPACE', canvas.width/2, 385); }
}
function frame(now) { const dt = Math.min(.04, (now-last)/1000 || 0); last=now; advance(dt); draw(); requestAnimationFrame(frame); }
window.addEventListener('keydown', (e) => { const d = dirs[e.key]; if (d) { e.preventDefault(); game.player.want = d; } if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!game.running) start(); else { game.paused=!game.paused; stateEl.textContent=game.paused?'PAUSE':'RUN'; if(game.paused) music.pause(); else music.resume(); } } if (e.key.toLowerCase()==='m') music.toggle(); });
startButton.addEventListener('click', () => { if (!game.running) start(); else { game.paused=!game.paused; game.paused ? music.pause() : music.resume(); stateEl.textContent=game.paused?'PAUSE':'RUN'; } });
freshGame(); requestAnimationFrame(frame);
