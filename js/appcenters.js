'use strict';

// 应用中心 - 悬浮面板 toggle
function initAppCenters() {
  const btn = document.querySelector('#app-center-nav .app-center-btn');
  if (!btn) return;

  // 点击按钮切换面板
  btn.onclick = function(e) {
    e.stopPropagation();
    this.classList.toggle('open');
  };

  // 点击面板内链接不关闭面板
  const panel = btn.querySelector('.app-center-panel');
  if (panel) {
    panel.onclick = function(e) {
      if (e.target.closest('a')) return;
      e.stopPropagation();
    };
  }

  // 点击面板外部关闭面板
  document.onclick = function() {
    btn.classList.remove('open');
  };

  // ESC 键关闭面板
  document.onkeydown = function(e) {
    if (e.key === 'Escape') btn.classList.remove('open');
  };
}

// 初始化 + PJAX 重新初始化
initAppCenters();
document.addEventListener('pjax:complete', initAppCenters);
