
import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create() {
    
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#07111f");
    // Boss fight state
    this.boss = null;
    this.bossHealth = 100;
    this.bossMaxHealth = 100;
    this.isBossFight = false;
    this.bossSpawned = false;

    // Starfield
    for (let i = 0; i < 100; i++) {
      this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(0.7, 2),
        0xffffff,
        0.7
      );
    }

    // Mission UI
    this.add
      .text(width / 2, 30, "MISSION 01 // DEEP SPACE", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#93c5fd",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 62, "MOVE: WASD / ARROW KEYS", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);

    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();

    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Player spaceship
    this.ship = this.add.triangle(
      width / 2,
      height - 90,
      0, -26,
      -19, 20,
      19, 20,
      0x60a5fa
    );

    this.ship.setStrokeStyle(2, 0xe0f2fe);
    this.shipSpeed = 300;

    this.engineGlow = this.add.circle(
      this.ship.x,
      this.ship.y + 27,
      7,
      0x38bdf8,
      0.8
    );

    // Projectiles and enemies
    this.projectiles = [];
    this.enemies = [];

    this.fireInterval = 250;
    this.fireElapsed = 0;

    this.score = 0;
    
    // Player health and game state
    this.health = 3;
    this.isGameOver = false;
    this.playerHitCooldown = 0;

    this.healthText = this.add.text(
      20,
      70,
      "HULL: 3/3",
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#fca5a5",
        fontStyle: "bold",
      }
    );

    // Press R to restart after game over
    this.restartKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.R
    );


    this.scoreText = this.add.text(20, 20, "SCORE: 0", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#4ade80",
      fontStyle: "bold",
    });

    this.enemyCountText = this.add.text(20, 45, "ENEMIES: 0", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#fca5a5",
    });

    // Mission objective
this.kills = 0;
this.targetKills = 10;
this.isMissionComplete = false;

this.objectiveText = this.add.text(
  20,
  95,
  `OBJECTIVE: DESTROY ${this.targetKills} ENEMIES (0/${this.targetKills})`,
  {
    fontFamily: "Arial",
    fontSize: "14px",
    color: "#67e8f9",
    fontStyle: "bold",
  }
);

    // Spawn enemies periodically
    this.spawnTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.spawnEnemy,
      callbackScope: this,
    });

    this.add
      .text(width / 2, height - 25, "WEAPONS ONLINE", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#4ade80",
      })
      .setOrigin(0.5);
  }

  spawnEnemy() {
    if (this.isGameOver || this.isMissionComplete) return;
    const margin = 35;
    const x = Phaser.Math.Between(
      margin,
      this.scale.width - margin
    );

    const enemy = this.add.triangle(
      x,
      -25,
      0, 20,
      -16, -16,
      16, -16,
      0xf87171
    );

    enemy.setStrokeStyle(2, 0xfecaca);

    // Custom gameplay properties
    enemy.enemySpeed = Phaser.Math.Between(80, 140);

    this.enemies.push(enemy);
  }

  spawnBoss() {
  if (this.isGameOver || this.isMissionComplete || this.bossSpawned) {
    return;
  }

  this.bossSpawned = true;
  this.isBossFight = true;

  // Stop regular enemies during the boss fight
  this.spawnTimer?.remove(false);

  const centerX = this.scale.width / 2;

  // Boss spaceship
  this.boss = this.add.triangle(
    centerX,
    110,
    0, 35,
    -45, -25,
    45, -25,
    0xef4444
  );

  this.boss.setStrokeStyle(4, 0xfca5a5);
  this.boss.setDepth(5);

  // Boss title
  this.bossTitle = this.add.text(
    centerX,
    35,
    "WARNING: BOSS APPROACHING",
    {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f87171",
      fontStyle: "bold",
    }
  ).setOrigin(0.5);

  // Boss health bar
  const barWidth = 300;

  this.bossHealthBackground = this.add.rectangle(
    centerX,
    65,
    barWidth,
    14,
    0x334155
  );

  this.bossHealthFill = this.add.rectangle(
    centerX - barWidth / 2,
    65,
    barWidth,
    14,
    0xef4444
  ).setOrigin(0, 0.5);

  this.bossHealthLabel = this.add.text(
    centerX,
    85,
    `BOSS HP: ${this.bossHealth}/${this.bossMaxHealth}`,
    {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#fecaca",
    }
  ).setOrigin(0.5);

  this.bossDirection = 1;
  this.bossSpeed = 150;

  this.objectiveText.setText("OBJECTIVE: DEFEAT THE BOSS");
}

  shootLaser() {
    if (!this.ship?.active) return;

    const laser = this.add.rectangle(
      this.ship.x,
      this.ship.y - 28,
      5,
      18,
      0x67e8f9
    );

    laser.setStrokeStyle(1, 0xffffff);

    laser.laserSpeed = 600;

    this.projectiles.push(laser);
  }



