// 3D Tilt effect — motionspace-style perspective transforms
(function () {
  function initTilt() {
    var cards = document.querySelectorAll('[data-tilt]');
    cards.forEach(function (card) {
      var maxRot = parseFloat(card.dataset.tiltMax) || 8;
      var perspective = parseFloat(card.dataset.tiltPerspective) || 1200;
      var scale = parseFloat(card.dataset.tiltScale) || 1.02;
      var speed = 400;
      var currentRx = 0, currentRy = 0, currentScale = 1;
      var targetRx = 0, targetRy = 0, targetScale = 1;
      var rafId = null;
      var glare = null;

      // Create glare element
      if (card.dataset.tiltGlare !== undefined) {
        var glareWrap = document.createElement('div');
        glareWrap.className = 'tilt-glare-wrap';
        glare = document.createElement('div');
        glare.className = 'tilt-glare';
        glareWrap.appendChild(glare);
        card.appendChild(glareWrap);
        card.style.overflow = 'hidden';
      }

      function animate() {
        currentRx += (targetRx - currentRx) * 0.08;
        currentRy += (targetRy - currentRy) * 0.08;
        currentScale += (targetScale - currentScale) * 0.08;

        card.style.transform =
          'perspective(' + perspective + 'px) ' +
          'rotateX(' + currentRx + 'deg) ' +
          'rotateY(' + currentRy + 'deg) ' +
          'scale3d(' + currentScale + ',' + currentScale + ',' + currentScale + ')';

        if (Math.abs(targetRx - currentRx) > 0.01 ||
            Math.abs(targetRy - currentRy) > 0.01 ||
            Math.abs(targetScale - currentScale) > 0.001) {
          rafId = requestAnimationFrame(animate);
        } else {
          rafId = null;
        }
      }

      function startAnim() {
        if (!rafId) rafId = requestAnimationFrame(animate);
      }

      card.addEventListener('mouseenter', function () {
        targetScale = scale;
        card.style.transition = 'none';
        startAnim();
      });

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        targetRy = (x - 0.5) * maxRot * 2;
        targetRx = (0.5 - y) * maxRot * 2;

        if (glare) {
          var angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
          var intensity = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2)) * 0.6;
          glare.style.background =
            'linear-gradient(' + angle + 'deg, rgba(255,255,255,' + intensity + ') 0%, rgba(255,255,255,0) 80%)';
        }

        startAnim();
      });

      card.addEventListener('mouseleave', function () {
        targetRx = 0;
        targetRy = 0;
        targetScale = 1;
        if (glare) glare.style.background = 'none';
        startAnim();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTilt);
  } else {
    initTilt();
  }
})();
