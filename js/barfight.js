// Bar Fight — retro hero game with rooms & bosses
(function () {
  var canvas, ctx, W, H, dpr, touchContainer;
  var player, enemies, boss, beers, bottles, particles, score, gameOver, frameId;
  var keys = {};
  var combo = 0, comboTimer = 0, shake = 0;
  var idleMode = true, idleTimer = 0;
  var levelUpFlash = 0, lastLevel = 1;
  var gameWon = false;
  var berserkInvuln = 0; // LVL 5 reward window after each kill

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

  // 10-room campaign. mix encodes the enemy roster for the room — keys must
  // sum to 1.0 across spawn weights. final:true marks the last room, which
  // triggers the win state after its boss falls.
  var ROOMS = [
    { name: 'CITY STREET',    tint: null,                  enemies: 5,  bossRoom: false,                                          mix: { normal: 1.0 } },
    { name: 'DARK ALLEY',     tint: 'rgba(0,0,60,0.35)',   enemies: 7,  bossRoom: false,                                          mix: { normal: 0.6, runner: 0.4 } },
    { name: 'BAR INTERIOR',   tint: 'rgba(80,20,0,0.40)',  enemies: 0,  bossRoom: true,  bossName: 'THE BOUNCER',   bossHp: 22,  mix: { normal: 1 } },
    { name: 'SUBWAY',         tint: 'rgba(10,40,10,0.35)', enemies: 9,  bossRoom: false,                                          mix: { runner: 0.7, normal: 0.3 } },
    { name: 'ROOFTOP',        tint: 'rgba(0,30,60,0.35)',  enemies: 10, bossRoom: false,                                          mix: { normal: 0.4, runner: 0.3, thug: 0.3 } },
    { name: 'CHINATOWN',      tint: 'rgba(70,0,30,0.40)',  enemies: 0,  bossRoom: true,  bossName: 'THE DEALER',    bossHp: 30,  mix: { thug: 1 } },
    { name: 'WAREHOUSE',      tint: 'rgba(40,20,0,0.35)',  enemies: 12, bossRoom: false,                                          mix: { big: 0.5, thug: 0.3, normal: 0.2 } },
    { name: 'NEON DISTRICT',  tint: 'rgba(40,0,60,0.40)',  enemies: 14, bossRoom: false,                                          mix: { runner: 0.4, thug: 0.3, big: 0.2, normal: 0.1 } },
    { name: 'PENTHOUSE',      tint: 'rgba(50,0,70,0.40)',  enemies: 0,  bossRoom: true,  bossName: 'THE KINGPIN',   bossHp: 36,  mix: { big: 1 } },
    { name: 'HELIPAD',        tint: 'rgba(60,40,0,0.40)',  enemies: 0,  bossRoom: true,  bossName: 'THE WARLORD',   bossHp: 60,  mix: { big: 1 }, final: true },
  ];

  function getRoomCfg(n) {
    var idx   = (n - 1) % ROOMS.length;
    var scale = Math.floor((n - 1) / ROOMS.length); // NG+ cycles add this
    var r     = ROOMS[idx];
    return {
      name:     r.name,
      tint:     r.tint,
      enemies:  r.bossRoom ? 0 : Math.round(r.enemies * (1 + scale * 0.4)),
      bossRoom: r.bossRoom,
      bossName: r.bossName || null,
      bossHp:   r.bossRoom ? Math.round(r.bossHp * (1 + scale * 0.5)) : 0,
      mix:      r.mix || { normal: 1 },
      final:    !!r.final,
    };
  }

  // Damage the player takes from a basic enemy melee. Scales by room so room 10
  // feels meaningfully more dangerous than room 1.
  function enemyMeleeDmg() {
    return 1 + Math.floor((worldRoom - 1) / 3); // 1 (r1-3) → 2 (r4-6) → 3 (r7-9) → 4 (r10)
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
    { body: '#ff2222', dark: '#aa0000' },
  ];
  var LEVEL_NAMES = ['ROOKIE', 'BUZZED', 'HAMMERED', 'LEGENDARY', 'BERSERK'];
  var LVL_COL     = ['#C5B358', '#44aaff', '#ff8844', '#dd44ff', '#ff2222'];

  function getLevel() {
    if (!player) return 1;
    return Math.min(5, 1 + Math.floor(player.beersDrunk / 3));
  }

  function getLevelStats(lv) {
    return {
      speed:       3.5 + (lv - 1) * 0.8,
      punchDamage: lv >= 5 ? 4 : (lv >= 2 ? 2 : 1),
      punchRange:  28  + (lv - 1) * 6,
      maxHp:       5   + (lv - 1) * 2,
      canKick:     lv >= 3,
      canThrow:    lv >= 4,
      canBerserk:  lv >= 5, // unlocks short invuln window after each kill
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
      if (gameWon  && (e.key === ' ' || e.key.toLowerCase() === 'f')) startGame();
    });
    document.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

    // Mobile / touch — attach controls only on tablet+ touch devices at init.
    // Phones get controls lazily mounted when the player taps the external PLAY
    // pill (see window.startBarFight below). That keeps the hero scrollable in
    // idle and the d-pad available only while actually playing.
    var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var isPhone = window.innerWidth < 768;
    touchContainer = container;
    if (hasTouch && !isPhone) {
      setupTouchControls(container);
      canvas.style.touchAction = 'none';
    } else {
      canvas.style.touchAction = 'pan-y';
    }

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
        if (idleMode || gameOver || gameWon) startGame();
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
      var visible = (idleMode || gameOver || gameWon);
      tapStart.classList.toggle('bf-hidden', !visible);
      tapStart.textContent = gameWon ? 'tap for NG+' : (gameOver ? 'tap to retry' : 'tap to fight');
    }, 250);

    tapStart.addEventListener('touchstart', function (e) {
      if (e.cancelable) e.preventDefault();
      if (idleMode || gameOver || gameWon) startGame();
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
    score = 0; gameOver = false; gameWon = false;
    combo = 0; comboTimer = 0; shake = 0;
    levelUpFlash = 0; lastLevel = 1; berserkInvuln = 0;
    worldRoom = 1; roomState = 'playing';
    transitionTimer = 0; roomNameTimer = 0;
    bgOffsetX = 0; idleMode = true;
    loadRoom();
  }

  function startGame() {
    idleMode = false;
    player.hp = 5; player.maxHp = 5; player.beersDrunk = 0;
    enemies = []; boss = null; beers = []; bottles = []; particles = [];
    score = 0; gameOver = false; gameWon = false;
    combo = 0; levelUpFlash = 0; lastLevel = 1; berserkInvuln = 0;
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
  // Pick a type via weighted roll against the current room's mix.
  function pickEnemyType() {
    var mix = getRoomCfg(worldRoom).mix;
    var r = Math.random(), cum = 0;
    for (var k in mix) {
      cum += mix[k];
      if (r <= cum) return k;
    }
    return 'normal';
  }

  function spawnEnemy() {
    var floorY = H * 0.72;
    var fromRight = Math.random() > 0.3;
    var type = pickEnemyType();
    var roomHp = 1 + Math.floor(score / 10) + Math.floor((worldRoom - 1) / 2);
    var sizeW, sizeH, baseSpeed, hpMult;
    switch (type) {
      case 'big':    sizeW = 22; sizeH = 36; baseSpeed = 0.6; hpMult = 2;    break;
      case 'runner': sizeW = 14; sizeH = 26; baseSpeed = 2.0; hpMult = 0.5;  break;
      case 'thug':   sizeW = 19; sizeH = 32; baseSpeed = 0.9; hpMult = 1.2;  break;
      default:       sizeW = 18; sizeH = 30; baseSpeed = 1.0; hpMult = 1;    break;
    }
    var hp = Math.max(1, Math.round(roomHp * hpMult));
    enemies.push({
      x: fromRight ? W + 20 : -20, y: floorY,
      w: sizeW, h: sizeH,
      vx: (fromRight ? -1 : 1) * (baseSpeed + Math.random() * 0.4),
      hp: hp, maxHp: hp,
      hit: 0, attackCd: 0, dodgeCd: 0,
      type: type,
    });
  }

  function spawnBoss(hp, name) {
    var floorY = H * 0.72;
    var cfg = getRoomCfg(worldRoom);
    boss = {
      x: W * 0.8, y: floorY,
      w: cfg.final ? 36 : 30, h: cfg.final ? 56 : 48,
      hp: hp, maxHp: hp,
      hit: 0, attackCd: 0,
      chargeDir: 1, chargeTimer: 0,
      berserk: false,
      phase2: false, // <25% HP — barrage mode
      barrageCd: 0,
      isFinal: !!cfg.final,
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

    var wasPhase2 = boss.phase2;
    boss.berserk = boss.hp < boss.maxHp * 0.5;
    boss.phase2  = boss.hp < boss.maxHp * 0.25;
    if (boss.phase2 && !wasPhase2) {
      // Phase-2 entry flash — short flicker + heal-tick particle burst
      addParticles(boss.x, boss.y - 24, '#ff4444', 28, 12);
      shake = 14;
      boss.barrageCd = 30;
    }

    var speed = boss.phase2 ? 3.4 : (boss.berserk ? 2.8 : 1.6);

    if (boss.chargeTimer > 0) {
      boss.chargeTimer--;
      boss.x += boss.chargeDir * (boss.phase2 ? 7.5 : (boss.berserk ? 6 : 4.5));
    } else {
      if (Math.abs(dx) > 60) boss.x += (dx > 0 ? 1 : -1) * speed;
      var chargeChance = boss.phase2 ? 0.022 : (boss.berserk ? 0.012 : 0.005);
      if (Math.random() < chargeChance) {
        boss.chargeDir = dx > 0 ? 1 : -1;
        boss.chargeTimer = boss.phase2 ? 26 : 18;
      }
    }
    boss.x = Math.max(30, Math.min(W - 30, boss.x));

    if (boss.attackCd > 0) boss.attackCd--;
    if (boss.barrageCd > 0) boss.barrageCd--;

    // Phase-2 barrage: lobs an arc of 3 bottles independent of melee CD.
    if (boss.phase2 && boss.barrageCd === 0) {
      var dir = dx > 0 ? 1 : -1;
      spawnBottle(boss.x,           dir, false);
      spawnBottle(boss.x + dir * 6, dir, false);
      spawnBottle(boss.x + dir * 12, dir, false);
      boss.barrageCd = boss.isFinal ? 60 : 90;
    }

    var dist = Math.abs(player.x - boss.x);
    if (dist < 60 && boss.attackCd === 0) {
      var throwGate = boss.phase2 ? 0.20 : (boss.berserk ? 0.35 : 0.65);
      if (Math.random() > throwGate && dist > 35) {
        spawnBottle(boss.x, dx > 0 ? 1 : -1, false);
        if (boss.berserk) spawnBottle(boss.x + 8, dx > 0 ? 1 : -1, false);
        boss.attackCd = boss.phase2 ? 20 : (boss.berserk ? 28 : 50);
      } else if (dist < 48) {
        var meleeDmg = boss.phase2 ? 3 : (boss.berserk ? 2 : 1);
        if (berserkInvuln <= 0) {
          player.hp -= meleeDmg;
          player.hit = 12; shake = 8;
          addParticles(player.x, player.y - 16, COL.ko, 8 + meleeDmg * 2, 5);
          if (player.hp <= 0) { gameOver = true; addParticles(player.x, player.y - 16, COL.ko, 20, 8); }
        }
        boss.attackCd = boss.phase2 ? 24 : (boss.berserk ? 32 : 52);
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
    var wasFinal = boss && boss.isFinal;
    score += wasFinal ? 25 : 5;
    combo += 5; comboTimer = 120;
    addParticles(boss.x, boss.y - 24, COL.boss,  wasFinal ? 80 : 30, wasFinal ? 16 : 10);
    addParticles(boss.x, boss.y - 24, '#fff',    wasFinal ? 50 : 20, wasFinal ? 14 : 8);
    boss = null;
    roomState = 'cleared';
    if (wasFinal) { gameWon = true; }
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
    if (gameWon)  return;

    if (shake > 0)         shake     *= 0.85;
    if (comboTimer > 0)    comboTimer--;
    if (comboTimer === 0)  combo = 0;
    if (levelUpFlash > 0)  levelUpFlash--;
    if (roomNameTimer > 0) roomNameTimer--;
    if (berserkInvuln > 0) berserkInvuln--;

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
      var sign = dx > 0 ? 1 : -1;

      // Per-type movement
      if (e.type === 'runner') {
        // Sprint in and out — closes faster, retreats briefly after attacking.
        var sprint = e.attackCd > 30 ? -1.4 : 1.6; // retreat right after attacking
        if (dist > 26) e.x += sign * Math.abs(e.vx) * sprint;
      } else if (e.type === 'thug') {
        // Prefers mid-range to throw bottles. Backs off if you get too close.
        if (dist < 50)      e.x -= sign * Math.abs(e.vx) * 0.6;
        else if (dist > 90) e.x += sign * Math.abs(e.vx);
      } else if (e.type === 'big') {
        if (dist > 36) e.x += sign * Math.abs(e.vx);
      } else {
        if (dist > 40) e.x += sign * Math.abs(e.vx);
      }

      if (e.attackCd > 0) e.attackCd--;
      if (e.dodgeCd  > 0) e.dodgeCd--;

      // Runner dodge: hop back when player is punching and close.
      if (e.type === 'runner' && e.dodgeCd === 0 && player.punching > 0 && dist < 36) {
        e.x -= sign * 18;
        e.dodgeCd = 50;
      }

      var meleeRange  = e.type === 'big' ? 40 : (e.type === 'runner' ? 30 : 35);
      var throwRange  = e.type === 'thug' ? 130 : 60;
      var throwChance = e.type === 'thug' ? 0.85 : (e.type === 'big' ? 0.15 : 0.35);
      var thugDouble  = e.type === 'thug' && Math.random() < 0.35;
      var thisDmg     = enemyMeleeDmg() * (e.type === 'big' ? 2 : 1);

      if (e.attackCd === 0) {
        if (dist < throwRange && dist > meleeRange && Math.random() < throwChance) {
          spawnBottle(e.x, sign, false);
          if (thugDouble) spawnBottle(e.x + sign * 6, sign, false);
          e.attackCd = e.type === 'thug' ? 55 : 70;
        } else if (dist < meleeRange) {
          if (berserkInvuln <= 0) {
            player.hp -= thisDmg; player.hit = 10; shake = 6;
            addParticles(player.x, player.y - 16, COL.ko, 5 + thisDmg * 2, 4);
            if (player.hp <= 0) { gameOver = true; addParticles(player.x, player.y - 16, COL.ko, 20, 8); }
          }
          e.attackCd = e.type === 'runner' ? 65 : 50;
        }
      }
      if (e.hit > 0) e.hit--;

      if (player.punching > 6 && player.punching < 11) {
        var px = player.x + player.punchDir * stats.punchRange;
        if (Math.abs(px - e.x) < 25 && Math.abs(player.y - e.y) < 30) {
          e.hp -= stats.punchDamage; e.hit = 8; e.x += player.punchDir * 12; shake = 4;
          addParticles(e.x, e.y - 16, '#fff', 4, 3);
          if (e.hp <= 0) { score++; combo++; comboTimer = 90; addParticles(e.x, e.y - 16, COL.particle, 12, 6); if (stats.canBerserk) berserkInvuln = 36; enemies.splice(i, 1); continue; }
        }
      }
      if (player.kicking > 7 && player.kicking < 13) {
        var kx = player.x + player.punchDir * 42;
        if (Math.abs(kx - e.x) < 34 && Math.abs(player.y - e.y) < 22) {
          e.hp -= 2; e.hit = 14; e.x += player.punchDir * 22; shake = 5;
          addParticles(e.x, e.y - 8, '#ffaa44', 7, 5);
          if (e.hp <= 0) { score++; combo++; comboTimer = 90; addParticles(e.x, e.y - 8, '#ffaa44', 14, 7); if (stats.canBerserk) berserkInvuln = 36; enemies.splice(i, 1); continue; }
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
            if (e.hp <= 0) { score++; combo++; comboTimer = 90; addParticles(e.x, e.y - 16, COL.particle, 12, 6); if (stats.canBerserk) berserkInvuln = 36; enemies.splice(j, 1); }
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
          if (berserkInvuln <= 0) {
            player.hp--; player.hit = 10; shake = 5;
            addParticles(b.x, b.y, COL.bottle, 6, 5);
            if (player.hp <= 0) { gameOver = true; addParticles(player.x, player.y - 16, COL.ko, 20, 8); }
          } else {
            addParticles(b.x, b.y, '#ff2222', 8, 6); // deflected by berserk aura
          }
          bottles.splice(i, 1);
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

    // Enemies — per-type palette so the threat type is readable at a glance
    var ENEMY_COL = {
      normal: { body: '#cc4444', dark: '#882222' },
      big:    { body: '#dd6644', dark: '#994422' },
      runner: { body: '#aa44aa', dark: '#66226a' },
      thug:   { body: '#ddaa33', dark: '#996611' },
    };
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var pal = ENEMY_COL[e.type] || ENEMY_COL.normal;
      drawPixelChar(e.x, e.y, e.w, e.h, pal.body, pal.dark, e.hit > 0, 0, 0, 0);
    }

    drawBoss();

    // Player
    var lv = idleMode ? 1 : getLevel();
    var lc = LEVEL_COLORS[lv - 1];
    var pBody = lc.body, pDark = lc.dark;
    if (player.hit > 0) { pBody = '#fff'; pDark = '#ccc'; }
    else if (berserkInvuln > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      pBody = '#ff2222'; pDark = '#fff';
    }
    if (!gameOver || Math.floor(Date.now() / 150) % 2 === 0) {
      drawPixelChar(player.x, player.y, player.w, player.h,
        pBody, pDark, false, player.punchDir, player.punching, player.kicking || 0);
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

    // Idle — skip the canvas text on phones; the HTML PLAY pill replaces it.
    if (idleMode && window.innerWidth >= 768) {
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
      var blinkKO = Math.floor(Date.now() / 800) % 2 === 0;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = blinkKO ? 'rgba(255,255,255,0.6)' : COL.textDim;
      ctx.fillText('[ PRESS F OR SPACE TO FIGHT AGAIN ]', W / 2, H / 2 + 22);
    }

    // Victory — final boss defeated
    if (gameWon) {
      ctx.textAlign = 'center';
      ctx.font = '800 20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#C5B358';
      ctx.fillText('CITY CLEARED', W / 2, H / 2 - 14);
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText('THE WARLORD IS DOWN — SCORE: ' + score, W / 2, H / 2 + 8);
      var blinkW = Math.floor(Date.now() / 800) % 2 === 0;
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = blinkW ? 'rgba(197,179,88,0.9)' : COL.textDim;
      ctx.fillText('[ PRESS F OR SPACE FOR NG+ ]', W / 2, H / 2 + 32);
    }

    ctx.restore();
  }

  function loop() { update(); draw(); frameId = requestAnimationFrame(loop); }

  window.initBarFight = init;

  // External controls used by the HTML PLAY/EXIT pills. On phones the touch
  // overlay is mounted only when the player taps PLAY, and unmounted on EXIT
  // so the page becomes scrollable again.
  window.startBarFight = function () {
    if (!canvas) return;
    var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (hasTouch && touchContainer && !touchContainer.querySelector('.bf-touch')) {
      setupTouchControls(touchContainer);
    }
    canvas.style.touchAction = 'none';
    document.body.classList.add('bf-playing');
    if (typeof startGame === 'function') startGame();
  };
  window.exitBarFight = function () {
    if (!canvas) return;
    var existing = touchContainer && touchContainer.querySelector('.bf-touch');
    if (existing && window.innerWidth < 768) existing.remove();
    canvas.style.touchAction = window.innerWidth < 768 ? 'pan-y' : 'none';
    document.body.classList.remove('bf-playing');
    if (typeof resetGame === 'function') resetGame();
  };
})();