update(time, delta) {
  // Game over: allow restart, but stop gameplay
  if (this.isGameOver || this.isMissionComplete) {
  if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
    this.scene.restart();
  }
  return;
}
  if (!this.ship?.active) return;

  const { width, height } = this.scale;
  const deltaSeconds = delta / 1000;

  // Player hit cooldown prevents multiple instant hits
  this.playerHitCooldown = Math.max(
    0,
    this.playerHitCooldown - delta
  );

  // 1. Player movement
  let directionX = 0;
  let directionY = 0;

  if (this.cursors.left.isDown || this.wasd.left.isDown) {
    directionX--;
  }

  if (this.cursors.right.isDown || this.wasd.right.isDown) {
    directionX++;
  }

  if (this.cursors.up.isDown || this.wasd.up.isDown) {
    directionY--;
  }

  if (this.cursors.down.isDown || this.wasd.down.isDown) {
    directionY++;
  }

  const direction = new Phaser.Math.Vector2(
    directionX,
    directionY
  ).normalize();

  this.ship.x += direction.x * this.shipSpeed * deltaSeconds;
  this.ship.y += direction.y * this.shipSpeed * deltaSeconds;

  this.ship.x = Phaser.Math.Clamp(
    this.ship.x, 28, width - 28
  );

  this.ship.y = Phaser.Math.Clamp(
    this.ship.y, 48, height - 43
  );

  this.engineGlow.setPosition(
    this.ship.x,
    this.ship.y + 27
  );

  this.engineGlow.setAlpha(
    0.55 + Math.random() * 0.4
  );

  // 2. Automatic shooting
  this.fireElapsed += delta;

  while (this.fireElapsed >= this.fireInterval) {
    this.fireElapsed -= this.fireInterval;
    this.shootLaser();
  }

  // 3. Move lasers
  for (const laser of this.projectiles) {
    if (!laser.active) continue;

    laser.y -= laser.laserSpeed * deltaSeconds;

    if (laser.y < -20) {
      laser.destroy();
    }
  }

  // 4. Move enemies
  for (const enemy of this.enemies) {
    if (!enemy.active) continue;

    enemy.y += enemy.enemySpeed * deltaSeconds;

    if (enemy.y > height + 30) {
      enemy.destroy();
    }
  }

  // 5. Laser-enemy collisions
  for (const laser of this.projectiles) {
    if (!laser.active) continue;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const distance = Phaser.Math.Distance.Between(
        laser.x,
        laser.y,
        enemy.x,
        enemy.y
      );

      if (
  laser.active &&
  enemy.active &&
  Phaser.Math.Distance.Between(
    laser.x,
    laser.y,
    enemy.x,
    enemy.y
  ) < 22
) {
  laser.destroy();
  enemy.destroy();

  this.score += 10;
  this.kills += 1;

  this.scoreText.setText(`SCORE: ${this.score}`);

  this.objectiveText.setText(
    `OBJECTIVE: DESTROY ${this.targetKills} ENEMIES (${this.kills}/${this.targetKills})`
  );

  if (this.kills >= this.targetKills) {
  this.spawnBoss();
  }

  break;
}
    }
  }

  // Boss collision and health
  if (this.isBossFight && this.boss?.active) {
    for (const laser of this.projectiles) {
      if (!laser.active) continue;

      const hit = Phaser.Math.Distance.Between(
        laser.x,
        laser.y,
        this.boss.x,
        this.boss.y
      ) < 50;

      if (hit) {
        laser.destroy();

        this.bossHealth = Math.max(0, this.bossHealth - 10);

        const barWidth = 300;
        this.bossHealthFill.width =
          barWidth * (this.bossHealth / this.bossMaxHealth);

        this.bossHealthLabel.setText(
          `BOSS HP: ${this.bossHealth}/${this.bossMaxHealth}`
        );

        if (this.bossHealth <= 0) {
          this.defeatBoss();
          return;
        }
      }
    }
  }
  // 6. Enemy-player collisions
  for (const enemy of this.enemies) {
    if (!enemy.active) continue;

    const distance = Phaser.Math.Distance.Between(
      this.ship.x,
      this.ship.y,
      enemy.x,
      enemy.y
    );

    if (distance < 28) {
      // Remove the enemy on contact
      enemy.destroy();

      // Only apply damage when the cooldown has expired
      if (this.playerHitCooldown <= 0) {
        this.health -= 1;
        this.playerHitCooldown = 1000;

        this.healthText.setText(
          `HULL: ${this.health}/3`
        );

        // Brief visual feedback
        this.ship.setAlpha(0.35);

        this.time.delayedCall(180, () => {
          if (this.ship?.active && !this.isGameOver) {
            this.ship.setAlpha(1);
          }
        });

        if (this.health <= 0) {
          this.endGame();
          return;
        }
      }
    }
  }

  // 7. Clean up destroyed objects
  this.projectiles = this.projectiles.filter(
    (laser) => laser.active
  );

  this.enemies = this.enemies.filter(
    (enemy) => enemy.active
  );

  // 8. Update enemy counter
  this.enemyCountText.setText(
    `ENEMIES: ${this.enemies.length}`
  );
}

