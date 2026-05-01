// Bar Fight — retro hero game
(function () {
  var canvas, ctx, W, H, dpr;
  var player, enemies, beers, bottles, particles, score, gameOver, frameId;
  var keys = {};
  var spawnTimer = 0;
  var beerTimer = 0;
  var combo = 0;
  var comboTimer = 0;
  var shake = 0;
  var idleMode = true;
  var idleTimer = 0;
  var levelUpFlash = 0;
  var lastLevel = 1;

  var COL = {
    bg: '#0a0a0a',
    floorLine: '#222',
    enemy: '#cc4444',
    enemyDark: '#882222',
    beer: '#C5B358',
    beerFoam: '#fff',
    bottle: '#66aaff',
    text: 'rgba(197, 179, 88, 0.6)',
    textDim: 'rgba(255,255,255,0.15)',
    particle: '#C5B358',
    health: '#C5B358',
    healthBg: 'rgba(255,255,255,0.08)',
    ko: '#ff4444',
  };

  var LEVEL_COLORS = [
    { body: '#C5B358', dark: '#8a7a30' },
    { body: '#44aaff', dark: '#2266aa' },
    { body: '#ff8844', dark: '#cc5522' },
    { body: '#dd44ff', dark: '#882299' },
  ];
  var LEVEL_NAMES = ['ROOKIE', 'BUZZED', 'HAMMERED', 'LEGENDARY'];
  var LVL_COL = ['#C5B358', '#44aaff', '#ff8844', '#dd44ff'];

  function getLevel() {
    if (!player) return 1;
    return Math.min(4, 1 + Math.floor(player.beersDrunk / 3));
  }

  function getLevelStats(level) {
    return {
      speed:        3.5 + (level - 1) * 0.8,
      punchDamage:  level >= 2 ? 2 : 1,
      punchRange:   28 + (level - 1) * 6,
      maxHp:        5  + (level - 1) * 2,
      canKick:      level >= 3,
      canThrow:     level >= 4,
    };
  }

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
        if (document.activeElement === document.body) e.preventDefault();
      }
      if (idleMode && (e.key === ' ' || e.key.toLowerCase() === 'f')) startGame();
      if (gameOver && (e.key === ' ' || e.key.toLowerCase() === 'f')) startGame();
    });
    document.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

    resetGame();
    loop();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.parentElement.clientWidth;
    H = canvas.parentElement.clientHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetGame() {
    var floorY = H * 0.72;
    player = {
      x: W * 0.15, y: floorY,
      w: 20, h: 32,
      vx: 0, vy: 0,
      hp: 5, maxHp: 5,
      punching: 0, kicking: 0,
      punchDir: 1,
      hit: 0,
      grounded: true,
      beersDrunk: 0,
    };
    enemies = []; beers = []; bottles = []; particles = [];
    score = 0; gameOver = false;
    spawnTimer = 0; beerTimer = 0;
    combo = 0; comboTimer = 0; shake = 0;
    levelUpFlash = 0; lastLevel = 1;
    idleMode = true;
  }

  function startGame() {
    idleMode = false;
    player.hp = 5; player.maxHp = 5; player.beersDrunk = 0;
    enemies = []; beers = []; bottles = []; particles = [];
    score = 0; gameOver = false;
    spawnTimer = 60; combo = 0;
    levelUpFlash = 0; lastLevel = 1;
  }

  function spawnEnemy() {
    var floorY = H * 0.72;
    var fromRight = Math.random() > 0.5;
    var big = Math.random() > 0.7;
    enemies.push({
      x: fromRight ? W + 20 : -20, y: floorY,
      w: big ? 22 : 18, h: big ? 36 : 30,
      vx: (fromRight ? -1 : 1) * (0.8 + Math.random() * 0.8),
      hp: 1 + Math.floor(score / 10),
      maxHp: 1 + Math.floor(score / 10),
      hit: 0, attackCd: 0,
      type: big ? 'big' : 'normal',
    });
  }

  function spawnBeer() {
    beers.push({
      x: 100 + Math.random() * (W - 200),
      y: H * 0.72 - 8,
      w: 10, h: 14,
      bob: Math.random() * Math.PI * 2,
    });
  }

  function spawnBottle(fromX, dir, fromPlayer) {
    bottles.push({
      x: fromX, y: H * 0.72 - 20,
      vx: dir * (fromPlayer ? 6 : 3 + Math.random() * 2),
      vy: -2 - Math.random() * 2,
      w: 6, h: 12, rot: 0,
      fromPlayer: !!fromPlayer,
    });
  }

  function addParticles(x, y, col, count, spread) {
    for (var i = 0; i < count; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.8) * spread,
        life: 20 + Math.random() * 20, maxLife: 40,
        col: col, size: 1 + Math.random() * 2,
      });
    }
  }

  function update() {
    var floorY = H * 0.72;

    if (idleMode) {
      idleTimer++;
      if (idleTimer % 120 === 0 && enemies.length < 3) spawnEnemy();
      for (var i = enemies.length - 1; i >= 0; i--) {
        enemies[i].x += enemies[i].vx * 0.5;
        if (enemies[i].x < -40 || enemies[i].x > W + 40) enemies.splice(i, 1);
      }
      return;
    }

    if (gameOver) return;

    if (shake > 0) shake *= 0.85;
    if (comboTimer > 0) comboTimer--;
    if (comboTimer === 0) combo = 0;
    if (levelUpFlash > 0) levelUpFlash--;

    var level = getLevel();
    var stats = getLevelStats(level);

    if (level > lastLevel) {
      lastLevel = level;
      levelUpFlash = 80;
      player.maxHp = stats.maxHp;
      player.hp = Math.min(player.hp + 3, player.maxHp);
      addParticles(player.x, player.y - 20, LVL_COL[level - 1], 24, 9);
    }

    player.vx = 0;
    if (keys['arrowleft'] || keys['a'])  { player.vx = -stats.speed; player.punchDir = -1; }
    if (keys['arrowright'] || keys['d']) { player.vx =  stats.speed; player.punchDir =  1; }
    if ((keys['arrowup'] || keys['w'] || keys[' ']) && player.grounded) {
      player.vy = -8; player.grounded = false;
    }

    if ((keys['f'] || keys['enter']) && !player.punching && !player.kicking) {
      if (stats.canThrow && (keys['shift'] || keys['control'])) {
        spawnBottle(player.x, player.punchDir, true);
      } else if (stats.canKick && Math.random() > 0.4) {
        player.kicking = 14;
      } else {
        player.punching = 12;
      }
    }

    player.x += player.vx;
    player.vy += 0.45;
    player.y += player.vy;
    if (player.y >= floorY) { player.y = floorY; player.vy = 0; player.grounded = true; }
    player.x = Math.max(10, Math.min(W - 10, player.x));
    if (player.punching > 0) player.punching--;
    if (player.kicking  > 0) player.kicking--;
    if (player.hit      > 0) player.hit--;

    spawnTimer--;
    if (spawnTimer <= 0) { spawnEnemy(); spawnTimer = Math.max(40, 120 - score * 3); }
    beerTimer--;
    if (beerTimer <= 0 && beers.length < 2) { spawnBeer(); beerTimer = 200 + Math.random() * 200; }

    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      var dx = player.x - e.x;
      var dist = Math.abs(dx);

      if (dist > 40) e.x += (dx > 0 ? 1 : -1) * Math.abs(e.vx);
      if (e.attackCd > 0) e.attackCd--;
      if (dist < 45 && e.attackCd === 0) {
        if (Math.random() > 0.7 && dist > 25) {
          spawnBottle(e.x, dx > 0 ? 1 : -1, false);
          e.attackCd = 60;
        } else if (dist < 35) {
          player.hp--; player.hit = 10; shake = 6;
          addParticles(player.x, player.y - 16, COL.ko, 5, 4);
          e.attackCd = 45;
          if (player.hp <= 0) { gameOver = true; addParticles(player.x, player.y - 16, COL.ko, 20, 8); }
        }
      }
      if (e.hit > 0) e.hit--;

      // Punch
      if (player.punching > 6 && player.punching < 11) {
        var punchX = player.x + player.punchDir * stats.punchRange;
        if (Math.abs(punchX - e.x) < 25 && Math.abs(player.y - e.y) < 30) {
          e.hp -= stats.punchDamage; e.hit = 8; e.x += player.punchDir * 12; shake = 4;
          addParticles(e.x, e.y - 16, '#fff', 4, 3);
          if (e.hp <= 0) {
            score++; combo++; comboTimer = 90;
            addParticles(e.x, e.y - 16, COL.particle, 12, 6);
            enemies.splice(i, 1); continue;
          }
        }
      }
      // Kick
      if (player.kicking > 7 && player.kicking < 13) {
        var kickX = player.x + player.punchDir * 42;
        if (Math.abs(kickX - e.x) < 34 && Math.abs(player.y - e.y) < 22) {
          e.hp -= 2; e.hit = 14; e.x += player.punchDir * 22; shake = 5;
          addParticles(e.x, e.y - 8, '#ffaa44', 7, 5);
          if (e.hp <= 0) {
            score++; combo++; comboTimer = 90;
            addParticles(e.x, e.y - 8, '#ffaa44', 14, 7);
            enemies.splice(i, 1); continue;
          }
        }
      }
    }

    for (var i = beers.length - 1; i >= 0; i--) {
      var b = beers[i];
      b.bob += 0.05;
      if (Math.abs(player.x - b.x) < 18 && Math.abs(player.y - b.y) < 24) {
        player.beersDrunk++;
        player.hp = Math.min(player.maxHp, player.hp + 1);
        addParticles(b.x, b.y - 8, COL.beer, 10, 5);
        beers.splice(i, 1);
      }
    }

    for (var i = bottles.length - 1; i >= 0; i--) {
      var b = bottles[i];
      b.x += b.vx; b.vy += 0.3; b.y += b.vy; b.rot += 0.15;

      if (b.fromPlayer) {
        for (var j = enemies.length - 1; j >= 0; j--) {
          var e = enemies[j];
          if (Math.abs(b.x - e.x) < 18 && Math.abs(b.y - (e.y - 16)) < 20) {
            e.hp -= 2; e.hit = 14; e.x += b.vx * 2;
            addParticles(b.x, b.y, '#66aaff', 8, 5);
            bottles.splice(i, 1);
            if (e.hp <= 0) { score++; combo++; comboTimer = 90; addParticles(e.x, e.y - 16, COL.particle, 12, 6); enemies.splice(j, 1); }
            break;
          }
        }
      } else {
        if (Math.abs(player.x - b.x) < 15 && Math.abs((player.y - 16) - b.y) < 18) {
          player.hp--; player.hit = 10; shake = 5;
          addParticles(b.x, b.y, COL.bottle, 6, 5);
          bottles.splice(i, 1);
          if (player.hp <= 0) { gameOver = true; addParticles(player.x, player.y - 16, COL.ko, 20, 8); }
          continue;
        }
      }
      if (i < bottles.length && (b.y > floorY || b.x < -20 || b.x > W + 20)) {
        addParticles(b.x, floorY, '#888', 4, 3);
        bottles.splice(i, 1);
      }
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawRect(x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawPixelChar(x, y, w, h, bodyCol, darkCol, isHit, punchDir, punching, kicking) {
    var bx = Math.round(x - w / 2);
    var by = Math.round(y - h);
    var c = isHit ? '#fff' : null;
    drawRect(bx + 4, by + 10, w - 8, h - 16, c || bodyCol);
    drawRect(bx + 5, by, w - 10, 12, c || bodyCol);
    drawRect(bx + 6, by + 4, 2, 2, '#000');
    drawRect(bx + w - 8, by + 4, 2, 2, '#000');
    drawRect(bx + 4, by + h - 8, 4, 8, c || darkCol);
    drawRect(bx + w - 8, by + h - 8, 4, 8, c || darkCol);

    if (punching > 6) {
      var armX = punchDir > 0 ? bx + w : bx - 14;
      drawRect(armX, by + 12, 14, 4, c || bodyCol);
      drawRect(punchDir > 0 ? armX + 10 : armX, by + 10, 6, 8, '#fff');
    } else if (kicking > 6) {
      var legX = punchDir > 0 ? bx + w - 4 : bx - 10;
      drawRect(legX, by + h - 14, 14, 5, c || darkCol);
      drawRect(punchDir > 0 ? legX + 10 : legX, by + h - 16, 6, 6, '#ffaa44');
    } else {
      drawRect(bx - 3, by + 12, 4, 10, c || darkCol);
      drawRect(bx + w - 1, by + 12, 4, 10, c || darkCol);
    }
  }

  function drawHUD() {
    var level = getLevel();
    var stats = getLevelStats(level);
    var hbW = 80, hbH = 5, hbX = 20, hbY = 24;

    // Health bar — top left, above all content
    drawRect(hbX, hbY, hbW, hbH, COL.healthBg);
    var ratio = player.hp / player.maxHp;
    var hpCol = ratio > 0.5 ? COL.health : ratio > 0.25 ? '#ffaa44' : '#ff4444';
    drawRect(hbX, hbY, hbW * ratio, hbH, hpCol);

    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'left';
    ctx.fillText('HP ' + player.hp + '/' + player.maxHp, hbX, hbY - 6);

    // Level badge
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = LVL_COL[level - 1];
    ctx.fillText('LVL ' + level + ' ' + LEVEL_NAMES[level - 1], hbX + hbW + 10, hbY + 4);

    if (level < 4) {
      var needed = level * 3 - player.beersDrunk;
      ctx.font = '400 8px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(197,179,88,0.35)';
      ctx.fillText(needed + ' BEERS → LVL ' + (level + 1), hbX + hbW + 10, hbY + 15);
    }

    // Score — top right
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = COL.textDim;
    ctx.textAlign = 'right';
    ctx.fillText('KO: ' + score, W - 20, 30);
    if (combo > 1) {
      ctx.fillStyle = COL.text;
      ctx.fillText(combo + 'x COMBO', W - 20, 44);
    }

    // Controls hint — bottom, very subtle
    ctx.font = '400 8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.textAlign = 'center';
    var hint = 'MOVE: WASD/←→   JUMP: W/↑/SPACE   PUNCH: F/ENTER';
    if (stats.canKick)  hint += '   KICK: F (auto)';
    if (stats.canThrow) hint += '   THROW: SHIFT+F';
    ctx.fillText(hint, W / 2, H - 10);

    // Level-up flash
    if (levelUpFlash > 0) {
      ctx.globalAlpha = Math.min(1, levelUpFlash / 40);
      ctx.font = '900 22px "JetBrains Mono", monospace';
      ctx.fillStyle = LVL_COL[level - 1];
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL UP!  ' + LEVEL_NAMES[level - 1], W / 2, H * 0.38);
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fff';
      if (level === 2) ctx.fillText('+HP  +SPEED  +PUNCH DAMAGE', W / 2, H * 0.38 + 18);
      if (level === 3) ctx.fillText('KICKS UNLOCKED', W / 2, H * 0.38 + 18);
      if (level === 4) ctx.fillText('BOTTLE THROW UNLOCKED — SHIFT+F', W / 2, H * 0.38 + 18);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    ctx.save();
    if (shake > 0.5) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    ctx.clearRect(-10, -10, W + 20, H + 20);

    var floorY = H * 0.72;
    drawRect(0, floorY, W, 2, COL.floorLine);
    for (var i = 0; i < 8; i++) {
      var ly = floorY + 20 + i * 30;
      if (ly < H) { ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(0, ly, W, 1); }
    }

    // Beers — with glow
    for (var i = 0; i < beers.length; i++) {
      var b = beers[i];
      var bobY = Math.sin(b.bob) * 3;
      ctx.globalAlpha = 0.12 + Math.abs(Math.sin(b.bob)) * 0.08;
      ctx.fillStyle = '#C5B358';
      ctx.fillRect(b.x - 9, b.y - 17 + bobY, 18, 22);
      ctx.globalAlpha = 1;
      drawRect(b.x - 4, b.y - 12 + bobY, 8, 12, COL.beer);
      drawRect(b.x - 5, b.y - 14 + bobY, 10, 4, COL.beerFoam);
      drawRect(b.x + 4, b.y - 10 + bobY, 3, 8, COL.beer);
    }

    // Bottles
    for (var i = 0; i < bottles.length; i++) {
      var b = bottles[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      var bc = b.fromPlayer ? '#ffaa44' : COL.bottle;
      drawRect(-2, -6, 4, 12, bc);
      drawRect(-1, -9, 2, 4, bc);
      ctx.restore();
    }

    // Enemies
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      drawPixelChar(e.x, e.y, e.w, e.h,
        e.type === 'big' ? '#dd6644' : COL.enemy,
        e.type === 'big' ? '#994422' : '#882222',
        e.hit > 0, 0, 0, 0);
    }

    // Player
    var level = idleMode ? 1 : getLevel();
    var lc = LEVEL_COLORS[level - 1];
    if (!gameOver || Math.floor(Date.now() / 150) % 2 === 0) {
      drawPixelChar(
        player.x, player.y, player.w, player.h,
        player.hit > 0 ? '#fff' : lc.body,
        player.hit > 0 ? '#ccc' : lc.dark,
        false, player.punchDir, player.punching, player.kicking || 0
      );
    }

    // Particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.life / p.maxLife;
      drawRect(p.x, p.y, p.size, p.size, p.col);
    }
    ctx.globalAlpha = 1;

    if (!idleMode) drawHUD();

    // Idle screen
    if (idleMode) {
      ctx.textAlign = 'center';
      ctx.font = '800 15px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(197,179,88,0.75)';
      ctx.fillText('BAR FIGHT', W / 2, H * 0.28);

      var blink = Math.floor(Date.now() / 600) % 2 === 0;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = blink ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)';
      ctx.fillText('[ PRESS F OR SPACE TO FIGHT ]', W / 2, H * 0.28 + 22);

      ctx.font = '400 9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillText('MOVE: WASD / ←→     JUMP: W / ↑ / SPACE     PUNCH: F / ENTER', W / 2, H * 0.28 + 42);
      ctx.fillText('DRINK BEERS TO LEVEL UP — UNLOCK KICKS & BOTTLE THROWS', W / 2, H * 0.28 + 56);
    }

    // Game over
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillStyle = COL.text;
      ctx.fillText('K.O. — SCORE: ' + score, W / 2, H / 2);
      var blink = Math.floor(Date.now() / 800) % 2 === 0;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = blink ? 'rgba(255,255,255,0.6)' : COL.textDim;
      ctx.fillText('[ PRESS F OR SPACE TO FIGHT AGAIN ]', W / 2, H / 2 + 22);
    }

    ctx.restore();
  }

  function loop() { update(); draw(); frameId = requestAnimationFrame(loop); }

  window.initBarFight = init;
})();
