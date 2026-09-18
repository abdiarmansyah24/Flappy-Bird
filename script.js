/* ==========================================================================
   NEON FLAPPY BIRD - GAME ENGINE (JAVASCRIPT)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. KONFIGURASI DAN VARIABEL UTAMA
// --------------------------------------------------------------------------

// Target Kemenangan (Dapat diubah dengan mudah)
const WINNING_SCORE = 20;

// Game States
const STATE_MENU = 'MENU';
const STATE_PLAYING = 'PLAYING';
const STATE_PAUSED = 'PAUSED';
const STATE_GAMEOVER = 'GAMEOVER';
const STATE_VICTORY = 'VICTORY';

let gameState = STATE_MENU;

// Audio System (Menggunakan Web Audio API Synthesizer agar 100% aman tanpa file external)
let audioCtx = null;
let isSoundMuted = false;

// Storage Key High Score
const HIGH_SCORE_STORAGE_KEY = 'neon_flappy_high_score';
let highScore = parseInt(localStorage.getItem(HIGH_SCORE_STORAGE_KEY)) || 0;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Dimensions (Virtual Coordinate System)
const V_WIDTH = 360;
const V_HEIGHT = 640;
let scale = 1;

// Element UI
const menuScreen = document.getElementById('menu-screen');
const howScreen = document.getElementById('how-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('gameover-screen');
const victoryScreen = document.getElementById('victory-screen');
const hudLayer = document.getElementById('hud-layer');

const currentScoreEl = document.getElementById('current-score');
const targetScoreDisplayEl = document.getElementById('target-score-display');
const menuHighScoreEl = document.getElementById('menu-high-score');
const gameOverScoreEl = document.getElementById('gameover-score');
const gameOverHighScoreEl = document.getElementById('gameover-high-score');
const newHighBadgeEl = document.getElementById('new-high-badge');
const victoryScoreEl = document.getElementById('victory-score');
const victoryHighScoreEl = document.getElementById('victory-high-score');

const btnSoundMenu = document.getElementById('btn-sound-menu');
const btnSoundHud = document.getElementById('btn-sound-hud');

// --------------------------------------------------------------------------
// 2. OBJEK ENTITAS GAME (BURUNG, RINTANGAN, PARTIKEL)
// --------------------------------------------------------------------------

let currentScore = 0;
let lastTime = 0;

// Gravitasi & Lompatan (Dibuat Lebih Mudah)
const GRAVITY = 0.35;
const FLAP_FORCE = -6.8;
const MAX_FALL_SPEED = 8.5;

// Burung (Bird Object)
const bird = {
  x: 80,
  y: V_HEIGHT / 2,
  radius: 16,
  vy: 0,
  rotation: 0,
  wingAngle: 0,
  wingSpeed: 0.15,
  isFlapping: false
};

// Array Rintangan & Partikel
let obstacles = [];
let particles = [];
let confetti = [];
let bgStars = [];

// Timers & Spawning
let obstacleTimer = 0;
let obstacleSpawnInterval = 135; // Frames (Jarak antar rintangan lebih jauh)

// Ground / Tanah Height
const GROUND_HEIGHT = 60;
let groundOffsetX = 0;

// --------------------------------------------------------------------------
// 3. SOUND SYNTHESIZER (WEB AUDIO API)
// --------------------------------------------------------------------------

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (isSoundMuted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  if (type === 'flap') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } 
  else if (type === 'score') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
  else if (type === 'gameover') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.35);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
  else if (type === 'victory') {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.3, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.25);
    });
  }
  else if (type === 'button') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

function toggleSound() {
  isSoundMuted = !isSoundMuted;
  btnSoundMenu.textContent = isSoundMuted ? 'SUARA: OFF' : 'SUARA: ON';
  btnSoundHud.textContent = isSoundMuted ? '🔇' : '🔊';
  playSound('button');
}

// --------------------------------------------------------------------------
// 4. SETUP RESIZING & CANVAS
// --------------------------------------------------------------------------

function resizeCanvas() {
  const container = document.getElementById('game-container');
  const w = container.clientWidth;
  const h = container.clientHeight;
  
  canvas.width = w;
  canvas.height = h;

  // Skala koordinat virtual
  scale = h / V_HEIGHT;
}

window.addEventListener('resize', resizeCanvas);

// Generate Bintang-bintang Background
function createBackgroundStars() {
  bgStars = [];
  for (let i = 0; i < 45; i++) {
    bgStars.push({
      x: Math.random() * V_WIDTH,
      y: Math.random() * (V_HEIGHT - GROUND_HEIGHT),
      radius: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.4 + 0.1
    });
  }
}

// --------------------------------------------------------------------------
// 5. KONTROL INPUT (HP TOUCH & LAPTOP KEYBOARD/MOUSE)
// --------------------------------------------------------------------------

function handleUserTouch(e) {
  // Abaikan jika menekan tombol UI
  if (e.target.closest('button') || e.target.tagName === 'BUTTON') {
    return;
  }

  if (e && e.cancelable && (e.type === 'touchstart' || e.type === 'pointerdown')) {
    e.preventDefault();
  }

  initAudio();

  if (gameState === STATE_PLAYING) {
    bird.vy = FLAP_FORCE;
    bird.isFlapping = true;
    playSound('flap');
    createJumpParticles();
  }
}

function setupInputListeners() {
  const container = document.getElementById('game-container');

  // Touch & Pointer event di seluruh container agar HP sentuh 100% responsif
  container.addEventListener('touchstart', handleUserTouch, { passive: false });
  container.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    handleUserTouch(e);
  }, { passive: false });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      if (gameState === STATE_PLAYING) {
        e.preventDefault();
        handleUserTouch(e);
      } else if (gameState === STATE_MENU) {
        startGame();
      }
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      if (gameState === STATE_PLAYING) {
        pauseGame();
      } else if (gameState === STATE_PAUSED) {
        resumeGame();
      }
    }
  });

  // UI Event Buttons
  document.getElementById('btn-start').addEventListener('click', () => { playSound('button'); startGame(); });
  document.getElementById('btn-how').addEventListener('click', () => { playSound('button'); showScreen(howScreen); });
  document.getElementById('btn-back-menu').addEventListener('click', () => { playSound('button'); showScreen(menuScreen); });
  
  btnSoundMenu.addEventListener('click', toggleSound);
  btnSoundHud.addEventListener('click', toggleSound);
  
  document.getElementById('btn-pause').addEventListener('click', () => { playSound('button'); pauseGame(); });
  document.getElementById('btn-resume').addEventListener('click', () => { playSound('button'); resumeGame(); });
  document.getElementById('btn-restart-pause').addEventListener('click', () => { playSound('button'); startGame(); });
  document.getElementById('btn-main-menu-pause').addEventListener('click', () => { playSound('button'); goToMenu(); });

  document.getElementById('btn-restart-gameover').addEventListener('click', () => { playSound('button'); startGame(); });
  document.getElementById('btn-main-menu-gameover').addEventListener('click', () => { playSound('button'); goToMenu(); });

  document.getElementById('btn-restart-victory').addEventListener('click', () => { playSound('button'); startGame(); });
  document.getElementById('btn-main-menu-victory').addEventListener('click', () => { playSound('button'); goToMenu(); });
}

// Helper Pergantian Layar UI
function showScreen(screenToActive) {
  [menuScreen, howScreen, pauseScreen, gameOverScreen, victoryScreen].forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });

  if (screenToActive) {
    screenToActive.classList.remove('hidden');
    screenToActive.classList.add('active');
  }

  if (gameState === STATE_PLAYING) {
    hudLayer.classList.remove('hidden');
    hudLayer.classList.add('active');
  } else {
    hudLayer.classList.remove('active');
    hudLayer.classList.add('hidden');
  }
}

// --------------------------------------------------------------------------
// 6. SISTEM PARTIKEL (TRAIL & CONFETTI)
// --------------------------------------------------------------------------

function createJumpParticles() {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: bird.x - 10,
      y: bird.y + (Math.random() * 10 - 5),
      vx: -(Math.random() * 2 + 1),
      vy: Math.random() * 2 - 1,
      size: Math.random() * 5 + 3,
      color: '#00f2fe',
      life: 1.0,
      decay: Math.random() * 0.05 + 0.03
    });
  }
}

function createCollisionParticles() {
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: bird.x,
      y: bird.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      size: Math.random() * 6 + 3,
      color: Math.random() > 0.5 ? '#ff007f' : '#ff4757',
      life: 1.0,
      decay: Math.random() * 0.04 + 0.02
    });
  }
}

function createVictoryConfetti() {
  confetti = [];
  const colors = ['#00f2fe', '#ff007f', '#ffcf00', '#00ff88', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    confetti.push({
      x: Math.random() * V_WIDTH,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2
    });
  }
}

// --------------------------------------------------------------------------
// 7. GAME LOGIC & SPEED PROGRESSION
// --------------------------------------------------------------------------

function getGameSpeed() {
  // Kecepatan dibuat lebih tenang dan santai
  if (currentScore >= 16) return 2.5;
  if (currentScore >= 11) return 2.2;
  if (currentScore >= 6)  return 2.0;
  return 1.8;
}

function getObstacleGap() {
  // Celah rintangan dibuat jauh lebih lebar agar mudah dilewati
  if (currentScore >= 15) return 145;
  if (currentScore >= 8)  return 155;
  return 165;
}

function initGame() {
  currentScore = 0;
  currentScoreEl.textContent = currentScore;
  targetScoreDisplayEl.textContent = WINNING_SCORE;
  
  bird.y = V_HEIGHT / 2;
  bird.vy = 0;
  bird.rotation = 0;
  
  obstacles = [];
  particles = [];
  confetti = [];
  obstacleTimer = 0;

  updateHighScoreDisplay();
}

function startGame() {
  initGame();
  gameState = STATE_PLAYING;
  showScreen(null); // Sembunyikan semua modal
}

function pauseGame() {
  if (gameState === STATE_PLAYING) {
    gameState = STATE_PAUSED;
    showScreen(pauseScreen);
  }
}

function resumeGame() {
  if (gameState === STATE_PAUSED) {
    gameState = STATE_PLAYING;
    showScreen(null);
  }
}

function goToMenu() {
  gameState = STATE_MENU;
  updateHighScoreDisplay();
  showScreen(menuScreen);
}

function spawnObstacle() {
  const gap = getObstacleGap();
  const minTop = 60;
  const maxTop = V_HEIGHT - GROUND_HEIGHT - gap - 60;
  const topHeight = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

  obstacles.push({
    x: V_WIDTH + 50,
    width: 52,
    topHeight: topHeight,
    bottomY: topHeight + gap,
    passed: false
  });
}

function updateHighScoreDisplay() {
  menuHighScoreEl.textContent = highScore;
  gameOverHighScoreEl.textContent = highScore;
  victoryHighScoreEl.textContent = highScore;
}

function handleScoreIncrease() {
  currentScore++;
  currentScoreEl.textContent = currentScore;
  playSound('score');

  // Cek Apakah Mencapai WINNING_SCORE
  if (currentScore >= WINNING_SCORE) {
    triggerVictory();
  }
}

function triggerGameOver() {
  gameState = STATE_GAMEOVER;
  playSound('gameover');
  createCollisionParticles();

  let isNewHigh = false;
  if (currentScore > highScore) {
    highScore = currentScore;
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, highScore);
    isNewHigh = true;
  }

  gameOverScoreEl.textContent = currentScore;
  gameOverHighScoreEl.textContent = highScore;

  if (isNewHigh) {
    newHighBadgeEl.classList.remove('hidden');
  } else {
    newHighBadgeEl.classList.add('hidden');
  }

  showScreen(gameOverScreen);
}

function triggerVictory() {
  gameState = STATE_VICTORY;
  playSound('victory');
  createVictoryConfetti();

  if (currentScore > highScore) {
    highScore = currentScore;
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, highScore);
  }

  victoryScoreEl.textContent = currentScore;
  victoryHighScoreEl.textContent = highScore;

  showScreen(victoryScreen);
}

// --------------------------------------------------------------------------
// 8. COLLISION DETECTION (SENSITIVITAS ADIL)
// --------------------------------------------------------------------------

function checkCollision() {
  // Hitbox burung dibuat lebih ramah (Fair & Forgiving Hitbox)
  const birdHitboxRadius = bird.radius - 6;

  // 1. Tabrakan dengan Tanah atau Atas Layar
  if (bird.y + birdHitboxRadius >= V_HEIGHT - GROUND_HEIGHT) {
    bird.y = V_HEIGHT - GROUND_HEIGHT - birdHitboxRadius;
    return true;
  }
  if (bird.y - birdHitboxRadius <= 0) {
    return true;
  }

  // 2. Tabrakan dengan Obstacle
  for (let obs of obstacles) {
    // Cek jangkauan horizontal
    if (bird.x + birdHitboxRadius > obs.x && bird.x - birdHitboxRadius < obs.x + obs.width) {
      // Cek apakah di luar celah (nabrak tiang atas atau tiang bawah)
      if (bird.y - birdHitboxRadius < obs.topHeight || bird.y + birdHitboxRadius > obs.bottomY) {
        return true;
      }
    }
  }

  return false;
}

// --------------------------------------------------------------------------
// 9. GAME UPDATE LOOP
// --------------------------------------------------------------------------

function update(deltaTime) {
  // Background star animation
  bgStars.forEach(s => {
    s.x -= s.speed;
    if (s.x < 0) s.x = V_WIDTH;
  });

  // Animasi Tanah Bergerak saat Bermain atau di Menu
  if (gameState === STATE_PLAYING || gameState === STATE_MENU) {
    groundOffsetX = (groundOffsetX + getGameSpeed()) % 24;
  }

  if (gameState === STATE_MENU) {
    // Burung melayang santai di menu utama
    bird.y = V_HEIGHT / 2 + Math.sin(Date.now() * 0.005) * 8;
    bird.rotation = 0;
    bird.wingAngle += bird.wingSpeed;
    return;
  }

  if (gameState === STATE_PAUSED) return;

  if (gameState === STATE_VICTORY) {
    // Update confetti saat layar kemenangan
    confetti.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.vRot;
      if (c.y > V_HEIGHT) c.y = -10;
    });
    return;
  }

  if (gameState === STATE_GAMEOVER) {
    // Update partikel ledakan saja saat game over
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
    });
    particles = particles.filter(p => p.life > 0);
    return;
  }

  // ----- STATE PLAYING -----
  const speed = getGameSpeed();

  // Update Fisika Burung
  bird.vy += GRAVITY;
  if (bird.vy > MAX_FALL_SPEED) bird.vy = MAX_FALL_SPEED;
  bird.y += bird.vy;

  // Rotasi Burung berdasarkan Kecepatan Jatuh
  if (bird.vy < 0) {
    bird.rotation = Math.max(-0.4, bird.rotation - 0.08);
  } else {
    bird.rotation = Math.min(0.7, bird.rotation + 0.05);
  }

  // Animasi Sayap
  bird.wingAngle += bird.wingSpeed * (bird.vy < 0 ? 2 : 1);

  // Spawning Obstacles
  obstacleTimer++;
  if (obstacleTimer >= obstacleSpawnInterval) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  // Update Obstacles Movement & Passing Score
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= speed;

    // Cek Lewati Obstacle (Score +1)
    if (!obs.passed && obs.x + obs.width < bird.x) {
      obs.passed = true;
      handleScoreIncrease();
    }

    // Hapus obstacle jika keluar dari layar kiri
    if (obs.x + obs.width < -20) {
      obstacles.splice(i, 1);
    }
  }

  // Update Partikel Jump
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
  });
  particles = particles.filter(p => p.life > 0);

  // Cek Collision
  if (checkCollision()) {
    triggerGameOver();
  }
}

// --------------------------------------------------------------------------
// 10. RENDER / DRAWING LOOP (CANVAS GRAPHICS)
// --------------------------------------------------------------------------

function draw() {
  ctx.save();
  ctx.scale(scale, scale);

  // 1. Background Gradient Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
  skyGrad.addColorStop(0, '#0a0e17');
  skyGrad.addColorStop(0.7, '#141c2b');
  skyGrad.addColorStop(1, '#1a2436');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

  // 2. Stars
  bgStars.forEach(s => {
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Obstacles (Futuristic Energy Pillars)
  obstacles.forEach(obs => {
    // Main Body Gradient
    const obsGrad = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
    obsGrad.addColorStop(0, '#00c6ff');
    obsGrad.addColorStop(0.5, '#0072ff');
    obsGrad.addColorStop(1, '#0040aa');

    ctx.fillStyle = obsGrad;

    // Top Pillar
    ctx.fillRect(obs.x, 0, obs.width, obs.topHeight);
    // Glowing Cap (Top Pillar Edge)
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(obs.x - 3, obs.topHeight - 12, obs.width + 6, 12);

    // Bottom Pillar
    const bottomHeight = V_HEIGHT - GROUND_HEIGHT - obs.bottomY;
    ctx.fillStyle = obsGrad;
    ctx.fillRect(obs.x, obs.bottomY, obs.width, bottomHeight);
    // Glowing Cap (Bottom Pillar Edge)
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(obs.x - 3, obs.bottomY, obs.width + 6, 12);
  });

  // 4. Ground (Tanah Neon Cyber Grid)
  const groundY = V_HEIGHT - GROUND_HEIGHT;
  ctx.fillStyle = '#0d131f';
  ctx.fillRect(0, groundY, V_WIDTH, GROUND_HEIGHT);

  // Top Neon Stripe on Ground
  ctx.fillStyle = '#00f2fe';
  ctx.fillRect(0, groundY, V_WIDTH, 3);
  ctx.shadowColor = '#00f2fe';
  ctx.shadowBlur = 8;
  ctx.fillRect(0, groundY, V_WIDTH, 3);
  ctx.shadowBlur = 0;

  // Diagonal Grid Lines on Ground
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
  ctx.lineWidth = 2;
  for (let x = -24; x < V_WIDTH + 24; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x - groundOffsetX, groundY);
    ctx.lineTo(x - groundOffsetX - 15, V_HEIGHT);
    ctx.stroke();
  }

  // 5. Partikel Jump & Ledakan
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;

  // 6. Character Burung (Original Cyber Bird)
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Body Outer Glow
  ctx.shadowColor = '#00f2fe';
  ctx.shadowBlur = 12;

  // Body (Gradient Circular Cyber Bird)
  const birdGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, bird.radius);
  birdGrad.addColorStop(0, '#ffffff');
  birdGrad.addColorStop(0.4, '#00f2fe');
  birdGrad.addColorStop(1, '#4facfe');

  ctx.fillStyle = birdGrad;
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Eye (Mata Burung Original)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(6, -5, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Beak (Paruh Cyber Kuning Neon)
  ctx.fillStyle = '#ffcf00';
  ctx.beginPath();
  ctx.moveTo(12, -2);
  ctx.lineTo(21, 2);
  ctx.lineTo(12, 6);
  ctx.closePath();
  ctx.fill();

  // Wing (Sayap dengan Animasi Flap Sinusoidal)
  const wingOffsetY = Math.sin(bird.wingAngle) * 5;
  ctx.fillStyle = '#ff007f';
  ctx.beginPath();
  ctx.ellipse(-5, 2 + wingOffsetY, 9, 5, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 7. Confetti (Saat Victory)
  confetti.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
    ctx.restore();
  });

  ctx.restore();
}

// --------------------------------------------------------------------------
// 11. MAIN GAME LOOP (REQUESTANIMATIONFRAME)
// --------------------------------------------------------------------------

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

// --------------------------------------------------------------------------
// 12. INISIALISASI SAAT AWAL LOAD
// --------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  createBackgroundStars();
  setupInputListeners();
  updateHighScoreDisplay();
  goToMenu();

  requestAnimationFrame(gameLoop);
});
