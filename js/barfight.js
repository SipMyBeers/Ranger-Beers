// Bar Fight — retro hero game
(function () {
  var canvas, ctx, W, H, dpr;
  var player, enemies, beers, bottles, particles, score, gameOver, frameId;
  var keys = {};
  var spawnTimer = 0;
  var beerTimer = 0;
  var bottleTimer = 0;
  var hitFlash = 0;
  var combo = 0;
  var comboTimer = 0;
  var shake = 0;
  var idleMode = true;
  var idleTimer = 0;

  // Pixel scale
  var PX = 3;

  // Colors
  var COL = {
    bg: '#0a0a0a',
    floor: '#1a1a1a',
    floorLine: '#222',
    player: '#C5B358',
    playerDark: '#8a7a30',
    enemy: '#cc4444',
    enemyDark: '#882222',
    beer: '#C5B358',
    beerFoam: '#fff',
    bottle: '#66aaff',
    punch: '#fff',
    text: 'rgba(197, 179, 88, 0.6)',
    textDim: 'rgba(255,255,255,0.15)',
    particle: '#C5B358',
    health: '#C5B358',
    healthBg: 'rgba(255,255,255,0.08)',
    ko: '#ff4444',
  };

  function init(container) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', function (e) {
      keys[e.key.toLowerCase()] = true;
      if (['arrowleft','arrowright','arrowup','arrowdown',' '].indexOf(e.key.toLowerCase()) > -1) {
        // Only prevent default if game canvas is visible
        if (document.activeElement === document.body) e.preventDefault();
      }
      if (idleMode && (e.key === ' ' || e.key.toLowerCase() === 'f')) {
        startGame();
      }
    });
    document.addEventListener('keyup', function (e) {
      keys[e.key.toLowerCase()] = false;
    });

    resetGame();
    loop();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.parentElement.clientWidth;
    H = canvas.parentElement.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetGame() {
    var floorY = H * 0.72;
    player = {
      x: W * 0.15,
      y: floorY,
      w: 20,
      h: 32,
      vx: 0,
      vy: 0,
      hp: 5,
      maxHp: 5,
      punching: 0,
      punchDir: 1,
      hit: 0,
      grounded: true,
    };
    enemies = [];
    beers = [];
    bottles = [];
    particles = [];
    score = 0;
    gameOver = false;
    spawnTimer = 0;
    beerTimer = 0;
    bottleTimer = 0;
    combo = 0;
    comboTimer = 0;
    shake = 0;
    idleMode = true;
  }

  function startGame() {
    idleMode = false;
    player.hp = player.maxHp;
    enemies = [];
    beers = [];
    bottles = [];
    particles = [];
    score = 0;
    gameOver = false;
    spawnTimer = 60;
    combo = 0;
  }

  function spawnEnemy() {
    var floorY = H * 0.72;
    var fromRight = Math.random() > 0.5;
    enemies.push({
      x: fromRight ? W + 20 : -20,
      y: floorY,
      w: 18,
      h: 30,
      vx: (fromRight ? -1 : 1) * (0.8 + Math.random() * 0.8),
      hp: 1 + Math.floor(score / 10),
      maxHp: 1 + Math.floor(score / 10),
      hit: 0,
      attackCd: 0,
      type: Math.random() > 0.7 ? 'big' : 'normal',
    });
  }

  function spawnBeer() {
    beers.push({
      x: 100 + Math.random() * (W - 200),
      y: H * 0.72 - 8,
      w: 10,
      h: 14,
      bob: Math.random() * Math.PI * 2,
    });
  }

  function spawnBottle(fromX, dir) {
    bottles.push({
      x: fromX,
      y: H * 0.72 - 20,
      vx: dir * (3 + Math.random() * 2),
      vy: -2 - Math.random() * 2,
      w: 6,
      h: 12,
      rot: 0,
    });
  }

  function addParticles(x, y, col, count, spread) {
    for (var i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.8) * spread,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        col: col,
        size: 1 + Math.random() * 2,
      });
    }
  }

  function update() {
    var floorY = H * 0.72;

    // Idle mode — just bob around
    if (idleMode) {
      idleTimer++;
      // Auto-spawn some enemies for ambience
      if (idleTimer % 120 === 0 && enemies.length < 3) spawnEnemy();
      // Move idle enemies
      for (var i = enemies.length - 1; i >= 0; i--) {
        var e = enemies[i];
        e.x += e.vx * 0.5;
        if (e.x < -40 || e.x > W + 40) enemies.splice(i, 1);
      }
      return;
    }

    if (gameOver) return;

    // Shake decay
    if (shake > 0) shake *= 0.85;

    // Combo timer
    if (comboTimer > 0) comboTimer--;
    if (comboTimer === 0) combo = 0;

    // Player movement
    var speed = 3.5;
    player.vx = 0;
    if (keys['arrowleft'] || keys['a']) { player.vx = -speed; player.punchDir = -1; }
    if (keys['arrowright'] || keys['d']) { player.vx = speed; player.punchDir = 1; }
    if ((keys['arrowup'] || keys['w'] || keys[' ']) && player.grounded) {
      player.vy = -8;
      player.grounded = false;
    }

    // Punch
    if ((keys['f'] || keys['enter']) && player.punching === 0) {
      player.punching = 12;
    }

    player.x += player.vx;
    player.vy += 0.45; // gravity
    player.y += player.vy;
    if (player.y >= floorY) {
      player.y = floorY;
      player.vy = 0;
      player.grounded = true;
    }
    player.x = Math.max(10, Math.min(W - 10, player.x));

    if (player.punching > 0) player.punching--;
    if (player.hit > 0) player.hit--;

    // Spawn
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = Math.max(40, 120 - score * 3);
    }

    beerTimer--;
    if (beerTimer <= 0 && beers.length < 2) {
      spawnBeer();
      beerTimer = 200 + Math.random() * 200;
    }

    // Enemies
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      var dx = player.x - e.x;
      var dist = Math.abs(dx);

      // Move toward player
      if (dist > 40) {
        e.x += (dx > 0 ? 1 : -1) * Math.abs(e.vx);
      }

      // Attack
      if (e.attackCd > 0) e.attackCd--;
      if (dist < 45 && e.attackCd === 0) {
        // Throw bottle sometimes
        if (Math.random() > 0.7 && dist > 25) {
          spawnBottle(e.x, dx > 0 ? 1 : -1);
          e.attackCd = 60;
        } else if (dist < 35) {
          // Melee hit player
          player.hp--;
          player.hit = 10;
          shake = 6;
          addParticles(player.x, player.y - 16, COL.ko, 5, 4);
          e.attackCd = 45;
          if (player.hp <= 0) {
            gameOver = true;
            addParticles(player.x, player.y - 16, COL.ko, 20, 8);
          }
        }
      }

      if (e.hit > 0) e.hit--;

      // Punch collision
      if (player.punching > 6 && player.punching < 11) {
        var punchX = player.x + player.punchDir * 28;
        if (Math.abs(punchX - e.x) < 25 && Math.abs(player.y - e.y) < 30) {
          e.hp--;
          e.hit = 8;
          e.x += player.punchDir * 12;
          shake = 4;
          addParticles(e.x, e.y - 16, '#fff', 4, 3);
          if (e.hp <= 0) {
            score++;
            combo++;
            comboTimer = 90;
            addParticles(e.x, e.y - 16, COL.particle, 12, 6);
            enemies.splice(i, 1);
          }
        }
      }
    }

    // Beers
    for (var i = beers.length - 1; i >= 0; i--) {
      var b = beers[i];
      b.bob += 0.05;
      if (Math.abs(player.x - b.x) < 18 && Math.abs(player.y - b.y) < 24) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
        addParticles(b.x, b.y - 8, COL.beer, 8, 4);
        beers.splice(i, 1);
      }
    }

    // Bottles
    for (var i = bottles.length - 1; i >= 0; i--) {
      var b = bottles[i];
      b.x += b.vx;
      b.vy += 0.3;
      b.y += b.vy;
      b.rot += 0.15;
      // Hit player
      if (Math.abs(player.x - b.x) < 15 && Math.abs((player.y - 16) - b.y) < 18) {
        player.hp--;
        player.hit = 10;
        shake = 5;
        addParticles(b.x, b.y, COL.bottle, 6, 5);
        bottles.splice(i, 1);
        if (player.hp <= 0) {
          gameOver = true;
          addParticles(player.x, player.y - 16, COL.ko, 20, 8);
        }
        continue;
      }
      // Off screen or hit floor
      if (b.y > floorY || b.x < -20 || b.x > W + 20) {
        addParticles(b.x, floorY, '#888', 4, 3);
        bottles.splice(i, 1);
      }
    }

    // Particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawRect(x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawPixelChar(x, y, w, h, bodyCol, darkCol, isHit, punchDir, punching, facing) {
    var bx = Math.round(x - w / 2);
    var by = Math.round(y - h);
    var flash = isHit ? '#fff' : null;

    // Body
    drawRect(bx + 4, by + 10, w - 8, h - 16, flash || bodyCol);
    // Head
    drawRect(bx + 5, by, w - 10, 12, flash || bodyCol);
    // Eyes
    drawRect(bx + 6, by + 4, 2, 2, '#000');
    drawRect(bx + w - 8, by + 4, 2, 2, '#000');
    // Legs
    drawRect(bx + 4, by + h - 8, 4, 8, flash || darkCol);
    drawRect(bx + w - 8, by + h - 8, 4, 8, flash || darkCol);

    // Arms / punch
    if (punching > 6) {
      // Extended punch arm
      var armX = punchDir > 0 ? bx + w : bx - 14;
      drawRect(armX, by + 12, 14, 4, flash || bodyCol);
      drawRect(punchDir > 0 ? armX + 10 : armX, by + 10, 6, 8, '#fff');
    } else {
      // Normal arms
      drawRect(bx - 3, by + 12, 4, 10, flash || darkCol);
      drawRect(bx + w - 1, by + 12, 4, 10, flash || darkCol);
    }
  }

  function draw() {
    ctx.save();

    // Shake
    if (shake > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
      );
    }

    // Clear
    ctx.clearRect(-10, -10, W + 20, H + 20);

    var floorY = H * 0.72;

    // Floor
    drawRect(0, floorY, W, 2, COL.floorLine);

    // Floor lines for depth
    for (var i = 0; i < 8; i++) {
      var ly = floorY + 20 + i * 30;
      if (ly < H) {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(0, ly, W, 1);
      }
    }

    // Beers
    for (var i = 0; i < beers.length; i++) {
      var b = beers[i];
      var bobY = Math.sin(b.bob) * 3;
      // Mug
      drawRect(b.x - 4, b.y - 12 + bobY, 8, 12, COL.beer);
      // Foam
      drawRect(b.x - 5, b.y - 14 + bobY, 10, 4, COL.beerFoam);
      // Handle
      drawRect(b.x + 4, b.y - 10 + bobY, 3, 8, COL.beer);
    }

    // Bottles
    for (var i = 0; i < bottles.length; i++) {
      var b = bottles[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      drawRect(-2, -6, 4, 12, COL.bottle);
      drawRect(-1, -9, 2, 4, COL.bottle);
      ctx.restore();
    }

    // Enemies
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var col = e.type === 'big' ? '#dd6644' : COL.enemy;
      var dark = e.type === 'big' ? '#994422' : COL.enemyDark;
      drawPixelChar(e.x, e.y, e.w, e.h, col, dark, e.hit > 0, 0, 0, 1);
    }

    // Player
    if (!gameOver || Math.floor(Date.now() / 150) % 2 === 0) {
      drawPixelChar(
        player.x, player.y,
        player.w, player.h,
        player.hit > 0 ? '#fff' : COL.player,
        player.hit > 0 ? '#ccc' : COL.playerDark,
        false,
        player.punchDir,
        player.punching,
        player.punchDir
      );
    }

    // Particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      drawRect(p.x, p.y, p.size, p.size, p.col);
    }
    ctx.globalAlpha = 1;

    // HUD — only when playing
    if (!idleMode) {
      // Health bar — bottom left, subtle
      var hbW = 80, hbH = 4, hbX = 24, hbY = H - 32;
      drawRect(hbX, hbY, hbW, hbH, COL.healthBg);
      drawRect(hbX, hbY, hbW * (player.hp / player.maxHp), hbH, COL.health);

      // Score
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = COL.textDim;
      ctx.textAlign = 'left';
      ctx.fillText('KO: ' + score, hbX, hbY - 10);

      // Combo
      if (combo > 1) {
        ctx.fillStyle = COL.text;
        ctx.fillText(combo + 'x COMBO', hbX + 60, hbY - 10);
      }
    }

    // Idle prompt
    if (idleMode) {
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillStyle = COL.textDim;
      ctx.textAlign = 'left';
      var blink = Math.floor(Date.now() / 800) % 2 === 0;
      if (blink) {
        ctx.fillText('PRESS F TO FIGHT', 24, H - 28);
      }
    }

    // Game over
    if (gameOver) {
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = COL.text;
      ctx.textAlign = 'center';
      ctx.fillText('K.O. — SCORE: ' + score, W / 2, H / 2);
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillStyle = COL.textDim;
      var blink = Math.floor(Date.now() / 800) % 2 === 0;
      if (blink) {
        ctx.fillText('PRESS F TO FIGHT AGAIN', W / 2, H / 2 + 24);
      }
    }

    ctx.restore();
  }

  function loop() {
    update();
    draw();
    frameId = requestAnimationFrame(loop);
  }

  // Restart on key after game over
  document.addEventListener('keydown', function (e) {
    if (gameOver && (e.key === 'f' || e.key === 'F' || e.key === ' ')) {
      startGame();
    }
  });

  // Export
  window.initBarFight = init;
})();
