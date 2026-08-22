'use strict';

/**
 * @chizhiying1/rightmenu
 * 右键菜单插件 - 基于 zhheo/JS-Heo 二次开发
 * 新增功能：复制文本、复制链接、打开链接、复制图片、打开图片、下载图片、粘贴文本
 * 暴露 API 接口以便扩展新功能
 */

let kk = {};

// ==================== 配置项（可扩展） ====================
const CONFIG = {
  // 调试模式
  debug: false,
  // 自定义 API 接口（供外部扩展）
  api: {
    // 随机跳转函数（由外部注入）
    randomPost: null,
    // 自定义复制回调
    onCopy: null,
    // 自定义下载回调
    onDownload: null,
  }
};

// ==================== 核心 API（暴露给外部） ====================

/**
 * 注册自定义 API
 * @param {Object} apis - 要注册的 API 对象
 * @example
 * rightmenu.register({
 *   randomPost: () => { window.location.href = '/random' },
 *   onCopy: (text) => { console.log('复制了:', text) }
 * })
 */
kk.register = function(apis) {
  Object.assign(CONFIG.api, apis);
};

/**
 * 显示/隐藏右键菜单
 * @param {boolean} isTrue - 是否显示
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 */
kk.showRightMenu = function(isTrue, x = 0, y = 0) {
  let $rightMenu = $('#rightMenu');
  if (isTrue) {
    // 如果正在关闭动画，立即结束它
    if ($rightMenu.hasClass('rightmenu-closing')) {
      $rightMenu.off('animationend');
      $rightMenu.hide().removeClass('rightmenu-closing');
    }
    if ($rightMenu.hasClass('rightmenu-visible')) {
      // 已显示：先关闭动画 → 再定位 → 再打开
      $rightMenu.removeClass('rightmenu-visible').addClass('rightmenu-closing');
      $rightMenu.one('animationend', function() {
        $rightMenu.hide().removeClass('rightmenu-closing');
        $rightMenu.css('top', x + 'px').css('left', y + 'px');
        void $rightMenu[0].offsetWidth;
        $rightMenu.show().addClass('rightmenu-visible');
      });
    } else {
      $rightMenu.css('top', x + 'px').css('left', y + 'px');
      $rightMenu.show().addClass('rightmenu-visible');
    }
  } else {
    $rightMenu.hide().removeClass('rightmenu-visible').removeClass('rightmenu-closing');
  }
};

/**
 * 隐藏右键菜单
 */
kk.hideRightMenu = function() {
  let $rightMenu = $('#rightMenu');
  if ($rightMenu.hasClass('rightmenu-visible') && $rightMenu.css('display') !== 'none') {
    $rightMenu.removeClass('rightmenu-visible').addClass('rightmenu-closing');
    $rightMenu.one('animationend', function() {
      $rightMenu.hide().removeClass('rightmenu-closing');
      let mask = document.getElementById('rightmenu-mask');
      if (mask) mask.style.display = 'none';
    });
  } else {
    $rightMenu.hide().removeClass('rightmenu-visible').removeClass('rightmenu-closing');
    let mask = document.getElementById('rightmenu-mask');
    if (mask) mask.style.display = 'none';
  }
};

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @param {string} successMsg - 成功提示
 */
kk.copyText = function(text, successMsg = '已复制') {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      kk.snackbarShow(successMsg);
      if (CONFIG.api.onCopy) CONFIG.api.onCopy(text);
    }).catch(() => {
      kk.fallbackCopy(text, successMsg);
    });
  } else {
    kk.fallbackCopy(text, successMsg);
  }
};

/**
 * 下载图片
 * @param {string} url - 图片 URL
 */
kk.downloadImage = function(url) {
  if (!url) return;
  if (CONFIG.api.onDownload) {
    CONFIG.api.onDownload(url);
    return;
  }
  let filename = url.split('/').pop().split('?')[0] || 'image';

  // 同源图片：直接下载
  if (!url.startsWith('http') || url.startsWith(location.origin)) {
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    kk.snackbarShow('已开始下载图片');
    return;
  }

  // 跨域图片：fetch + blob
  fetch(url, { mode: 'cors' })
    .then(r => {
      if (!r.ok) throw new Error('跨域受限');
      return r.blob();
    })
    .then(blob => {
      let blobUrl = URL.createObjectURL(blob);
      let a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      kk.snackbarShow('已开始下载图片');
    })
    .catch(() => {
      // canvas 中转
      let img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        let canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(function(blob) {
          let blobUrl = URL.createObjectURL(blob);
          let a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          kk.snackbarShow('已开始下载图片');
        });
      };
      img.onerror = function() {
        window.open(url, '_blank');
        kk.snackbarShow('图片受保护无法下载，已在新标签打开');
      };
      img.src = url;
    });
};

/**
 * Snackbar 提示
 * @param {string} msg - 提示消息
 */
