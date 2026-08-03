// ============================================================
//  友链信号检测（自动创建，不影响布局）
// ============================================================

(function() {
  'use strict';

  var API_URL = 'https://link-checker-api.vercel.app/api/check?url=';

  function updateSignal(element, data) {
    var icons = {
      4: '<i class="fas fa-wifi" style="color:#00B894;font-size:0.5rem;"></i>',
      3: '<i class="fas fa-wifi" style="color:#4ECDC4;font-size:0.5rem;"></i>',
      2: '<i class="fas fa-wifi" style="color:#FDCB6E;font-size:0.5rem;"></i>',
      1: '<i class="fas fa-wifi" style="color:#FF9F43;font-size:0.5rem;"></i>',
      0: '<i class="fas fa-times-circle" style="color:#FF6B6B;font-size:0.5rem;"></i>'
    };
    element.innerHTML = icons[data.signal] || icons[0];
    if (data.responseTime) {
      element.title = data.responseTime + 'ms';
    }
  }

  function checkAllLinks() {
    var allItems = [];

    // myLink
    document.querySelectorAll('.my-link[data-url]').forEach(function(el) {
      var url = el.getAttribute('data-url');
      var signalEl = el.querySelector('.my-link-signal');
      if (url && signalEl) {
        allItems.push({ url: url, signalEl: signalEl });
      }
    });

    // 友链卡片 - 自动在右下角创建信号
    document.querySelectorAll('.flink-list-item').forEach(function(card) {
      var linkEl = card.querySelector('a[href]');
      if (!linkEl) return;
      var url = linkEl.href;
      if (!url || !url.startsWith('http')) return;

      // 检查是否已有信号
      var signalEl = card.querySelector('.flink-signal');
      if (!signalEl) {
        signalEl = document.createElement('div');
        signalEl.className = 'flink-signal';
        signalEl.style.cssText = 'position:absolute;bottom:4px;right:8px;font-size:0.5rem;z-index:2;opacity:0.6;line-height:1;';
        signalEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#FF9F43;font-size:0.5rem;"></i>';
        card.style.position = 'relative';
        card.appendChild(signalEl);
      }

      allItems.push({ url: url, signalEl: signalEl });
    });

    if (!allItems.length) {
      setTimeout(checkAllLinks, 1000);
      return;
    }

    allItems.forEach(function(item) {
      fetch(API_URL + encodeURIComponent(item.url))
        .then(function(response) { return response.json(); })
        .then(function(data) {
          updateSignal(item.signalEl, data);
        })
        .catch(function() {
          item.signalEl.innerHTML = '<i class="fas fa-times-circle" style="color:#FF6B6B;font-size:0.5rem;"></i>';
        });
    });
  }

  function runCheck() {
    setTimeout(checkAllLinks, 1500);
  }

  if (document.readyState === 'complete') {
    runCheck();
  } else {
    document.addEventListener('DOMContentLoaded', runCheck);
  }

  document.addEventListener('pjax:complete', function() {
    setTimeout(checkAllLinks, 1000);
  });
  document.addEventListener('pjax:success', function() {
    setTimeout(checkAllLinks, 1000);
  });

})();