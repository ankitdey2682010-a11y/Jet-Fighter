/* ==========================================================================
   ASTRO FIREFIGHTER - LIGHT ENGINE EDITION
   - Clean object-oriented canvas game loop
   - Native WebAudio synthesizer (zero external sound files)
   - Multi-screen UI navigation flow
   ========================================================================== */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Screen Overlays
const screenWelcome = document.getElementById('screen-welcome');
const screenControls = document.getElementById('screen-controls');
const screenLevels = document.getElementById('screen-levels');
const screenDebrief = document.getElementById('screen-debrief');

// Interactive Buttons
const btnNextControls = document.getElementById('btn-next-controls');
const btnNextLevels = document.getElementById('btn-next-levels');
const btnLaunchGame = document.getElementById('btn-launch-game');
const btnReturnMenu = document.getElementById('btn-return-menu');
const sectorGrid = document.getElementById('sector-grid');

// Debrief Elements
const debriefTitle = document.getElementById('debrief-title');
const debriefSubtitle = document.getElementById('debrief-subtitle');
const debriefDetails = document.getElementById('debrief-details');

// --- AUDIO SYNTHESIZER ---
class AudioSynthesizer {
  constructor() {
    this.audioCtx = null;
  }

  ensureContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playWaterShot() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.audioCtx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.09);
  }

  playExplosion() {
    if (!this.audioCtx) return;
    const duration = 0.22;
    const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * duration, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, this.audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(30, this.audioCtx.currentTime + duration);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    noise.start();
  }

  playItemPickup() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.audioCtx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.18);
  }
}

const sfx = new AudioSynthesizer();

// --- NAVIGATION & MENU FLOW ---
const MAX_SECTORS = 15;
let chosenStartSector = 1;

function renderSectorGrid() {
  sectorGrid.innerHTML = '';
  for (let s = 1; s <= MAX_SECTORS; s++) {
    const btn = document.createElement('button');
    btn.className = `sector-option ${s === chosenStartSector ? 'active' : ''}`;
    btn.innerText = s;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.sector-option').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      chosenStartSector = s;
    });

    sectorGrid.appendChild(btn);
  }
}

renderSectorGrid();

btnNextControls.addEventListener('click', () => {
  sfx.ensureContext();
  screenWelcome.classList.add('hidden');
  screenControls.classList.remove('hidden');
});

btnNextLevels.addEventListener('click', () => {
  screenControls.classList.add('hidden');
  screenLevels.classList.remove('hidden');
});

btnLaunchGame.addEventListener('click', () => {
  screenLevels.classList.add('hidden');
  launchMission(chosenStartSector);
});

btnReturnMenu.addEventListener('click', () => {
  screenDebrief.classList.add('hidden');
  screenWelcome.classList.remove('hidden');
});

// --- GAME LOGIC & INPUTS ---
let currentSector = 1;
let totalScore = 0;
let isLoopRunning = false;
const activeKeys = {};

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  activeKeys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  activeKeys[e.code] = false;
});

// --- PLAYER ---
class PlayerShip {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 80;
    this.y = canvas.height / 2 - 14;
    this.width = 48;
    this.height = 28;
    this.speed = 5.5;
    this.hp = 100;
    this.maxHp = 100;

    // Heat mechanics
    this.cannonTemp = 0;
    this.maxTemp = 100;
    this.isOverheated = false;

    // Hydro-Dash
    this.dashCooldown = 0;
    this.isDashing = false;
    this.dashTimer = 0;

