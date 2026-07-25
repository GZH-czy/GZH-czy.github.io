/* source/css/custom.css */
:root {
  --main-radius: 10px;
  --main-color: #49B1F5;
  --main-font: 'Microsoft YaHei', sans-serif;
}

/* 应用全局圆角 */
.card-widget, .recent-post-item, .layout-page, .post-block {
  border-radius: var(--main-radius) !important;
}

/* 应用主题色 */
a, .btn, .button {
  color: var(--main-color) !important;
}
.btn, .button {
  background: var(--main-color) !important;
}

/* 应用字体 */
body {
  font-family: var(--main-font) !important;
}

/* --- 滤镜效果 --- */
.filter-dark #body-wrap {
  filter: brightness(0.7);
}
.filter-sunset #body-wrap {
  filter: sepia(0.5) brightness(1.1) saturate(1.3);
}
.filter-grayscale #body-wrap {
  filter: grayscale(1);
}