'use strict';

// 应用中心 - 悬浮面板（鼠标悬停打开）
function initAppCenters() {
  const btn = document.querySelector('#app-center-nav .app-center-btn');
  if (!btn) return;

  let hideTimeout;

  // 鼠标进入按钮 - 显示面板
  btn.onmouseenter = function() {
    clearTimeout(hideTimeout);
    this.classList.add('open');
  };

  // 鼠标离开按钮 - 延迟隐藏
  btn.onmouseleave = function() {
    hideTimeout = setTimeout(() => {
      this.classList.remove('open');
    }, 200);
  };

  // 鼠标进入面板 - 取消隐藏
  const panel = btn.querySelector('.app-center-panel');
  if (panel) {
    panel.onmouseenter = function() {
      clearTimeout(hideTimeout);
    };
    // 鼠标离开面板 - 隐藏
    panel.onmouseleave = function() {
      hideTimeout = setTimeout(() => {
        btn.classList.remove('open');
      }, 200);
    };
  }

  // 点击面板外部关闭面板
  document.addEventListener('click', function(e) {
    if (!btn.contains(e.target)) {
      btn.classList.remove('open');
    }
  });

  // ESC 键关闭面板
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') btn.classList.remove('open');
  });
}

// 初始化 + PJAX 重新初始化
initAppCenters();
document.addEventListener('pjax:complete', initAppCenters);