    // Upgrades
    this.weaponTier = 1;
    this.hasShield = false;
    this.lastShotTime = 0;
  }

  update() {
    let currentSpeed = this.speed;

    // Dash Handling
    if (this.dashCooldown > 0) this.dashCooldown--;

    if (this.isDashing) {
      currentSpeed *= 2.2;
      this.dashTimer--;
      if (this.dashTimer <= 0) this.isDashing = false;
    } else if (activeKeys['ShiftLeft'] || activeKeys['ShiftRight']) {
      if (this.dashCooldown <= 0) {
        this.isDashing = true;
        this.dashTimer = 10;
        this.dashCooldown = 80; // ~1.3 seconds recovery
        spawnExplosion(this.x, this.y + this.height / 2, '#38bdf8', 10);
      }
    }

    // Directional Movement
    if ((activeKeys['KeyW'] || activeKeys['ArrowUp']) && this.y > 10) this.y -= currentSpeed;
    if ((activeKeys['KeyS'] || activeKeys['ArrowDown']) && this.y < canvas.height - this.height - 10) this.y += currentSpeed;
    if ((activeKeys['KeyA'] || activeKeys['ArrowLeft']) && this.x > 10) this.x -= currentSpeed;
    if ((activeKeys['KeyD'] || activeKeys['ArrowRight']) && this.x < canvas.width / 1.8) this.x += currentSpeed;

    // Temperature Management
    if (this.isOverheated) {
      this.cannonTemp -= 0.65;
      if (this.cannonTemp <= 0) {
        this.cannonTemp = 0;
        this.isOverheated = false;
      }
    } else if (this.cannonTemp > 0) {
      this.cannonTemp -= 0.35;
    }

    // Firing Controls
    if (activeKeys['Space'] && !this.isOverheated) {
      this.shoot();
    }
  }

  shoot() {
    const now = Date.now();
    if (now - this.lastShotTime < 110) return;
    this.lastShotTime = now;

    this.cannonTemp += 4.2;
    if (this.cannonTemp >= this.maxTemp) {
      this.cannonTemp = this.maxTemp;
      this.isOverheated = true;
    }

    sfx.playWaterShot();
    const noseX = this.x + this.width;
    const centerY = this.y + this.height / 2;

    if (this.weaponTier === 1) {
      waterShots.push(new WaterShot(noseX, centerY, 0));
    } else if (this.weaponTier === 2) {
      waterShots.push(new WaterShot(noseX, this.y + 4, 0));
      waterShots.push(new WaterShot(noseX, this.y + this.height - 4, 0));
    } else {
      waterShots.push(new WaterShot(noseX, centerY, 0));
      waterShots.push(new WaterShot(noseX, this.y + 4, -1.5));
      waterShots.push(new WaterShot(noseX, this.y + this.height - 4, 1.5));
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Thruster Engine Trail
    const flameLength = this.isDashing ? 28 : 16;
    const flameFlicker = Math.random() * 6;
    
    const flameGrad = ctx.createLinearGradient(-flameLength - flameFlicker, 0, 0, 0);
    flameGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    flameGrad.addColorStop(0.5, this.isDashing ? '#00f0ff' : '#f97316');
    flameGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-flameLength - flameFlicker, this.height / 2);
    ctx.lineTo(0, this.height / 2 - 7);
    ctx.lineTo(4, this.height / 2);
    ctx.lineTo(0, this.height / 2 + 7);
    ctx.closePath();
    ctx.fill();

    // 2. Main Ship Hull
    const hullGrad = ctx.createLinearGradient(0, 0, this.width, 0);
    hullGrad.addColorStop(0, '#0284c7');
    hullGrad.addColorStop(0.6, '#38bdf8');
    hullGrad.addColorStop(1, '#e0f2fe');

    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(14, 2);
    ctx.lineTo(this.width - 12, 10);
    ctx.lineTo(this.width, this.height / 2);
    ctx.lineTo(this.width - 12, this.height - 10);
    ctx.lineTo(14, this.height - 2);
    ctx.lineTo(0, this.height - 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Wings
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.lineTo(24, -4);
    ctx.lineTo(30, 6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(8, this.height - 6);
    ctx.lineTo(24, this.height + 4);
    ctx.lineTo(30, this.height - 6);
    ctx.closePath();
    ctx.fill();

    // 4. Firefighter Safety Stripe
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(16, 8);
    ctx.lineTo(20, 8);
    ctx.lineTo(14, this.height - 8);
    ctx.lineTo(10, this.height - 8);
    ctx.closePath();
    ctx.fill();

    // 5. Visor
    const visorGrad = ctx.createLinearGradient(this.width - 24, 0, this.width - 10, 0);
    visorGrad.addColorStop(0, '#38bdf8');
    visorGrad.addColorStop(0.5, '#e0f2fe');
    visorGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = visorGrad;
    ctx.beginPath();
    ctx.ellipse(this.width - 18, this.height / 2, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 6. Water Cannon Nozzle
    ctx.fillStyle = '#64748b';
    ctx.fillRect(this.width - 4, this.height / 2 - 2, 6, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(this.width + 1, this.height / 2 - 1, 3, 2);

    // 7. Energy Shield Effect
    if (this.hasShield) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, this.width / 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}

const player = new PlayerShip();

// --- PROJECTILES & ENEMIES ---
class WaterShot {
  constructor(x, y, vy) {
    this.x = x;
    this.y = y;
    this.vx = 11;
    this.vy = vy;
    this.radius = 4;
    this.isExpired = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > canvas.width) this.isExpired = true;
  }

  draw() {
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Fireball {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.isExpired = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -10) this.isExpired = true;
  }

  draw() {
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class EnemyAutomata {
  constructor(type, sector) {
    this.type = type;
    this.x = canvas.width + 60;
    this.y = Math.random() * (canvas.height - 100) + 50;
    this.isExpired = false;

    if (type === 'scout') {
      this.width = 30;
      this.height = 25;
      this.hp = 2;
      this.speed = 3 + sector * 0.2;
      this.bounty = 100;
    } else if (type === 'interceptor') {
      this.width = 40;
      this.height = 30;
      this.hp = 4;
      this.speed = 2.4 + sector * 0.2;
      this.bounty = 200;
      this.sineAmp = Math.random() * 3 + 1;
      this.startY = this.y;
    } else if (type === 'heavy') {
      this.width = 58;
      this.height = 54;
      this.hp = 12;
      this.speed = 1.2;
      this.bounty = 500;
    } else if (type === 'boss') {
      this.x = canvas.width - 160;
      this.y = canvas.height / 2 - 60;
      this.width = 115;
      this.height = 115;
      this.hp = 90 + sector * 30;
      this.maxHp = this.hp;
      this.speed = 2;
      this.moveDir = 1;
      this.bounty = 5000;
    }
  }

  update() {
    if (this.type === 'boss') {
      this.y += this.speed * this.moveDir;
      if (this.y < 40 || this.y > canvas.height - this.height - 40) {
        this.moveDir *= -1;
      }
      if (Math.random() < 0.045) {
        fireballs.push(new Fireball(this.x, this.y + Math.random() * this.height, -7, (Math.random() - 0.5) * 4));
      }
      return;
    }

    this.x -= this.speed;

    if (this.type === 'interceptor') {
      this.y = this.startY + Math.sin(this.x * 0.02) * (this.sineAmp * 15);
    }

    const shootChance = this.type === 'heavy' ? 0.018 : 0.005;
    if (Math.random() < shootChance) {
      fireballs.push(new Fireball(this.x, this.y + this.height / 2, -5.5, 0));
    }

    if (this.x < -this.width) this.isExpired = true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'boss') {
      const bossGrad = ctx.createLinearGradient(0, 0, this.width, 0);
      bossGrad.addColorStop(0, '#7f1d1d');
      bossGrad.addColorStop(0.5, '#dc2626');
      bossGrad.addColorStop(1, '#991b1b');

      ctx.fillStyle = bossGrad;
      ctx.beginPath();
      ctx.moveTo(this.width, this.height / 2);
      ctx.lineTo(this.width - 25, 10);
      ctx.lineTo(30, 0);
      ctx.lineTo(0, 20);
      ctx.lineTo(15, this.height / 2);
      ctx.lineTo(0, this.height - 20);
      ctx.lineTo(30, this.height);
      ctx.lineTo(this.width - 25, this.height - 10);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(this.width - 35, this.height / 2, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(this.width - 35, this.height / 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#450a0a';
      ctx.fillRect(this.width - 15, 20, 18, 8);
      ctx.fillRect(this.width - 15, this.height - 28, 18, 8);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(0, -18, this.width, 8);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, -18, (this.hp / this.maxHp) * this.width, 8);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, -18, this.width, 8);

    } else if (this.type === 'heavy') {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(this.width, this.height / 2 - 6, 10 + Math.random() * 6, 12);

      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.moveTo(0, this.height / 2);
      ctx.lineTo(20, 4);
      ctx.lineTo(this.width - 10, 12);
      ctx.lineTo(this.width, this.height / 2);
      ctx.lineTo(this.width - 10, this.height - 12);
      ctx.lineTo(20, this.height - 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ea580c';
      ctx.fillRect(10, 14, this.width - 24, this.height - 28);

      ctx.fillStyle = '#fde047';
      ctx.fillRect(10, 10, 10, 5);
      ctx.fillRect(10, this.height - 15, 10, 5);

    } else if (this.type === 'interceptor') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(this.width, this.height / 2);
      ctx.lineTo(this.width + 10 + Math.random() * 4, this.height / 2 - 4);
      ctx.lineTo(this.width + 10 + Math.random() * 4, this.height / 2 + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.moveTo(0, this.height / 2);
      ctx.lineTo(this.width - 8, 2);
      ctx.lineTo(this.width, 8);
      ctx.lineTo(this.width - 12, this.height / 2);
      ctx.lineTo(this.width, this.height - 8);
      ctx.lineTo(this.width - 8, this.height - 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(8, this.height / 2 - 3, 12, 6);

    } else {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, this.height / 2);
      ctx.lineTo(this.width, 4);
      ctx.lineTo(this.width - 8, this.height / 2);
      ctx.lineTo(this.width, this.height - 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(6, this.height / 2 - 2, 8, 4);
    }

    ctx.restore();
  }
}

class PowerupCrate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 1.8;
    this.isExpired = false;

    const roll = Math.random();
    if (roll < 0.4) this.type = 'health';
    else if (roll < 0.7) this.type = 'weapon';
    else this.type = 'shield';
  }

  update() {
    this.x -= this.speed;
    if (this.x < -this.size) this.isExpired = true;
  }

  draw() {
    if (this.type === 'health') ctx.fillStyle = '#10b981';
    else if (this.type === 'weapon') ctx.fillStyle = '#f59e0b';
    else ctx.fillStyle = '#0284c7';

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.type[0].toUpperCase(), this.x, this.y + 3);
  }
}

class VisualParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.alpha = 1.0;
    this.fade = Math.random() * 0.04 + 0.02;
    this.color = color;
    this.size = Math.random() * 4 + 2;
    this.isExpired = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.fade;
    if (this.alpha <= 0) this.isExpired = true;
  }

  draw() {
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1.0;
  }
}

function spawnExplosion(x, y, color = '#ea580c', count = 15) {
  for (let i = 0; i < count; i++) particles.push(new VisualParticle(x, y, color));
}

// Global Collections
let waterShots = [];
let enemies = [];
let fireballs = [];
let powerups = [];
let particles = [];
let backgroundDots = [];

let defeatedCount = 0;
let requiredKills = 0;
let isBossPresent = false;

// Background Dots
for (let i = 0; i < 90; i++) {
  backgroundDots.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.5 + 0.2
  });
}

