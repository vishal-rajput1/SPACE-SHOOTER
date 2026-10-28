import Phaser from "phaser";

const COLORS = {
  bg: 0x050b18,
  panel: 0x0b1730,
  cyan: 0x55e7ff,
  blue: 0x5d8dff,
  red: 0xff5577,
  green: 0x62f6bd,
  white: 0xf3f7ff,
  muted: 0x8ea4c8,
};

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.gameState = "playing";
    this.score = 0;
    this.health = 3;
    this.kills = 0;
    this.targetKills = 10;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboWindow = 2200;
    this.isBossFight = false;
    this.bossSpawned = false;
    this.bossHealth = 100;
    this.bossMaxHealth = 100;
    this.playerHitCooldown = 0;
    this.fireElapsed = 0;
    this.fireInterval = 260;
    this.fireBoost = false;
    this.touchVector = new Phaser.Math.Vector2(0, 0);
    this.joystickPointerId = null;
    this.firePointerId = null;
    this.joystickOrigin = new Phaser.Math.Vector2(76, this.scale.height - 70);
    this.enemySpawnDelay = 950;
    this.bossFireElapsed = 0;

    this.projectiles = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.stars = [];

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.createBackground();
    this.createShip();
    this.createHud();
    this.createTouchControls();

    this.spawnTimer = this.time.addEvent({
      delay: this.enemySpawnDelay,
      loop: true,
      callback: this.spawnEnemy,
      callbackScope: this,
    });

    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.input.on("pointerupoutside", this.handlePointerUp, this);
    this.scale.on("resize", this.handleResize, this);

    this.handleResize({ width: this.scale.width, height: this.scale.height });
    this.showToast("SYSTEMS ONLINE  •  DESTROY 10 DRONES", COLORS.cyan);
  }

  createBackground() {
    this.backgroundGlow = this.add.graphics().setDepth(-20);
    this.starGraphics = this.add.graphics().setDepth(-10);

    for (let i = 0; i < 110; i += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.FloatBetween(0.5, 1.8),
        i % 7 === 0 ? COLORS.cyan : 0xdbeafe,
        Phaser.Math.FloatBetween(0.2, 0.8)
      ).setDepth(-5);
      star.drift = Phaser.Math.FloatBetween(8, 34);
      star.twinkle = Phaser.Math.FloatBetween(0.3, 1);
      this.stars.push(star);
    }

  }

  createShip() {
    const { width, height } = this.scale;

    this.engineGlow = this.add.circle(width / 2, height - 125, 11, COLORS.cyan, 0.45);
    this.engineGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.ship = this.add.triangle(
      width / 2, height - 145,
      0, -25, -19, 19, 19, 19,
      0x67a8ff
    ).setStrokeStyle(2, 0xe3f8ff).setDepth(8);

    this.shipSpeed = 340;
    this.ship.setScale(1.08);
  }

  createHud() {
    this.hudGraphics = this.add.graphics().setDepth(30);
    this.bottomGraphics = this.add.graphics().setDepth(30);

    const textStyle = {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#f3f7ff",
      fontStyle: "bold",
    };

    this.brandText = this.add.text(0, 0, "ODYSSEY", {
      ...textStyle, fontSize: "17px", color: "#65eaff", letterSpacing: 2,
    }).setOrigin(0, 0.5).setDepth(32);

    this.missionText = this.add.text(0, 0, "MISSION 01  /  DEEP SPACE", {
      ...textStyle, fontSize: "11px", color: "#91a8cc", letterSpacing: 1,
    }).setOrigin(0.5).setDepth(32);

    this.scoreText = this.add.text(0, 0, "SCORE  000000", {
      ...textStyle, fontSize: "13px", color: "#ffffff",
    }).setOrigin(0, 0.5).setDepth(32);

    this.healthText = this.add.text(0, 0, "HULL  ♥ ♥ ♥", {
      ...textStyle, fontSize: "13px", color: "#ff7894",
    }).setOrigin(1, 0.5).setDepth(32);

    this.objectiveText = this.add.text(0, 0, "DRONES DESTROYED  0 / 10", {
      ...textStyle, fontSize: "11px", color: "#78eaff",
    }).setOrigin(0.5).setDepth(32);

    this.progressBackground = this.add.rectangle(0, 0, 200, 5, 0x20314d, 1)
      .setOrigin(0, 0.5).setDepth(31);
    this.progressFill = this.add.rectangle(0, 0, 1, 5, COLORS.cyan, 1)
      .setOrigin(0, 0.5).setDepth(32);

    this.comboText = this.add.text(0, 0, "", {
      ...textStyle, fontSize: "16px", color: "#ffe27a",
    }).setOrigin(0.5).setDepth(35).setAlpha(0);

    this.statusText = this.add.text(0, 0, "AUTO-CANNON ACTIVE", {
      ...textStyle, fontSize: "10px", color: "#6af5c2", letterSpacing: 1,
    }).setOrigin(0.5).setDepth(32);

    this.pauseButton = this.add.text(0, 0, "Ⅱ", {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#eaf7ff",
      backgroundColor: "#142541",
      padding: { x: 11, y: 7 },
    }).setOrigin(0.5).setDepth(40).setInteractive({ useHandCursor: true });

    this.pauseButton.on("pointerdown", () => this.togglePause());
    this.pauseButton.on("pointerover", () => this.pauseButton.setColor("#65eaff"));
    this.pauseButton.on("pointerout", () => this.pauseButton.setColor("#eaf7ff"));

    this.bossTitle = this.add.text(0, 0, "ELITE COMMANDER", {
      ...textStyle, fontSize: "12px", color: "#ff8098", letterSpacing: 1.5,
    }).setOrigin(0.5).setDepth(34).setVisible(false);

    this.bossBarBackground = this.add.rectangle(0, 0, 240, 8, 0x321b36)
      .setOrigin(0, 0.5).setDepth(33).setVisible(false);
    this.bossBarFill = this.add.rectangle(0, 0, 240, 8, COLORS.red)
      .setOrigin(0, 0.5).setDepth(34).setVisible(false);
    this.bossHealthLabel = this.add.text(0, 0, "BOSS 100%", {
      ...textStyle, fontSize: "10px", color: "#ffc2ce",
    }).setOrigin(0.5).setDepth(34).setVisible(false);
  }

  createTouchControls() {
    this.controlGraphics = this.add.graphics().setDepth(50);
    this.joystickRing = this.add.circle(76, this.scale.height - 70, 43, 0x173050, 0.55)
      .setStrokeStyle(2, 0x6b9dce, 0.7).setDepth(51);
    this.joystickKnob = this.add.circle(76, this.scale.height - 70, 19, 0x7deaff, 0.85)
      .setStrokeStyle(2, 0xffffff, 0.8).setDepth(52);
    this.fireButton = this.add.circle(this.scale.width - 72, this.scale.height - 70, 37, 0x193e5a, 0.8)
      .setStrokeStyle(2, 0x69eaff, 0.95).setDepth(51).setInteractive({ useHandCursor: true });
    this.fireButtonLabel = this.add.text(this.scale.width - 72, this.scale.height - 70, "FIRE", {
      fontFamily: "Arial, sans-serif", fontSize: "11px", fontStyle: "bold",
      color: "#e9fbff", letterSpacing: 1,
    }).setOrigin(0.5).setDepth(52);

    this.fireButton.on("pointerdown", (pointer) => {
      this.firePointerId = pointer.id;
      this.fireBoost = true;
      this.fireButton.setFillStyle(0x1f7892, 0.95);
      this.cameras.main.shake(70, 0.001);
    });
    this.fireButton.on("pointerover", () => {
      if (!this.fireBoost) this.fireButton.setStrokeStyle(2, 0xb8f7ff, 1);
    });
  }

  handleResize(gameSize) {
    const width = gameSize.width || this.scale.width;
    const height = gameSize.height || this.scale.height;
    const compact = width < 620;
    const portrait = height > width;
    const pad = compact ? 14 : 24;
    this.compact = compact;
    this.portrait = portrait;

    this.backgroundGlow?.clear();
    this.backgroundGlow?.fillStyle(0x102956, 0.22);
    this.backgroundGlow?.fillCircle(width * 0.5, height * 0.35, Math.min(width, height) * 0.48);
    this.backgroundGlow?.fillStyle(0x082e42, 0.12);
    this.backgroundGlow?.fillCircle(width * 0.15, height * 0.72, Math.min(width, height) * 0.3);

    this.brandText?.setPosition(pad, compact ? 18 : 24);
    this.brandText?.setFontSize(compact ? "13px" : "17px");
    this.missionText?.setPosition(width / 2, compact ? 49 : 28);
    this.scoreText?.setPosition(pad, compact ? 43 : 55);
    this.healthText?.setPosition(width - pad, compact ? 43 : 55);
    this.objectiveText?.setPosition(width / 2, compact ? 80 : 65);
    this.progressBackground?.setPosition(width / 2 - Math.min(130, width * 0.28), compact ? 96 : 82);
    this.progressBackground?.setSize(Math.min(260, width * 0.56), 5);
    this.progressFill?.setPosition(width / 2 - Math.min(130, width * 0.28), compact ? 96 : 82);
    this.statusText?.setPosition(width / 2, height - (compact ? 121 : 25));
    this.statusText?.setVisible(!compact);
    this.pauseButton?.setPosition(width - pad - 16, compact ? 80 : 28);
    this.pauseButton?.setScale(compact ? 0.85 : 1);
    this.comboText?.setPosition(width / 2, compact ? 119 : 112);

    this.joystickOrigin.set(width < 460 ? 62 : 76, height - (compact ? 64 : 66));
    this.joystickRing?.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
    this.joystickKnob?.setPosition(
      this.joystickOrigin.x + this.touchVector.x * 23,
      this.joystickOrigin.y + this.touchVector.y * 23
    );
    this.fireButton?.setPosition(width - (width < 460 ? 62 : 76), height - (compact ? 64 : 66));
    this.fireButtonLabel?.setPosition(this.fireButton.x, this.fireButton.y);

    if (this.ship?.active) {
      this.ship.x = Phaser.Math.Clamp(this.ship.x, 24, width - 24);
      this.ship.y = Phaser.Math.Clamp(this.ship.y, this.getPlayTop(), height - this.getBottomSafe());
      this.engineGlow?.setPosition(this.ship.x, this.ship.y + 25);
    }

    this.layoutBossHud(width, compact);
    this.bottomGraphics?.clear();
    this.bottomGraphics?.fillStyle(0x071329, compact ? 0.84 : 0.48);
    this.bottomGraphics?.fillRoundedRect(8, height - (compact ? 112 : 18), width - 16, compact ? 104 : 10, 18);
    this.bottomGraphics?.lineStyle(1, 0x244363, 0.55);
    this.bottomGraphics?.strokeRoundedRect(8, height - (compact ? 112 : 18), width - 16, compact ? 104 : 10, 18);

    this.controlGraphics?.clear();
    this.controlGraphics?.lineStyle(1, 0x73c7e8, 0.3);
    this.controlGraphics?.strokeCircle(this.joystickOrigin.x, this.joystickOrigin.y, 48);
  }

  layoutBossHud(width = this.scale.width, compact = this.compact) {
    if (!this.bossTitle) return;
    const centerX = width / 2;
    const y = compact ? 139 : 108;
    const barWidth = Math.min(300, width * 0.56);
    this.bossTitle.setPosition(centerX, y);
    this.bossBarBackground.setPosition(centerX - barWidth / 2, y + 15).setSize(barWidth, 7);
    this.bossBarFill.setPosition(centerX - barWidth / 2, y + 15)
      .setSize(barWidth * (this.bossHealth / this.bossMaxHealth), 7);
    this.bossHealthLabel.setPosition(centerX, y + 30);
  }

  getPlayTop() {
    return this.compact ? (this.portrait ? 145 : 120) : 105;
  }

  getBottomSafe() {
    return this.compact ? (this.portrait ? 128 : 112) : 92;
  }

  handlePointerDown(pointer) {
    if (this.gameState !== "playing" || pointer.wasTouch === false && this.scale.width >= 620) return;
    const width = this.scale.width;
    const height = this.scale.height;
    if (pointer.y > height - (this.compact ? 120 : 100)) {
      if (pointer.x < width * 0.48 && this.joystickPointerId === null) {
        this.joystickPointerId = pointer.id;
        this.updateTouchVector(pointer);
      } else if (pointer.x >= width * 0.48 && this.firePointerId === null) {
        this.firePointerId = pointer.id;
        this.fireBoost = true;
        this.fireButton?.setFillStyle(0x1f7892, 0.95);
      }
    }
  }

  handlePointerMove(pointer) {
    if (pointer.id === this.joystickPointerId) this.updateTouchVector(pointer);
  }

  handlePointerUp(pointer) {
    if (pointer.id === this.joystickPointerId) {
      this.joystickPointerId = null;
      this.touchVector.set(0, 0);
      this.joystickKnob?.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
    }
    if (pointer.id === this.firePointerId) {
      this.firePointerId = null;
      this.fireBoost = false;
      this.fireButton?.setFillStyle(0x193e5a, 0.8);
    }
  }

  updateTouchVector(pointer) {
    const dx = pointer.x - this.joystickOrigin.x;
    const dy = pointer.y - this.joystickOrigin.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const magnitude = Math.min(1, length / 34);
    this.touchVector.set((dx / length) * magnitude, (dy / length) * magnitude);
    this.joystickKnob?.setPosition(
      this.joystickOrigin.x + this.touchVector.x * 23,
      this.joystickOrigin.y + this.touchVector.y * 23
    );
  }

  spawnEnemy() {
    if (this.gameState !== "playing" || this.isBossFight || this.kills >= this.targetKills) return;

    const margin = 30;
    const x = Phaser.Math.Between(margin, Math.max(margin, this.scale.width - margin));
    const enemy = this.add.triangle(
      x, this.getPlayTop() - 20,
      0, 17, -14, -12, 14, -12,
      0xff5e7d
    ).setStrokeStyle(2, 0xffc0cd).setDepth(7);
    enemy.enemySpeed = Phaser.Math.Between(78, 125);
    enemy.wobble = Phaser.Math.FloatBetween(0.6, 1.8);
    enemy.baseX = x;
    enemy.age = 0;
    this.enemies.push(enemy);
    this.tweens.add({
      targets: enemy,
      alpha: { from: 0.55, to: 1 },
      duration: 180,
      ease: "Quad.Out",
    });
  }

  spawnBoss() {
    if (this.gameState !== "playing" || this.bossSpawned) return;
    this.bossSpawned = true;
    this.isBossFight = true;
    this.spawnTimer?.remove(false);

    this.bossHealth = this.bossMaxHealth;
    this.boss = this.add.triangle(
      this.scale.width / 2, this.getPlayTop() + 65,
      0, 36, -48, -27, 48, -27,
      0xe84166
    ).setStrokeStyle(4, 0xffb2c2).setDepth(10);
    this.boss.setScale(1.05);
    this.bossDirection = 1;
    this.bossSpeed = Math.max(105, this.scale.width * 0.22);
    this.bossFireElapsed = 0;
    this.bossTitle.setText("⚠ ELITE COMMANDER ⚠").setVisible(true);
    this.bossBarBackground.setVisible(true);
    this.bossBarFill.setVisible(true);
    this.bossHealthLabel.setVisible(true);
    this.layoutBossHud();
    this.objectiveText.setText("FINAL OBJECTIVE  •  DEFEAT THE COMMANDER");
    this.progressFill.setFillStyle(COLORS.red);
    this.showToast("BOSS INBOUND  •  EVADE INCOMING FIRE", COLORS.red);
    this.cameras.main.flash(180, 90, 20, 45);
    this.tweens.add({
      targets: this.boss,
      scaleX: 1.12,
      scaleY: 0.94,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  shootLaser() {
    if (!this.ship?.active || this.gameState !== "playing") return;
    const laser = this.add.rectangle(
      this.ship.x, this.ship.y - 25, this.fireBoost ? 4 : 3, this.fireBoost ? 19 : 15,
      this.fireBoost ? 0xa9f8ff : COLORS.cyan
    ).setDepth(6);
    laser.setBlendMode(Phaser.BlendModes.ADD);
    laser.laserSpeed = 620;
    this.projectiles.push(laser);
    if (this.fireBoost) {
      this.cameras.main.shake(35, 0.0005);
    }
  }

  shootBossBullet() {
    if (!this.boss?.active || !this.ship?.active) return;
    const bullet = this.add.circle(this.boss.x, this.boss.y + 27, 6, COLORS.red, 1)
      .setStrokeStyle(2, 0xffd3dc).setDepth(9);
    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.ship.x, this.ship.y);
    bullet.vx = Math.cos(angle) * 205;
    bullet.vy = Math.sin(angle) * 205;
    this.enemyBullets.push(bullet);
    this.tweens.add({
      targets: bullet,
      scale: { from: 0.7, to: 1.25 },
      duration: 260,
      yoyo: true,
      repeat: -1,
    });
  }

  registerKill(target, laser) {
    if (!target.active || !laser.active) return;
    laser.destroy();
    target.destroy();

    this.kills += 1;
    this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
    this.comboTimer = this.comboWindow;
    const multiplier = this.combo >= 2 ? Math.min(5, 1 + Math.floor(this.combo / 2)) : 1;
    this.score += 10 * multiplier;
    this.scoreText.setText(`SCORE  ${String(this.score).padStart(6, "0")}`);
    this.objectiveText.setText(`DRONES DESTROYED  ${Math.min(this.kills, this.targetKills)} / ${this.targetKills}`);
    this.progressFill.width = this.progressBackground.width * Math.min(1, this.kills / this.targetKills);
    this.progressFill.setFillStyle(this.kills >= this.targetKills ? COLORS.red : COLORS.cyan);
    this.showScorePopup(target.x, target.y, `+${10 * multiplier}`);
    this.updateComboDisplay(multiplier);
    this.cameras.main.shake(75, 0.0011);
    this.spawnBurst(target.x, target.y, COLORS.cyan, 8);

    if (this.kills >= this.targetKills) this.spawnBoss();
  }

  updateComboDisplay(multiplier) {
    if (this.combo >= 2) {
      this.comboText.setText(`${multiplier}× COMBO`);
      this.comboText.setAlpha(1).setScale(1.25);
      this.tweens.add({
        targets: this.comboText,
        scale: 1,
        duration: 160,
        ease: "Back.Out",
      });
    } else {
      this.comboText.setAlpha(0);
    }
  }

  showScorePopup(x, y, message) {
    const popup = this.add.text(x, y, message, {
      fontFamily: "Arial, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#8af8ff",
      stroke: "#06101d",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: popup,
      y: y - 32,
      alpha: 0,
      scale: 1.25,
      duration: 550,
      ease: "Cubic.Out",
      onComplete: () => popup.destroy(),
    });
  }

  spawnBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      const particle = this.add.circle(x, y, Phaser.Math.FloatBetween(1.5, 3.5), color, 0.95)
        .setDepth(20).setBlendMode(Phaser.BlendModes.ADD);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(18, 55);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(250, 500),
        ease: "Cubic.Out",
        onComplete: () => particle.destroy(),
      });
    }
  }

  showToast(message, color = COLORS.cyan) {
    if (this.toastText?.active) this.toastText.destroy();
    this.toastText = this.add.text(this.scale.width / 2, this.compact ? 150 : 125, message, {
      fontFamily: "Arial, sans-serif",
      fontSize: this.compact ? "10px" : "12px",
      fontStyle: "bold",
      color: `#${color.toString(16).padStart(6, "0")}`,
      backgroundColor: "#071329",
      padding: { x: 12, y: 8 },
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.tweens.add({
      targets: this.toastText,
      alpha: 1,
      y: this.toastText.y + 8,
      duration: 220,
      yoyo: true,
      hold: 950,
      onComplete: () => this.toastText?.destroy(),
    });
  }

  takeDamage() {
    if (this.playerHitCooldown > 0 || this.gameState !== "playing") return;
    this.health -= 1;
    this.playerHitCooldown = 1050;
    this.healthText.setText(`HULL  ${"♥ ".repeat(this.health)}${"♡ ".repeat(3 - this.health)}`.trim());
    this.ship.setAlpha(0.35);
    this.cameras.main.shake(170, 0.004);
    this.cameras.main.flash(100, 255, 55, 100);
    this.time.delayedCall(220, () => {
      if (this.ship?.active && this.gameState === "playing") this.ship.setAlpha(1);
    });
    this.showToast(this.health > 0 ? "HULL BREACH  •  DAMAGE TAKEN" : "HULL CRITICAL", COLORS.red);
    if (this.health <= 0) this.endGame();
  }

  togglePause() {
    if (this.gameState === "gameover" || this.gameState === "victory") return;
    if (this.gameState === "paused") {
      this.gameState = "playing";
      this.spawnTimer && (this.spawnTimer.paused = false);
      this.pauseButton.setText("Ⅱ");
      this.pauseOverlay?.destroy();
      this.showToast("SYSTEMS RESUMED", COLORS.green);
    } else {
      this.gameState = "paused";
      this.spawnTimer && (this.spawnTimer.paused = true);
      this.pauseButton.setText("▶");
      this.showOverlay("PAUSED", "MISSION ON HOLD", "RESUME MISSION", () => this.togglePause(), true);
    }
  }

  showOverlay(title, subtitle, buttonLabel, action, isPause = false) {
    this.pauseOverlay?.destroy();
    const width = this.scale.width;
    const height = this.scale.height;
    const panelWidth = Math.min(width - 36, 390);
    const panelHeight = isPause ? 220 : 270;
    this.pauseOverlay = this.add.container(width / 2, height / 2).setDepth(100);
    const shade = this.add.rectangle(0, 0, width, height, 0x020713, 0.78);
    const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x0b1930, 0.98)
      .setStrokeStyle(1.5, isPause ? 0x4c8cc1 : title.includes("COMPLETE") ? COLORS.cyan : COLORS.red, 0.9);
    const accent = this.add.rectangle(0, -panelHeight / 2 + 2, panelWidth - 2, 4, isPause ? COLORS.cyan : title.includes("COMPLETE") ? COLORS.cyan : COLORS.red);
    const heading = this.add.text(0, -panelHeight / 2 + 48, title, {
      fontFamily: "Arial, sans-serif",
      fontSize: width < 420 ? "25px" : "30px",
      fontStyle: "bold",
      color: title.includes("FAILED") ? "#ff718c" : "#72edff",
      align: "center",
    }).setOrigin(0.5);
    const detail = this.add.text(0, -panelHeight / 2 + 91, subtitle, {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#b5c8e7",
      align: "center",
      wordWrap: { width: panelWidth - 40 },
    }).setOrigin(0.5);
    const button = this.add.text(0, panelHeight / 2 - 51, buttonLabel, {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#061222",
      backgroundColor: "#72edff",
      padding: { x: 22, y: 13 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerdown", action);
    button.on("pointerover", () => button.setScale(1.04));
    button.on("pointerout", () => button.setScale(1));
    this.pauseOverlay.add([shade, panel, accent, heading, detail, button]);
    this.tweens.add({
      targets: this.pauseOverlay,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.94, to: 1 },
      duration: 180,
      ease: "Cubic.Out",
    });
  }

  endGame() {
    if (this.gameState === "gameover" || this.gameState === "victory") return;
    this.gameState = "gameover";
    this.spawnTimer?.remove(false);
    this.pauseButton?.setVisible(false);
    this.enemies.forEach((item) => item.destroy());
    this.projectiles.forEach((item) => item.destroy());
    this.enemyBullets.forEach((item) => item.destroy());
    this.enemies = [];
    this.projectiles = [];
    this.enemyBullets = [];
    this.showOverlay("MISSION FAILED", `FINAL SCORE  ${this.score}   •   DRONES  ${this.kills}/${this.targetKills}`, "RETRY MISSION", () => this.scene.restart());
  }

  completeMission() {
    if (this.gameState === "gameover" || this.gameState === "victory") return;
    this.gameState = "victory";
    this.spawnTimer?.remove(false);
    this.pauseButton?.setVisible(false);
    this.boss?.destroy();
    this.enemies.forEach((item) => item.destroy());
    this.projectiles.forEach((item) => item.destroy());
    this.enemyBullets.forEach((item) => item.destroy());
    this.enemies = [];
    this.projectiles = [];
    this.enemyBullets = [];
    this.bossTitle?.setVisible(false);
    this.bossBarBackground?.setVisible(false);
    this.bossBarFill?.setVisible(false);
    this.bossHealthLabel?.setVisible(false);
    this.showOverlay(
      "MISSION COMPLETE",
      `COMMANDER ELIMINATED  •  FINAL SCORE  ${this.score}  •  +500 BOSS REWARD`,
      "PLAY AGAIN",
      () => this.scene.restart()
    );
    this.cameras.main.flash(450, 40, 220, 255);
  }

  defeatBoss() {
    if (!this.boss?.active || this.gameState !== "playing") return;
    this.spawnBurst(this.boss.x, this.boss.y, COLORS.red, 32);
    this.boss.destroy();
    this.score += 500;
    this.scoreText.setText(`SCORE  ${String(this.score).padStart(6, "0")}`);
    this.completeMission();
  }

  update(time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.restartKey) &&
      (this.gameState === "gameover" || this.gameState === "victory")) {
      this.scene.restart();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey) &&
      this.gameState !== "gameover" && this.gameState !== "victory") {
      this.togglePause();
    }
    if (this.gameState !== "playing") return;

    const { width, height } = this.scale;
    const dt = Math.min(delta, 40) / 1000;

    this.playerHitCooldown = Math.max(0, this.playerHitCooldown - delta);
    this.comboTimer = Math.max(0, this.comboTimer - delta);
    if (this.comboTimer === 0 && this.combo !== 0) {
      this.combo = 0;
      this.comboText.setAlpha(0);
    }

    for (const star of this.stars) {
      star.y += star.drift * dt;
      if (star.y > height + 3) {
        star.y = -3;
        star.x = Phaser.Math.Between(0, width);
      }
      star.setAlpha(0.35 + (Math.sin(time * 0.002 * star.twinkle) + 1) * 0.25);
    }

    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

    if (Math.abs(this.touchVector.x) > 0.05 || Math.abs(this.touchVector.y) > 0.05) {
      dx = this.touchVector.x;
      dy = this.touchVector.y;
    }
    const direction = new Phaser.Math.Vector2(dx, dy);
    if (direction.length() > 1) direction.normalize();

    this.ship.x = Phaser.Math.Clamp(this.ship.x + direction.x * this.shipSpeed * dt, 22, width - 22);
    this.ship.y = Phaser.Math.Clamp(
      this.ship.y + direction.y * this.shipSpeed * dt,
      this.getPlayTop() + 20,
      height - this.getBottomSafe()
    );
    this.engineGlow.setPosition(this.ship.x, this.ship.y + 24);
    this.engineGlow.setAlpha(0.38 + Math.random() * 0.35);
    this.engineGlow.setScale(Phaser.Math.FloatBetween(0.8, 1.3));

    this.fireElapsed += delta;
    const currentFireInterval = this.fireBoost ? 115 : this.fireInterval;
    while (this.fireElapsed >= currentFireInterval) {
      this.fireElapsed -= currentFireInterval;
      this.shootLaser();
    }

    for (const laser of this.projectiles) {
      if (!laser.active) continue;
      laser.y -= laser.laserSpeed * dt;
      if (laser.y < -20) laser.destroy();
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.age += dt;
      enemy.y += enemy.enemySpeed * dt;
      enemy.x = enemy.baseX + Math.sin(enemy.age * enemy.wobble) * 15;
      if (enemy.y > height + 30) enemy.destroy();
    }

    for (const laser of this.projectiles) {
      if (!laser.active) continue;
      for (const enemy of this.enemies) {
        if (!enemy.active || !laser.active) continue;
        if (Phaser.Math.Distance.Between(laser.x, laser.y, enemy.x, enemy.y) < 23) {
          this.registerKill(enemy, laser);
          break;
        }
      }
      if (this.gameState !== "playing") return;
    }

    if (this.isBossFight && this.boss?.active) {
      const bossMinX = Math.min(75, width * 0.2);
      const bossMaxX = width - bossMinX;
      this.boss.x += this.bossDirection * this.bossSpeed * dt;
      if (this.boss.x >= bossMaxX) {
        this.boss.x = bossMaxX;
        this.bossDirection = -1;
      } else if (this.boss.x <= bossMinX) {
        this.boss.x = bossMinX;
        this.bossDirection = 1;
      }

      this.bossFireElapsed += delta;
      if (this.bossFireElapsed >= 1050) {
        this.bossFireElapsed = 0;
        this.shootBossBullet();
      }

      for (const laser of this.projectiles) {
        if (!laser.active || !this.boss?.active) continue;
        if (Phaser.Math.Distance.Between(laser.x, laser.y, this.boss.x, this.boss.y) < 53) {
          laser.destroy();
          this.bossHealth = Math.max(0, this.bossHealth - 10);
          this.layoutBossHud();
          this.bossHealthLabel.setText(`BOSS ${this.bossHealth}%`);
          // Phaser Triangle shapes use setFillStyle(), not sprite tint methods.
          // Calling setTint() here throws on the first boss hit and stops the scene update.
          this.boss.setFillStyle(0xffffff);
          this.time.delayedCall(65, () => {
            if (this.boss?.active) this.boss.setFillStyle(0xe84166);
          });
          this.spawnBurst(laser.x, laser.y, COLORS.cyan, 4);
          if (this.bossHealth <= 0) {
            this.defeatBoss();
            return;
          }
        }
      }
    }

    for (const bullet of this.enemyBullets) {
      if (!bullet.active) continue;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.x < -20 || bullet.x > width + 20 || bullet.y < -20 || bullet.y > height + 20) {
        bullet.destroy();
        continue;
      }
      if (Phaser.Math.Distance.Between(bullet.x, bullet.y, this.ship.x, this.ship.y) < 25) {
        bullet.destroy();
        this.takeDamage();
        if (this.gameState !== "playing") return;
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (Phaser.Math.Distance.Between(this.ship.x, this.ship.y, enemy.x, enemy.y) < 28) {
        enemy.destroy();
        this.takeDamage();
        if (this.gameState !== "playing") return;
      }
    }

    this.projectiles = this.projectiles.filter((item) => item.active);
    this.enemies = this.enemies.filter((item) => item.active);
    this.enemyBullets = this.enemyBullets.filter((item) => item.active);
    this.progressFill.width = this.progressBackground.width * Math.min(1, this.kills / this.targetKills);
  }

  shutdown() {
    this.input.off("pointerdown", this.handlePointerDown, this);
    this.input.off("pointermove", this.handlePointerMove, this);
    this.input.off("pointerup", this.handlePointerUp, this);
    this.input.off("pointerupoutside", this.handlePointerUp, this);
    this.scale.off("resize", this.handleResize, this);
  }
}
