'use strict';

// 应用中心 - 悬浮面板 toggle
(function() {
  const btn = document.getElementById('app-center-btn');
  if (!btn) return;

  // 点击按钮切换面板
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.toggle('open');
  });

  // 点击面板内链接不关闭面板
  const panel = btn.querySelector('.app-center-panel');
  if (panel) {
    panel.addEventListener('click', function(e) {
      // 如果点击的是链接，让链接正常跳转
      if (e.target.closest('a')) return;
      e.stopPropagation();
    });
  }

  // 点击面板外部关闭面板
  document.addEventListener('click', function() {
    btn.classList.remove('open');
  });

  // ESC 键关闭面板
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      btn.classList.remove('open');
    }
  });
})();
