// ============================================================
//  友链/外挂标签 信号检测 适配flink
// ============================================================

(function() {
  'use strict';

  // 配置 - 修改为你的 API 地址
  const API_URL = 'https://link-checker-api.gzh-czy.cc.cd/api/check?url=';
  const BATCH_SIZE = 5; // 并发数
  const CACHE_DURATION = 600000; // 缓存10分钟

  // 缓存
  const cache = new Map();

  // 信号图标映射
  const SIGNAL_ICONS = {
    0: '<i class="fas fa-times-circle" style="color:#FF6B6B;font-size:0.9rem;"></i>',
    1: '<i class="fas fa-wifi" style="color:#FF9F43;font-size:0.9rem;"></i>',
    2: '<i class="fas fa-wifi" style="color:#FDCB6E;font-size:0.9rem;"></i>',
    3: '<i class="fas fa-wifi" style="color:#4ECDC4;font-size:0.9rem;"></i>',
    4: '<i class="fas fa-wifi" style="color:#00B894;font-size:0.9rem;"></i>'
  };

  // 检测单个链接
  async function checkLink(url) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.time < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(API_URL + encodeURIComponent(url));
      const data = await response.json();
      cache.set(url, { data, time: Date.now() });
      return data;
    } catch (error) {
      const failData = { alive: false, signal: 0, message: '检测失败' };
      cache.set(url, { data: failData, time: Date.now() });
      return failData;
    }
  }

  // 更新信号图标
  function updateSignal(element, data) {
    const signalMap = {
      0: SIGNAL_ICONS[0],
      1: SIGNAL_ICONS[1],
      2: SIGNAL_ICONS[2],
      3: SIGNAL_ICONS[3],
      4: SIGNAL_ICONS[4]
    };
    const icon = signalMap[data.signal] || SIGNAL_ICONS[0];
    element.innerHTML = icon;
    element.title = data.message || (data.alive ? `${data.responseTime}ms` : '无法访问');
  }

  // 检测所有 my-link
  async function checkAllLinks() {
    // 选择所有带信号的 my-link
    const items = document.querySelectorAll('.my-link[data-url]');
    if (!items.length) {
      // 如果还没渲染，等待重试
      setTimeout(checkAllLinks, 1000);
      return;
    }

    const links = [];
    items.forEach(item => {
      const url = item.getAttribute('data-url');
      const signalEl = item.querySelector('.my-link-signal');
      if (url && signalEl) {
        links.push({ item, url, signalEl });
      }
    });

    if (!links.length) return;

    // 显示加载状态
    links.forEach(({ signalEl }) => {
      signalEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#FF9F43;"></i>';
    });

    // 分批检测
    for (let i = 0; i < links.length; i += BATCH_SIZE) {
      const batch = links.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async ({ url }) => ({
          url,
          data: await checkLink(url)
        }))
      );

      results.forEach(({ url, data }) => {
        const item = links.find(l => l.url === url);
        if (item) {
          updateSignal(item.signalEl, data);
        }
      });

      if (i + BATCH_SIZE < links.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  // 1. 检测 myLink 卡片
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

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAllLinks);
  } else {
    checkAllLinks();
  }

  // Pjax 兼容
  document.addEventListener('pjax:complete', checkAllLinks);
  document.addEventListener('pjax:success', checkAllLinks);

})();