kk.snackbarShow = function(msg) {
  if (typeof btf !== 'undefined' && btf.snackbarShow) {
    btf.snackbarShow(msg);
  } else {
    let toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:8px;z-index:9999;font-size:14px;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
};

/**
 * 暗色模式切换
 */
kk.switchDarkMode = function() {
  kk.hideRightMenu();
  const nowMode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  if (nowMode === 'light') {
    if (typeof activateDarkMode === 'function') activateDarkMode();
    else document.documentElement.setAttribute('data-theme', 'dark');
    if (typeof saveToLocal !== 'undefined') saveToLocal.set('theme', 'dark', 2);
    GLOBAL_CONFIG.Snackbar !== undefined && typeof btf !== 'undefined' && btf.snackbarShow(GLOBAL_CONFIG.Snackbar.day_to_night);
  } else {
    if (typeof activateLightMode === 'function') activateLightMode();
    else document.documentElement.setAttribute('data-theme', 'light');
    if (typeof saveToLocal !== 'undefined') saveToLocal.set('theme', 'light', 2);
    GLOBAL_CONFIG.Snackbar !== undefined && typeof btf !== 'undefined' && btf.snackbarShow(GLOBAL_CONFIG.Snackbar.night_to_day);
  }
  typeof utterancesTheme === 'function' && utterancesTheme();
  typeof FB === 'object' && window.loadFBComment();
  window.DISQUS && document.getElementById('disqus_thread').children.length && setTimeout(() => window.disqusReset(), 200);
};

/**
 * 随机跳转
 */
kk.randomPost = function() {
  kk.hideRightMenu();
  if (CONFIG.api.randomPost) {
    CONFIG.api.randomPost();
  } else if (typeof toRandomPost === 'function') {
    toRandomPost();
  } else {
    window.location.href = window.location.origin;
  }
};

/**
 * 粘贴文本（兼容 input/textarea/contenteditable）
 */
kk.pasteText = function() {
  // 优先使用右键时保存的输入框引用
  let el = rmInputEl || document.activeElement;
  let isInput = el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT');
  let isContentEditable = el && el.isContentEditable;
  if (!el || (!isInput && !isContentEditable)) {
    kk.snackbarShow('请先点击输入框');
    return;
  }
  navigator.permissions
    .query({ name: 'clipboard-read' })
    .then(result => {
      if (result.state == 'granted' || result.state == 'prompt') {
        navigator.clipboard.readText().then(text => {
          if (isInput) {
            // 标准 input/textarea
            var startPos = el.selectionStart;
            var endPos = el.selectionEnd;
            el.value = el.value.substring(0, startPos) + text + el.value.substring(endPos, el.value.length);
            el.selectionStart = startPos + text.length;
            el.selectionEnd = startPos + text.length;
          } else if (isContentEditable) {
            // contenteditable 元素（如 Twikoo）
            document.execCommand('insertText', false, text);
          }
          kk.snackbarShow('已粘贴');
        }).catch(() => {
          kk.snackbarShow('剪贴板为空或无权访问');
        });
      } else {
        kk.snackbarShow('请允许读取剪贴板权限');
      }
    }).catch(() => {
      kk.snackbarShow('剪贴板访问失败');
    });
};

// ==================== 内部工具函数 ====================

function log(...args) {
  if (CONFIG.debug) console.log('[RightMenu]', ...args);
}

function fallbackCopy(text, successMsg) {
  let ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    kk.snackbarShow(successMsg);
    if (CONFIG.api.onCopy) CONFIG.api.onCopy(text);
  } catch (e) {
    kk.snackbarShow('复制失败，请手动复制');
  }
  document.body.removeChild(ta);
}

// ==================== 右键菜单上下文状态 ====================
let rmWidth = 0;
let rmHeight = 0;
let rmSelectedText = '';
let rmLinkUrl = '';
let rmImageUrl = '';
let rmIsInput = false;
let rmInputEl = null;  // 保存右键时的输入框引用
let globalEvent = null;

// ==================== 初始化 ====================
function init() {
  let rightMenuEl = document.getElementById('rightMenu');
  if (rightMenuEl) {
    // 临时显示以获取实际尺寸
    rightMenuEl.style.visibility = 'hidden';
    rightMenuEl.style.display = 'block';
    rmWidth = rightMenuEl.offsetWidth;
    rmHeight = rightMenuEl.offsetHeight;
    rightMenuEl.style.display = 'none';
    rightMenuEl.style.visibility = '';
  }
  log('initialized', { rmWidth, rmHeight });
}