function launchMission(sector) {
  totalScore = 0;
  player.reset();
  setupSector(sector);
  isLoopRunning = true;
  requestAnimationFrame(gameLoop);
}

function setupSector(sectorNum) {
  currentSector = sectorNum;
  defeatedCount = 0;
  isBossPresent = false;
  requiredKills = 10 + sectorNum * 4;

  enemies = [];
  fireballs = [];
  waterShots = [];
  powerups = [];
}

function handleSpawns() {
  if (currentSector % 5 === 0 && !isBossPresent && defeatedCount >= 5) {
    enemies.push(new EnemyAutomata('boss', currentSector));
    isBossPresent = true;
  }

  if (Math.random() < 0.024 && !isBossPresent) {
    const roll = Math.random();
    if (roll < 0.5) enemies.push(new EnemyAutomata('scout', currentSector));
    else if (roll < 0.8) enemies.push(new EnemyAutomata('interceptor', currentSector));
    else enemies.push(new EnemyAutomata('heavy', currentSector));
  }
}

function updateFrame() {
  if (!isLoopRunning) return;

  player.update();

  backgroundDots.forEach(dot => {
    dot.x -= dot.speed;
    if (dot.x < 0) dot.x = canvas.width;
  });

  waterShots.forEach(shot => shot.update());
  waterShots = waterShots.filter(shot => !shot.isExpired);

  fireballs.forEach(fb => {
    fb.update();
    const hitDist = Math.hypot(player.x + player.width / 2 - fb.x, player.y + player.height / 2 - fb.y);

    if (hitDist < fb.radius + player.height / 2) {
      if (player.hasShield) {
        player.hasShield = false;
      } else {
        player.hp -= 12;
      }
      spawnExplosion(fb.x, fb.y, '#ea580c', 8);
      fb.isExpired = true;

      if (player.hp <= 0) triggerMissionEnd(false);
    }
  });
  fireballs = fireballs.filter(fb => !fb.isExpired);

  enemies.forEach(enemy => {
    enemy.update();

    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      player.hp -= 25;
      spawnExplosion(enemy.x, enemy.y, '#ea580c', 20);
      sfx.playExplosion();

      if (enemy.type !== 'boss') enemy.isExpired = true;
      if (player.hp <= 0) triggerMissionEnd(false);
    }

    waterShots.forEach(shot => {
      if (
        shot.x > enemy.x && shot.x < enemy.x + enemy.width &&
        shot.y > enemy.y && shot.y < enemy.y + enemy.height
      ) {
        enemy.hp--;
        shot.isExpired = true;
        spawnExplosion(shot.x, shot.y, '#0284c7', 4);

        if (enemy.hp <= 0) {
          spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#f97316', 20);
          sfx.playExplosion();

          totalScore += enemy.bounty;
          defeatedCount++;
          enemy.isExpired = true;

          if (Math.random() < 0.25 && enemy.type !== 'boss') {
            powerups.push(new PowerupCrate(enemy.x, enemy.y));
          }

          if (defeatedCount >= requiredKills || enemy.type === 'boss') {
            if (currentSector < MAX_SECTORS) {
              setupSector(currentSector + 1);
            } else {
              triggerMissionEnd(true);
            }
          }
        }
      }
    });
  });
  enemies = enemies.filter(e => !e.isExpired);

  powerups.forEach(p => {
    p.update();
    const grabDist = Math.hypot(player.x + player.width / 2 - p.x, player.y + player.height / 2 - p.y);

    if (grabDist < p.size + player.height / 2) {
      sfx.playItemPickup();
      if (p.type === 'health') player.hp = Math.min(player.maxHp, player.hp + 30);
      if (p.type === 'weapon') player.weaponTier = Math.min(3, player.weaponTier + 1);
      if (p.type === 'shield') player.hasShield = true;
      p.isExpired = true;
    }
  });
  powerups = powerups.filter(p => !p.isExpired);

  particles.forEach(pt => pt.update());
  particles = particles.filter(pt => !pt.isExpired);

  handleSpawns();
}

function renderFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#cbd5e1';
  backgroundDots.forEach(dot => ctx.fillRect(dot.x, dot.y, dot.size, dot.size));

  player.draw();
  waterShots.forEach(s => s.draw());
  enemies.forEach(e => e.draw());
  fireballs.forEach(f => f.draw());
  powerups.forEach(p => p.draw());
  particles.forEach(pt => pt.draw());

  // HUD
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(15, 15, 210, 48);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(15, 15, 210, 48);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(20, 20, 200, 14);
  ctx.fillStyle = player.hp > 30 ? '#10b981' : '#ef4444';
  ctx.fillRect(20, 20, Math.max(0, (player.hp / player.maxHp) * 200), 14);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`HULL: ${Math.ceil(player.hp)}%`, 25, 31);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(20, 42, 200, 8);
  ctx.fillStyle = player.isOverheated ? '#ef4444' : '#f59e0b';
  ctx.fillRect(20, 42, (player.cannonTemp / player.maxTemp) * 200, 8);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SECTOR: ${currentSector} / ${MAX_SECTORS}`, canvas.width - 20, 32);
  ctx.fillText(`SCORE: ${totalScore}`, canvas.width - 20, 52);
  ctx.textAlign = 'left';
}

function gameLoop() {
  updateFrame();
  renderFrame();
  if (isLoopRunning) requestAnimationFrame(gameLoop);
}

function triggerMissionEnd(didWin) {
  isLoopRunning = false;

  if (didWin) {
    debriefTitle.innerText = 'SECTORS CLEARED!';
    debriefTitle.style.color = '#10b981';
    debriefSubtitle.innerText = 'MISSION ACCOMPLISHED';
    debriefDetails.innerHTML = `You secured all ${MAX_SECTORS} sectors!<br>Final Score: <strong>${totalScore}</strong>`;
  } else {
    debriefTitle.innerText = 'CRITICAL FAILURE';
    debriefTitle.style.color = '#ef4444';
    debriefSubtitle.innerText = 'SHIP DESTROYED';
    debriefDetails.innerHTML = `Fell in Sector <strong>${currentSector}</strong>.<br>Final Score: <strong>${totalScore}</strong>`;
  }

  screenDebrief.classList.remove('hidden');
}