	'use strict';

// 全屏幕中控台
function initControlConsole() {
  const trigger = document.getElementById('cc-trigger');
  const overlay = document.getElementById('cc-overlay');
  if (!trigger || !overlay) return;

  const backdrop = overlay.querySelector('.cc-backdrop');

  function open() {
    trigger.classList.add('open');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function close() {
    trigger.classList.remove('open');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  trigger.onclick = function() {
    if (overlay.classList.contains('is-open')) {
      close();
    } else {
      open();
    }
  };

  backdrop.onclick = close;

  // ===== 功能按钮 =====
  const actions = overlay.querySelectorAll('.cc-action');
  actions.forEach(function(action) {
    action.onclick = function() {
      const actionType = this.dataset.action;

      switch (actionType) {
        case 'music':
          toggleMusic(this);
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

  // 音乐控制
  function toggleMusic(btn) {
    const aplayerEl = document.querySelector('.aplayer') || document.querySelector('meting-js');
    if (!aplayerEl) return;

    const isHidden = aplayerEl.style.display === 'none';

    if (isHidden) {
      aplayerEl.style.display = '';
      btn.classList.add('active');
      btn.title = '关闭音乐';
    } else {
      try {
        const metingEl = document.querySelector('meting-js');
        if (metingEl && metingEl.aplayer) {
          metingEl.aplayer.pause();
        } else if (typeof APlayer !== 'undefined' && APlayer.players) {
          Object.values(APlayer.players).forEach(function(p) { if (p) p.pause(); });
        }
      } catch(e) {}
      aplayerEl.style.display = 'none';
      btn.classList.remove('active');
      btn.title = '开启音乐';
    }
  }

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

  document.addEventListener('fullscreenchange', function() {
    const btn = overlay.querySelector('[data-action="fullscreen"]');
    if (btn) btn.dataset.fullscreen = document.fullscreenElement ? 'exit' : 'enter';
  });

  // 右键菜单开关
  function toggleContextMenu(btn) {
    const isEnabled = localStorage.getItem('rightmenu-disabled') !== 'true';
    const newEnabled = !isEnabled;

    localStorage.setItem('rightmenu-disabled', newEnabled ? 'false' : 'true');
    btn.classList.toggle('active', newEnabled);
    btn.setAttribute('aria-pressed', newEnabled ? 'true' : 'false');

    showSnackbar(newEnabled ? '右键菜单已开启' : '右键菜单已关闭（原生）');
  }

  // 初始化按钮状态
  const contextMenuBtn = overlay.querySelector('[data-action="contextMenu"]');
  if (contextMenuBtn) {
    const isEnabled = localStorage.getItem('rightmenu-disabled') !== 'true';
    contextMenuBtn.classList.toggle('active', isEnabled);
    contextMenuBtn.setAttribute('aria-pressed', isEnabled ? 'true' : 'false');
  }

  // 提示函数
  function showSnackbar(msg) {
    if (typeof btf !== 'undefined' && btf.snackbarShow) {
      btf.snackbarShow(msg);
    } else {
      const toast = document.createElement('div');
      toast.textContent = msg;
      toast.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:8px;z-index:9999;font-size:14px;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  }

  // 加载最近评论（使用 Twikoo 客户端 API）
  const recentHost = overlay.querySelector('[data-recent-comments-host]');
  if (recentHost) loadRecentComments(recentHost);

  function loadRecentComments(host) {
    const envId = host.dataset.server;
    const displayCount = parseInt(host.dataset.displayCount) || 10;
    if (!envId) return;

    if (typeof twikoo !== 'undefined') {
      fetchComments();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.all.min.js';
      script.onload = fetchComments;
      document.head.appendChild(script);
    }

    function fetchComments() {
      twikoo.getRecentComments({
        envId: envId.replace(/\/$/, ''),
        pageSize: displayCount,
        includeReply: true
      }).then(function(res) {
        if (res && res.length > 0) {
          renderComments(host, res);
        } else {
          host.innerHTML = '<p class="cc-empty">暂无评论</p>';
        }
      }).catch(function() {
        host.innerHTML = '<p class="cc-empty">评论加载失败</p>';
      });
    }
  }

  function renderComments(host, comments) {
    const list = host.querySelector('.cc-recent-list');
    if (!list) return;
    list.innerHTML = comments.slice(0, 10).map(function(comment) {
      const avatar = comment.avatar || 'https://weavatar.com/avatar/?d=mp';
      const nick = comment.nick || '匿名';
      const content = (comment.comment || '').replace(/<[^>]*>/g, '');
      const url = (comment.url || '#') + '#' + (comment.id || '');
      return '<li class="cc-recent-item"><a href="' + url + '" target="_blank">' +
        '<img class="cc-recent-avatar" src="' + avatar + '" alt="">' +
        '<div class="cc-recent-info"><span class="cc-recent-nick">' + nick + '</span>' +
        '<span class="cc-recent-content">' + content + '</span></div></a></li>';
    }).join('');
  }
}

// ESC 键关闭
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('cc-overlay');
    if (overlay && overlay.classList.contains('is-open')) {
      document.getElementById('cc-trigger').classList.remove('open');
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }
});

// 初始化 + PJAX 重新初始化
initControlConsole();
document.addEventListener('pjax:complete', initControlConsole);