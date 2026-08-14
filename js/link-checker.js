// ============================================================
//  友链/外挂标签 信号检测（可见区域检测 + 自动停止轮询）
// ============================================================

(function() {
  'use strict';

  // 配置 - 修改为你的 API 地址
  const API_URL = 'https://link-checker-api.gzh-czy.cc.cd/api/check?url=';
  const BATCH_SIZE = 2;                    // 每批并发数
  const POLL_INTERVAL = 10000;              // 2秒检测一次
  const VISIBILITY_DEBOUNCE = 500;         // 可见性变化防抖延迟（毫秒）

  // DOM 缓存
  let cachedLinks = [];
  let cachedSignalElements = new Map();

  // 轮询控制
  let pollTimer = null;
  let isPolling = false;
  let isPageVisible = true;

  // 信号图标映射
  const SIGNAL_ICONS = {
    0: '<i class="fas fa-times-circle" style="color:#FF6B6B;font-size:0.9rem;"></i>',
    1: '<i class="fas fa-wifi" style="color:#FF9F43;font-size:0.9rem;"></i>',
    2: '<i class="fas fa-wifi" style="color:#FDCB6E;font-size:0.9rem;"></i>',
    3: '<i class="fas fa-wifi" style="color:#4ECDC4;font-size:0.9rem;"></i>',
    4: '<i class="fas fa-wifi" style="color:#00B894;font-size:0.9rem;"></i>'
  };

  // ========== 工具函数 ==========

  // 检测元素是否在可视区域（使用 IntersectionObserver 兼容方案）
  function isElementVisible(element) {
    if (!element) return false;
    
    // 方法1：使用 IntersectionObserver 的 fallback（通过 getBoundingClientRect）
    const rect = element.getBoundingClientRect();
    const winHeight = window.innerHeight || document.documentElement.clientHeight;
    const winWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // 判断元素是否在视口内（至少露出一半以上）
    const visibleHeight = Math.min(rect.bottom, winHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, winWidth) - Math.max(rect.left, 0);
    
    // 如果元素高度或宽度为0，跳过检测
    if (rect.height === 0 || rect.width === 0) return false;
    
    // 至少露出 50% 以上才算可见
    const visibleRatio = (visibleHeight * visibleWidth) / (rect.height * rect.width);
    return visibleRatio > 0.5;
  }

  // 获取当前可见的友链
  function getVisibleLinks(links) {
    // 使用 requestAnimationFrame 优化性能，避免在主线程卡顿
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const visible = links.filter(({ item }) => isElementVisible(item));
        resolve(visible);
      });
    });
  }

  // ========== 核心函数 ==========

  // 检测单个链接
  async function checkLink(url) {
    try {
      const response = await fetch(API_URL + encodeURIComponent(url));
      const data = await response.json();
      return data;
    } catch (error) {
      return { alive: false, signal: 0, message: '检测失败' };
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

  // 检测可见的友链（只检测当前屏幕可见的）
  async function checkVisibleLinks() {
    // 如果页面不可见，直接跳过
    if (!isPageVisible) return;

    // 如果缓存中没有链接，重新获取
    if (cachedLinks.length === 0) {
      const items = document.querySelectorAll('.my-link[data-url]');
      if (!items.length) {
        // 如果还没渲染，等待重试（只重试一次）
        setTimeout(checkVisibleLinks, 1000);
        return;
      }
      
      cachedLinks = [];
      items.forEach(item => {
        const url = item.getAttribute('data-url');
        const signalEl = item.querySelector('.my-link-signal');
        if (url && signalEl) {
          cachedLinks.push({ item, url, signalEl });
          cachedSignalElements.set(url, signalEl);
        }
      });
    }

    if (!cachedLinks.length) return;

    // 获取当前可见的友链
    const visibleLinks = await getVisibleLinks(cachedLinks);
    
    if (visibleLinks.length === 0) {
      // 如果没有可见的友链，不做任何请求（节省资源）
      return;
    }

    // 分批检测可见的友链
    for (let i = 0; i < visibleLinks.length; i += BATCH_SIZE) {
      // 如果页面离开或不可见，立即停止检测
      if (!isPageVisible || !isPolling) break;

      const batch = visibleLinks.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async ({ url }) => ({
          url,
          data: await checkLink(url)
        }))
      );

      // 只有在页面仍然可见且轮询未停止时才更新UI
      if (isPageVisible && isPolling) {
        results.forEach(({ url, data }) => {
          const signalEl = cachedSignalElements.get(url);
          if (signalEl) {
            updateSignal(signalEl, data);
          }
        });
      }
    }
  }

  // ========== 轮询控制 ==========

  function startPolling() {
    if (isPolling) return;
    isPolling = true;
    
    // 立即执行一次
    checkVisibleLinks();
    
    // 每 2 秒执行一次
    pollTimer = setInterval(checkVisibleLinks, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    isPolling = false;
    
    // 清空缓存，下次重新获取
    cachedLinks = [];
    cachedSignalElements.clear();
  }

  // ========== 页面可见性监听 ==========

  function handleVisibilityChange() {
    if (document.hidden) {
      // 页面离开（切换到其他标签页或最小化）
      isPageVisible = false;
      stopPolling();
    } else {
      // 页面重新可见
      isPageVisible = true;
      // 延迟重新启动轮询，避免短时间内重复请求
      setTimeout(() => {
        if (isPageVisible && !isPolling) {
          startPolling();
        }
      }, VISIBILITY_DEBOUNCE);
    }
  }

  // ========== 滚动优化 ==========

  let scrollTimeout = null;
  function handleScroll() {
    // 防抖：滚动停止后 200ms 再检测一次
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
      if (isPageVisible && isPolling) {
        checkVisibleLinks();
      }
    }, 200);
  }

  // ========== 初始化 ==========

  function init() {
    // 停止之前的轮询
    stopPolling();
    
    // 重置状态
    isPageVisible = !document.hidden;
    
    // 启动轮询
    if (isPageVisible) {
      startPolling();
    }
  }

  // ========== 注册事件监听 ==========

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 滚动时检测（用户滚动到新区域时触发检测）
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll, { passive: true });

  // Pjax 兼容
  document.addEventListener('pjax:complete', () => {
    stopPolling();
    // 清空缓存，重新获取
    cachedLinks = [];
    cachedSignalElements.clear();
    setTimeout(init, 300);
  });
  document.addEventListener('pjax:success', () => {
    stopPolling();
    cachedLinks = [];
    cachedSignalElements.clear();
    setTimeout(init, 300);
  });

  // 页面关闭或刷新时停止轮询
  window.addEventListener('beforeunload', () => {
    stopPolling();
  });

  // ========== 暴露控制接口（方便调试） ==========

  window.linkChecker = {
    startPolling,
    stopPolling,
    checkVisibleLinks,
    getVisibleLinks,
    isElementVisible,
    getCache: () => cachedLinks,
    isPolling: () => isPolling,
    isPageVisible: () => isPageVisible
  };

})();