// ==================== 右键菜单事件 ====================
$(document).ready(function() {
  init();

  // 使用 jQuery 绑定事件
  $(document).on('contextmenu', function(event) {
    // 检查用户是否关闭了自定义右键菜单（开启原生菜单）
    if (localStorage.getItem('rightmenu-disabled') === 'true') return;

    // Ctrl+右键 = 原生菜单
    if (event.ctrlKey) return;

    // 阻止原生菜单
    event.preventDefault();
    event.stopImmediatePropagation();

    // 保存全局事件引用
    globalEvent = event;

    // 重置状态
    rmSelectedText = window.getSelection().toString().trim();
    rmLinkUrl = '';
    rmImageUrl = '';
    rmIsInput = false;

    let target = event.target;

    // ===== 1. 检测输入框（兼容 contenteditable） =====
    let activeEl = document.activeElement;
    rmInputEl = null;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' ||
        target.closest('input') || target.closest('textarea') ||
        target.isContentEditable || activeEl.isContentEditable ||
        target.closest('[contenteditable="true"]')) {
      rmIsInput = true;
      // 保存输入框引用（优先 target，其次 activeElement）
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        rmInputEl = target;
      } else if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') {
        rmInputEl = activeEl;
      } else if (target.isContentEditable) {
        rmInputEl = target;
      } else if (activeEl.isContentEditable) {
        rmInputEl = activeEl;
      } else {
        rmInputEl = target.closest('input') || target.closest('textarea') || target.closest('[contenteditable="true"]');
      }
    }

    // ===== 2. 检测图片 =====
    let imgElement = target.tagName === 'IMG' ? target : target.closest('img');
    if (imgElement) {
      rmImageUrl = imgElement.src || imgElement.dataset.src || '';
    }

    // ===== 3. 检测链接 =====
    let linkElement = target.tagName === 'A' ? target : target.closest('a');
    if (linkElement && linkElement.href) {
      rmLinkUrl = linkElement.href;
    }

    // 如果选中文字在链接内，链接优先
    if (rmSelectedText && rmLinkUrl) {
      let selection = window.getSelection();
      if (selection.rangeCount > 0) {
        let range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        let parentLink = container.nodeType === 3 ? container.parentElement?.closest('a') : container.closest?.('a');
        if (parentLink) {
          rmSelectedText = '';
        }
      }
    }

    log('contextmenu', { rmLinkUrl, rmImageUrl, rmSelectedText, rmIsInput });

    // 根据上下文显示/隐藏菜单项
    toggleContextItems();

    let pageX = event.clientX + 10;
    let pageY = event.clientY;

    // 防止超出屏幕
    if (pageX + rmWidth > window.innerWidth) pageX -= rmWidth;
    if (pageY + rmHeight > window.innerHeight) pageY -= rmHeight;

    kk.showRightMenu(true, pageY, pageX);
    $('#rightmenu-mask').attr('style', 'display: flex');
  });

  // 点击遮罩关闭菜单
  $('#rightmenu-mask').on('click', kk.hideRightMenu);

  // ==================== 菜单项点击事件 ====================

  // 原有功能
  $('#menu-backward').on('click', function() { window.history.back(); kk.hideRightMenu(); });
  $('#menu-forward').on('click', function() { window.history.forward(); kk.hideRightMenu(); });
  $('#menu-refresh').on('click', function() { window.location.reload(); });
  $('#menu-darkmode').on('click', kk.switchDarkMode);
  $('#menu-home').on('click', function() { window.location.href = window.location.origin; kk.hideRightMenu(); });
  $('#menu-translate').on('click', function() {
    kk.hideRightMenu();
    if (typeof translateInitialization === 'function') translateInitialization();
  });

  // 新功能：复制选中文字
  $('#menu-copy-text').on('click', function() {
    kk.hideRightMenu();
    kk.copyText(rmSelectedText, '已复制选中文字');
  });

  // 新功能：复制链接
  $('#menu-copy-link').on('click', function() {
    kk.hideRightMenu();
    kk.copyText(rmLinkUrl, '已复制链接');
  });

  // 新功能：打开链接
  $('#menu-open-link').on('click', function() {
    kk.hideRightMenu();
    window.open(rmLinkUrl, '_blank');
    rmLinkUrl = '';
  });

  // 新功能：复制图片链接
  $('#menu-copy-image').on('click', function() {
    kk.hideRightMenu();
    kk.copyText(rmImageUrl, '已复制图片链接');
  });

  // 新功能：打开图片
  $('#menu-open-image').on('click', function() {
    kk.hideRightMenu();
    window.open(rmImageUrl, '_blank');
    rmImageUrl = '';
  });

  // 新功能：下载图片
  $('#menu-download-image').on('click', function() {
    kk.hideRightMenu();
    kk.downloadImage(rmImageUrl);
  });

  // 新功能：粘贴文字
  $('#menu-pastetext').on('click', function() {
    kk.hideRightMenu();
    kk.pasteText();
  });

  // 随机跳转
  $('#menu-radompage').on('click', function() {
    kk.randomPost();
  });
});

// ==================== 上下文菜单项显示/隐藏 ====================
function toggleContextItems() {
  // 重置所有新功能菜单项
  $('#menu-copy-text, #menu-copy-link, #menu-open-link, #menu-copy-image, #menu-open-image, #menu-download-image, #menu-pastetext').hide();

  // 优先级：输入框 > 图片 > 链接 > 选中文字
  if (rmIsInput) {
    $('#menu-pastetext').show();
  } else if (rmImageUrl) {
    $('#menu-copy-image').show();
    $('#menu-open-image').show();
    $('#menu-download-image').show();
    // 如果图片同时是链接，额外显示链接功能
    if (rmLinkUrl) {
      $('#menu-copy-link').show();
      $('#menu-open-link').show();
    }
  } else if (rmLinkUrl) {
    $('#menu-copy-link').show();
    $('#menu-open-link').show();
  } else if (rmSelectedText) {
    $('#menu-copy-text').show();
  }

  // 隐藏空分组
  hideEmptyGroups();
}

// ==================== 隐藏空分组 ====================
function hideEmptyGroups() {
  $('#rightMenu .rightMenu-group').each(function() {
    let $group = $(this);
    // 跳过导航组和功能组
    if ($group.hasClass('rightMenu-small') || $group.find('#menu-darkmode').length) return;
    let hasVisible = false;
    $group.find('.rightMenu-item').each(function() {
      if ($(this).css('display') !== 'none') {
        hasVisible = true;
        return false;
      }
    });
    $group.css('display', hasVisible ? '' : 'none');
  });
  // 重新计算菜单高度
  rmHeight = $('#rightMenu').outerHeight();
}

// ==================== 暴露全局 API ====================
window.rightmenu = kk;

