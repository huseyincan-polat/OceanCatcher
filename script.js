const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
 
// --- State ---
let score, lives, level, gameRunning, objects, diver, spawnTimer, spawnInterval, bgBubbles, particles;
 
// --- Diver ---
const DIVER_W = 60, DIVER_H = 70;

const OBJ_TYPES = [
  { emoji: '🐟', points: 10,  danger: false, size: 36, weight: 35 },
  { emoji: '⭐', points: 25,  danger: false, size: 34, weight: 12 },
  { emoji: '💎', points: 50,  danger: false, size: 30, weight:  6 },
  { emoji: '🎁', points: 100, danger: false, size: 34, weight:  3 },
  { emoji: '🪼', points: -1,  danger: true,  size: 38, weight: 20 },
  { emoji: '🗑️', points: -1,  danger: true,  size: 34, weight: 12 }
];
 
function weightedRandom(types) {
  const total = types.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of types) { r -= t.weight; if (r <= 0) return t; }
  return types[types.length - 1];
}
 
function initGame() {
  score = 0;
  lives = 3;
  level = 1;
  gameRunning = true;
  objects = [];
  particles = [];
  spawnTimer = 0;
  spawnInterval = 90;

  diver = { 
    x: W / 2, 
    y: H - 100, 
    vx: 0, 
    w: DIVER_W, 
    h: DIVER_H,
    moveSpeed: 5,
    tilt: 0 
  };

  const savedHighScore = localStorage.getItem('oceanCatcherHighScore') || 0;
  const highScoreElement = document.getElementById('highScoreDisplay');
  if (highScoreElement) {
    highScoreElement.textContent = savedHighScore;
  }

  bgBubbles = Array.from({length: 18}, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 2 + Math.random() * 8,
    speed: 0.3 + Math.random() * 0.6,
    alpha: 0.08 + Math.random() * 0.12
  }));

  updateHUD();
}
 
// --- Input ---
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup',   e => keys[e.key] = false);
 
// Touch/drag
let touchX = null;
canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
canvas.addEventListener('touchmove',  e => {
  if (touchX !== null) {
    const dx = e.touches[0].clientX - touchX;
    diver.x = Math.max(DIVER_W/2, Math.min(W - DIVER_W/2, diver.x + dx));
    touchX = e.touches[0].clientX;
  }
}, { passive: true });
canvas.addEventListener('touchend', () => { touchX = null; });
 
// --- HUD ---
function updateHUD() {
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('levelDisplay').textContent = level;
  
  const currentHighScore = localStorage.getItem('oceanCatcherHighScore') || 0;
  if (score > parseInt(currentHighScore)) {
    localStorage.setItem('oceanCatcherHighScore', score);
    const hsDisplay = document.getElementById('highScoreDisplay');
    if (hsDisplay) hsDisplay.textContent = score;
  }

  const ld = document.getElementById('livesDisplay');
  if (ld) {
    ld.innerHTML = Array.from({length: 3}, (_, i) =>
      `<span class="heart" style="opacity: ${i < lives ? '1' : '0.3'}">${i < lives ? '❤️' : '🖤'}</span>`
    ).join('');
  }
}
 
// --- Particles ---
function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      r: 3 + Math.random() * 5,
      alpha: 1,
      color
    });
  }
}
 
// --- Spawn ---
function spawnObject() {
  const type = weightedRandom(OBJ_TYPES);
  objects.push({
    x: type.size/2 + Math.random() * (W - type.size),
    y: -type.size,
    type,
    speed: (2 + level * 0.60) * (0.85 + Math.random() * 0.3)
  });
}
 
// --- Level Up ---
let levelBannerTimer = 0;
function checkLevel() {
  const newLevel = Math.floor(score / 100) + 1;
  if (newLevel > level) {
    level = newLevel;
    // Orijinal zorluk artışı
    spawnInterval = Math.max(30, 90 - (level - 1) * 8);
    showLevelBanner();
    updateHUD();
  }
}
 
