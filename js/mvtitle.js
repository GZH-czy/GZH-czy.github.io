//动态标题
var OriginTitile = document.title;
var titleTime;
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    //离开当前页面时标签显示内容
    document.title = "w(ﾟДﾟ)w 不要走！再看看嘛！";
    clearTimeout(titleTime);
  } else {
    //返回当前页面时标签显示内容
    document.title = "♪(^∇^*)欢迎肥来！" + OriginTitile;
    //两秒后变回正常标题
    titleTime = setTimeout(function () {
      document.title = OriginTitile;
    }, 2000);
  }
});

  // ============================================================
  //  动态彩色控制台输出
  // ============================================================
(function() {
  'use strict';



  const text = '子子涵ya';
  const colors = [
    '#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB', 
    '#0ABDE3', '#10AC84', '#5F27CD', '#FF9FF3'
  ];

  let colorIndex = 0;
  let intervalId = null;

  function printColoredText() {
    // 生成渐变色
    const gradient = colors.map((c, i) => {
      const pos = (i / (colors.length - 1) * 100).toFixed(0);
      return `${c} ${pos}%`;
    }).join(', ');

    const style = `
      background: linear-gradient(90deg, ${gradient});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 3em;
      font-weight: bold;
      padding: 10px;
      text-shadow: 0 2px 20px rgba(0,0,0,0.3);
    `;

    console.clear(); // 每次清除之前的输出，产生动态效果
    console.log('%c' + text, style);
    console.log('%c每一个案例都是故事', 'font-size: 1.2em; color: #aaa;');
    console.log('%c让编程改变世界.', 'color: #2ebb96; font-size: 1em;');
  }

  // 启动动画
  function startColorAnimation(interval = 500) {
    if (intervalId) clearInterval(intervalId);
    // 先旋转颜色数组
    setInterval(() => {
      const first = colors.shift();
      colors.push(first);
    }, interval);
    
    // 每 interval 毫秒刷新一次
    intervalId = setInterval(printColoredText, interval);
    printColoredText(); // 立即执行一次
  }

  // 停止动画
  function stopColorAnimation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // 启动
  startColorAnimation(500);



})();