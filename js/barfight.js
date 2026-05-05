// Bar Fight — retro hero game with rooms & bosses
(function () {
  var canvas, ctx, W, H, dpr;
  var player, enemies, boss, beers, bottles, particles, score, gameOver, frameId;
  var keys = {};
  var combo = 0, comboTimer = 0, shake = 0;
  var idleMode = true, idleTimer = 0;
  var levelUpFlash = 0, lastLevel = 1;

  // Room system
  var worldRoom = 1;
  var roomState = 'playing';   // 'playing' | 'cleared' | 'transitioning'
  var transitionTimer = 0;
  var roomNameTimer = 0;
  var roomEnemyBudget = 0;
  var waveTimer = 0;

  // Backdrop
  var cityImg = new Image();
  cityImg.src = 'images/city-backdrop.jpg';
  var bgOffsetX = 0;

  var ROOMS = [
    { name: 'CITY STREET',  tint: null,                  enemies: 5,  bossRoom: false },
    { name: 'DARK ALLEY',   tint: 'rgba(0,0,60,0.35)',   enemies: 7,  bossRoom: false },
    { name: 'BAR INTERIOR', tint: 'rgba(80,20,0,0.40)',  enemies: 0,  bossRoom: true,  bossName: 'THE BOUNCER', bossHp: 18 },
    { name: 'ROOFTOP',      tint: 'rgba(0,30,60,0.35)',  enemies: 9,  bossRoom: false },
    { name: 'PENTHOUSE',    tint: 'rgba(50,0,70,0.40)',  enemies: 0,  bossRoom: true,  bossName: 'THE KINGPIN', bossHp: 28 },
  ];

  function getRoomCfg(n) {
    var idx   = (n - 1) % ROOMS.length;
    var scale = Math.floor((n - 1) / ROOMS.length);
    var r     = ROOMS[idx];
    return {
      name:     r.name,
      tint:     r.tint,
      enemies:  r.bossRoom ? 0 : r.enemies + scale * 3,
      bossRoom: r.bossRoom,
      bossName: r.bossName || null,
      bossHp:   r.bossRoom ? r.bossHp + scale * 10 : 0,
    };
  }

  var COL = {
    bg:        '#0a0a0a',
    beer:      '#C5B358',
    beerFoam:  '#fff',
    bottle:    '#66aaff',
    text:      'rgba(197,179,88,0.6)',
    textDim:   'rgba(255,255,255,0.15)',
    particle:  '#C5B358',
    health:    '#C5B358',
    healthBg:  'rgba(255,255,255,0.08)',
    ko:        '#ff4444',
    boss:      '#cc8800',
    bossDark:  '#7a4a00',
  };

  var LEVEL_COLORS = [
    { body: '#C5B358', dark: '#8a7a30' },
    { body: '#44aaff', dark: '#2266aa' },
    { body: '#ff8844', dark: '#cc5522' },
    { body: '#dd44ff', dark: '#882299' },
  ];
  var LEVEL_NAMES = ['ROOKIE', 'BUZZED', 'HAMMERED', 'LEGENDARY'];
  var LVL_COL     = ['#C5B358', '#44aaff', '#ff8844', '#dd44ff'];

  function getLevel() {
    if (!player) return 1;
    return Math.min(4, 1 + Math.floor(player.beersDrunk / 3));
  }

  function getLevelStats(lv) {
    return {
      speed:       3.5 + (lv - 1) * 0.8,
      punchDamage: lv >= 2 ? 2 : 1,
      punchRange:  28  + (lv - 1) * 6,
      maxHp:       5   + (lv - 1) * 2,
      canKick:     lv >= 3,
      canThrow:    lv >= 4,
    };
  }

  // ─── Init ────────────────────────────────────────────────────────────────────
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

    // Mobile / touch — only attach if the device actually has touch.
    var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (hasTouch) setupTouchControls(container);
    // Prevent pinch-zoom + scroll-on-drag on the game canvas, even on desktop
    // (a stylus/trackpad gesture would otherwise scroll the page mid-fight).
    canvas.style.touchAction = 'none';

    // Re-fit on orientation flip (resize fires on most mobile browsers, but
    // some only fire orientationchange — bind both).
    window.addEventListener('orientationchange', resize);

    resetGame();
    loop();
  }

  // ─── Touch controls ─────────────────────────────────────────────────────────
  // Builds an in-canvas overlay with virtual D-pad + jump + punch. Each button
  // toggles the same `keys` flags the keyboard handlers do, so the game logic
  // doesn't need to know about touch at all. Tap-anywhere-on-canvas starts /
  // restarts the game (mirroring SPACE/F).
  function setupTouchControls(container) {
    // Inject styles once
    if (!document.getElementById('bf-touch-style')) {
      var style = document.createElement('style');
      style.id = 'bf-touch-style';
      style.textContent = [
        '.bf-touch{position:absolute;inset:0;pointer-events:none;z-index:5;font-family:monospace;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;}',
        '.bf-touch .bf-side{position:absolute;bottom:14px;display:flex;gap:10px;pointer-events:auto;}',
        '.bf-touch .bf-side.bf-left{left:14px;}',
        '.bf-touch .bf-side.bf-right{right:14px;}',
        '.bf-touch .bf-btn{width:62px;height:62px;border-radius:14px;background:rgba(0,0,0,0.55);color:#C5B358;border:1.5px solid rgba(197,179,88,0.55);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;letter-spacing:1px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:0 0 18px rgba(197,179,88,0.12);transition:transform .08s ease,background .08s ease,box-shadow .12s ease;}',
        '.bf-touch .bf-btn.bf-active{background:rgba(197,179,88,0.22);transform:scale(0.92);box-shadow:0 0 24px rgba(197,179,88,0.45);color:#fff;}',
        '.bf-touch .bf-btn.bf-jump{background:rgba(0,0,0,0.4);}',
        '.bf-touch .bf-btn.bf-punch{background:rgba(0,0,0,0.4);font-size:22px;}',
        '.bf-touch .bf-tapstart{position:absolute;inset:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;color:rgba(197,179,88,0.85);font-size:13px;letter-spacing:3px;text-transform:uppercase;text-shadow:0 0 8px rgba(197,179,88,0.4);background:linear-gradient(180deg,rgba(0,0,0,0) 60%,rgba(0,0,0,0.35) 100%);}',
        '.bf-touch .bf-tapstart.bf-hidden{display:none;}',
        // shrink slightly in cramped landscape (phones held sideways)
        '@media (orientation:landscape) and (max-height:500px){.bf-touch .bf-btn{width:54px;height:54px;font-size:20px;}.bf-touch .bf-side{bottom:8px;}}',
      ].join('\n');
      document.head.appendChild(style);
    }

    var overlay = document.createElement('div');
    overlay.className = 'bf-touch';
    overlay.innerHTML = [
      '<div class="bf-side bf-left">',
      '  <div class="bf-btn" data-key="arrowleft" aria-label="Move left">◀</div>',
      '  <div class="bf-btn" data-key="arrowright" aria-label="Move right">▶</div>',
      '</div>',
      '<div class="bf-side bf-right">',
      '  <div class="bf-btn bf-jump" data-key="arrowup" aria-label="Jump">↑</div>',
      '  <div class="bf-btn bf-punch" data-key="f" aria-label="Punch">F</div>',
      '</div>',
      '<div class="bf-tapstart bf-hidden">tap to fight</div>',
    ].join('');
    container.appendChild(overlay);

    // Each button binds touchstart→keys[k]=true, touchend/cancel→false.
    // Also pointerdown for stylus/desktop-touch fallback.
    var buttons = overlay.querySelectorAll('.bf-btn');
    buttons.forEach(function (btn) {
      var k = btn.getAttribute('data-key');
      var press = function (e) {
        if (e.cancelable) e.preventDefault();
        keys[k] = true;
        btn.classList.add('bf-active');
        // Tapping any control while idle/dead also kicks off a game
        if (idleMode || gameOver) startGame();
      };
      var release = function (e) {
        if (e.cancelable) e.preventDefault();
        keys[k] = false;
        btn.classList.remove('bf-active');
      };
      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend',   release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
      // Prevent context-menu / accidental scroll
      btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });

    // Tap-to-start overlay: visible only while idle or after game over.
    // Tapping anywhere on the canvas fires startGame().
    var tapStart = overlay.querySelector('.bf-tapstart');
    setInterval(function () {
      var visible = (idleMode || gameOver);
      tapStart.classList.toggle('bf-hidden', !visible);
      tapStart.textContent = gameOver ? 'tap to retry' : 'tap to fight';
    }, 250);

    tapStart.addEventListener('touchstart', function (e) {
      if (e.cancelable) e.preventDefault();
      if (idleMode || gameOver) startGame();
    }, { passive: false });
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
      punchDir: 1, hit: 0,
      grounded: true, beersDrunk: 0,
    };
    enemies = []; boss = null; beers = []; bottles = []; particles = [];
    score = 0; gameOver = false;
    combo = 0; comboTimer = 0; shake = 0;
    levelUpFlash = 0; lastLevel = 1;
    worldRoom = 1; roomState = 'playing';
    transitionTimer = 0; roomNameTimer = 0;
    bgOffsetX = 0; idleMode = true;
    loadRoom();
  }

  function startGame() {
    idleMode = false;
    player.hp = 5; player.maxHp = 5; player.beersDrunk = 0;
    enemies = []; boss = null; beers = []; bottles = []; particles = [];
    score = 0; gameOver = false;
    combo = 0; levelUpFlash = 0; lastLevel = 1;
    worldRoom = 1; roomState = 'playing';
    transitionTimer = 0; roomNameTimer = 90;
    bgOffsetX = 0;
    loadRoom();
  }

  // ─── Room management ─────────────────────────────────────────────────────────
  function loadRoom() {
    var cfg = getRoomCfg(worldRoom);
    roomEnemyBudget = cfg.enemies;
    waveTimer = 60;
    enemies = []; boss = null; bottles = []; beers = [];
    roomState = 'playing';
    if (cfg.bossRoom) spawnBoss(cfg.bossHp, cfg.bossName);
  }

  function advanceRoom() {
    worldRoom++;
    roomNameTimer = 90;
    player.x = 60;
    player.y = H * 0.72;
    player.hp = Math.min(player.maxHp, player.hp + 2);
    addParticles(player.x, player.y - 20, '#C5B358', 20, 8);
    loadRoom();
  }

  function isRoomCleared() {
    return !boss && enemies.length === 0 && roomEnemyBudget === 0;
  }

  // ─── Spawning ─────────────────────────────────────────────────────────────────
  function spawnEnemy() {
    var floorY = H * 0.72;
    var fromRight = Math.random() > 0.3;
    var big = Math.random() > 0.7;
    var hp = 1 + Math.floor(score / 8) + Math.floor((worldRoom - 1) / 2);
    enemies.push({
      x: fromRight ? W + 20 : -20, y: floorY,
      w: big ? 22 : 18, h: big ? 36 : 30,
      vx: (fromRight ? -1 : 1) * (0.8 + Math.random() * 0.9),
      hp: hp, maxHp: hp,
      hit: 0, attackCd: 0,
      type: big ? 'big' : 'normal',
    });
  }

  function spawnBoss(hp, name) {
    var floorY = H * 0.72;
    boss = {
      x: W * 0.8, y: floorY,
      w: 30, h: 48,
      hp: hp, maxHp: hp,
      hit: 0, attackCd: 0,
      chargeDir: 1, chargeTimer: 0,
      berserk: false,
      name: name || 'BOSS',
    };
  }

  function spawnBeer() {
    beers.push({
      x: 100 + Math.random() * (W - 200),
      y: H * 0.72 - 8,
      bob: Math.random() * Math.PI * 2,
    });
  }

  function spawnBottle(fromX, dir, fromPlayer) {
    bottles.push({
      x: fromX, y: H * 0.72 - 20,
      vx: dir * (fromPlayer ? 6 : 3 + Math.random() * 2),
      vy: -2 - Math.random() * 2,
      rot: 0, fromPlayer: !!fromPlayer,
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

  // ─── Boss AI ──────────────────────────────────────────────────────────────────
  function updateBoss() {
    if (!boss) return;
    var floorY = H * 0.72;
    var dx = player.x - boss.x;
    var speed = boss.berserk ? 2.8 : 1.6;

    boss.berserk = boss.hp < boss.maxHp * 0.5;

    if (boss.chargeTimer > 0) {
      boss.chargeTimer--;
      boss.x += boss.chargeDir * (boss.berserk ? 6 : 4.5);
    } else {
      if (Math.abs(dx) > 60) boss.x += (dx > 0 ? 1 : -1) * speed;
      if (Math.random() < (boss.berserk ? 0.012 : 0.005)) {
        boss.chargeDir = dx > 0 ? 1 : -1;
        boss.chargeTimer = 18;
      }
    }
    boss.x = Math.max(30, Math.min(W - 30, boss.x));

    if (boss.attackCd > 0) boss.attackCd--;

    var dist = Math.abs(player.x - boss.x);
    if (dist < 60 && boss.attackCd === 0) {
      if (Math.random() > (boss.berserk ? 0.35 : 0.65) && dist > 35) {
        spawnBottle(boss.x, dx > 0 ? 1 : -1, false);
        if (boss.berserk) spawnBottle(boss.x + 8, dx > 0 ? 1 : -1, false);
        boss.attackCd = boss.berserk ? 28 : 50;
      } else if (dist < 48) {
        player.hp -= boss.berserk ? 2 : 1;
        player.hit = 12; shake = 8;
        addParticles(player.x, player.y - 16, COL.ko, 8, 5);
        boss.attackCd = boss.berserk ? 32 : 52;
        if (player.hp <= 0) { gameOver = true; addParticles(player.x, player.y - 16, COL.ko, 20, 8); }
      }
    }

    if (boss.hit > 0) boss.hit--;

    // Player melee hits boss
    var stats = getLevelStats(getLevel());
    if (player.punching > 6 && player.punching < 11) {
      var px = player.x + player.punchDir * stats.punchRange;
      if (Math.abs(px - boss.x) < 35 && Math.abs(player.y - boss.y) < 44) {
        boss.hp -= stats.punchDamage; boss.hit = 8;
        boss.x += player.punchDir * 8; shake = 5;
        addParticles(boss.x, boss.y - 24, '#fff', 6, 4);
        if (boss.hp <= 0) killBoss();
      }
    }
    if (boss && player.kicking > 7 && player.kicking < 13) {
      var kx = player.x + player.punchDir * 42;
      if (Math.abs(kx - boss.x) < 44 && Math.abs(player.y - boss.y) < 30) {
        boss.hp -= 2; boss.hit = 14;
        boss.x += player.punchDir * 16; shake = 6;
        addParticles(boss.x, boss.y - 16, '#ffaa44', 8, 6);
        if (boss.hp <= 0) killBoss();
      }
    }
  }

  function killBoss() {
    score += 5; combo += 5; comboTimer = 120;
    addParticles(boss.x, boss.y - 24, COL.boss,  30, 10);
    addParticles(boss.x, boss.y - 24, '#fff', 20, 8);
    boss = null;
    roomState = 'cleared';
  }

  // ─── Update ───────────────────────────────────────────────────────────────────
  function update() {
    var floorY = H * 0.72;

    if (roomState === 'transitioning') {
      transitionTimer--;
      if (transitionTimer <= 0) advanceRoom();
      return;
    }

    if (idleMode) {
      idleTimer++;
      bgOffsetX -= 0.4;
      if (idleTimer % 120 === 0 && enemies.length < 3) spawnEnemy();
      for (var i = enemies.length - 1; i >= 0; i--) {
        enemies[i].x += enemies[i].vx * 0.5;
        if (enemies[i].x < -40 || enemies[i].x > W + 40) enemies.splice(i, 1);
      }
      return;
    }

    if (gameOver) return;

    if (shake > 0)       shake     *= 0.85;
    if (comboTimer > 0)  comboTimer--;
    if (comboTimer === 0) combo = 0;
    if (levelUpFlash > 0) levelUpFlash--;
    if (roomNameTimer > 0) roomNameTimer--;

    var lv    = getLevel();
    var stats = getLevelStats(lv);

    if (lv > lastLevel) {
      lastLevel = lv;
      levelUpFlash  = 80;
      player.maxHp  = stats.maxHp;
      player.hp     = Math.min(player.hp + 3, player.maxHp);
      addParticles(player.x, player.y - 20, LVL_COL[lv - 1], 24, 9);
    }

    // ── Player input ──
    player.vx = 0;
    if (keys['arrowleft']  || keys['a']) { player.vx = -stats.speed; player.punchDir = -1; }
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

    // Right wall open when room cleared
    var rightBound = (roomState === 'cleared') ? W + 20 : W - 10;
    player.x = Math.max(10, Math.min(rightBound, player.x));

    // Exit trigger
    if (roomState === 'cleared' && player.x > W - 22) {
      roomState = 'transitioning';
      transitionTimer = 40;
    }

    bgOffsetX += player.vx;

    if (player.punching > 0) player.punching--;
    if (player.kicking  > 0) player.kicking--;
    if (player.hit      > 0) player.hit--;

    // ── Wave spawning ──
    var cfg = getRoomCfg(worldRoom);
    if (!cfg.bossRoom && roomEnemyBudget > 0) {
      waveTimer--;
      if (waveTimer <= 0 && enemies.length < 3) {
        var n = Math.min(2, roomEnemyBudget);
        for (var s = 0; s < n; s++) spawnEnemy();
        roomEnemyBudget -= n;
        waveTimer = 80 + Math.random() * 60;
      }
    }

    // ── Room cleared? ──
    if (roomState === 'playing' && isRoomCleared()) {
      roomState = 'cleared';
      addParticles(W / 2, H * 0.5, '#C5B358', 30, 12);
    }

    // ── Beer timer ──
    if (Math.random() < 0.002 && beers.length < 2) spawnBeer();

    // ── Boss ──
    updateBoss();

    // ── Enemies ──
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e  = enemies[i];
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

      if (player.punching > 6 && player.punching < 11) {
        var px = player.x + player.punchDir * stats.punchRange;
        if (Math.abs(px - e.x) < 25 && Math.abs(player.y - e.y) < 30) {
          e.hp -= stats.punchDamage; e.hit = 8; e.x += player.punchDir * 12; shake = 4;
          addParticles(e.x, e.y - 16, '#fff', 4, 3);
          if (e.hp <= 0) { score++; combo++; comboTimer = 90; addParticles(e.x, e.y - 16, COL.particle, 12, 6); enemies.splice(i, 1); continue; }
        }
      }
      if (player.kicking > 7 && player.kicking < 13) {
        var kx = player.x + player.punchDir * 42;
        if (Math.abs(kx - e.x) < 34 && Math.abs(player.y - e.y) < 22) {
          e.hp -= 2; e.hit = 14; e.x += player.punchDir * 22; shake = 5;
          addParticles(e.x, e.y - 8, '#ffaa44', 7, 5);
          if (e.hp <= 0) { score++; combo++; comboTimer = 90; addParticles(e.x, e.y - 8, '#ffaa44', 14, 7); enemies.splice(i, 1); continue; }
        }
      }
    }

    // ── Beers ──
    for (var i = beers.length - 1; i >= 0; i--) {
      beers[i].bob += 0.05;
      if (Math.abs(player.x - beers[i].x) < 18 && Math.abs(player.y - beers[i].y) < 24) {
        player.beersDrunk++;
        player.hp = Math.min(player.maxHp, player.hp + 1);
        addParticles(beers[i].x, beers[i].y - 8, COL.beer, 10, 5);
        beers.splice(i, 1);
      }
    }

    // ── Bottles ──
    for (var i = bottles.length - 1; i >= 0; i--) {
      var b = bottles[i];
      b.x += b.vx; b.vy += 0.3; b.y += b.vy; b.rot += 0.15;

      if (b.fromPlayer) {
        var hit = false;
        for (var j = enemies.length - 1; j >= 0; j--) {
          var e = enemies[j];
          if (Math.abs(b.x - e.x) < 18 && Math.abs(b.y - (e.y - 16)) < 20) {
            e.hp -= 2; e.hit = 14; e.x += b.vx * 2;
            addParticles(b.x, b.y, '#66aaff', 8, 5);
            if (e.hp <= 0) { score++; combo++; comboTimer = 90; addParticles(e.x, e.y - 16, COL.particle, 12, 6); enemies.splice(j, 1); }
            bottles.splice(i, 1); hit = true; break;
          }
        }
        if (!hit && boss) {
          if (Math.abs(b.x - boss.x) < 32 && Math.abs(b.y - (boss.y - 24)) < 32) {
            boss.hp -= 2; boss.hit = 14;
            addParticles(b.x, b.y, '#66aaff', 8, 5);
            bottles.splice(i, 1);
            if (boss.hp <= 0) killBoss();
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
        addParticles(b.x, Math.min(b.y, floorY), '#888', 3, 3);
        bottles.splice(i, 1);
      }
    }

    // ── Particles ──
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // ─── Draw helpers ─────────────────────────────────────────────────────────────
  function drawRect(x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawPixelChar(x, y, w, h, bodyCol, darkCol, isHit, dir, punching, kicking) {
    var bx = Math.round(x - w / 2);
    var by = Math.round(y - h);
    var c  = isHit ? '#fff' : null;
    drawRect(bx + 4,     by + 10, w - 8,  h - 16, c || bodyCol);
    drawRect(bx + 5,     by,      w - 10, 12,     c || bodyCol);
    drawRect(bx + 6,     by + 4,  2,      2,      '#000');
    drawRect(bx + w - 8, by + 4,  2,      2,      '#000');
    drawRect(bx + 4,     by + h - 8, 4,   8,      c || darkCol);
    drawRect(bx + w - 8, by + h - 8, 4,   8,      c || darkCol);

    if (punching > 6) {
      var ax = dir > 0 ? bx + w : bx - 14;
      drawRect(ax, by + 12, 14, 4, c || bodyCol);
      drawRect(dir > 0 ? ax + 10 : ax, by + 10, 6, 8, '#fff');
    } else if (kicking > 6) {
      var lx = dir > 0 ? bx + w - 4 : bx - 10;
      drawRect(lx, by + h - 14, 14, 5, c || darkCol);
      drawRect(dir > 0 ? lx + 10 : lx, by + h - 16, 6, 6, '#ffaa44');
    } else {
      drawRect(bx - 3,     by + 12, 4, 10, c || darkCol);
      drawRect(bx + w - 1, by + 12, 4, 10, c || darkCol);
    }
  }

  function drawExitDoor() {
    if (roomState !== 'cleared') return;
    var floorY = H * 0.72;
    var dx = W - 44, dy = floorY - 62;
    var blink = Math.floor(Date.now() / 400) % 2 === 0;

    ctx.fillStyle = blink ? 'rgba(197,179,88,0.95)' : 'rgba(197,179,88,0.5)';
    ctx.fillRect(dx - 2, dy - 2, 32, 66);
    ctx.fillStyle = '#0d0a04';
    ctx.fillRect(dx, dy, 28, 62);

    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillStyle = blink ? '#C5B358' : 'rgba(197,179,88,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('→', dx + 14, dy + 36);

    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillStyle = blink ? 'rgba(197,179,88,0.9)' : 'rgba(197,179,88,0.4)';
    ctx.fillText('EXIT', dx + 14, dy - 8);
  }

  function drawBoss() {
    if (!boss) return;
    var pulse = boss.berserk && Math.floor(Date.now() / 180) % 2 === 0;
    drawPixelChar(boss.x, boss.y, boss.w, boss.h,
      boss.hit > 0 ? '#fff' : (pulse ? '#ff2200' : COL.boss),
      boss.hit > 0 ? '#ccc' : (pulse ? '#aa1100' : COL.bossDark),
      false, 0, 0, 0);
    // Crown detail
    var bx = Math.round(boss.x - boss.w / 2);
    var by = Math.round(boss.y - boss.h);
    var cc = boss.hit > 0 ? '#fff' : (pulse ? '#ff2200' : COL.boss);
    drawRect(bx + 4,  by - 6,  22, 6, cc);
    drawRect(bx + 8,  by - 10, 14, 4, cc);
    drawRect(bx + 6,  by - 10, 3,  3, cc);
    drawRect(bx + 21, by - 10, 3,  3, cc);
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────────
  function drawHUD() {
    var lv    = getLevel();
    var stats = getLevelStats(lv);
    var hbW = 80, hbH = 5, hbX = 20, hbY = 24;

    // Player HP bar
    drawRect(hbX, hbY, hbW, hbH, COL.healthBg);
    var ratio  = player.hp / player.maxHp;
    var hpCol  = ratio > 0.5 ? COL.health : ratio > 0.25 ? '#ffaa44' : '#ff4444';
    drawRect(hbX, hbY, hbW * ratio, hbH, hpCol);

    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'left';
    ctx.fillText('HP ' + player.hp + '/' + player.maxHp, hbX, hbY - 6);

    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = LVL_COL[lv - 1];
    ctx.fillText('LVL ' + lv + ' ' + LEVEL_NAMES[lv - 1], hbX + hbW + 10, hbY + 4);

    if (lv < 4) {
      ctx.font = '400 8px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(197,179,88,0.35)';
      ctx.fillText((lv * 3 - player.beersDrunk) + ' BEERS → LVL ' + (lv + 1), hbX + hbW + 10, hbY + 15);
    }

    // Score + room (top right)
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = COL.textDim;
    ctx.textAlign = 'right';
    ctx.fillText('KO: ' + score, W - 20, 26);
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(197,179,88,0.45)';
    ctx.fillText('ROOM ' + worldRoom, W - 20, 38);
    if (combo > 1) {
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = COL.text;
      ctx.fillText(combo + 'x COMBO', W - 20, 52);
    }

    // Enemies remaining (center top)
    if (roomState === 'playing') {
      var left = enemies.length + roomEnemyBudget + (boss ? 1 : 0);
      ctx.font = '500 8px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,80,80,0.55)';
      ctx.textAlign = 'center';
      ctx.fillText(left + ' REMAINING', W / 2, 20);
    }

    // Boss health bar (center)
    if (boss) {
      var bbW = Math.min(W * 0.45, 220);
      var bbX = W / 2 - bbW / 2, bbY = 28;
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillStyle = boss.berserk ? '#ff4444' : COL.boss;
      ctx.textAlign = 'center';
      ctx.fillText(boss.name + (boss.berserk ? '  ⚡ BERSERK' : ''), W / 2, bbY - 5);
      drawRect(bbX, bbY, bbW, 7, 'rgba(255,255,255,0.1)');
      var br = Math.max(0, boss.hp / boss.maxHp);
      drawRect(bbX, bbY, bbW * br, 7, boss.berserk ? '#ff3300' : COL.boss);
    }

    // Room cleared banner
    if (roomState === 'cleared') {
      var blink = Math.floor(Date.now() / 500) % 2 === 0;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = blink ? 'rgba(197,179,88,1)' : 'rgba(197,179,88,0.55)';
      ctx.textAlign = 'center';
      ctx.fillText('ROOM CLEARED — WALK RIGHT →', W / 2, H * 0.4);
    }

    // Controls hint
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
      ctx.fillStyle = LVL_COL[lv - 1];
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL UP!  ' + LEVEL_NAMES[lv - 1], W / 2, H * 0.45);
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fff';
      if (lv === 2) ctx.fillText('+HP  +SPEED  +PUNCH DAMAGE', W / 2, H * 0.45 + 18);
      if (lv === 3) ctx.fillText('KICKS UNLOCKED', W / 2, H * 0.45 + 18);
      if (lv === 4) ctx.fillText('BOTTLE THROW UNLOCKED — SHIFT+F', W / 2, H * 0.45 + 18);
      ctx.globalAlpha = 1;
    }

    // Room name entry flash
    if (roomNameTimer > 0) {
      var cfg = getRoomCfg(worldRoom);
      ctx.globalAlpha = Math.min(1, roomNameTimer / 40);
      ctx.font = '900 20px "JetBrains Mono", monospace';
      ctx.fillStyle = cfg.bossRoom ? '#ff4444' : '#C5B358';
      ctx.textAlign = 'center';
      ctx.fillText(cfg.name, W / 2, H * 0.35);
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = cfg.bossRoom ? '#ff8844' : 'rgba(255,255,255,0.45)';
      ctx.fillText(cfg.bossRoom ? '⚠ BOSS ROOM' : 'ROOM ' + worldRoom, W / 2, H * 0.35 + 22);
      ctx.globalAlpha = 1;
    }
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.save();
    if (shake > 0.5) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    ctx.clearRect(-10, -10, W + 20, H + 20);

    var cfg = getRoomCfg(worldRoom);

    // City backdrop with parallax tiling
    if (cityImg.complete && cityImg.naturalWidth) {
      var parallax = bgOffsetX * 0.25;
      var scale = H / cityImg.naturalHeight;
      var tileW = cityImg.naturalWidth * scale;
      var startX = ((-parallax % tileW) - tileW) % tileW;
      if (startX > 0) startX -= tileW;
      for (var tx = startX; tx < W + tileW; tx += tileW) {
        ctx.drawImage(cityImg, tx, 0, tileW, H);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.52)';
      ctx.fillRect(0, 0, W, H);
      if (cfg.tint) { ctx.fillStyle = cfg.tint; ctx.fillRect(0, 0, W, H); }
    } else {
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, W, H);
    }

    var floorY = H * 0.72;
    ctx.fillStyle = 'rgba(197,150,40,0.35)';
    ctx.fillRect(0, floorY, W, 2);
    ctx.fillStyle = 'rgba(197,150,40,0.08)';
    ctx.fillRect(0, floorY + 2, W, H - floorY - 2);
    for (var i = 0; i < 8; i++) {
      var ly = floorY + 20 + i * 30;
      if (ly < H) { ctx.fillStyle = 'rgba(255,200,80,0.03)'; ctx.fillRect(0, ly, W, 1); }
    }

    drawExitDoor();

    // Beers
    for (var i = 0; i < beers.length; i++) {
      var b = beers[i];
      var bobY = Math.sin(b.bob) * 3;
      ctx.globalAlpha = 0.12 + Math.abs(Math.sin(b.bob)) * 0.08;
      ctx.fillStyle = '#C5B358';
      ctx.fillRect(b.x - 9, b.y - 17 + bobY, 18, 22);
      ctx.globalAlpha = 1;
      drawRect(b.x - 4, b.y - 12 + bobY, 8,  12, COL.beer);
      drawRect(b.x - 5, b.y - 14 + bobY, 10, 4,  COL.beerFoam);
      drawRect(b.x + 4, b.y - 10 + bobY, 3,  8,  COL.beer);
    }

    // Bottles
    for (var i = 0; i < bottles.length; i++) {
      var b = bottles[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      var bc = b.fromPlayer ? '#ffaa44' : COL.bottle;
      drawRect(-2, -6, 4, 12, bc);
      drawRect(-1, -9, 2, 4,  bc);
      ctx.restore();
    }

    // Enemies
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      drawPixelChar(e.x, e.y, e.w, e.h,
        e.type === 'big' ? '#dd6644' : '#cc4444',
        e.type === 'big' ? '#994422' : '#882222',
        e.hit > 0, 0, 0, 0);
    }

    drawBoss();

    // Player
    var lv = idleMode ? 1 : getLevel();
    var lc = LEVEL_COLORS[lv - 1];
    if (!gameOver || Math.floor(Date.now() / 150) % 2 === 0) {
      drawPixelChar(player.x, player.y, player.w, player.h,
        player.hit > 0 ? '#fff' : lc.body,
        player.hit > 0 ? '#ccc' : lc.dark,
        false, player.punchDir, player.punching, player.kicking || 0);
    }

    // Particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.life / p.maxLife;
      drawRect(p.x, p.y, p.size, p.size, p.col);
    }
    ctx.globalAlpha = 1;

    // Room transition flash
    if (roomState === 'transitioning') {
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, 1 - transitionTimer / 40) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    if (!idleMode) drawHUD();

    // Idle
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
      ctx.fillText('5 ROOMS · BOSS EVERY 3RD · DRINK BEERS TO LEVEL UP', W / 2, H * 0.28 + 56);
    }

    // Game over
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.font = '700 16px "JetBrains Mono", monospace';
      ctx.fillStyle = COL.text;
      ctx.fillText('K.O. — SCORE: ' + score + '   ROOM: ' + worldRoom, W / 2, H / 2);
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
