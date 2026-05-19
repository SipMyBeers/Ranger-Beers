(function () {
  var canvas = document.getElementById('matrix-bg');
  if (!canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx = canvas.getContext('2d');
  var w = 0, h = 0, dpr = 1;
  var fontSize = 16;
  var cols = 0;
  var drops = [];
  var speeds = [];

  // Ranger Beers themed glyphs: hex, binary, military shorthand, katakana echo
  var chars = (
    '0123456789ABCDEF' +
    'RNGRBEERSAIRBORNERANGERMEDIC' +
    '╱╲│─┼╳░▒▓█' +
    'アイウエオカキクケコサシスセソタチツテト'
  ).split('');

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontSize = w < 640 ? 13 : 16;
    cols = Math.ceil(w / fontSize);
    drops = new Array(cols);
    speeds = new Array(cols);
    for (var i = 0; i < cols; i++) {
      drops[i] = Math.random() * -h;
      speeds[i] = 0.6 + Math.random() * 1.4;
    }
    // Prime with dark fill so first frame isn't bright
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
  }

  function pick() {
    return chars[(Math.random() * chars.length) | 0];
  }

  var running = true;

  function draw() {
    // Trailing fade — leaves a fading tail of glyphs
    ctx.fillStyle = 'rgba(10, 10, 10, 0.085)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '600 ' + fontSize + 'px JetBrains Mono, ui-monospace, monospace';
    ctx.textBaseline = 'top';

    for (var i = 0; i < cols; i++) {
      var x = i * fontSize;
      var y = drops[i];

      // Head — bright pale gold
      ctx.fillStyle = 'rgba(229, 211, 130, 0.92)';
      ctx.fillText(pick(), x, y);

      // Mid-trail — saturated gold one cell above
      ctx.fillStyle = 'rgba(197, 179, 88, 0.55)';
      ctx.fillText(pick(), x, y - fontSize);

      drops[i] += fontSize * speeds[i] * 0.5;

      // Reset stream off-screen with random chance for staggered streams
      if (drops[i] > h + fontSize * 2 && Math.random() > 0.972) {
        drops[i] = Math.random() * -h * 0.4;
        speeds[i] = 0.6 + Math.random() * 1.4;
      }
    }
  }

  function loop() {
    if (running) draw();
    requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
  });

  window.addEventListener('resize', function () {
    // Debounced via rAF
    requestAnimationFrame(resize);
  }, { passive: true });

  resize();
  requestAnimationFrame(loop);
})();