function showLevelBanner() {
  const b = document.getElementById('levelBanner');
  b.textContent = `Level ${level}! 🌊`;
  b.style.opacity = '1';
  levelBannerTimer = 120;
}
 
// --- Draw ---
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#001533');
  grad.addColorStop(0.5, '#002a5c');
  grad.addColorStop(1, '#001020');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
 
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const x = 60 + i * 90;
    const rayGrad = ctx.createLinearGradient(x, 0, x + 40, H * 0.7);
    rayGrad.addColorStop(0, 'rgba(100,200,255,0.06)');
    rayGrad.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(x - 20, 0); ctx.lineTo(x + 60, 0);
    ctx.lineTo(x + 80, H * 0.7); ctx.lineTo(x, H * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
 
  bgBubbles.forEach(b => {
    b.y -= b.speed;
    if (b.y < -b.r) b.y = H + b.r;
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.strokeStyle = 'rgba(150,220,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
 
  ctx.fillStyle = '#002244';
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) {
    ctx.lineTo(x, H - 20 - Math.sin(x * 0.05) * 12);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
 
  for (let i = 0; i < 6; i++) {
    const sx = 30 + i * 75 + Math.sin(Date.now() * 0.001 + i) * 5;
    const sh = 30 + i % 3 * 20;
    ctx.strokeStyle = `rgba(0, ${120 + i*15}, ${60 + i*10}, 0.7)`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, H - 18);
    for (let j = 1; j <= 3; j++) {
      ctx.quadraticCurveTo(
        sx + (j % 2 === 0 ? 12 : -12), H - 18 - j * sh / 3,
        sx, H - 18 - j * sh / 3 + 2
      );
    }
    ctx.stroke();
  }
}
 
function drawDiver(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(diver.tilt); // Yana yatma eklendi
 
  const bodyGrad = ctx.createRadialGradient(-4, -8, 2, 0, 0, 22);
  bodyGrad.addColorStop(0, '#4fc3f7');
  bodyGrad.addColorStop(1, '#0277bd');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();
 
  ctx.fillStyle = '#b0bec5';
  ctx.beginPath();
  ctx.roundRect(12, -14, 10, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#78909c';
  ctx.beginPath();
  ctx.roundRect(13, -13, 8, 18, 3);
  ctx.fill();
 
  ctx.fillStyle = '#6383b1';
  ctx.beginPath();
  ctx.ellipse(0, -10, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
 
  ctx.fillStyle = 'rgba(100,220,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(-1, -10, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
 
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-4, -13, 4, 2, -0.5, 0, Math.PI * 2);
  ctx.fill();
 
  ctx.fillStyle = '#f57f17';
  ctx.beginPath();
  ctx.ellipse(-6, 22, 6, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6, 22, 6, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
 
  const t = Date.now() * 0.002;
  for (let b = 0; b < 3; b++) {
    const bx = -14 + Math.sin(t + b * 1.2) * 4;
    const by = -8 - b * 10 - ((t * 30 + b * 20) % 30);
    ctx.globalAlpha = Math.max(0, 1 - b * 0.3);
    ctx.strokeStyle = 'rgba(150,230,255,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bx, by, 3 + b, 0, Math.PI * 2);
    ctx.stroke();
  }
 
  ctx.restore();
}
 
function drawObject(obj) {
  ctx.save();
  const s = obj.type.size;
  ctx.translate(obj.x, obj.y);
  ctx.font = `${s}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
 
  if (obj.type.danger) {
    ctx.shadowColor = 'rgba(255,50,50,0.8)';
    ctx.shadowBlur = 18;
  } else {
    ctx.shadowColor = 'rgba(100,220,255,0.5)';
    ctx.shadowBlur = 10;
  }
 
  ctx.fillText(obj.type.emoji, 0, 0);
  ctx.restore();
}
 
function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.1;
    p.alpha -= 0.03;
    p.r *= 0.96;
  });
  particles = particles.filter(p => p.alpha > 0);
}
 
let popups = [];
function addPopup(x, y, text, color) {
  popups.push({ x, y, text, color, alpha: 1, vy: -1.5 });
}
function drawPopups() {
  popups.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.font = 'bold 22px Fredoka One, cursive';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
    p.y += p.vy;
    p.alpha -= 0.022;
  });
  popups = popups.filter(p => p.alpha > 0);
}
 
function checkCollision(obj) {
  const s = obj.type.size / 2;
  const dx = Math.abs(obj.x - diver.x); 
  const dy = Math.abs(obj.y - diver.y);
  return dx < (DIVER_W / 2 + s * 0.6) && dy < (DIVER_H / 2 + s * 0.6);
}
 
function gameOver() {
  gameRunning = false;
  const ov = document.getElementById('overlay');
  ov.innerHTML = `
    <div class="emoji-big">${score >= 300 ? '🏆' : '😞'}</div>
    <h1>${score >= 300 ? 'Amazing!' : 'Game Over'}</h1>
    <p>You reached <strong>Level ${level}</strong></p>
    <div id="finalScore">${score} pts</div>
    <div style="display: flex; gap: 10px; flex-direction: column; width: 100%; margin-top: 15px;">
      <button onclick="startGame()" style="background: linear-gradient(135deg, #00c6ff, #0072ff); color: white; font-family: 'Fredoka One', cursive; font-size: 20px; border: none; padding: 12px 25px; border-radius: 50px; cursor: pointer;">Play Again 🤿</button>
      <button onclick="showMenu()" style="background: rgba(255, 255, 255, 0.2); color: white; font-family: 'Fredoka One', cursive; font-size: 16px; border: none; padding: 12px 25px; border-radius: 50px; cursor: pointer;">Back to Menu 🏠</button>
    </div>
  `;
  ov.style.display = 'flex';
}

function showMenu() {
  location.reload(); 
}
 
let animId;
function loop() {
  if (!gameRunning) return;
  animId = requestAnimationFrame(loop);
 
  const speed = 5;
  diver.tilt = 0;
  if (keys['ArrowLeft'])  { diver.x -= speed; diver.tilt = -0.15; }
  if (keys['ArrowRight']) { diver.x += speed; diver.tilt = 0.15; }
  diver.x = Math.max(DIVER_W/2, Math.min(W - DIVER_W/2, diver.x));
 
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnObject();
    if (Math.random() < 0.3 + level * 0.05) spawnObject(); 
  }
 
  objects.forEach(obj => { obj.y += obj.speed; });
 
  const toRemove = [];
  objects.forEach((obj, i) => {
    if (checkCollision(obj)) {
      toRemove.push(i);
      if (obj.type.danger) {
        lives--;
        spawnParticles(obj.x, obj.y, 'rgba(255,80,80,0.8)', 12);
        addPopup(obj.x, obj.y - 20, '-1 ❤️', '#ff5252');
        updateHUD();
        if (lives <= 0) { setTimeout(gameOver, 300); }
      } else {
        score += obj.type.points;
        spawnParticles(obj.x, obj.y, 'rgba(100,220,255,0.8)', 10);
        addPopup(obj.x, obj.y - 20, `+${obj.type.points}`, '#00e5ff');
        updateHUD();
        checkLevel();
      }
    }
    if (obj.y > H + obj.type.size) toRemove.push(i);
  });
  objects = objects.filter((_, i) => !toRemove.includes(i));
 
  if (levelBannerTimer > 0) {
    levelBannerTimer--;
    if (levelBannerTimer === 0) document.getElementById('levelBanner').style.opacity = '0';
  }
 
  drawBackground();
  drawParticles();
  objects.forEach(drawObject);
  drawDiver(diver.x, diver.y);
  drawPopups();
}
 
function startGame() {
  if (animId) cancelAnimationFrame(animId);
  document.getElementById('overlay').style.display = 'none';
  initGame();
  loop();
}
 
document.getElementById('startBtn').addEventListener('click', startGame);