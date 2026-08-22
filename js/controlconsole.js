'use strict';

// 全屏幕中控台
function initControlConsole() {
  const trigger = document.getElementById('cc-trigger');
  const overlay = document.getElementById('cc-overlay');
  if (!trigger || !overlay) return;

  const backdrop = overlay.querySelector('.cc-backdrop');

  // 打开中控台
  function open() {
    trigger.classList.add('open');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // 关闭中控台
  function close() {
    trigger.classList.remove('open');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // 切换中控台
  function toggle() {
    if (overlay.classList.contains('is-open')) {
      close();
    } else {
      open();
    }
  }

  // 点击触发按钮（使用 onclick 避免重复绑定）
  trigger.onclick = toggle;

  // 点击遮罩关闭
  backdrop.onclick = close;

  // ===== 功能按钮 =====
  const actions = overlay.querySelectorAll('.cc-action');
  actions.forEach(function(action) {
    action.onclick = function() {
      const actionType = this.dataset.action;

      switch (actionType) {
        case 'music':
          this.classList.toggle('active');
          if (typeof Meting !== 'undefined') {
            const player = document.querySelector('meting-js');
            if (player) player.play();
          }
          break;

        case 'theme':
          if (typeof switchNightMode === 'function') switchNightMode();
          break;

        case 'fullscreen':
          toggleFullscreen(this);
          break;

        case 'comment':
          close();
          const commentEl = document.getElementById('post-comment') || document.querySelector('.comment-headling');
          if (commentEl) commentEl.scrollIntoView({ behavior: 'smooth' });
          break;

        case 'contextMenu':
          toggleContextMenu(this);
          break;
      }
    };
  });

  // 全屏功能
  function toggleFullscreen(btn) {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(function() {
        btn.dataset.fullscreen = 'exit';
      }).catch(function() {});
    } else {
      document.exitFullscreen().then(function() {
        btn.dataset.fullscreen = 'enter';
      }).catch(function() {});
    }
  }

  // 监听全屏变化
  document.addEventListener('fullscreenchange', function() {
    const btn = overlay.querySelector('[data-action="fullscreen"]');
    if (btn) btn.dataset.fullscreen = document.fullscreenElement ? 'exit' : 'enter';
  });

  // 右键菜单开关
  function toggleContextMenu(btn) {
    const isEnabled = btn.classList.toggle('active');
    btn.setAttribute('aria-pressed', isEnabled);
    localStorage.setItem('rightmenu-disabled', !isEnabled);
    if (typeof rightmenu !== 'undefined' && rightmenu.snackbarShow) {
      rightmenu.snackbarShow(isEnabled ? '右键菜单已开启' : '右键菜单已关闭');
    }
  }

  // ===== 加载最近评论 =====
  const recentHost = overlay.querySelector('[data-recent-comments-host]');
  if (recentHost) loadRecentComments(recentHost);

  function loadRecentComments(host) {
    const server = host.dataset.server;
    const site = host.dataset.site;
    const siteOrigin = host.dataset.siteOrigin;
    const displayCount = parseInt(host.dataset.displayCount) || 10;
    if (!server || !site) return;

    fetch(server + '/api/comment?url=' + encodeURIComponent(siteOrigin) + '&size=' + displayCount)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.data && data.data.length > 0) {
          renderComments(host, data.data);
        }
      })
      .catch(function() {
        host.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">评论加载失败</p>';
      });
  }

  function renderComments(host, comments) {
    const list = host.querySelector('.cc-recent-list');
    if (!list) return;
    list.innerHTML = comments.slice(0, 10).map(function(comment) {
      return '<li class="cc-recent-item"><a href="' + (comment.url || '#') + '">' +
        '<img class="cc-recent-avatar" src="' + (comment.avatar || 'https://weavatar.com/avatar/?d=mp') + '" alt="">' +
        '<div class="cc-recent-info"><span class="cc-recent-nick">' + (comment.nick || '匿名') + '</span>' +
        '<span class="cc-recent-content">' + (comment.comment || '').substring(0, 50) + '</span></div></a></li>';
    }).join('');
  }
}

// ESC 键关闭（全局，只绑定一次）
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('cc-overlay');
    if (overlay && overlay.classList.contains('is-open')) {
      document.getElementById('cc-trigger').classList.remove('open');
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }
});

// 初始化 + PJAX 重新初始化
initControlConsole();
document.addEventListener('pjax:complete', initControlConsole);
