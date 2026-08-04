// source/js/ccp.js
(function() {
    // ---- 预设主题色 ----
    const PRESET_COLORS = [
        '#49B1F5', '#FF6B6B', '#4ECDC4', '#FF9F43', '#A29BFE',
        '#FD79A8', '#00B894', '#E17055', '#0984E3', '#6C5CE7',
        '#FDCB6E', '#E84393', '#00CEC9', '#D63031'
    ];

    // 全局当前颜色
    let currentColor = '#49B1F5';

    // ---- 蒙版元素 ----
    let overlay = null;

    function createOverlay() {
        if (document.getElementById('custom-panel-overlay')) {
            return document.getElementById('custom-panel-overlay');
        }
        overlay = document.createElement('div');
        overlay.id = 'custom-panel-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 99998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
        `;
        // 点击蒙版关闭面板
        overlay.addEventListener('click', function() {
            hidePanel();
            hideColorPicker();
        });
        document.body.appendChild(overlay);
        return overlay;
    }

    function showOverlay() {
        const el = createOverlay();
        el.style.pointerEvents = 'auto';
        el.style.opacity = '1';
    }

    function hideOverlay() {
        const el = document.getElementById('custom-panel-overlay');
        if (el) {
            el.style.pointerEvents = 'none';
            el.style.opacity = '0';
        }
    }

    function initCustomPanel() {
        if (document.getElementById('custom-control-panel')) {
            rebindEvents();
            applyRadiusToAll();
            applyPanelRadius();
            applyThemeToElements();
            return;
        }
        loadSettings();
        createControlPanel();
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            panel.classList.add('panel-hidden');
        }
        initCustomPanelButton();
        // 创建蒙版（但默认隐藏）
        createOverlay();
        // 只在面板可见时监听点击，且只监听面板相关元素
        setupPanelClickHandler();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomPanel);
    } else {
        initCustomPanel();
    }

    document.addEventListener('pjax:complete', function() {
        setTimeout(function() { initCustomPanel(); }, 50);
    });

    document.addEventListener('pjax:success', function() {
        setTimeout(function() { initCustomPanel(); }, 50);
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(function() {
                const panel = document.getElementById('custom-control-panel');
                if (panel) {
                    applyRadiusToAll();
                    applyPanelRadius();
                    applyThemeToElements();
                }
            }, 200);
        }
    });

    // ================================================================
    //  新增：只处理面板内部的点击事件，不干扰其他界面
    // ================================================================
    function setupPanelClickHandler() {
        // 移除之前可能绑定的监听器（通过克隆替换方式）
        // 只对面板内部的关闭按钮和颜色选择器进行事件绑定
        // 不再使用全局 document 监听
    }

    // 应用主题色到各个元素（实时更新）
    function applyThemeToElements() {
        const color = currentColor;
        
        // 1. 应用到目录（TOC）文字颜色
        document.querySelectorAll('.toc-item a, .toc-link, .toc-text, .toc-number').forEach(el => {
            el.style.color = color;
        });
        document.querySelectorAll('.toc-item.active .toc-link, .toc-link.active').forEach(el => {
            el.style.color = color;
            el.style.borderColor = color;
        });
        
        // 2. 应用到文章标题
        document.querySelectorAll('.post-title, .article-title, .post-title a, .recent-post-item .title, .blog-post-title').forEach(el => {
            el.style.color = color;
        });
        document.querySelectorAll('.post-title a, .article-title a, .recent-post-item .title a').forEach(el => {
            el.onmouseenter = function() { 
                this.style.color = color; 
                this.style.opacity = '0.8';
            };
            el.onmouseleave = function() { 
                this.style.color = color; 
                this.style.opacity = '1';
            };
        });
        document.querySelectorAll('.post-title::after, .article-title::after, .recent-post-item .title::after').forEach(el => {
            el.style.background = color;
        });
        
        // 3. 应用到导航栏 - 只修改 .site-name 和菜单项
        document.documentElement.style.setProperty('--lyx-theme', color);
        
        const styleId = 'dynamic-nav-style';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `
            .site-name {
                color: ${color} !important;
                transition: color 0.3s ease;
            }
            .site-name:hover {
                color: ${color} !important;
                opacity: 0.8;
            }
            .menus_item:hover > .site-page,
            .menus_item > .site-page:hover {
                color: ${color} !important;
            }
            .menus_item .site-page.current,
            .menus_item .site-page.active,
            .site-page.current,
            .site-page.active {
                color: ${color} !important;
                border-bottom: 2px solid ${color} !important;
            }
            .site-page.child:hover,
            .menus_item .child:hover {
                color: ${color} !important;
            }
            .site-page.group:hover {
                color: ${color} !important;
            }
        `;
        
        // 4. 应用到面板自身
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            const title = panel.querySelector('h3');
            if (title) title.style.color = color;
            panel.querySelectorAll('label').forEach(label => {
                label.style.color = color;
            });
            const closeBtn = panel.querySelector('#close-panel-btn');
            if (closeBtn) {
                closeBtn.style.color = '#888';
                closeBtn.onmouseover = function() { this.style.color = color; };
                closeBtn.onmouseout = function() { this.style.color = '#888'; };
            }
            panel.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.filter === getSettings().filter) {
                    btn.style.borderColor = color;
                    btn.style.background = color + '22';
                    btn.style.color = color;
                }
            });
            const slider = panel.querySelector('#radius-slider');
            if (slider) slider.style.accentColor = color;
            const fontSelect = panel.querySelector('#font-select');
            if (fontSelect) fontSelect.style.accentColor = color;
            const resetBtn = panel.querySelector('#reset-default-btn');
            if (resetBtn) {
                resetBtn.onmouseover = function() { 
                    this.style.background = '#e0e0e0'; 
                    this.style.color = color; 
                };
                resetBtn.onmouseout = function() { 
                    this.style.background = '#f0f0f0'; 
                    this.style.color = '#333'; 
                };
            }
        }
        
        // 5. 颜色选择器
        const picker = document.getElementById('color-picker-panel');
        if (picker) {
            const title = picker.querySelector('h4');
            if (title) title.style.color = color;
            const closeColorBtn = picker.querySelector('#close-color-picker-btn');
            if (closeColorBtn) {
                closeColorBtn.style.color = '#888';
                closeColorBtn.onmouseover = function() { this.style.color = color; };
                closeColorBtn.onmouseout = function() { this.style.color = '#888'; };
            }
        }
        
        // 6. 齿轮按钮
        const gearBtn = document.getElementById('custom-panel-btn');
        if (gearBtn) {
            gearBtn.style.color = color;
            gearBtn.style.borderColor = color;
        }
        
        document.documentElement.style.setProperty('--main-color', color);
    }

    function applyPanelRadius() {
        const radius = getSettings().radius;
        const panel = document.getElementById('custom-control-panel');
        const colorPicker = document.getElementById('color-picker-panel');
        if (panel) panel.style.borderRadius = radius + 'px';
        if (colorPicker) colorPicker.style.borderRadius = radius + 'px';
    }

    function applyRadiusToAll() {
        const radius = getSettings().radius;
        document.documentElement.style.setProperty('--main-radius', radius + 'px');
        const selectors = [
            '.card-widget', '.recent-post-item', '.layout-page', '.post-block',
            '.recent-post-item', '.card', '.post', '.article', '.entry', '.blog-card',
            '.layout', '.main', '.container', '.content', '.page',
            '.post-content', '.article-container', '.post-body', '.markdown-body',
            '.page-content', '.main-content', '.content-area',
            '#post', '.post-wrap', '.article-wrap', '.blog-post',
            '.post-main', '.post-container', '.post-inner'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (el.tagName !== 'IMG' && !el.closest('img')) {
                    el.style.borderRadius = radius + 'px';
                }
            });
        });
        document.querySelectorAll('img').forEach(img => {
            img.style.borderRadius = '0px !important';
        });
        applyPanelRadius();
    }

    function applyRadiusToAllWithValue(radius) {
        document.documentElement.style.setProperty('--main-radius', radius + 'px');
        const selectors = [
            '.card-widget', '.recent-post-item', '.layout-page', '.post-block',
            '.recent-post-item', '.card', '.post', '.article', '.entry', '.blog-card',
            '.layout', '.main', '.container', '.content', '.page',
            '.post-content', '.article-container', '.post-body', '.markdown-body',
            '.page-content', '.main-content', '.content-area',
            '#post', '.post-wrap', '.article-wrap', '.blog-post',
            '.post-main', '.post-container', '.post-inner'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (el.tagName !== 'IMG' && !el.closest('img')) {
                    el.style.borderRadius = radius + 'px';
                }
            });
        });
        document.querySelectorAll('img').forEach(img => {
            img.style.borderRadius = '0px !important';
        });
        applyPanelRadius();
    }

    function rebindEvents() {
        // 齿轮按钮
        const panelBtn = document.getElementById('custom-panel-btn');
        if (panelBtn) {
            const newBtn = panelBtn.cloneNode(true);
            panelBtn.parentNode.replaceChild(newBtn, panelBtn);
            newBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                togglePanel();
            });
            newBtn.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                e.preventDefault();
                togglePanel();
            }, { passive: false });
        }

        // 关闭主面板
        const closeBtn = document.getElementById('close-panel-btn');
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hidePanel();
            });
            newCloseBtn.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                hidePanel();
            }, { passive: false });
        }

        // 关闭颜色选择器
        const closeColorBtn = document.getElementById('close-color-picker-btn');
        if (closeColorBtn) {
            const newClose = closeColorBtn.cloneNode(true);
            closeColorBtn.parentNode.replaceChild(newClose, closeColorBtn);
            newClose.addEventListener('click', function(e) {
                e.stopPropagation();
                hideColorPicker();
            });
            newClose.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                hideColorPicker();
            }, { passive: false });
        }

        // 当前色块点击打开颜色选择器
        const colorDisplay = document.getElementById('current-color-display');
        if (colorDisplay) {
            const newDisplay = colorDisplay.cloneNode(true);
            colorDisplay.parentNode.replaceChild(newDisplay, colorDisplay);
            newDisplay.style.cursor = 'pointer';
            newDisplay.addEventListener('click', function(e) {
                e.stopPropagation();
                showColorPicker();
            });
            newDisplay.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                showColorPicker();
            }, { passive: false });
        }

        // 颜色选择器中的预设色块
        document.querySelectorAll('.picker-swatch').forEach(el => {
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            newEl.addEventListener('click', function(e) {
                e.stopPropagation();
                const color = this.dataset.color;
                applyColor(color);
            });
        });

        // 色环输入
        const colorWheel = document.getElementById('color-wheel');
        if (colorWheel) {
            const newWheel = colorWheel.cloneNode(true);
            colorWheel.parentNode.replaceChild(newWheel, colorWheel);
            newWheel.addEventListener('input', function(e) {
                e.stopPropagation();
                const color = this.value;
                document.getElementById('color-hex-input').value = color;
                applyColor(color);
            });
        }

        // 十六进制输入
        const hexInput = document.getElementById('color-hex-input');
        if (hexInput) {
            const newInput = hexInput.cloneNode(true);
            hexInput.parentNode.replaceChild(newInput, hexInput);
            newInput.addEventListener('input', function(e) {
                e.stopPropagation();
                let val = this.value.trim();
                if (val.startsWith('#')) {
                    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                        document.getElementById('color-wheel').value = val;
                        applyColor(val);
                    }
                }
            });
        }

        // 滤镜
        document.querySelectorAll('.filter-btn').forEach(el => {
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            newEl.addEventListener('click', function(e) {
                e.stopPropagation();
                const filter = this.dataset.filter;
                const color = currentColor;
                applyFilter(filter);
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.style.borderColor = '#e0e0e0';
                    b.style.background = 'transparent';
                    b.style.color = '#333';
                });
                this.style.borderColor = color;
                this.style.background = color + '22';
                this.style.color = color;
                const newSettings = getSettings();
                newSettings.filter = filter;
                saveSettings(newSettings);
            });
        });

        // 圆角滑块
        const radiusSlider = document.getElementById('radius-slider');
        if (radiusSlider) {
            const newSlider = radiusSlider.cloneNode(true);
            radiusSlider.parentNode.replaceChild(newSlider, radiusSlider);
            newSlider.addEventListener('input', function(e) {
                e.stopPropagation();
                const val = this.value;
                document.getElementById('radius-value').textContent = val + 'px';
                applyRadiusToAllWithValue(val);
                const newSettings = getSettings();
                newSettings.radius = parseInt(val);
                saveSettings(newSettings);
            });
        }

        // 字体
        const fontSelect = document.getElementById('font-select');
        if (fontSelect) {
            const newSelect = fontSelect.cloneNode(true);
            fontSelect.parentNode.replaceChild(newSelect, fontSelect);
            newSelect.addEventListener('change', function(e) {
                e.stopPropagation();
                const val = this.value;
                document.documentElement.style.setProperty('--main-font', val);
                const newSettings = getSettings();
                newSettings.font = val;
                saveSettings(newSettings);
            });
        }

        // 重置按钮
        const resetBtn = document.getElementById('reset-default-btn');
        if (resetBtn) {
            const newResetBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
            newResetBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const defaultSettings = { radius: 10, color: '#49B1F5', font: "'Microsoft YaHei', sans-serif", filter: 'none' };
                document.getElementById('radius-slider').value = defaultSettings.radius;
                document.getElementById('radius-value').textContent = defaultSettings.radius + 'px';
                document.getElementById('font-select').value = defaultSettings.font;
                applyRadiusToAllWithValue(defaultSettings.radius);
                document.documentElement.style.setProperty('--main-color', defaultSettings.color);
                document.documentElement.style.setProperty('--main-font', defaultSettings.font);
                document.documentElement.style.setProperty('--lyx-theme', defaultSettings.color);
                applyFilter('none');
                document.getElementById('current-color-display').style.background = defaultSettings.color;
                document.getElementById('current-color-hex').textContent = defaultSettings.color.toUpperCase();
                document.getElementById('color-wheel').value = defaultSettings.color;
                document.getElementById('color-hex-input').value = defaultSettings.color;
                document.querySelectorAll('.picker-swatch').forEach(s => {
                    s.style.borderColor = 'transparent';
                    if (s.dataset.color === defaultSettings.color) {
                        s.style.borderColor = '#333';
                    }
                });
                currentColor = defaultSettings.color;
                saveSettings(defaultSettings);
                applyThemeToElements();
            });
        }

        const settings = getSettings();
        currentColor = settings.color;
        applyRadiusToAllWithValue(settings.radius);
        applyFilter(settings.filter);
        document.documentElement.style.setProperty('--main-color', settings.color);
        document.documentElement.style.setProperty('--main-font', settings.font);
        document.documentElement.style.setProperty('--lyx-theme', settings.color);
        applyPanelRadius();
        applyThemeToElements();
        document.getElementById('current-color-display').style.background = settings.color;
        document.getElementById('current-color-hex').textContent = settings.color.toUpperCase();
        document.getElementById('color-wheel').value = settings.color;
        document.getElementById('color-hex-input').value = settings.color;
    }

    function togglePanel() {
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            if (panel.classList.contains('panel-hidden')) {
                showPanel();
            } else {
                hidePanel();
                hideColorPicker();
            }
        }
    }

    function showPanel() {
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            panel.classList.remove('panel-hidden');
            panel.classList.add('panel-visible');
            applyThemeToElements();
            // 显示蒙版
            showOverlay();
        }
    }

    function hidePanel() {
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            panel.classList.remove('panel-visible');
            panel.classList.add('panel-hidden');
        }
        // 隐藏蒙版
        hideOverlay();
    }

    function showColorPicker() {
        const picker = document.getElementById('color-picker-panel');
        if (picker) {
            picker.classList.remove('picker-hidden');
            picker.classList.add('picker-visible');
            picker.style.zIndex = '100001';
            applyThemeToElements();
        }
    }

    function hideColorPicker() {
        const picker = document.getElementById('color-picker-panel');
        if (picker) {
            picker.classList.remove('picker-visible');
            picker.classList.add('picker-hidden');
        }
    }

    function applyColor(color) {
        currentColor = color;
        document.documentElement.style.setProperty('--main-color', color);
        document.documentElement.style.setProperty('--lyx-theme', color);
        
        document.getElementById('current-color-display').style.background = color;
        document.getElementById('current-color-hex').textContent = color.toUpperCase();
        document.getElementById('color-wheel').value = color;
        document.getElementById('color-hex-input').value = color;
        
        document.querySelectorAll('.picker-swatch').forEach(s => {
            s.style.borderColor = 'transparent';
            if (s.dataset.color === color) {
                s.style.borderColor = '#333';
            }
        });
        
        applyThemeToElements();
        
        const newSettings = getSettings();
        newSettings.color = color;
        saveSettings(newSettings);
    }

    function loadSettings() {
        const settings = getSettings();
        currentColor = settings.color;
        document.documentElement.style.setProperty('--main-radius', settings.radius + 'px');
        document.documentElement.style.setProperty('--main-color', settings.color);
        document.documentElement.style.setProperty('--main-font', settings.font);
        document.documentElement.style.setProperty('--lyx-theme', settings.color);
        applyFilter(settings.filter);
        setTimeout(function() {
            applyRadiusToAllWithValue(settings.radius);
            applyPanelRadius();
            applyThemeToElements();
        }, 100);
    }

    function getSettings() {
        const defaultSettings = {
            radius: 10,
            color: '#49B1F5',
            font: "'Microsoft YaHei', sans-serif",
            filter: 'none'
        };
        try {
            const saved = localStorage.getItem('myBlogSettings');
            return saved ? JSON.parse(saved) : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    }

    function saveSettings(settings) {
        localStorage.setItem('myBlogSettings', JSON.stringify(settings));
    }

    function applyFilter(filterType) {
        document.documentElement.classList.remove('filter-dark', 'filter-sunset', 'filter-grayscale');
        if (filterType !== 'none') {
            document.documentElement.classList.add('filter-' + filterType);
        }
    }

    function createControlPanel() {
        // ---- 创建主面板 ----
        const panelHTML = `
            <div id="custom-control-panel" class="panel-hidden" style="position:fixed; bottom:70px; right:10px; width:300px; max-width:calc(100vw - 20px); background:#fff; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.25); padding:20px; z-index:99999; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333; max-height:80vh; overflow-y:auto; opacity:0; transform:scale(0.9) translateY(10px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events:none; transform-origin: bottom right; font-size:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:2px solid #f0f0f0; padding-bottom:10px;">
                    <h3 style="margin:0; font-size:16px; font-weight:600; color:#49B1F5;">自定义主题</h3>
                    <button id="close-panel-btn" style="background:none; border:none; font-size:20px; cursor:pointer; color:#888; padding:0 6px; transition:color 0.3s;" aria-label="关闭面板">✕</button>
                </div>
                
                <!-- 主题色 -->
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; margin-bottom:6px; font-weight:600; color:#49B1F5;">主题色</label>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span id="current-color-display" style="display:inline-block; width:36px; height:36px; border-radius:8px; background:#49B1F5; border:2px solid #ddd; cursor:pointer; transition: all 0.2s;" title="点击选择颜色"></span>
                        <span id="current-color-hex" style="font-size:13px; font-family:monospace; color:#555; cursor:pointer;" onclick="document.getElementById('current-color-display').click()">#49B1F5</span>
                        <span style="font-size:12px; color:#999; margin-left:auto;">点击色块选择</span>
                    </div>
                </div>

                <!-- 滤镜 -->
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; margin-bottom:6px; font-weight:600; color:#49B1F5;">屏幕滤镜</label>
                    <div id="filter-options" style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${[
                            {id: 'none', label: '关闭'},
                            {id: 'dark', label: '暗化'},
                            {id: 'sunset', label: '日落'},
                            {id: 'grayscale', label: '灰度'}
                        ].map(f => `
                            <button class="filter-btn" data-filter="${f.id}" style="padding:4px 12px; border:2px solid ${f.id === 'none' ? '#49B1F5' : '#e0e0e0'}; background:${f.id === 'none' ? '#49B1F522' : 'transparent'}; border-radius:16px; cursor:pointer; font-size:12px; transition: all 0.2s; color:${f.id === 'none' ? '#49B1F5' : '#333'};">${f.label}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- 全局圆角 -->
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; margin-bottom:4px; font-weight:600; color:#49B1F5;">全局圆角 (px)</label>
                    <input type="range" id="radius-slider" min="0" max="30" value="10" style="width:100%; accent-color:#49B1F5;">
                    <span id="radius-value" style="display:inline-block; margin-top:2px; font-size:12px; color:#666;">10px</span>
                </div>

                <!-- 字体 -->
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; margin-bottom:4px; font-weight:600; color:#49B1F5;">字体</label>
                    <select id="font-select" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; font-size:13px; accent-color:#49B1F5;">
                        <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
                        <option value="'PingFang SC', 'Microsoft YaHei', sans-serif">苹方</option>
                        <option value="'Noto Sans SC', sans-serif">思源黑体</option>
                        <option value="'Georgia', serif">Georgia (衬线)</option>
                        <option value="'Courier New', monospace">Courier New (等宽)</option>
                    </select>
                </div>

                <button id="reset-default-btn" style="width:100%; padding:8px; background:#f0f0f0; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px; transition: all 0.2s; color:#333;" onmouseover="this.style.background='#e0e0e0'; this.style.color='#49B1F5'" onmouseout="this.style.background='#f0f0f0'; this.style.color='#333'">恢复默认设置</button>
            </div>
        `;

        const panelContainer = document.createElement('div');
        panelContainer.innerHTML = panelHTML;
        document.body.appendChild(panelContainer.firstElementChild);

        // ---- 创建颜色选择器面板（独立于主面板，放在body下） ----
        const pickerHTML = `
            <div id="color-picker-panel" class="picker-hidden" style="position:fixed; bottom:70px; right:10px; width:300px; max-width:calc(100vw - 20px); background:#fff; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.3); padding:20px; z-index:100000; opacity:0; transform:scale(0.9) translateY(10px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events:none; transform-origin: bottom right; font-size:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:2px solid #f0f0f0; padding-bottom:10px;">
                    <h4 style="margin:0; font-size:15px; font-weight:600; color:#49B1F5;">选择主题色</h4>
                    <button id="close-color-picker-btn" style="background:none; border:none; font-size:18px; cursor:pointer; color:#888; padding:0 4px; transition:color 0.3s;" aria-label="关闭颜色选择器">✕</button>
                </div>
                
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">预设颜色</label>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${PRESET_COLORS.map(c => `
                            <div class="picker-swatch" data-color="${c}" style="width:30px; height:30px; border-radius:50%; background:${c}; cursor:pointer; border:2px solid transparent; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'"></div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">色环</label>
                    <input type="color" id="color-wheel" value="#49B1F5" style="width:100%; height:50px; border:1px solid #ddd; border-radius:8px; cursor:pointer; padding:2px;">
                </div>
                
                <div>
                    <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">十六进制</label>
                    <input type="text" id="color-hex-input" value="#49B1F5" style="width:100%; padding:6px 10px; border:1px solid #ddd; border-radius:6px; font-family:monospace; font-size:14px;" placeholder="#RRGGBB">
                </div>
            </div>
        `;

        const pickerContainer = document.createElement('div');
        pickerContainer.innerHTML = pickerHTML;
        document.body.appendChild(pickerContainer.firstElementChild);

        // ---- 事件绑定 ----
        const closeBtn = document.getElementById('close-panel-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) { 
                e.stopPropagation(); 
                hidePanel(); 
            });
            closeBtn.addEventListener('touchstart', function(e) { 
                e.stopPropagation(); 
                hidePanel(); 
            }, { passive: false });
        }

        const closeColorBtn = document.getElementById('close-color-picker-btn');
        if (closeColorBtn) {
            closeColorBtn.addEventListener('click', function(e) { 
                e.stopPropagation(); 
                hideColorPicker(); 
            });
            closeColorBtn.addEventListener('touchstart', function(e) { 
                e.stopPropagation(); 
                hideColorPicker(); 
            }, { passive: false });
        }

        const colorDisplay = document.getElementById('current-color-display');
        if (colorDisplay) {
            colorDisplay.style.cursor = 'pointer';
            colorDisplay.addEventListener('click', function(e) {
                e.stopPropagation();
                showColorPicker();
            });
            colorDisplay.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                showColorPicker();
            }, { passive: false });
        }
        document.getElementById('current-color-hex').style.cursor = 'pointer';
        document.getElementById('current-color-hex').addEventListener('click', function() {
            document.getElementById('current-color-display').click();
        });

        document.querySelectorAll('.picker-swatch').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const color = this.dataset.color;
                applyColor(color);
            });
        });

        const colorWheel = document.getElementById('color-wheel');
        if (colorWheel) {
            colorWheel.addEventListener('input', function(e) {
                e.stopPropagation();
                const color = this.value;
                document.getElementById('color-hex-input').value = color;
                applyColor(color);
            });
        }

        const hexInput = document.getElementById('color-hex-input');
        if (hexInput) {
            hexInput.addEventListener('input', function(e) {
                e.stopPropagation();
                let val = this.value.trim();
                if (val.startsWith('#')) {
                    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                        document.getElementById('color-wheel').value = val;
                        applyColor(val);
                    }
                }
            });
        }

        const settings = getSettings();
        currentColor = settings.color;
        document.getElementById('radius-slider').value = settings.radius;
        document.getElementById('radius-value').textContent = settings.radius + 'px';
        document.getElementById('font-select').value = settings.font;
        document.getElementById('current-color-display').style.background = settings.color;
        document.getElementById('current-color-hex').textContent = settings.color.toUpperCase();
        document.getElementById('color-wheel').value = settings.color;
        document.getElementById('color-hex-input').value = settings.color;

        document.querySelectorAll('.picker-swatch').forEach(el => {
            if (el.dataset.color === settings.color) {
                el.style.borderColor = '#333';
            }
        });

        document.querySelectorAll('.filter-btn').forEach(el => {
            if (el.dataset.filter === settings.filter) {
                el.style.borderColor = settings.color;
                el.style.background = settings.color + '22';
                el.style.color = settings.color;
            }
        });

        document.querySelectorAll('.color-swatch').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const color = this.dataset.color;
                applyColor(color);
                document.querySelectorAll('.color-swatch').forEach(s => {
                    s.style.borderColor = 'transparent';
                    s.style.transform = 'scale(1)';
                });
                this.style.borderColor = '#333';
                this.style.transform = 'scale(1.1)';
            });
        });

        document.querySelectorAll('.filter-btn').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const filter = this.dataset.filter;
                const color = currentColor;
                applyFilter(filter);
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.style.borderColor = '#e0e0e0';
                    b.style.background = 'transparent';
                    b.style.color = '#333';
                });
                this.style.borderColor = color;
                this.style.background = color + '22';
                this.style.color = color;
                const newSettings = getSettings();
                newSettings.filter = filter;
                saveSettings(newSettings);
            });
        });

        document.getElementById('radius-slider').addEventListener('input', function(e) {
            e.stopPropagation();
            const val = this.value;
            document.getElementById('radius-value').textContent = val + 'px';
            applyRadiusToAllWithValue(val);
            const newSettings = getSettings();
            newSettings.radius = parseInt(val);
            saveSettings(newSettings);
        });

        document.getElementById('font-select').addEventListener('change', function(e) {
            e.stopPropagation();
            const val = this.value;
            document.documentElement.style.setProperty('--main-font', val);
            const newSettings = getSettings();
            newSettings.font = val;
            saveSettings(newSettings);
        });

        document.getElementById('reset-default-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            const defaultSettings = { radius: 10, color: '#49B1F5', font: "'Microsoft YaHei', sans-serif", filter: 'none' };
            document.getElementById('radius-slider').value = defaultSettings.radius;
            document.getElementById('radius-value').textContent = defaultSettings.radius + 'px';
            document.getElementById('font-select').value = defaultSettings.font;
            applyRadiusToAllWithValue(defaultSettings.radius);
            document.documentElement.style.setProperty('--main-color', defaultSettings.color);
            document.documentElement.style.setProperty('--main-font', defaultSettings.font);
            document.documentElement.style.setProperty('--lyx-theme', defaultSettings.color);
            applyFilter('none');
            document.getElementById('current-color-display').style.background = defaultSettings.color;
            document.getElementById('current-color-hex').textContent = defaultSettings.color.toUpperCase();
            document.getElementById('color-wheel').value = defaultSettings.color;
            document.getElementById('color-hex-input').value = defaultSettings.color;
            document.querySelectorAll('.picker-swatch').forEach(s => {
                s.style.borderColor = 'transparent';
                if (s.dataset.color === defaultSettings.color) {
                    s.style.borderColor = '#333';
                }
            });
            currentColor = defaultSettings.color;
            saveSettings(defaultSettings);
            applyThemeToElements();
        });

        applyPanelRadius();
        applyThemeToElements();
    }

    function initCustomPanelButton() {
        const panelBtn = document.getElementById('custom-panel-btn');
        if (panelBtn) {
            panelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                togglePanel();
            });
            panelBtn.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                e.preventDefault();
                togglePanel();
            }, { passive: false });
        }
    }
})();




// ===============================ai摘要====================================//
// 打字机效果
function typeTextMachineStyle(text, targetSelector, options = {}) {
    const {
        delay = 50,
        startDelay = 2000,
        onComplete = null,
        clearBefore = true,
        eraseBefore = true, // 新增：是否以打字机方式清除原文本
        eraseDelay = 30,    // 新增：删除每个字符的间隔
    } = options;

    const el = document.querySelector(targetSelector);
    if (!el || typeof text !== "string") return;

    setTimeout(() => {
        const startTyping = () => {
            let index = 0;
            function renderChar() {
                if (index <= text.length) {
                    el.textContent = text.slice(0, index++);
                    setTimeout(renderChar, delay);
                } else {
                    onComplete && onComplete(el);
                }
            }
            renderChar();
        };

        if (clearBefore) {
            if (eraseBefore && el.textContent.length > 0) {
                let currentText = el.textContent;
                let eraseIndex = currentText.length;

                function eraseChar() {
                    if (eraseIndex > 0) {
                        el.textContent = currentText.slice(0, --eraseIndex);
                        setTimeout(eraseChar, eraseDelay);
                    } else {
                        startTyping(); // 删除完毕后开始打字
                    }
                }

                eraseChar();
            } else {
                el.textContent = "";
                startTyping();
            }
        } else {
            startTyping();
        }
    }, startDelay);
}

function renderAISummary() {
    const summaryEl = document.querySelector('.ai-summary .ai-explanation');
    if (!summaryEl) return;

    const summaryText = summaryEl.getAttribute('data-summary');
    if (summaryText) {
        typeTextMachineStyle(summaryText, ".ai-summary .ai-explanation"); // 如果需要切换，在这里调用另一个函数即可
    }
}

document.addEventListener('pjax:complete', renderAISummary);
document.addEventListener('DOMContentLoaded', renderAISummary);


// ===============================欢迎弹窗====================================//
//首次访问弹窗
if (localStorage.getItem("popWelcomeWindow") != "0") {
    if(document.referrer==undefined||document.referrer.indexOf("love.gzh-czy.cc.cd")!=-1||document.referrer.indexOf("love.gzh-czy.cc.cd")!=-1){ //改成自己域名，注意是referrer!!! qwq
        Snackbar.show({
            pos: "top-right",
            showAction: true,
            text: '欢迎访问本站！'
        })
    }else{
        Snackbar.show({
                pos: "top-right",
                showAction: true,
                text: `欢迎来自${document.referrer.split("://")[1].split("/")[0]}的童鞋访问本站！`
            })
        localStorage.setItem("popWelcomeWindow", "0");
    }
}
if (sessionStorage.getItem("popCookieWindow") != "0") {
    setTimeout(function () {
        Snackbar.show({
            text: '本站使用Cookie和本地/会话存储保证浏览体验和网站统计',
            pos: 'bottom-right',
            actionText: "查看博客声明",
            onActionClick: function (element) {
                window.open("/license")
            },
        })
    }, 3000)
}
//不在弹出Cookie提醒
sessionStorage.setItem("popCookieWindow", "0");
 
//自带上文浏览器提示
 
function browserTC() {
    btf.snackbarShow("");
    Snackbar.show({
        text: '浏览器版本较低，网站样式可能错乱',
        actionText: '关闭',
        duration: '6000',
        pos: 'bottom-right'
    });
}
function browserVersion() {
    var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
    var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1; //判断是否IE<11浏览器
    var isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf("rv:11.0") > -1;
    var isEdge = userAgent.indexOf("Edge") > -1 && !isIE; //Edge浏览器
    var isFirefox = userAgent.indexOf("Firefox") > -1; //Firefox浏览器
    var isOpera = userAgent.indexOf("Opera")>-1 || userAgent.indexOf("OPR")>-1 ; //Opera浏览器
    var isChrome = userAgent.indexOf("Chrome")>-1 && userAgent.indexOf("Safari")>-1 && userAgent.indexOf("Edge")==-1 && userAgent.indexOf("OPR")==-1; //Chrome浏览器
    var isSafari = userAgent.indexOf("Safari")>-1 && userAgent.indexOf("Chrome")==-1 && userAgent.indexOf("Edge")==-1 && userAgent.indexOf("OPR")==-1; //Safari浏览器
    if(isEdge) {
        if(userAgent.split('Edge/')[1].split('.')[0]<90){
            browserTC()
        }
    } else if(isFirefox) {
        if(userAgent.split('Firefox/')[1].split('.')[0]<90){
            browserTC()
        }
    } else if(isOpera) {
        if(userAgent.split('OPR/')[1].split('.')[0]<80){
            browserTC()
        }
    } else if(isChrome) {
        if(userAgent.split('Chrome/')[1].split('.')[0]<90){
            browserTC()
        }
    } else if(isSafari) {
        //不知道Safari哪个版本是该淘汰的老旧版本
    }
}
//2022-10-29修正了一个错误：过期时间应使用toGMTString()，而不是toUTCString()，否则实际过期时间在中国差了8小时
function setCookies(obj, limitTime) {
    let data = new Date(new Date().getTime() + limitTime * 24 * 60 * 60 * 1000).toGMTString()
    for (let i in obj) {
        document.cookie = i + '=' + obj[i] + ';expires=' + data
    }
}
function getCookie(name) {
    var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if (arr = document.cookie.match(reg))
        return unescape(arr[2]);
    else
        return null;
}
if(getCookie('browsertc')!=1){
    setCookies({
        browsertc: 1,
    }, 1);
    browserVersion();
}
