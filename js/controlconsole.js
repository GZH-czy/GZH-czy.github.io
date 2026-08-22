'use strict';

// 音乐状态：0=正常播放, 1=已暂停, 2=已关闭
let musicState = 0;

// 全屏幕中控台
function initControlConsole() {
  const trigger = document.getElementById('cc-trigger');
  const overlay = document.getElementById('cc-overlay');
  if (!trigger || !overlay) return;

  const backdrop = overlay.querySelector('.cc-backdrop');

  // 打开中控台（不禁止背景滚动）
  function open() {
    trigger.classList.add('open');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  // 关闭中控台
  function close() {
    trigger.classList.remove('open');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  // 点击触发按钮
  trigger.onclick = function() {
    if (overlay.classList.contains('is-open')) {
      close();
    } else {
      open();
    }
  };

  // 点击遮罩关闭
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

  // 音乐控制（开启/关闭，关闭前先暂停）
  function toggleMusic(btn) {
    const aplayerEl = document.querySelector('.aplayer') || document.querySelector('meting-js');
    if (!aplayerEl) return;

    const isHidden = aplayerEl.style.display === 'none';

    if (isHidden) {
      // 开启：显示播放器
      aplayerEl.style.display = '';
      btn.classList.add('active');
      btn.title = '关闭音乐';
    } else {
      // 关闭：先暂停，再隐藏
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

  // 监听全屏变化
  document.addEventListener('fullscreenchange', function() {
    const btn = overlay.querySelector('[data-action="fullscreen"]');
    if (btn) btn.dataset.fullscreen = document.fullscreenElement ? 'exit' : 'enter';
  });

  // 右键菜单开关
  function toggleContextMenu(btn) {
    // 当前是否启用（默认启用）
    const isEnabled = localStorage.getItem('rightmenu-disabled') !== 'true';
    // 切换为相反状态
    const newEnabled = !isEnabled;

    // 保存状态：'false'=启用, 'true'=禁用
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

    // 检查 Twikoo 是否加载
    if (typeof twikoo !== 'undefined') {
      fetchComments();
    } else {
      // 动态加载 Twikoo
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

    // 生成评论 HTML
    const html = comments.slice(0, 15).map(function(comment) {
      const avatar = comment.avatar || 'https://weavatar.com/avatar/?d=mp';
      const nick = comment.nick || '匿名';
      const content = (comment.comment || '').replace(/<[^>]*>/g, '');
      const url = (comment.url || '#') + '#' + (comment.id || '');
      return '<li class="cc-recent-item"><a href="' + url + '" target="_blank">' +
        '<img class="cc-recent-avatar" src="' + avatar + '" alt="">' +
        '<div class="cc-recent-info"><span class="cc-recent-nick">' + nick + '</span>' +
        '<span class="cc-recent-content">' + content + '</span></div></a></li>';
    }).join('');

    list.innerHTML = html;

    // 瀑布流布局
    requestAnimationFrame(function() {
      masonryLayout(list);
    });
  }

  // 瀑布流布局算法
  function masonryLayout(list) {
    const items = list.querySelectorAll('.cc-recent-item');
    if (!items.length) return;

    const containerWidth = list.offsetWidth;
    const columnCount = window.innerWidth < 768 ? 1 : 2;
    const columnWidth = (containerWidth - (columnCount - 1) * 12) / columnCount;
    const columnHeights = new Array(columnCount).fill(0);

    items.forEach(function(item) {
      item.style.width = columnWidth + 'px';
      item.style.marginBottom = '12px';

      // 找到最短的列
      const minHeight = Math.min(...columnHeights);
      const minIndex = columnHeights.indexOf(minHeight);

      // 计算位置
      const left = minIndex * (columnWidth + 12);
      const top = minHeight;

      item.style.position = 'absolute';
      item.style.left = left + 'px';
      item.style.top = top + 'px';

      // 更新列高
      columnHeights[minIndex] += item.offsetHeight + 12;
    });

    // 设置容器高度
    list.style.position = 'relative';
    list.style.height = Math.max(...columnHeights) + 'px';
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
      document.body.style.overflow = '';
    }
  }
});

// 初始化 + PJAX 重新初始化
initControlConsole();
document.addEventListener('pjax:complete', initControlConsole);
