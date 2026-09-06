/**
 * Live2D 看板娘 - 简洁版
 * ============================================================
 * 使用方法：
 *   1. 在 _config.butterfly.yml 中配置 live2d.enable: true
 *   2. 修改 live2d.model 切换模型预设
 *   3. 添加新模型只需在 models 中添加预设
 * ============================================================
 *
 * 模型预设示例：
 *   live2d:
 *     enable: true
 *     model: 'luoxiaohei'  # 预设名称
 *
 * 添加新模型预设：
 *   live2d:
 *     models:
 *       mymodel:
 *         url: '/live2dw/assets/mymodel/model.json'
 *         width: 280
 *         height: 300
 */
(function () {
  'use strict';

  // ============================================================
  // 模型预设库 - 添加新模型只需在这里加一条
  // ============================================================
  const MODELS = {
    // 罗小黑 2023 (.moc3 格式)
    luoxiaohei: {
      url: '/live2dw/assets/luoxiaohei/罗小黑2023/model0.json',
      width: 280,
      height: 300,
      left: 0,
      bottom: 0,
      scale: 1.0
    },
    // 猫酱 hijiki (.moc 格式)
    hijiki: {
      url: '/live2dw/assets/hijiki.model.json',
      width: 150,
      height: 300,
      left: 0,
      bottom: 0,
      scale: 1.0
    }
    // --- 添加新模型预设 ---
    // 格式：
    // 预设名称: {
    //   url: '/live2dw/assets/你的模型路径/model.json',
    //   width: 280,     // 容器宽度
    //   height: 300,    // 容器高度
    //   left: 0,        // 距离屏幕左边
    //   bottom: 0,      // 距离屏幕底部
    //   scale: 1.0      // 额外缩放
    // }
  };

  // ============================================================
  // 配置
  // ============================================================
  const CONFIG = {
    // 当前使用的模型预设名称
    activeModel: 'luoxiaohei',

    // vendor 路径（本地依赖，一般不需要修改）
    vendor: {
      pixi: '/live2dw/live2d/vendor/pixi.min.js',
      cubismCore: '/live2dw/live2d/vendor/live2dcubismcore.min.js',
      display: '/live2dw/live2d/vendor/cubism4.min.js'
    },

    // 旧版 L2Dwidget 路径
    l2dwidget: {
      js: '/live2dw/lib/L2Dwidget.min.js'
    }
  };

  // 从博客配置读取（如果存在）
  if (window.live2dConfig) {
    if (window.live2dConfig.model) CONFIG.activeModel = window.live2dConfig.model;
    if (window.live2dConfig.models) Object.assign(MODELS, window.live2dConfig.models);
    if (window.live2dConfig.vendor) Object.assign(CONFIG.vendor, window.live2dConfig.vendor);
  }

  // ============================================================
  // 状态
  // ============================================================
  let pixiApp = null;
  let live2dModel = null;
  let isLoading = false;
  let isInitialized = false;

  // ============================================================
  // 工具函数
  // ============================================================
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ============================================================
  // 检测模型类型
  // ============================================================
  function getModelType(url) {
    if (url.endsWith('.moc3')) return 'new';   // Cubism 3/4
    if (url.endsWith('.moc') || url.includes('.model.json')) return 'old';  // Cubism 2.0
    return 'new'; // 默认新版
  }

  // ============================================================
  // 初始化 PIXI（仅 .moc3 需要）
  // ============================================================
  function initPixi() {
    return new Promise(function (resolve, reject) {
      if (isInitialized) { resolve(); return; }
      loadScript(CONFIG.vendor.pixi)
        .then(function () { return loadScript(CONFIG.vendor.cubismCore); })
        .then(function () { return loadScript(CONFIG.vendor.display); })
        .then(function () { isInitialized = true; resolve(); })
        .catch(reject);
    });
  }

  // ============================================================
  // 加载旧版模型 (.moc) - 使用 L2Dwidget
  // ============================================================
  function loadOldModel(modelCfg) {
    // 清理 PIXI
    if (pixiApp) {
      pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
      pixiApp = null;
      live2dModel = null;
    }
    var container = document.getElementById('l2d-widget-container');
    if (container) container.innerHTML = '';

    // 确保 L2Dwidget 已加载
    function startL2D() {
      if (window.L2Dwidget) {
        window.L2Dwidget.init({
          tagMode: false,
          debug: false,
          model: { jsonPath: modelCfg.url },
          display: {
            position: 'left',
            width: modelCfg.width,
            height: modelCfg.height,
            hOffset: modelCfg.left,
            vOffset: -modelCfg.bottom
          },
          mobile: { show: true },
          log: false,
          pluginJsPath: 'lib/',
          pluginModelPath: 'assets/',
          pluginRootPath: 'live2dw/'
        });
      }
    }

    if (window.L2Dwidget) {
      startL2D();
    } else {
      loadScript(CONFIG.l2dwidget.js).then(startL2D);
    }
  }

  // ============================================================
  // 加载新版模型 (.moc3) - 使用 PIXI + pixi-live2d-display
  // ============================================================
  function loadNewModel(modelCfg) {
    return new Promise(function (resolve, reject) {
      if (isLoading) return;
      isLoading = true;

      // 隐藏旧版
      var oldWidget = document.getElementById('live2d-widget');
      if (oldWidget) oldWidget.style.display = 'none';
      var oldCanvas = document.getElementById('live2dcanvas');
      if (oldCanvas) oldCanvas.style.display = 'none';

      initPixi().then(function () {
        var container = document.getElementById('l2d-widget-container');

        // 清理旧模型
        if (pixiApp) {
          pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
          pixiApp = null;
          live2dModel = null;
          if (container) container.innerHTML = '';
        }

        // 创建 PIXI 应用
        pixiApp = new PIXI.Application({
          view: document.createElement('canvas'),
          width: modelCfg.width,
          height: modelCfg.height,
          transparent: true,
          antialias: true,
          autoStart: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        });

        container.appendChild(pixiApp.view);

        // 加载模型
        PIXI.live2d.Live2DModel.from(modelCfg.url, { autoInteract: true }).then(function (model) {
          model.x = modelCfg.width / 2;
          model.y = modelCfg.height / 2;
          model.anchor.set(0.5, 0.5);

          var scale = Math.min(
            modelCfg.width / model.width,
            modelCfg.height / model.height
          ) * 0.9 * (modelCfg.scale || 1.0);
          model.scale.set(scale);

          pixiApp.stage.addChild(model);
          live2dModel = model;
          isLoading = false;
          resolve(model);
        }).catch(function (err) {
          isLoading = false;
          reject(err);
        });
      }).catch(function (err) {
        isLoading = false;
        reject(err);
      });
    });
  }

  // ============================================================
  // 加载指定模型
  // ============================================================
  function loadModel(name) {
    var modelCfg = MODELS[name];
    if (!modelCfg) {
      console.error('[Live2D] 模型预设 "' + name + '" 不存在，可用预设:', Object.keys(MODELS));
      return;
    }

    var type = getModelType(modelCfg.url);
    if (type === 'old') {
      loadOldModel(modelCfg);
    } else {
      loadNewModel(modelCfg);
    }
  }

  // ============================================================
  // 主入口
  // ============================================================
  function init() {
    // 创建容器
    var div = document.createElement('div');
    div.id = 'l2d-widget-container';
    div.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;' +
      'left:' + (MODELS[CONFIG.activeModel]?.left || 0) + 'px;' +
      'bottom:' + (MODELS[CONFIG.activeModel]?.bottom || 0) + 'px;' +
      'width:' + (MODELS[CONFIG.activeModel]?.width || 280) + 'px;' +
      'height:' + (MODELS[CONFIG.activeModel]?.height || 300) + 'px;';
    document.body.appendChild(div);

    loadModel(CONFIG.activeModel);
  }

  // ============================================================
  // 启动
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================================
  // 暴露接口
  // ============================================================
  window.L2DwidgetLive = {
    // 加载指定模型
    load: loadModel,
    // 重新加载当前模型
    reload: init,
    // 所有可用模型
    models: Object.keys(MODELS),
    // 当前模型
    current: CONFIG.activeModel
  };
})();