// ==================== 简繁切换（保留原样） ====================
document.addEventListener('DOMContentLoaded', function () {
  const translate = GLOBAL_CONFIG.translate;
  const snackbarData = GLOBAL_CONFIG.Snackbar;
  const defaultEncoding = translate.defaultEncoding;
  const translateDelay = translate.translateDelay;
  const msgToTraditionalChinese = translate.msgToTraditionalChinese;
  const msgToSimplifiedChinese = translate.msgToSimplifiedChinese;
  let currentEncoding = defaultEncoding;
  const targetEncodingCookie = 'translate-chn-cht';
  let targetEncoding = saveToLocal.get(targetEncodingCookie) === undefined
    ? defaultEncoding
    : Number(saveToLocal.get('translate-chn-cht'));
  let translateButtonObject;
  const isSnackbar = GLOBAL_CONFIG.Snackbar !== undefined;

  function translateText(txt) {
    if (txt === '' || txt == null) return '';
    if (currentEncoding === 1 && targetEncoding === 2) return Simplized(txt);
    else if (currentEncoding === 2 && targetEncoding === 1) return Traditionalized(txt);
    else return txt;
  }

  function translateBody(fobj) {
    let objs;
    if (typeof fobj === 'object') objs = fobj.childNodes;
    else objs = document.body.childNodes;
    for (let i = 0; i < objs.length; i++) {
      const obj = objs.item(i);
      if ('||BR|HR|'.indexOf('|' + obj.tagName + '|') > 0 || obj === translateButtonObject) continue;
      if (obj.title !== '' && obj.title != null) obj.title = translateText(obj.title);
      if (obj.alt !== '' && obj.alt != null) obj.alt = translateText(obj.alt);
      if (obj.placeholder !== '' && obj.placeholder != null) obj.placeholder = translateText(obj.placeholder);
      if (obj.tagName === 'INPUT' && obj.value !== '' && obj.type !== 'text' && obj.type !== 'hidden') obj.value = translateText(obj.value);
      if (obj.nodeType === 3) obj.data = translateText(obj.data);
      else translateBody(obj);
    }
  }

  function translatePage() {
    if (targetEncoding === 1) {
      currentEncoding = 1; targetEncoding = 2;
      saveToLocal.set(targetEncodingCookie, targetEncoding, 2);
      translateBody();
      if (isSnackbar) btf.snackbarShow(snackbarData.cht_to_chs);
    } else if (targetEncoding === 2) {
      currentEncoding = 2; targetEncoding = 1;
      saveToLocal.set(targetEncodingCookie, targetEncoding, 2);
      translateBody();
      if (isSnackbar) btf.snackbarShow(snackbarData.chs_to_cht);
    }
  }

  function JTPYStr() {
    return '万与丑专业丛东丝丢两严丧个丬丰临为丽举么义乌乐乔习乡书买乱争于亏云亘亚产亩亲亵亸亿仅从仑仓仪们价众优伙会伛伞伟传伤伥伦伧伪伫体余佣佥侠侣侥侦侧侨侩侪侬俣俦俨俩俪俭债倾偬偻偾偿傥傧储傩儿兑兖党兰关兴兹养兽冁内冈册写军农冢冯冲决况冻净凄凉凌减凑凛几凤凫凭凯击凼凿刍划刘则刚创删别刬刭刽刿剀剂剐剑剥剧劝办务劢动励劲劳势勋勐勚匀匦匮区医华协单卖卢卤卧卫却卺厂厅历厉压厌厍厕厢厣厦厨厩厮县参叆叇双发变叙叠叶号叹叽吁后吓吕吗吣吨听启吴呒呓呕呖呗员呙呛呜咏咔咙咛咝咤咴咸哌响哑哒哓哔哕哗哙哜哝哟唛唝唠唡唢唣唤唿啧啬啭啮啰啴啸喷喽喾嗫呵嗳嘘嘤嘱噜噼嚣嚯团园囱围囵国图圆圣圹场坂坏块坚坛坜坝坞坟坠垄垅垆垒垦垧垩垫垭垯垱垲垴埘埙埚埝埯堑堕塆墙壮声壳壶壸处备复够头夸夹夺奁奂奋奖奥妆妇妈妩妪妫姗姜娄娅娆娇娈娱娲娴婳婴婵婶媪嫒嫔嫱嬷孙学孪宁宝实宠审宪宫宽宾寝对寻导寿将尔尘尧尴尸尽层屃屉届属屡屦屿岁岂岖岗岘岙岚岛岭岳岽岿峃峄峡峣峤峥峦崂崃崄崭嵘嵚嵛嵝嵴巅巩巯币帅师帏帐帘帜带帧帮帱帻帼幂幞干并广庄庆庐庑库应庙庞废庼廪开异弃张弥弪弯弹强归当录彟彦彻径徕御忆忏忧忾怀态怂怃怄怅怆怜总怼怿恋恳恶恸恹恺恻恼恽悦悫悬悭悯惊惧惨惩惫惬惭惮惯愍愠愤愦愿慑慭憷懑懒懔戆戋戏戗战戬户扎扑扦执扩扪扫扬扰抚抛抟抠抡抢护报担拟拢拣拥拦拧拨择挂挚挛挜挝挞挟挠挡挢挣挤挥挦捞损捡换捣据捻掳掴掷掸掺揼揸揽揿搀搁搂搅携摄摅摆摇摈摊撄撑撵撷撸撺擞攒敌敛数斋斓斗斩断无旧时旷旸昙昼昽显晋晒晓晔晕晖暂暧札术朴机杀杂权条来杨杩杰极构枞枢枣枥枧枨枪枫枭柜柠柽栀栅标栈栉栊栋栌栎栏树栖样栾桊桠桡桢档桤桥桦桧桨桩梦梼梾检棂椁椟椠椤椭楼榄榇榈榉槚槛槟槠横樯樱橥橱橹橼檐檩欢欤欧歼殁殇残殒殓殚殡殴毁毂毕毙毡毵氇气氢氩氲汇汉污汤汹沓沟没沣沤沥沦沧沨沩沪沵泞泪泶泷泸泺泻泼泽泾洁洒洼浃浅浆浇浈浉浊测浍济浏浐浑浒浓浔浕涂涌涛涝涞涟涠涡涢涣涤润涧涨涩淀渊渌渍渎渐渑渔渖渗温游湾湿溃溅溆溇滗滚滞滟滠满滢滤滥滦滨滩滪漤潆潇潋潍潜潴澜濑濒灏灭灯灵灾灿炀炉炖炜炝点炼炽烁烂烃烛烟烦烧烨烩烫烬热焕焖焘煅煳熘爱爷牍牦牵牺犊犟状犷犸犹狈狍狝狞独狭狮狯狰狱狲猃猎猕猡猪猫猬献獭玑玙玚玛玮环现玱玺珉珏珐珑珰珲琎琏琐琼瑶瑷璇璎瓒瓮瓯电画畅畲畴疖疗疟疠疡疬疮疯疱疴痈痉痒痖痨痪痫痴瘅瘆瘗瘘瘪瘫瘾瘿癞癣癫癯皑皱皲盏盐监盖盗盘眍眦眬着睁睐睑瞒瞩矫矶矾矿砀码砖砗砚砜砺砻砾础硁硅硕硖硗硙硚确硷碍碛碜碱碹磙礼祎祢祯祷祸禀禄禅离秃秆种积称秽秾稆税稣稳穑穷窃窍窑窜窝窥窦窭竖竞笃笋笔笕笺笼笾筑筚筛筜筝筹签简箓箦箧箨箩箪箫篑篓篮篱簖籁籴类籼粜粝粤粪粮糁糇紧絷纟纠纡红纣纤纥约级纨纩纪纫纬纭纮纯纰纱纲纳纴纵纶纷纸纹纺纻纼纽纾线绀绁绂练组绅细织终绉绊绋绌绍绎经绐绑绒结绔绕绖绗绘给绚绛络绝绞统绠绡绢绣绤绥绦继绨绩绪绫绬续绮绯绰绱绲绳维绵绶绷绸绹绺绻综绽绾绿缀缁缂缃缄缅缆缇缈缉缊缋缌缍缎缏缐缑缒缓缔缕编缗缘缙缚缛缜缝缞缟缠缡缢缣缤缥缦缧缨缩缪缫缬缭缮缯缰缱缲缳缴缵罂网罗罚罢罴羁羟羡翘翙翚耢耧耸耻聂聋职聍联聩聪肃肠肤肷肾肿胀胁胆胜胧胨胪胫胶脉脍脏脐脑脓脔脚脱脶脸腊腌腘腭腻腼腽腾膑臜舆舣舰舱舻艰艳艹艺节芈芗芜芦苁苇苈苋苌苍苎苏苘苹茎茏茑茔茕茧荆荐荙荚荛荜荞荟荠荡荣荤荥荦荧荨荩荪荫荬荭荮药莅莜莱莲莳莴莶获莸莹莺莼萚萝萤营萦萧萨葱蒇蒉蒋蒌蓝蓟蓠蓣蓥蓦蔷蔹蔺蔼蕲蕴薮藁藓虏虑虚虫虬虮虽虾虿蚀蚁蚂蚕蚝蚬蛊蛎蛏蛮蛰蛱蛲蛳蛴蜕蜗蜡蝇蝈蝉蝎蝼蝾螀螨蟏衅衔补衬衮袄袅袆袜袭袯装裆裈裢裣裤裥褛褴襁襕见观觃规觅视觇览觉觊觋觌觍觎觏觐觑觞触觯詟誉誊讠计订讣认讥讦讧讨让讪讫训议讯记讱讲讳讴讵讶讷许讹论讻讼讽设访诀证诂诃评诅识诇诈诉诊诋诌词诎诏诐译诒诓诔试诖诗诘诙诚诛诜话诞诟诠诡询诣诤该详诧诨诩诪诫诬语诮误诰诱诲诳说诵诶请诸诹诺读诼诽课诿谀谁谂调谄谅谆谇谈谊谋谌谍谎谏谐谑谒谓谔谕谖谗谘谙谚谛谜谝谞谟谠谡谢谣谤谥谦谧谨谩谪谫谬谭谮谯谰谱谲谳谴谵谶谷豮贝贞负贠贡财责贤败账货质贩贪贫贬购贮贯贰贱贲贳贴贵贶贷贸费贺贻贼贽贾贿赀赁赂赃资赅赆赇赈赉赊赋赌赍赎赏赐赑赒赓赔赕赖赗赘赙赚赛赜赝赞赟赠赡赢赣赪赵赶趋趱趸跃跄跖跞践跶跷跸跹跻踊踌踪踬踯蹑蹒蹰蹿躏躜躯车轧轨轩轪轫转轭轮软轰轱轲轳轴轵轶轷轸轹轺轻轼载轾轿辀辁辂较辄辅辆辇辈辉辊辋辌辍辎辏辐辑辒输辔辕辖辗辘辙辚辞辩辫边辽达迁过迈运还这进远违连迟迩迳迹适选逊递逦逻遗遥邓邝邬邮邹邺邻郁郄郏郐郑郓郦郧郸酝酦酱酽酾酿释里鉅鉴銮錾钆钇针钉钊钋钌钍钎钏钐钑钒钓钔钕钖钗钘钙钚钛钝钞钟钠钡钢钣钤钥钦钧钨钩钪钫钬钭钮钯钰钱钲钳钴钵钶钷钸钹钺钻钼钽钾钿铀铁铂铃铄铅铆铈铉铊铋铍铎铏铐铑铒铕铗铘铙铚铛铜铝铞铟铠铡铢铣铤铥铦铧铨铪铫铬铭铮铯铰铱铲铳铴铵银铷铸铹铺铻铼铽链铿销锁锂锃锄锅锆锇锈锉锊锋锌锍锎锏锐锑锒锓锔锕锖锗错锚锜锞锟锠锡锢锣锤锥锦锨锩锫锬锭键锯锰锱锲锳锴锵锶锷锸锹锺锻锼锽锾锿镀镁镂镃镆镇镈镉镊镌镍镎镏镐镑镒镕镖镗镙镚镛镜镝镞镟镠镡镢镣镤镥镦镧镨镩镪镫镬镭镮镯镰镱镲镳镴镶长门闩闪闫闬闭问闯闰闱闲闳间闵闶闷闸闹闺闻闼闽闾闿阀阁阂阃阄阅阆阇阈阉阊阋阌阍阎阏阐阑阒阓阔阕阖阗阘阙阚阛队阳阴阵阶际陆陇陈陉陕陧陨险随隐隶隽难雏雠雳雾霁霉霭靓静靥鞑鞒鞯鞴韦韧韨韩韪韫韬韵页顶顷顸项顺须顼顽顾顿颀颁颂颃预颅领颇颈颉颊颋颌颍颎颏颐频颒颓颔颕颖颗题颙颚颛颜额颞颟颠颡颢颣颤颥颦颧风飏飐飑飒飓飔飕飖飗飘飙飚飞飨餍饤饥饦饧饨饩饪饫饬饭饮饯饰饱饲饳饴饵饶饷饸饹饺饻饼饽馾饿馀馁馂馃馄馅馆馇馈馉馊馋馌馍馎馏馐馑馒馓馔馕马驭驮驯驰驱驲驳驴驵驶驷驸驹驺驻驼驽驾驿骀骁骂骃骄骅骆骇骈骉骊骋验骍骎骏骐骑骒骓骔骕骖骗骘骙骚骛骜骝骞骟骠骡骢骣骤骥骦骧髅髋髌鬓魇魉鱼鱽鱾鱿鲀鲁鲂鲄鲅鲆鲇鲈鲉鲊鲋鲌鲍鲎鲏鲐鲑鲒鲓鲔鲕鲖鲗鲘鲙鲚鲛鲜鲝鲞鲟鲠鲡鲢鲣鲤鲥鲦鲧鲨鲩鲪鲫鲬鲭鲮鲯鲰鲱鲲鲳鲴鲵鲶鲷鲸鲹鲺鲻鲼鲽鲾鲿鳀鳁鳂鳃鳄鳅鳆鳇鳈鳉鳊鳋鳌鳍鳎鳏鳐鳑鳒鳓鳔鳕鳖鳗鳘鳙鳛鳜鳝鳞鳟鳠鳡鳢鳣鸟鸠鸡鸢鸣鸤鸥鸦鸧鸨鸩鸪鸫鸬鸭鸮鸯鸰鸱鸲鸳鸴鸵鸶鸷鸸鸹鸺鸻鸼鸽鸾鸿鹀鹁鹂鹃鹄鹅鹆鹇鹈鹉鹊鹋鹌鹍鹎鹏鹐鹑鹒鹓鹔鹕鹖鹗鹘鹚鹛鹜鹝鹞鹟鹠鹡鹢鹣鹤鹥鹦鹧鹨鹩鹪鹫鹬鹭鹯鹰鹱鹲鹳鹴鹾麦麸黄黉黡黩黪黾';
  }

  function FTPYStr() {
    return '萬與醜專業叢東絲丟兩嚴喪個爿豐臨為麗舉麼義烏樂喬習鄉書買亂爭於虧雲亙亞產畝親褻嚲億僅從侖倉儀們價眾優夥會傴傘偉傳傷倀倫傖偽佇體餘傭僉俠侶僥偵側僑儈儕儂俁儔儼倆儷儉債傾傯僂僨償儻儐儲儺兒兌兗黨蘭關興茲養獸内內岡冊寫軍農塚馮衝決況凍淨淒涼淩減湊凜幾鳳鳧憑凱擊氹鑿芻劃劉則剛創刪別剗剄劊劌剴劑剮劍剝劇勸辦務勱動勵勁勞勢勳猛勩勻匭匱區醫華協單賣盧鹵臥衛卻巹廠廳曆厲壓厭厙廁廂厴廈廚廄廝縣參靉靆雙發變敘疊葉號籲後嚇呂嗎唚噸聽啟吳嘸囈嘔唄員咼嗆嗚詠哢嚨嚀噝吒噅鹹呱響啞噠嘵嗶噦嘩噲嚌噥喲嘜嗊嘮啢嗩唕喚呼嘖囀齧囉嘽嘯噴嘍囁嗬噯噓嚶囑嚕劈囂謔團園囪圍圇國圖圓聖壙場阪壞塊堅壇壢壩塢墳墜壟壟壚壘墾堊墊埡墶壋塏堖塒塤堝墊垵塹墮壪牆壯聲殼壺壼處備複夠頭誇夾奪奩奐奮獎奧妝婦媽嫵嫗媯姍薑婁婭嬈嬌孌娛媧嫻嫿嬰嬋嬸媼嬡嬪嬙嬤孫學孿寧寶實寵審憲宮寬賓寢對尋導壽將爾塵堯尷屍盡層屭屜屆屬屢屨嶼歲豈嶇崗嶴嵐島嶺嶽崠巋嶨嶧峽嶢嶠崢巒嶗崍嶮嶄嶸嶔崳嶁脊巔鞏巰幣帥師幃帳簾幟帶幀幫幬幘幗冪襆幹並廣莊慶廬廡庫應廟龐廢廎廩開異棄張彌弳彎彈強歸當錄彠彥徹徑徠禦憶懺憂愾懷態慫憮慪悵愴憐總懟懌戀懇惡慟懨愷惻惱惲悅愨懸慳憫驚懼慘懲憊愜慚憚慣湣慍憤憒願懾憖怵懣懶懍戇戔戲戧戰戩戶紮撲扡執擴捫掃揚擾撫拋摶摳掄搶護報擔擬攏揀擁攔擰撥擇掛摯攣撾撻挾撓擋撟掙擠揮撏撈損撿換搗據撚擄摑擲撣摻摜摣攬撳攙擱摟攪攜攝攄擺搖擯攤攖撐擆擷擼攛擻攢敵斂數齋斕鬥斬斷無舊時曠暘曇晝曨顯晉曬曉曄暈暉暫曖劄術樸機殺雜權條來楊榪傑極構樅樞棗櫪梘棖槍楓梟櫃檸檉梔柵標棧櫛櫳棟櫨櫟欄樹棲樣欒棬椏橈楨檔榿橋樺檜槳樁夢檮棶檢欞槨櫝槧欏橢樓欖櫬櫚櫸檟檻檳櫧橫檣櫻櫫櫥櫓櫞簷檁歡歟歐殲歿殤殘殞殮殫殯毆毀轂畢斃氈毿氌氣氫氬氳彙漢汙湯洶遝溝沒灃漚沥淪滄渢溈滬濔濘淚澩瀧瀘濼瀉潑澤涇潔灑窪浹淺漿澆湞溮濁測澮濟瀏滻渾滸濃潯濜塗湧濤澇淶漣潿渦溳渙滌潤澗漲澀澱淵淥漬瀆漸澠漁瀋滲溫遊灣濕潰濺漵漊潷滾滯灩灄滿瀅濾濫灤濱灘澦濫瀠瀟瀲濰潛瀦瀾瀨瀕灝滅燈靈災燦煬爐燉煒熗點煉熾爍爛烴燭煙煩燒燁燴燙燼熱煥燜燾煆糊溜愛爺牘犛牽犧犢強狀獷獁猶狽麅獮獰獨狹獅獪猙獄猻獫獵獼玀豬貓蝟獻獺璣璵瑒瑪瑋環現瑲璽瑉玨琺瓏璫璡璉瑣瓊瑤璦璿瓔瓚甕甌電畫暢佘範疇療瘧癘瘍鬁瘡瘋皰屙癰痙癢瘂癆瘓癇癡癉瘮瘞瘺癟癱癮癭癩癬癲臒皚皺皸盞鹽監蓋盜盤瞘眥矓著睜睞瞼瞞矚矯磯礬礦碭碼磚硨硯碸礪礱礫礎硜矽碩硤磽磑礄確鹼礙磧磣堿镟滾禮禕禰禎禱禍稟祿禪離禿稈種積稱穢穠穭稅稣穩穡窮竊竅窯竄窝窺竇窶豎競篤筍筆筧箋籠籩築篳篩簹箏籌簽簡籙簀篋籜籮簞簫簣簍籃籬籪籟糴類秈糶糲粵糞糧糝餱緊縶糸糾紆紅紂纖紇約級紈纊紀紉緯紜紘純紕紗綱納紝縱綸紛紙紋紡紵紖紐紓線紺絏紱練組紳細織終縐絆紼絀紹绎經紿綁絨結絝繞絰絎繪給絢絳絡絕絞統綆綃絹繡綌綏絛繼綈績緒綾緓續綺緋綽緔緄繩維綿綬繃綢綯綹綣綜綻綰綠綴緇緙緗緘緬纜緹緲緝縕繢緦綞緞緶線緱縋緩締縷編緡緣縉縛縟縝縫縗縞纏縭縊縑繽縹縵縲纓縮繆繅纈繚繕繒韁繾繰繯繳纘罌網羅罰罷羆羈羥羨翹翽翬耮耬聳恥聶聾職聹聯聵聰肅腸膚膁腎腫脹脅膽勝朧腖臚脛膠脈膾髒臍腦膿臠腳脫腡臉臘醃膕齶膩靦膃騰臏臢輿艤艦艙艫艱豔艸藝節羋薌蕪蘆蓯葦藶莧萇蒼苧蘇檾蘋莖蘢蔦塋煢繭荊薦薘莢蕘蓽蕎薈薺蕩榮葷滎犖熒蕁藎蓀蔭蕒葒葤藥蒞蓧萊蓮蒔萵薟獲蕕瑩鶯蓴蘀蘿螢營縈蕭薩蔥蕆蕢蔣蔞藍薊蘺蕷鎣驀薔蘞藺藹蘄蘊藪槁蘚虜慮虛蟲虯蟣雖虾蠆蝕蚁螞蠶蠔蜆蠱蠣蟶蠻蟄蛺蟯螄蠐蛻蝸蠟蠅蟈蟬蠍螻蠑螿蟎蠨釁銜補襯袞襖嫋褘襪襲襏裝襠褌褳襝褲襇褸襤繈襴見觀覎規覓視覘覽覺覬覡覿覥覦覯覲覷觴觸觶讋譽謄訁計訂訃認譏訐訌討讓訕訖訓議訊記訒講諱謳詎訥許訛論訩訟諷設訪訣證詁訶評詛識詗詐訴診詆謅詞詘詔詖譯詒誆誄試詿詩詰詼誠誅詵話誕詬詮詭詢詣諍該詳詫諢詡譸誡誣語誚誤誥誘誨誑說诵誒请諸諏诺讀諑誹課諉諛誰諗調諂諒諄誶談誼谋諶谍謊諫諧謔謁謂諤諭諼讒諮諳諺諦謎諞諝謨讜謖謝謠謗諡謙謐謹謾謫譾謬譚譖譙讕譜譎讞譴譫讖穀豶貝貞負貟貢財責贤敗账貨質販贪貧贬購貯貫贰賤賁貰貼貴貺贷貿費贺貽贼贄贾賄貲賃賂贓資賅贐賕賑賚賒賦賭齎贖賞賜贔賙賡賠賧賴賵贅賻賺賽賾贗讚贇贈贍贏贛赬趙趕趨趲躉躍蹌蹠躒踐躂蹺蹕躚躋躴躊蹤躓躑躡蹣躕躥躪躦軀車軋軌軒軑軔轉軛輪軟轟軲軻軤軸軹軼軤軫軹軺輕軾載輊轎輈輇輅較輒輔輛輦輩輝輥輞輬輟輜輳輻輯轀輸轡轅轄輾轆轍轔辭辩辮邊遼達遷過邁運還這進遠違連遲邇逕跡適選遜遞邐逻遺遙鄧鄺鄔郵鄒鄴鄰鬱郤郟鄶鄭鄆酈鄖鄲醞醱醬釅釃釀釋裏钜鑒鑾鏨釓釔針釘釗釙釕釷釺釧釤鈒釩釣鍆釹鍚釵鈃鈣鈈鈦鈍鈔鍾鈉鋇鋼鈑鈐鑰欽鈞鎢鉤鈧鈁鈥鈄鈕鈀鈺錢鉦鉗鈷缽鈳鉕鈽鉸鉞鑽鉬鉭鉀鈿鈾鐵鉑鈴鑠鉛鉚鈰鉉鉈鉍鈹鐸鉶銬銠鉺銪鋏鋣鐃銍鐺銅鋁銱銦鎧鍘銖銑鋌銩銛鏵銓鉿銚鉻銘錚銫鉸銥鏟銃鐋銨銀銣鑄鐒鋪鋙錸鋱鏈鏗銷鎖鋰鋥鋤鍋鋯鋨鏽銼鋝鋒鋅鋶鐦鐧銳銻鋃鋟鋦錒錆鍺錯錨錡錁錕錩錫錮鑼錘錐錦鍁錈錇錟錠鍵鋸錳錙鍥鍈鍇鏘鍶鍔鍤鍬鍾鍛鎪鍠鍰鎄鍍鎂鏤鎡鏌鎮鎛鎘鑷鐫鎳鎿鎦鎬鎊鎰鎔鏢鏜鏍鏰鏞鏡鏑鏃鏇鏐鐔钁鐐鏷鑥鐓鑭鐠鑹鏹鐙鑊鐳鐶鐲鐮鐿鑔鑣鑞鑲長門閂閃閆閈閉問闖閏闈閑閎間閔閌悶閘鬧閨聞闥閩閭闓閥閣閡閫鬮閱閬闍閾閹閶鬩閿閽閻閼闡闌闃闠闊闋闔闐闒闕闞闤隊陽陰陣階際陸隴陳陘陝隉隕險隨隱隸雋難雛讎靂霧霽黴靄靚靜靨韃鞽韉韝韋韌韍韓韙韞韜韻頁頂頃頇項順須頊頑顧頓頎頒頌頏預顱領頗頸頡頰頲頜潁熲頦頤頻頮頹頷頴穎顆題顒顎顓顏額顳顢顛顙顥纇顫顬顰顴風颺颭颮颯颶颸颼颻飀飄飆飆飛饗饜飣饑飥餳飩餼飪飫飭饭飲餞飾飽飼飿飴餌饒餉餄餎餃餏餅餑餖餓餘餒餕餜餛餡館餷饋餶餿饞饁饃餺餾饈饉饅饊饌饢馬馭馱馴馳驅馹駁驢駔駛駟駙駒騶駐駝駑駕驛駘驍罵駰驕驊駱駭駢驫驪騁驗騂駸駿騏騎騍騅騌驌驂騙騭騤騷騖驁騮騫騸驃騾驄驏驟驥驦驤髏髖髕鬢魘魎魚魛魢魷魨魯魴魺鮁鮃鯰鱸鮋鮓鮒鮊鮑鱟鮍鮐鮭鮚鮳鮪鮞鮦鰂鮜鱠鱭鮫鲜鮺鯗鱘鯁鱺鰱鰹鯉鰣鰷鯀鯊鯇鮶鯽鯒鯖鯪鯕鯫鯡鯤鯧鯝鯢鯰鯛鯨鯵鯴鯔鱝鰈鰏鱨鯷鰮鰃鰓鱷鰍鰒鰉鰁鱂鯿鰠鼇鰭鰨鰥鰩鰟鰜鰳鰾鱈鱉鰻鰵鱅鰼鱖鱔鳞鱒鱯鱤鱧鱣鳥鳩雞鳶鳴鳲鷗鴉鶬鴇鴆鴣鶇鸕鴨鴞鴦鴒鴟鴝鴛鴬鴕鷥鷙鴯鴰鵂鴴鵃鴿鸞鴻鵐鵓鸝鵑鵠鵝鵒鷳鵜鵡鵲鶓鵪鶤鵯鵬鵮鶉鶊鵷鷫鶘鶡鶚鶻鶿鶥鶩鷊鷂鶲鶹鶺鷁鶼鶴鷖鸚鷓鷚鷯鷦鷲鷸鷺鸇鷹鸌鸏鸛鸘鹺麥麩黃黌黶黷黲黽';
  }

  function Traditionalized(cc) {
    let str = '';
    const ss = JTPYStr();
    const tt = FTPYStr();
    for (let i = 0; i < cc.length; i++) {
      if (cc.charCodeAt(i) > 10000 && ss.indexOf(cc.charAt(i)) !== -1) { str += tt.charAt(ss.indexOf(cc.charAt(i))); } else str += cc.charAt(i);
    }
    return str;
  }

  function Simplized(cc) {
    let str = '';
    const ss = JTPYStr();
    const tt = FTPYStr();
    for (let i = 0; i < cc.length; i++) {
      if (cc.charCodeAt(i) > 10000 && tt.indexOf(cc.charAt(i)) !== -1) { str += ss.charAt(tt.indexOf(cc.charAt(i))); } else str += cc.charAt(i);
    }
    return str;
  }

  function translateInitialization() {
    translateButtonObject = document.getElementById('menu-translate');
    if (translateButtonObject) {
      if (currentEncoding !== targetEncoding) {
        setTimeout(translateBody, translateDelay);
      }
      translateButtonObject.addEventListener('click', translatePage, false);
    }
  }
  translateInitialization();
  document.addEventListener('pjax:complete', translateInitialization);
});

// ==================== 导出 API ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = kk;
}
