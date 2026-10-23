(function () {
  var root = document.documentElement;
  var query = window.matchMedia('(prefers-color-scheme: dark)');
  var toggle = document.querySelector('.theme-toggle');

  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : query.matches;
  }

  function sync() {
    if (toggle) toggle.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
    // keep the utterances comment widget in step with the page
    var frame = document.querySelector('iframe.utterances-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage(
        { type: 'set-theme', theme: isDark() ? 'github-dark' : 'github-light' },
        'https://utteranc.es'
      );
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      sync();
    });
  }
  if (query.addEventListener) query.addEventListener('change', sync);
  sync();

  // Looping previews play only while on screen, and never with reduced motion
  // (the poster image is shown instead).
  var videos = document.querySelectorAll('video[data-preview]');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (videos.length && 'IntersectionObserver' in window && !calm) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var p = entry.target.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          entry.target.pause();
        }
      });
    }, { threshold: 0.35 });
    videos.forEach(function (v) { io.observe(v); });
  }
})();
