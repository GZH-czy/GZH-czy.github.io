/**
 * Live2D Widget - 模型切换看板娘
 * 支持 Cubism 2.0 (.moc) 和 Cubism 3/4 (.moc3) 格式
 * 交互：鼠标进入模型区域 → 环绕功能按钮 → 点击切换
 */
(function () {
  'use strict';

  // ============================================================
  // 配置区域 - 可以自由调整模型位置和大小
  // ============================================================
  const CONFIG = {
    // --- 模型容器位置 ---
    // 距离屏幕左边的距离（像素）
    positionLeft: 0,
    // 距离屏幕底部的距离（像素）
    // 注意：这个值要足够大，确保按钮在视口内
    positionBottom: 100,

    // --- 模型容器尺寸 ---
    // 容器宽度（像素）
    containerWidth: 280,
    // 容器高度（像素）
    containerHeight: 300,

    // --- 模型缩放 ---
    // 模型缩放比例（1 = 原始大小，0.5 = 一半，2 = 两倍）
    // 注意：这个是在自适应缩放基础上的额外缩放
    modelScaleExtra: 1.0,

    // --- 按钮样式 ---
    // 按钮大小（像素）
    buttonSize: 36,

    // --- 移动端适配 ---
    mobile: {
      containerWidth: 180,
      containerHeight: 200,
      positionBottom: 80,
      buttonSize: 32
    }
  };

  // ============================================================
  // 模型配置
  // ============================================================
  const MODELS = {
    hijiki: {
      name: 'hijiki',
      title: '猫酱',
      jsonPath: '/live2dw/assets/hijiki.model.json',
      type: 'old' // 旧版 .moc 格式
    },
    luoxiaohei: {
      name: 'luoxiaohei',
      title: '罗小黑',
      jsonPath: '/live2dw/assets/luoxiaohei/罗小黑2023/model0.json',
      type: 'new' // 新版 .moc3 格式
    }
  };

  // ============================================================
  // 功能按钮配置 - 预留接口，可添加更多功能
  // ============================================================
  const FUNCTION_BUTTONS = [
    {
      id: 'switch-model',
      icon: '🔄',
      title: '切换模型',
      action: 'switchModel'
    },
    {
      id: 'close-model',
      icon: '✕',
      title: '关闭模型',
      action: 'closeModel'
    },
    // --- 在这里添加更多功能按钮 ---
    // 示例：
    // { id: 'change-pose', icon: '💃', title: '换姿势', action: 'changePose' },
    // { id: 'screenshot', icon: '📷', title: '截图', action: 'screenshot' },
    // { id: 'hide-model', icon: '👁️', title: '隐藏', action: 'hideModel' },
  ];

  // ============================================================
  // 内部状态
  // ============================================================
  let currentModel = null;
  let pixiApp = null;
  let live2dModel = null;
  let widgetContainer = null;
  let isInitialized = false;
  let isMenuOpen = false;
  let isHovering = false;
  let hideMenuTimer = null;

  // ============================================================
  // DOM 创建
  // ============================================================
  function createWidgetDOM() {
    if (document.getElementById('l2d-widget')) return;

    // 检测是否为移动端
    const isMobile = window.innerWidth <= 768;
    const cfg = isMobile ? CONFIG.mobile : CONFIG;

    widgetContainer = document.createElement('div');
    widgetContainer.id = 'l2d-widget';
    widgetContainer.innerHTML =
      '<style>' +
      // --- 主容器 ---
      '#l2d-container{position:fixed;z-index:9999;pointer-events:none;' +
        'left:' + CONFIG.positionLeft + 'px;' +
        'bottom:' + CONFIG.positionBottom + 'px;' +
        'width:' + CONFIG.containerWidth + 'px;' +
        'height:' + CONFIG.containerHeight + 'px;' +
        'transition:all 0.3s ease;' +
        'overflow:visible;' +
      '}' +
      '#l2d-container canvas{width:100%!important;height:100%!important;pointer-events:auto}' +

      // --- 功能按钮容器（环绕模型） ---
      '#l2d-menu{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;opacity:0;transition:all 0.4s cubic-bezier(0.68,-0.55,0.265,1.55)}' +
      '#l2d-menu.show{opacity:1}' +

      // --- 功能按钮 ---
      '#l2d-menu .l2d-btn{position:absolute;width:' + CONFIG.buttonSize + 'px;height:' + CONFIG.buttonSize + 'px;border-radius:50%;background:rgba(255,255,255,0.95);border:2px solid rgba(255,182,193,0.8);box-shadow:0 4px 15px rgba(0,0,0,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:' + (CONFIG.buttonSize * 0.5) + 'px;transition:all 0.3s cubic-bezier(0.68,-0.55,0.265,1.55);pointer-events:auto;transform:translate(-50%,-50%) scale(0)}' +
      '#l2d-menu.show .l2d-btn{transform:translate(-50%,-50%) scale(1)}' +
      '#l2d-menu .l2d-btn:hover{transform:translate(-50%,-50%) scale(1.15)!important;background:rgba(255,182,193,0.95);box-shadow:0 6px 20px rgba(255,182,193,0.4)}' +
      '#l2d-menu .l2d-btn:active{transform:translate(-50%,-50%) scale(0.95)!important}' +

      // --- 模型区域悬停检测 ---
      // z-index要高于旧版L2Dwidget的canvas(z-index通常是9999)
      '#l2d-hover-area{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:10001}' +

      // --- 移动端适配 ---
      '@media (max-width:768px){' +
        '#l2d-container{width:' + cfg.containerWidth + 'px;height:' + cfg.containerHeight + 'px}' +
        '#l2d-menu .l2d-btn{width:' + cfg.buttonSize + 'px;height:' + cfg.buttonSize + 'px;font-size:' + (cfg.buttonSize * 0.5) + 'px}' +
      '}' +
      '</style>' +
      '<div id="l2d-container">' +
        '<div id="l2d-hover-area"></div>' +
        '<div id="l2d-menu"></div>' +
      '</div>';

    document.body.appendChild(widgetContainer);

    // 创建功能按钮
    createFunctionButtons();

    // 绑定事件
    bindEvents();
  }

  // ============================================================
  // 重新创建功能按钮（响应式更新）
  // ============================================================
  function recreateFunctionButtons() {
    var menu = document.getElementById('l2d-menu');
    if (menu) menu.innerHTML = '';
    createFunctionButtons();
  }

  // ============================================================
  // 创建功能按钮（纵向排列在模型右侧）
  // ============================================================
  function createFunctionButtons() {
    const menu = document.getElementById('l2d-menu');
    const isMobile = window.innerWidth <= 768;
    const buttonSize = isMobile ? CONFIG.mobile.buttonSize : CONFIG.buttonSize;
    const gap = 8; // 按钮间距
    const buttonCount = FUNCTION_BUTTONS.length;
    const containerWidth = isMobile ? CONFIG.mobile.containerWidth : CONFIG.containerWidth;

    // 计算总高度，垂直居中排列
    const totalHeight = buttonCount * buttonSize + (buttonCount - 1) * gap;
    const startY = -totalHeight / 2; // 从中心向上偏移一半高度
    const x = containerWidth - buttonSize / 2 + 2; // 在容器右侧（距离模型更近）

    FUNCTION_BUTTONS.forEach(function (btn, index) {
      // 纵向排列：在模型右侧
      const y = startY + index * (buttonSize + gap);

      const btnEl = document.createElement('button');
      btnEl.className = 'l2d-btn';
      btnEl.id = 'l2d-btn-' + btn.id;
      btnEl.innerHTML = btn.icon;
      btnEl.title = btn.title;
      btnEl.style.left = x + 'px';
      btnEl.style.top = y + 'px';
      // 错开动画延迟
      btnEl.style.transitionDelay = (index * 0.05) + 's';

      btnEl.addEventListener('click', function () {
        handleButtonAction(btn.action, btn);
      });

      menu.appendChild(btnEl);
    });
  }

  // ============================================================
  // 按钮动作处理
  // ============================================================
  function handleButtonAction(action, btn) {
    switch (action) {
      case 'switchModel':
        switchToNextModel();
        break;
      case 'closeModel':
        closeModel();
        break;
      // --- 在这里添加更多功能处理 ---
      // case 'changePose':
      //   changePose();
      //   break;
      // case 'screenshot':
      //   takeScreenshot();
      //   break;
      default:
        console.log('[L2D Widget] Unknown action:', action);
    }
  }

  // 关闭模型（刷新页面恢复）
  function closeModel() {
    hideMenu();
    hideOldWidget();

    // 隐藏 PIXI canvas
    var canvas = document.querySelector('#l2d-container canvas');
    if (canvas) canvas.style.display = 'none';

    // 隐藏 hover area（不再触发菜单）
    var hoverArea = document.getElementById('l2d-hover-area');
    if (hoverArea) hoverArea.style.display = 'none';

    // 隐藏容器
    var container = document.getElementById('l2d-container');
    if (container) container.style.display = 'none';

    localStorage.setItem('l2d-widget-closed', 'true');
    showSnackbar('模型已隐藏，刷新页面恢复');
  }

  // ============================================================
  // 事件绑定
  // ============================================================
  function bindEvents() {
    const hoverArea = document.getElementById('l2d-hover-area');
    const menu = document.getElementById('l2d-menu');
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // 移动端：点击切换显示/隐藏
      hoverArea.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isMenuOpen) {
          hideMenu();
        } else {
          showMenu();
        }
      });

      // 点击菜单按钮后自动隐藏菜单
      menu.addEventListener('click', function () {
        scheduleHideMenu();
      });

      // 点击页面其他地方关闭菜单
      document.addEventListener('click', function () {
        hideMenu();
      });
    } else {
      // 桌面端：悬停显示
      hoverArea.addEventListener('mouseenter', function () {
        isHovering = true;
        showMenu();
      });

      hoverArea.addEventListener('mouseleave', function () {
        isHovering = false;
        scheduleHideMenu();
      });

      menu.addEventListener('mouseenter', function () {
        cancelHideMenu();
      });

      menu.addEventListener('mouseleave', function () {
        if (!isHovering) {
          scheduleHideMenu();
        }
      });
    }
  }

  // ============================================================
  // 菜单显示/隐藏
  // ============================================================
  function showMenu() {
    cancelHideMenu();
    const menu = document.getElementById('l2d-menu');
    menu.classList.add('show');
    isMenuOpen = true;
  }

  function hideMenu() {
    const menu = document.getElementById('l2d-menu');
    menu.classList.remove('show');
    isMenuOpen = false;
  }

  function scheduleHideMenu() {
    cancelHideMenu();
    hideMenuTimer = setTimeout(function () {
      hideMenu();
    }, 800);
  }

  function cancelHideMenu() {
    if (hideMenuTimer) {
      clearTimeout(hideMenuTimer);
      hideMenuTimer = null;
    }
  }

  // ============================================================
  // 脚本加载
  // ============================================================
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ============================================================
  // 旧版看板娘控制
  // ============================================================
  function hideOldWidget() {
    var oldWidget = document.getElementById('live2d-widget');
    if (oldWidget) oldWidget.style.display = 'none';
    var oldCanvas = document.getElementById('live2dcanvas');
    if (oldCanvas) oldCanvas.style.display = 'none';
    // 同时隐藏旧版容器
    var oldContainer = document.querySelector('.live2d-container');
    if (oldContainer) oldContainer.style.display = 'none';
  }

  function showOldWidget() {
    var oldWidget = document.getElementById('live2d-widget');
    if (oldWidget) oldWidget.style.display = '';
    var oldCanvas = document.getElementById('live2dcanvas');
    if (oldCanvas) oldCanvas.style.display = '';
    var oldContainer = document.querySelector('.live2d-container');
    if (oldContainer) oldContainer.style.display = '';
  }

  // 持续监控并隐藏旧版看板娘（防止hexo helper重新初始化）
  function watchOldWidget() {
    // 使用 MutationObserver 监控 DOM 变化
    var observer = new MutationObserver(function (mutations) {
      if (currentModel && currentModel.type === 'new') {
        hideOldWidget();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ============================================================
  // PIXI 初始化 (Cubism 4 for .moc3 models)
  // ============================================================
  function initPixi() {
    return new Promise(function (resolve, reject) {
      if (isInitialized) {
        resolve();
        return;
      }
      loadScript('/live2dw/lib/vendor/pixi.min.js')
        .then(function () {
          return loadScript('/live2dw/lib/vendor/live2dcubismcore.min.js');
        })
        .then(function () {
          return loadScript('/live2dw/lib/vendor/cubism4.min.js');
        })
        .then(function () {
          isInitialized = true;
          resolve();
        })
        .catch(reject);
    });
  }

  // ============================================================
  // 加载新版模型 (.moc3)
  // ============================================================
  function loadNewModel(modelConfig) {
    return new Promise(function (resolve, reject) {
      initPixi().then(function () {
        var container = document.getElementById('l2d-container');

        // 清理旧的 PIXI 模型
        if (pixiApp) {
          pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
          pixiApp = null;
          live2dModel = null;
          // 保留 hover-area 和 menu，只清理 canvas
          var oldCanvas = container.querySelector('canvas');
          if (oldCanvas) oldCanvas.remove();
        }

        // 创建 PIXI 应用
        pixiApp = new PIXI.Application({
          view: document.createElement('canvas'),
          width: CONFIG.containerWidth,
          height: CONFIG.containerHeight,
          transparent: true,
          antialias: true,
          autoStart: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        });

        // 插入 canvas（在 hover-area 之后）
        var hoverArea = document.getElementById('l2d-hover-area');
        container.insertBefore(pixiApp.view, hoverArea.nextSibling);

        // 加载模型
        PIXI.live2d.Live2DModel.from(modelConfig.jsonPath, {
          autoInteract: true
        }).then(function (model) {
          // 设置模型位置和大小
          model.x = pixiApp.view.width / 2;
          model.y = pixiApp.view.height / 2;
          model.anchor.set(0.5, 0.5);

          // 缩放模型以适应画布
          var scale = Math.min(
            pixiApp.view.width / model.width,
            pixiApp.view.height / model.height
          ) * 0.9 * CONFIG.modelScaleExtra;
          model.scale.set(scale);

          // 添加到舞台
          pixiApp.stage.addChild(model);
          live2dModel = model;

          resolve(model);
        }).catch(reject);
      }).catch(reject);
    });
  }

  // ============================================================
  // 加载旧版模型 (.moc)
  // ============================================================
  function loadOldModel(modelConfig) {
    if (pixiApp) {
      pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
      pixiApp = null;
      live2dModel = null;
      var oldCanvas = document.querySelector('#l2d-container canvas');
      if (oldCanvas) oldCanvas.remove();
    }
    showOldWidget();
  }

  // ============================================================
  // 切换模型
  // ============================================================
  function switchModel(modelName) {
    currentModel = MODELS[modelName];
    if (!currentModel) return;

    if (currentModel.type === 'new') {
      hideOldWidget();
      loadNewModel(currentModel);
    } else {
      loadOldModel(currentModel);
    }

    localStorage.setItem('l2d-current-model', modelName);
  }

  // 切换到下一个模型
  function switchToNextModel() {
    var modelNames = Object.keys(MODELS);
    var currentIndex = modelNames.indexOf(currentModel?.name || 'hijiki');
    var nextIndex = (currentIndex + 1) % modelNames.length;
    var nextModel = modelNames[nextIndex];

    switchModel(nextModel);

    // 显示 snackbar 提示
    showSnackbar('已切换到 ' + MODELS[nextModel].title);
  }

  // ============================================================
  // Snackbar 提示
  // ============================================================
  function showSnackbar(msg) {
    if (typeof btf !== 'undefined' && btf.snackbarShow) {
      btf.snackbarShow(msg);
    } else {
      // 降级方案：创建简单的 toast
      var toast = document.createElement('div');
      toast.textContent = msg;
      toast.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:10px 20px;border-radius:20px;z-index:99999;font-size:14px;animation:l2d-fade-in-up 0.3s ease;';
      document.body.appendChild(toast);
      setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function () { toast.remove(); }, 300);
      }, 2000);
    }
  }

  // ============================================================
  // 添加 snackbar 动画样式
  // ============================================================
  function addSnackbarStyles() {
    if (document.getElementById('l2d-snackbar-style')) return;
    var style = document.createElement('style');
    style.id = 'l2d-snackbar-style';
    style.textContent = '@keyframes l2d-fade-in-up{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(style);
  }

  // ============================================================
  // 初始化
  // ============================================================
  function init() {
    createWidgetDOM();
    addSnackbarStyles();

    // 启动监控，防止旧版看板娘重新出现
    watchOldWidget();

    // 检查是否被用户关闭过
    var wasClosed = localStorage.getItem('l2d-widget-closed') === 'true';

    // 先隐藏旧版看板娘（防止闪烁）
    hideOldWidget();

    if (wasClosed) {
      // 如果之前关闭了，隐藏模型区域（刷新页面恢复）
      var container = document.getElementById('l2d-container');
      if (container) container.style.display = 'none';
    } else {
      // 正常加载模型
      var savedModel = localStorage.getItem('l2d-current-model') || 'hijiki';
      switchModel(savedModel);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================================
  // 暴露全局接口
  // ============================================================
  window.L2DwidgetSwitch = {
    switchModel: switchModel,
    switchToNextModel: switchToNextModel,
    showMenu: showMenu,
    hideMenu: hideMenu,
    MODELS: MODELS,
    CONFIG: CONFIG
  };
})();
