// scripts/my-link.js
'use strict';

function myLink(args) {
  // 解析参数：名称, 链接, 副标题, 图标URL
  const name = args[0] || '网站名称';
  const link = args[1] || '#';
  const subtitle = args[2] || '';
  const icon = args[3] || '';

  // 构建 HTML
  return `
    <a class="my-link" href="${link}" target="_blank" rel="noopener noreferrer" title="${name}">
      <span class="my-link-tip">前往以下网站，不保证安全性哦喵～</span>
      <img class="my-link-img" alt="${name}" src="${icon}">
      <span class="my-link-title">${name}</span>
      <span class="my-link-subtitle">${subtitle}</span>
    </a>
  `;
}

// 注册标签：{% myLink 名称 链接 副标题 图标URL %}
hexo.extend.tag.register('myLink', myLink, { ends: false });