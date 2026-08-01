// ============================================================
//  信号检测
// ============================================================

(function() {
  'use strict';

  const API_URL = 'https://link-checker-api.gzh-czy.cc.cd/api/check?url=';

  async function checkLink(url) {
    try {
      const response = await fetch(API_URL + encodeURIComponent(url));
      const data = await response.json();
      return data;
    } catch (error) {
      return { alive: false, signal: 0 };
    }
  }

  function updateSignal(element, data) {
    const icons = {
      4: '<i class="fas fa-wifi" style="color:#00B894;"></i>',
      3: '<i class="fas fa-wifi" style="color:#4ECDC4;"></i>',
      2: '<i class="fas fa-wifi" style="color:#FDCB6E;"></i>',
      1: '<i class="fas fa-wifi" style="color:#FF9F43;"></i>',
      0: '<i class="fas fa-times-circle" style="color:#FF6B6B;"></i>'
    };
    element.innerHTML = icons[data.signal] || icons[0];
  }

  function checkAllLinks() {
    const items = document.querySelectorAll('.my-link[data-url]');
    if (!items.length) {
      setTimeout(checkAllLinks, 1000);
      return;
    }

    items.forEach(async function(item) {
      const url = item.getAttribute('data-url');
      const signalEl = item.querySelector('.my-link-signal');
      if (!signalEl) return;

      signalEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#FF9F43;"></i>';
      const data = await checkLink(url);
      updateSignal(signalEl, data);
    });
  }

  setTimeout(checkAllLinks, 1500);

  document.addEventListener('pjax:complete', function() {
    setTimeout(checkAllLinks, 1000);
  });
})();