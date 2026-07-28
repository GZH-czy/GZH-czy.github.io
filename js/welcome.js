// ============================================================
        //  配置区 - 修改为你的 Vercel API 地址
        // ============================================================
        const API_CHECK_URL = 'https://你的项目名.vercel.app/api/check?url=';
        const BATCH_SIZE = 5;  // 每批并发检测数量

        // ============================================================
        //  核心逻辑
        // ============================================================

        // 缓存检测结果
        const statusCache = new Map();

        // 检测单个友链
        async function checkLink(url) {
          // 检查缓存（5分钟内不重复检测）
          const cached = statusCache.get(url);
          if (cached && Date.now() - cached.time < 300000) {
            return cached.alive;
          }

          try {
            const response = await fetch(API_CHECK_URL + encodeURIComponent(url));
            const data = await response.json();
            const alive = data.alive === true;
            statusCache.set(url, { alive, time: Date.now() });
            return alive;
          } catch (error) {
            console.warn('检测失败:', url, error);
            statusCache.set(url, { alive: false, time: Date.now() });
            return false;
          }
        }

        // 更新信号图标
        function updateSignalIcon(card, alive) {
          let signalIcon = card.querySelector('.link-signal');
          if (!signalIcon) {
            signalIcon = document.createElement('span');
            signalIcon.className = 'link-signal';
            card.querySelector('.link-info')?.appendChild(signalIcon);
          }

          if (alive === undefined) {
            signalIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            signalIcon.style.color = '#FF9F43';
          } else if (alive) {
            signalIcon.innerHTML = '<i class="fas fa-wifi"></i>';
            signalIcon.style.color = '#4ECDC4';
            signalIcon.style.filter = 'drop-shadow(0 0 4px rgba(78, 205, 196, 0.5))';
          } else {
            signalIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            signalIcon.style.color = '#FF6B6B';
            signalIcon.style.filter = 'drop-shadow(0 0 4px rgba(255, 107, 107, 0.5))';
          }
        }

        // 批量检测友链
        async function checkAllLinks() {
          const cards = document.querySelectorAll('.flink-item, .friend-link-card, .link-card');
          if (!cards.length) {
            // 如果还没渲染，等待一下
            setTimeout(checkAllLinks, 1000);
            return;
          }

          // 提取友链 URL
          const links = [];
          cards.forEach(card => {
            const linkEl = card.querySelector('a[href]') || card;
            const url = linkEl.href;
            if (url && url.startsWith('http')) {
              links.push({ card, url });
            }
          });

          // 显示加载状态
          links.forEach(({ card }) => updateSignalIcon(card, undefined));

          // 分批检测
          for (let i = 0; i < links.length; i += BATCH_SIZE) {
            const batch = links.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(
              batch.map(async ({ url }) => ({
                url,
                alive: await checkLink(url)
              }))
            );

            // 更新图标
            results.forEach(({ url, alive }) => {
              const item = links.find(l => l.url === url);
              if (item) {
                updateSignalIcon(item.card, alive);
              }
            });

            // 批次间延迟，避免请求过快
            if (i + BATCH_SIZE < links.length) {
              await new Promise(r => setTimeout(r, 300));
            }
          }
        }

        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
          // 等待友链渲染完成
          setTimeout(checkAllLinks, 800);
        });

        // Pjax 兼容（Butterfly 使用 Pjax）
        document.addEventListener('pjax:complete', function() {
          setTimeout(checkAllLinks, 500);
        });