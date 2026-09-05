/**
 * 罗小黑2023 Live2D Widget
 * 使用 pixi-live2d-display 支持 Cubism 3/4 (.moc3) 格式
 * 支持模型切换：hijiki (.moc) ↔ 罗小黑 (.moc3)
 */
(function () {
  'use strict';

  // 模型配置
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

  let currentModel = null;
  let pixiApp = null;
  let live2dModel = null;
  let widgetContainer = null;
  let isInitialized = false;

  // 创建 Widget DOM
  function createWidgetDOM() {
    // 检查是否已存在
    if (document.getElementById('luoxiaohei-widget')) {
      return;
    }

    // 主容器
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'luoxiaohei-widget';
    widgetContainer.innerHTML =
      '<style>' +
      '#l2d-container{position:fixed;left:0;bottom:0;width:280px;height:400px;z-index:9999;pointer-events:none}' +
      '#l2d-container canvas{width:100%!important;height:100%!important;pointer-events:auto}' +
      '#l2d-switch-btn{position:fixed;left:10px;bottom:410px;z-index:10000;background:rgba(255,182,193,0.9);border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:18px;box-shadow:0 2px 10px rgba(0,0,0,0.2);transition:all 0.3s;display:flex;align-items:center;justify-content:center}' +
      '#l2d-switch-btn:hover{transform:scale(1.1);box-shadow:0 4px 15px rgba(0,0,0,0.3)}' +
      '#l2d-switch-panel{position:fixed;left:60px;bottom:410px;z-index:10000;background:rgba(255,255,255,0.95);border-radius:12px;padding:10px;box-shadow:0 4px 20px rgba(0,0,0,0.15);display:none;min-width:120px}' +
      '#l2d-switch-panel.show{display:block}' +
      '#l2d-switch-panel .switch-item{padding:8px 16px;cursor:pointer;border-radius:8px;transition:all 0.2s;display:flex;align-items:center;gap:8px;font-size:14px;color:#333}' +
      '#l2d-switch-panel .switch-item:hover{background:rgba(255,182,193,0.3)}' +
      '#l2d-switch-panel .switch-item.active{background:rgba(255,182,193,0.5);font-weight:bold}' +
      '#l2d-switch-panel .switch-item .icon{font-size:20px}' +
      '@media (max-width:768px){' +
      '#l2d-container{width:200px;height:280px}' +
      '#l2d-switch-btn{bottom:290px}' +
      '#l2d-switch-panel{bottom:290px}' +
      '}' +
      '</style>' +
      '<div id="l2d-container"></div>' +
      '<button id="l2d-switch-btn" title="切换模型">🐱</button>' +
      '<div id="l2d-switch-panel">' +
      '<div class="switch-item active" data-model="hijiki"><span class="icon">🐱</span><span>猫酱</span></div>' +
      '<div class="switch-item" data-model="luoxiaohei"><span class="icon">🐾</span><span>罗小黑</span></div>' +
      '</div>';

    document.body.appendChild(widgetContainer);

    // 绑定切换按钮事件
    var switchBtn = document.getElementById('l2d-switch-btn');
    var switchPanel = document.getElementById('l2d-switch-panel');
    var switchItems = document.querySelectorAll('.switch-item');

    switchBtn.addEventListener('click', function () {
      switchPanel.classList.toggle('show');
    });

    for (var i = 0; i < switchItems.length; i++) {
      (function (item) {
        item.addEventListener('click', function () {
          var modelName = this.dataset.model;
          switchModel(modelName);
          switchPanel.classList.remove('show');
          // 更新选中状态
          var items = document.querySelectorAll('.switch-item');
          for (var j = 0; j < items.length; j++) {
            items[j].classList.remove('active');
          }
          this.classList.add('active');
        });
      })(switchItems[i]);
    }

    // 点击其他地方关闭面板
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#l2d-switch-btn') && !e.target.closest('#l2d-switch-panel')) {
        switchPanel.classList.remove('show');
      }
    });
  }

  // 加载脚本
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 隐藏旧的看板娘
  function hideOldWidget() {
    var oldWidget = document.getElementById('live2d-widget');
    if (oldWidget) oldWidget.style.display = 'none';
    var oldCanvas = document.getElementById('live2dcanvas');
    if (oldCanvas) oldCanvas.style.display = 'none';
  }

  // 显示旧的看板娘
  function showOldWidget() {
    var oldWidget = document.getElementById('live2d-widget');
    if (oldWidget) oldWidget.style.display = '';
    var oldCanvas = document.getElementById('live2dcanvas');
    if (oldCanvas) oldCanvas.style.display = '';
  }

  // 初始化 PIXI 和 Live2d Display (Cubism 4 for .moc3 models)
  function initPixi() {
    return new Promise(function (resolve, reject) {
      if (isInitialized) {
        resolve();
        return;
      }
      // Load local vendor libraries (faster & more reliable than CDN)
      loadScript('/live2dw/lib/vendor/pixi.min.js')
        .then(function () {
          return loadScript('/live2dw/lib/vendor/live2dcubismcore.min.js');
        })
        .then(function () {
          return loadScript('/live2dw/lib/vendor/live2d-display.min.js');
        })
        .then(function () {
          isInitialized = true;
          resolve();
        })
        .catch(reject);
    });
  }

  // 加载新版模型 (.moc3)
  function loadNewModel(modelConfig) {
    return new Promise(function (resolve, reject) {
      initPixi().then(function () {
        var container = document.getElementById('l2d-container');

        // 清理旧的 PIXI 模型
        if (pixiApp) {
          pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
          pixiApp = null;
          live2dModel = null;
          container.innerHTML = '';
        }

        // 创建 PIXI 应用
        pixiApp = new PIXI.Application({
          view: document.createElement('canvas'),
          width: 280,
          height: 400,
          transparent: true,
          antialias: true,
          autoStart: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        });

        container.appendChild(pixiApp.view);

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
          ) * 0.9;
          model.scale.set(scale);

          // 添加到舞台
          pixiApp.stage.addChild(model);
          live2dModel = model;

          resolve(model);
        }).catch(reject);
      }).catch(reject);
    });
  }

  // 加载旧版模型 (.moc) - 使用旧版 L2Dwidget
  function loadOldModel(modelConfig) {
    // 清理 PIXI
    if (pixiApp) {
      pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
      pixiApp = null;
      live2dModel = null;
      var container = document.getElementById('l2d-container');
      if (container) container.innerHTML = '';
    }

    // 显示旧的看板娘
    showOldWidget();
  }

  // 切换模型
  function switchModel(modelName) {
    currentModel = MODELS[modelName];
    if (!currentModel) return;

    if (currentModel.type === 'new') {
      hideOldWidget();
      loadNewModel(currentModel);
    } else {
      loadOldModel(currentModel);
    }

    // 更新按钮图标
    var switchBtn = document.getElementById('l2d-switch-btn');
    if (switchBtn) {
      switchBtn.innerHTML = modelName === 'luoxiaohei' ? '🐾' : '🐱';
    }

    // 保存用户偏好
    localStorage.setItem('l2d-current-model', modelName);
  }

  // 初始化
  function init() {
    createWidgetDOM();
    hideOldWidget();

    // 读取用户上次选择的模型
    var savedModel = localStorage.getItem('l2d-current-model') || 'hijiki';

    // 更新切换面板的选中状态
    var switchItems = document.querySelectorAll('.switch-item');
    for (var i = 0; i < switchItems.length; i++) {
      switchItems[i].classList.toggle('active', switchItems[i].dataset.model === savedModel);
    }

    switchModel(savedModel);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露全局接口
  window.L2DwidgetSwitch = {
    switchModel: switchModel,
    MODELS: MODELS
  };
})();
