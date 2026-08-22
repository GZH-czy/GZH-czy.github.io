'use strict';

// 全屏幕中控台
(function() {
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

  // 点击触发按钮
  trigger.addEventListener('click', toggle);

  // 点击遮罩关闭
  backdrop.addEventListener('click', close);

  // ESC 键关闭
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      close();
    }
  });

  // ===== 功能按钮 =====
  const actions = overlay.querySelectorAll('.cc-action');
  actions.forEach(function(action) {
    action.addEventListener('click', function() {
      const actionType = this.dataset.action;

      switch (actionType) {
        case 'music':
          // 音乐胶囊 toggle
          this.classList.toggle('active');
          // 触发音乐播放器
          if (typeof Meting !== 'undefined') {
            const player = document.querySelector('meting-js');
            if (player) {
              player.play();
            }
          }
          break;

        case 'theme':
          // 切换主题（Butterfly 原生）
          if (typeof switchNightMode === 'function') {
            switchNightMode();
          }
          break;

        case 'fullscreen':
          // 全屏 toggle
          toggleFullscreen(this);
          break;

        case 'comment':
          // 滚动到评论
          close();
          const commentEl = document.getElementById('post-comment') || document.querySelector('.comment-headling');
          if (commentEl) {
            commentEl.scrollIntoView({ behavior: 'smooth' });
          }
          break;

        case 'contextMenu':
          // 右键菜单开关（集成 rightmenu）
          toggleContextMenu(this);
          break;
      }
    });
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
    if (btn) {
      btn.dataset.fullscreen = document.fullscreenElement ? 'exit' : 'enter';
    }
  });

  // 右键菜单开关
  function toggleContextMenu(btn) {
    // 通过自定义事件通知 rightmenu
    const event = new CustomEvent('toggleRightMenu');
    document.dispatchEvent(event);

    // 切换按钮状态
    const isEnabled = btn.classList.toggle('active');
    btn.setAttribute('aria-pressed', isEnabled);

    // 保存到 localStorage
    localStorage.setItem('rightmenu-disabled', !isEnabled);

    // 显示提示
    if (typeof rightmenu !== 'undefined' && rightmenu.snackbarShow) {
      rightmenu.snackbarShow(isEnabled ? '右键菜单已开启' : '右键菜单已关闭');
    }
  }

  // ===== 加载最近评论 =====
  const recentHost = overlay.querySelector('[data-recent-comments-host]');
  if (recentHost) {
    loadRecentComments(recentHost);
  }

  function loadRecentComments(host) {
    const server = host.dataset.server;
    const site = host.dataset.site;
    const siteOrigin = host.dataset.siteOrigin;
    const displayCount = parseInt(host.dataset.displayCount) || 10;

    if (!server || !site) return;

    // 尝试从 Twikoo API 获取评论
    fetch(server + '/api/comment?url=' + encodeURIComponent(siteOrigin) + '&size=' + displayCount)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.data && data.data.length > 0) {
          renderComments(host, data.data);
        }
      })
      .catch(function() {
        // 评论加载失败，显示提示
        host.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">评论加载失败，请检查评论服务配置</p>';
      });
  }

  function renderComments(host, comments) {
    const list = host.querySelector('.cc-recent-list');
    if (!list) return;

    list.innerHTML = comments.slice(0, 10).map(function(comment) {
      return '<li class="cc-recent-item">' +
        '<a href="' + (comment.url || '#') + '">' +
          '<img class="cc-recent-avatar" src="' + (comment.avatar || 'https://weavatar.com/avatar/?d=mp') + '" alt="">' +
          '<div class="cc-recent-info">' +
            '<span class="cc-recent-nick">' + (comment.nick || '匿名') + '</span>' +
            '<span class="cc-recent-content">' + (comment.comment || '').substring(0, 50) + '</span>' +
          '</div>' +
        '</a>' +
      '</li>';
    }).join('');
  }
})();
