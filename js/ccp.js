// source/js/ccp.js
(function() {
    function initCustomPanel() {
        if (document.getElementById('custom-control-panel')) {
            rebindEvents();
            applyRadiusToAll();
            // 同时更新面板本身的圆角
            applyPanelRadius();
            return;
        }
        loadSettings();
        createControlPanel();
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            panel.classList.add('panel-hidden');
        }
        initCustomPanelButton();
        document.addEventListener('click', function(e) {
            const panel = document.getElementById('custom-control-panel');
            const btn = document.getElementById('custom-panel-btn');
            if (panel && btn) {
                if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                    hidePanel();
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomPanel);
    } else {
        initCustomPanel();
    }

    document.addEventListener('pjax:complete', function() {
        setTimeout(function() {
            initCustomPanel();
        }, 50);
    });

    document.addEventListener('pjax:success', function() {
        setTimeout(function() {
            initCustomPanel();
        }, 50);
    });

    // 应用面板本身的圆角
    function applyPanelRadius() {
        const radius = getSettings().radius;
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            panel.style.borderRadius = radius + 'px';
        }
    }

    function applyRadiusToAll() {
        const radius = getSettings().radius;
        document.documentElement.style.setProperty('--main-radius', radius + 'px');
        // 更全面的选择器覆盖
        const selectors = [
            '.card-widget', '.recent-post-item', '.layout-page', '.post-block',
            '.recent-post-item', '.card', '.post', '.article', '.entry', '.blog-card',
            '.layout', '.main', '.container', '.content', '.page',
            // 文章页面的背景
            '.post-content', '.article-container', '.post-body', '.markdown-body',
            '.page-content', '.main-content', '.content-area',
            // Butterfly 特有的
            '#post', '.post-wrap', '.article-wrap', '.blog-post',
            '.post-main', '.post-container', '.post-inner',
            // 任何包含 .post 的元素
            '[class*="post"]', '[class*="article"]', '[class*="content"]'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.borderRadius = radius + 'px';
            });
        });
        // 同时更新面板
        applyPanelRadius();
    }

    function rebindEvents() {
        const panelBtn = document.getElementById('custom-panel-btn');
        if (panelBtn) {
            panelBtn.replaceWith(panelBtn.cloneNode(true));
            const newBtn = document.getElementById('custom-panel-btn');
            newBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const panel = document.getElementById('custom-control-panel');
                if (panel) {
                    if (panel.classList.contains('panel-hidden')) {
                        showPanel();
                    } else {
                        hidePanel();
                    }
                }
            });
        }

        const closeBtn = document.getElementById('close-panel-btn');
        if (closeBtn) {
            closeBtn.replaceWith(closeBtn.cloneNode(true));
            const newCloseBtn = document.getElementById('close-panel-btn');
            newCloseBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hidePanel();
            });
        }

        document.querySelectorAll('.color-swatch').forEach(el => {
            el.replaceWith(el.cloneNode(true));
        });
        document.querySelectorAll('.color-swatch').forEach(el => {
            el.addEventListener('click', function() {
                const color = this.dataset.color;
                document.documentElement.style.setProperty('--main-color', color);
                document.getElementById('current-color-display').style.background = color;
                document.getElementById('current-color-hex').textContent = color.toUpperCase();
                document.querySelectorAll('.color-swatch').forEach(s => {
                    s.style.borderColor = 'transparent';
                    s.style.transform = 'scale(1)';
                });
                this.style.borderColor = '#333';
                this.style.transform = 'scale(1.1)';
                const newSettings = getSettings();
                newSettings.color = color;
                saveSettings(newSettings);
            });
        });

        document.querySelectorAll('.filter-btn').forEach(el => {
            el.replaceWith(el.cloneNode(true));
        });
        document.querySelectorAll('.filter-btn').forEach(el => {
            el.addEventListener('click', function() {
                const filter = this.dataset.filter;
                applyFilter(filter);
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.style.borderColor = '#e0e0e0';
                    b.style.background = 'transparent';
                });
                this.style.borderColor = '#49B1F5';
                this.style.background = '#f0f8ff';
                const newSettings = getSettings();
                newSettings.filter = filter;
                saveSettings(newSettings);
            });
        });

        const radiusSlider = document.getElementById('radius-slider');
        if (radiusSlider) {
            radiusSlider.replaceWith(radiusSlider.cloneNode(true));
            const newSlider = document.getElementById('radius-slider');
            newSlider.addEventListener('input', function() {
                const val = this.value;
                document.getElementById('radius-value').textContent = val + 'px';
                applyRadiusToAllWithValue(val);
                const newSettings = getSettings();
                newSettings.radius = parseInt(val);
                saveSettings(newSettings);
            });
        }

        const fontSelect = document.getElementById('font-select');
        if (fontSelect) {
            fontSelect.replaceWith(fontSelect.cloneNode(true));
            const newFontSelect = document.getElementById('font-select');
            newFontSelect.addEventListener('change', function() {
                const val = this.value;
                document.documentElement.style.setProperty('--main-font', val);
                const newSettings = getSettings();
                newSettings.font = val;
                saveSettings(newSettings);
            });
        }

        const resetBtn = document.getElementById('reset-default-btn');
        if (resetBtn) {
            resetBtn.replaceWith(resetBtn.cloneNode(true));
            const newResetBtn = document.getElementById('reset-default-btn');
            newResetBtn.addEventListener('click', function() {
                const defaultSettings = { radius: 10, color: '#49B1F5', font: "'Microsoft YaHei', sans-serif", filter: 'none' };
                document.getElementById('radius-slider').value = defaultSettings.radius;
                document.getElementById('radius-value').textContent = defaultSettings.radius + 'px';
                document.getElementById('font-select').value = "'Microsoft YaHei', sans-serif";
                applyRadiusToAllWithValue(defaultSettings.radius);
                document.documentElement.style.setProperty('--main-color', defaultSettings.color);
                document.documentElement.style.setProperty('--main-font', defaultSettings.font);
                applyFilter('none');
                document.querySelectorAll('.color-swatch').forEach(s => {
                    s.style.borderColor = 'transparent';
                    s.style.transform = 'scale(1)';
                    if (s.dataset.color === defaultSettings.color) {
                        s.style.borderColor = '#333';
                        s.style.transform = 'scale(1.1)';
                    }
                });
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.style.borderColor = '#e0e0e0';
                    b.style.background = 'transparent';
                    if (b.dataset.filter === 'none') {
                        b.style.borderColor = '#49B1F5';
                        b.style.background = '#f0f8ff';
                    }
                });
                document.getElementById('current-color-display').style.background = defaultSettings.color;
                document.getElementById('current-color-hex').textContent = defaultSettings.color.toUpperCase();
                saveSettings(defaultSettings);
            });
        }

        const settings = getSettings();
        applyRadiusToAllWithValue(settings.radius);
        applyFilter(settings.filter);
        document.documentElement.style.setProperty('--main-color', settings.color);
        document.documentElement.style.setProperty('--main-font', settings.font);
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
            '.post-main', '.post-container', '.post-inner',
            '[class*="post"]', '[class*="article"]', '[class*="content"]'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.borderRadius = radius + 'px';
            });
        });
        applyPanelRadius();
    }

    function loadSettings() {
        const settings = getSettings();
        document.documentElement.style.setProperty('--main-radius', settings.radius + 'px');
        document.documentElement.style.setProperty('--main-color', settings.color);
        document.documentElement.style.setProperty('--main-font', settings.font);
        applyFilter(settings.filter);
        setTimeout(function() {
            applyRadiusToAllWithValue(settings.radius);
            applyPanelRadius();
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

    function showPanel() {
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            panel.classList.remove('panel-hidden');
            panel.classList.add('panel-visible');
        }
    }

    function hidePanel() {
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            panel.classList.remove('panel-visible');
            panel.classList.add('panel-hidden');
        }
    }

    function createControlPanel() {
        const panelHTML = `
            <div id="custom-control-panel" class="panel-hidden" style="position:fixed; bottom:70px; right:10px; width:300px; max-width:calc(100vw - 20px); background:#fff; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.25); padding:20px; z-index:99999; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333; max-height:80vh; overflow-y:auto; opacity:0; transform:scale(0.9) translateY(10px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events:none; transform-origin: bottom right; font-size:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:2px solid #f0f0f0; padding-bottom:10px;">
                    <h3 style="margin:0; font-size:16px; font-weight:600;">🎨 实时自定义</h3>
                    <button id="close-panel-btn" style="background:none; border:none; font-size:20px; cursor:pointer; color:#888; padding:0 6px;" aria-label="关闭面板">✕</button>
                </div>
                
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; margin-bottom:6px; font-weight:600;">主题色</label>
                    <div id="color-palette" style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${['#49B1F5', '#FF6B6B', '#4ECDC4', '#FF9F43', '#A29BFE', '#FD79A8', '#00B894', '#E17055', '#0984E3', '#6C5CE7'].map(c => `
                            <div class="color-swatch" data-color="${c}" style="width:28px; height:28px; border-radius:50%; background:${c}; cursor:pointer; border:2px solid transparent; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.transform='scale(1.12)'" onmouseout="this.style.transform='scale(1)'"></div>
                        `).join('')}
                    </div>
                    <div style="margin-top:6px; display:flex; align-items:center; gap:8px;">
                        <span style="font-size:12px; color:#888;">当前:</span>
                        <span id="current-color-display" style="display:inline-block; width:20px; height:20px; border-radius:4px; background:#49B1F5; border:1px solid #ddd;"></span>
                        <span id="current-color-hex" style="font-size:12px; font-family:monospace; color:#555;">#49B1F5</span>
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; margin-bottom:6px; font-weight:600;">屏幕滤镜</label>
                    <div id="filter-options" style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${[
                            {id: 'none', label: '关闭'},
                            {id: 'dark', label: '暗化'},
                            {id: 'sunset', label: '日落'},
                            {id: 'grayscale', label: '灰度'}
                        ].map(f => `
                            <button class="filter-btn" data-filter="${f.id}" style="padding:4px 12px; border:2px solid #e0e0e0; background:transparent; border-radius:16px; cursor:pointer; font-size:12px; transition: all 0.2s; ${f.id === 'none' ? 'border-color:#49B1F5; background:#f0f8ff;' : ''}">${f.label}</button>
                        `).join('')}
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; margin-bottom:4px; font-weight:600;">全局圆角 (px)</label>
                    <input type="range" id="radius-slider" min="0" max="30" value="10" style="width:100%;">
                    <span id="radius-value" style="display:inline-block; margin-top:2px; font-size:12px; color:#666;">10px</span>
                </div>

                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:13px; margin-bottom:4px; font-weight:600;">字体</label>
                    <select id="font-select" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; font-size:13px;">
                        <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
                        <option value="'PingFang SC', 'Microsoft YaHei', sans-serif">苹方</option>
                        <option value="'Noto Sans SC', sans-serif">思源黑体</option>
                        <option value="'Georgia', serif">Georgia (衬线)</option>
                        <option value="'Courier New', monospace">Courier New (等宽)</option>
                    </select>
                </div>

                <button id="reset-default-btn" style="width:100%; padding:8px; background:#f0f0f0; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px; transition: background 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">恢复默认设置</button>
            </div>
        `;

        const panelContainer = document.createElement('div');
        panelContainer.innerHTML = panelHTML;
        document.body.appendChild(panelContainer.firstElementChild);

        const closeBtn = document.getElementById('close-panel-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hidePanel();
            });
        }

        const settings = getSettings();
        const radiusSlider = document.getElementById('radius-slider');
        const radiusValue = document.getElementById('radius-value');
        const fontSelect = document.getElementById('font-select');
        const currentColorDisplay = document.getElementById('current-color-display');
        const currentColorHex = document.getElementById('current-color-hex');

        radiusSlider.value = settings.radius;
        radiusValue.textContent = settings.radius + 'px';
        currentColorDisplay.style.background = settings.color;
        currentColorHex.textContent = settings.color.toUpperCase();

        document.querySelectorAll('.color-swatch').forEach(el => {
            if (el.dataset.color === settings.color) {
                el.style.borderColor = '#333';
                el.style.transform = 'scale(1.1)';
            }
        });

        document.querySelectorAll('.filter-btn').forEach(el => {
            if (el.dataset.filter === settings.filter) {
                el.style.borderColor = '#49B1F5';
                el.style.background = '#f0f8ff';
            }
        });

        if (fontSelect.querySelector(`option[value="${settings.font}"]`)) {
            fontSelect.value = settings.font;
        }

        document.querySelectorAll('.color-swatch').forEach(el => {
            el.addEventListener('click', function() {
                const color = this.dataset.color;
                document.documentElement.style.setProperty('--main-color', color);
                currentColorDisplay.style.background = color;
                currentColorHex.textContent = color.toUpperCase();
                document.querySelectorAll('.color-swatch').forEach(s => {
                    s.style.borderColor = 'transparent';
                    s.style.transform = 'scale(1)';
                });
                this.style.borderColor = '#333';
                this.style.transform = 'scale(1.1)';
                const newSettings = getSettings();
                newSettings.color = color;
                saveSettings(newSettings);
            });
        });

        document.querySelectorAll('.filter-btn').forEach(el => {
            el.addEventListener('click', function() {
                const filter = this.dataset.filter;
                applyFilter(filter);
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.style.borderColor = '#e0e0e0';
                    b.style.background = 'transparent';
                });
                this.style.borderColor = '#49B1F5';
                this.style.background = '#f0f8ff';
                const newSettings = getSettings();
                newSettings.filter = filter;
                saveSettings(newSettings);
            });
        });

        radiusSlider.addEventListener('input', function() {
            const val = this.value;
            radiusValue.textContent = val + 'px';
            applyRadiusToAllWithValue(val);
            const newSettings = getSettings();
            newSettings.radius = parseInt(val);
            saveSettings(newSettings);
        });

        fontSelect.addEventListener('change', function() {
            const val = this.value;
            document.documentElement.style.setProperty('--main-font', val);
            const newSettings = getSettings();
            newSettings.font = val;
            saveSettings(newSettings);
        });

        document.getElementById('reset-default-btn').addEventListener('click', function() {
            const defaultSettings = { radius: 10, color: '#49B1F5', font: "'Microsoft YaHei', sans-serif", filter: 'none' };
            radiusSlider.value = defaultSettings.radius;
            radiusValue.textContent = defaultSettings.radius + 'px';
            fontSelect.value = "'Microsoft YaHei', sans-serif";
            applyRadiusToAllWithValue(defaultSettings.radius);
            document.documentElement.style.setProperty('--main-color', defaultSettings.color);
            document.documentElement.style.setProperty('--main-font', defaultSettings.font);
            applyFilter('none');
            document.querySelectorAll('.color-swatch').forEach(s => {
                s.style.borderColor = 'transparent';
                s.style.transform = 'scale(1)';
                if (s.dataset.color === defaultSettings.color) {
                    s.style.borderColor = '#333';
                    s.style.transform = 'scale(1.1)';
                }
            });
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.style.borderColor = '#e0e0e0';
                b.style.background = 'transparent';
                if (b.dataset.filter === 'none') {
                    b.style.borderColor = '#49B1F5';
                    b.style.background = '#f0f8ff';
                }
            });
            currentColorDisplay.style.background = defaultSettings.color;
            currentColorHex.textContent = defaultSettings.color.toUpperCase();
            saveSettings(defaultSettings);
        });

        // 立即应用面板圆角
        applyPanelRadius();
    }

    function initCustomPanelButton() {
        const panelBtn = document.getElementById('custom-panel-btn');
        if (panelBtn) {
            panelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const panel = document.getElementById('custom-control-panel');
                if (panel) {
                    if (panel.classList.contains('panel-hidden')) {
                        showPanel();
                    } else {
                        hidePanel();
                    }
                }
            });
        }
    }
})();