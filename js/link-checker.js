

// ============================================================
//  友链信号检测（适配 flink.pug）
// ============================================================

(function() {
  'use strict';

  var API_URL = 'https://link-checker-api.gzh-czy.cc.cd/api/check?url=';

  function updateSignal(element, data) {
    var icons = {
      4: '<i class="fas fa-wifi" style="color:#00B894;font-size:0.6rem;"></i>',
      3: '<i class="fas fa-wifi" style="color:#4ECDC4;font-size:0.6rem;"></i>',
      2: '<i class="fas fa-wifi" style="color:#FDCB6E;font-size:0.6rem;"></i>',
      1: '<i class="fas fa-wifi" style="color:#FF9F43;font-size:0.6rem;"></i>',
      0: '<i class="fas fa-times-circle" style="color:#FF6B6B;font-size:0.6rem;"></i>'
    };
    element.innerHTML = icons[data.signal] || icons[0];
    if (data.responseTime) {
      element.title = data.responseTime + 'ms';
    }
  }

  function checkAllLinks() {
    var allItems = [];

    // 1. 检测 myLink 卡片
    document.querySelectorAll('.my-link[data-url]').forEach(function(el) {
      var url = el.getAttribute('data-url');
      var signalEl = el.querySelector('.my-link-signal');
      if (url && signalEl) {
        allItems.push({ url: url, signalEl: signalEl });
      }
    });

    // 2. 检测友链卡片
    document.querySelectorAll('.flink-list-item').forEach(function(card) {
      var linkEl = card.querySelector('a[href]');
      if (!linkEl) return;
      var url = linkEl.href;
      if (!url || !url.startsWith('http')) return;

      // 查找信号占位
      var signalEl = card.querySelector('.flink-signal');
      if (!signalEl) {
        // 如果不存在，在 flink-item-name 中创建
        var nameEl = card.querySelector('.flink-item-name');
        if (nameEl) {
          signalEl = document.createElement('span');
          signalEl.className = 'flink-signal';
          signalEl.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;margin-left:4px;font-size:0.6rem;';
          signalEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#FF9F43;font-size:0.6rem;"></i>';
          nameEl.appendChild(signalEl);
        } else {
          return;
        }
      }

      allItems.push({ url: url, signalEl: signalEl });
    });

    // 3. 检测 flexcard 样式友链
    document.querySelectorAll('.flexcard-flink-list > a').forEach(function(card) {
      var url = card.getAttribute('href');
      if (!url || !url.startsWith('http')) return;

      var infoEl = card.querySelector('.info');
      if (!infoEl) return;

      var signalEl = infoEl.querySelector('.flink-signal');
      if (!signalEl) {
        var spanEl = infoEl.querySelector('span');
        if (spanEl) {
          signalEl = document.createElement('span');
          signalEl.className = 'flink-signal';
          signalEl.style.cssText = 'display:inline-block;margin-left:4px;font-size:0.55rem;';
          signalEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#FF9F43;font-size:0.55rem;"></i>';
          spanEl.appendChild(signalEl);
        } else {
          return;
        }
      }

      allItems.push({ url: url, signalEl: signalEl });
    });

    if (!allItems.length) {
      setTimeout(checkAllLinks, 1000);
      return;
    }

    allItems.forEach(function(item) {
      item.signalEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#FF9F43;font-size:0.6rem;"></i>';

      fetch(API_URL + encodeURIComponent(item.url))
        .then(function(response) { return response.json(); })
        .then(function(data) {
          updateSignal(item.signalEl, data);
        })
        .catch(function() {
          item.signalEl.innerHTML = '<i class="fas fa-times-circle" style="color:#FF6B6B;font-size:0.6rem;"></i>';
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