completeMission() {
  if (
  this.isGameOver ||
  this.isMissionComplete ||
  this.isBossFight
) {
  return;
}

  this.isMissionComplete = true;

  this.spawnTimer?.remove(false);

  this.projectiles.forEach((laser) => laser.destroy());
  this.enemies.forEach((enemy) => enemy.destroy());

  this.projectiles = [];
  this.enemies = [];

  this.enemyCountText.setText("ENEMIES: 0");

  const centerX = this.scale.width / 2;
  const centerY = this.scale.height / 2;

  this.add.rectangle(
    centerX,
    centerY,
    this.scale.width,
    this.scale.height,
    0x020617,
    0.85
  )
    .setDepth(100);

  this.add.text(
    centerX,
    centerY - 65,
    "MISSION COMPLETE!",
    {
      fontFamily: "Arial",
      fontSize: "34px",
      fontStyle: "bold",
      color: "#67e8f9",
      align: "center",
    }
  )
    .setOrigin(0.5)
    .setDepth(101);

  this.add.text(
    centerX,
    centerY - 10,
    `FINAL SCORE: ${this.score}`,
    {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffffff",
    }
  )
    .setOrigin(0.5)
    .setDepth(101);

  this.add.text(
    centerX,
    centerY + 30,
    `ENEMIES DESTROYED: ${this.kills}/${this.targetKills}`,
    {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#a5f3fc",
    }
  )
    .setOrigin(0.5)
    .setDepth(101);

  const restartText = this.add.text(
    centerX,
    centerY + 85,
    "PLAY AGAIN  [R]",
    {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#67e8f9",
      backgroundColor: "#123047",
      padding: { x: 16, y: 12 },
    }
  )
    .setOrigin(0.5)
    .setDepth(101)
    .setInteractive({ useHandCursor: true });

  restartText.on("pointerdown", () => this.scene.restart());

  restartText.on("pointerover", () => {
    restartText.setColor("#ffffff");
  });

  restartText.on("pointerout", () => {
    restartText.setColor("#67e8f9");
  });
}

defeatBoss() {
  if (this.isGameOver || this.isMissionComplete) return;

  this.boss?.destroy();

  this.bossTitle?.destroy();
  this.bossHealthBackground?.destroy();
  this.bossHealthFill?.destroy();
  this.bossHealthLabel?.destroy();

  this.isBossFight = false;

  // Reward for defeating the boss
  this.score += 500;
  this.scoreText.setText(`SCORE: ${this.score}`);

  this.completeMission();
}


endGame() {
  if (this.isGameOver) return;

  this.isGameOver = true;

  // Stop spawning new enemies
  this.spawnTimer?.remove(false);

  // Remove existing projectiles and enemies
  this.projectiles.forEach((laser) => laser.destroy());
  this.enemies.forEach((enemy) => enemy.destroy());

  this.projectiles = [];
  this.enemies = [];

  this.enemyCountText.setText("ENEMIES: 0");

  // Dim the game area
  this.add
    .rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x020617,
      0.85
    )
    .setDepth(100);

  this.add
    .text(
      this.scale.width / 2,
      this.scale.height / 2 - 55,
      "MISSION FAILED",
      {
        fontFamily: "Arial",
        fontSize: "36px",
        fontStyle: "bold",
        color: "#f87171",
        align: "center",
      }
    )
    .setOrigin(0.5)
    .setDepth(101);

  this.add
    .text(
      this.scale.width / 2,
      this.scale.height / 2,
      `FINAL SCORE: ${this.score}`,
      {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffffff",
      }
    )
    .setOrigin(0.5)
    .setDepth(101);

  const restartText = this.add
    .text(
      this.scale.width / 2,
      this.scale.height / 2 + 55,
      "RESTART MISSION  [R]",
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#67e8f9",
        backgroundColor: "#123047",
        padding: { x: 16, y: 12 },
      }
    )
    .setOrigin(0.5)
    .setDepth(101)
    .setInteractive({ useHandCursor: true });

  restartText.on("pointerdown", () => {
    this.scene.restart();
  });

  restartText.on("pointerover", () => {
    restartText.setColor("#ffffff");
  });

  restartText.on("pointerout", () => {
    restartText.setColor("#67e8f9");
  });
}


}
