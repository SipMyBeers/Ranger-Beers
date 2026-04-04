(function () {
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxName = document.getElementById('lightbox-name');
  var lightboxDesc = document.getElementById('lightbox-desc');
  var lightboxLink = document.getElementById('lightbox-link');
  var lightboxClose = document.getElementById('lightbox-close');

  document.querySelectorAll('.portfolio-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var img = this.querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = this.dataset.name;
      lightboxName.textContent = this.dataset.name;
      lightboxDesc.textContent = this.dataset.desc;
      lightboxLink.href = this.dataset.url;
      lightbox.classList.add('active');
    });
  });

  lightboxClose.addEventListener('click', function () {
    lightbox.classList.remove('active');
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') lightbox.classList.remove('active');
  });
})();
