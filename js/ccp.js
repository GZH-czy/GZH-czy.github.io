// source/js/custom-control-panel.js
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        loadSettings();
        createControlPanel();
        const panel = document.getElementById('custom-control-panel');
        if (panel) panel.style.display = 'none';
        initCustomPanelButton();
        // 点击面板外部关闭
        document.addEventListener('click', function(e) {
            const panel = document.getElementById('custom-control-panel');
            const btn = document.getElementById('custom-panel-btn');
            if (panel && btn) {
                if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                    panel.style.display = 'none';
                }
            }
        });
    });

    function loadSettings() {
        const settings = getSettings();
        document.documentElement.style.setProperty('--main-radius', settings.radius + 'px');
        document.documentElement.style.setProperty('--main-color', settings.color);
        document.documentElement.style.setProperty('--main-font', settings.font);
        applyFilter(settings.filter);
    }

    function getSettings() {
        const defaultSettings = {
            radius: 10,
            color: '#49B1F5', // Butterfly 默认主题色
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
        const bg = document.getElementById('body-wrap');
        if (!bg) return;
        // 移除所有滤镜类
        bg.classList.remove('filter-dark', 'filter-sunset', 'filter-grayscale');
        if (filterType === 'dark') {
            bg.classList.add('filter-dark');
        } else if (filterType === 'sunset') {
            bg.classList.add('filter-sunset');
        } else if (filterType === 'grayscale') {
            bg.classList.add('filter-grayscale');
        }
    }

    function createControlPanel() {
        const panelHTML = `
            <div id="custom-control-panel" style="display:none; position:fixed; bottom:80px; right:20px; width:320px; background:#fff; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.25); padding:24px; z-index:99999; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333; max-height:80vh; overflow-y:auto;">
                <h3 style="margin:0 0 20px 0; text-align:center; font-size:18px; font-weight:600; border-bottom:2px solid #f0f0f0; padding-bottom:12px;">🎨 实时自定义</h3>
                
                <!-- 主题色 -->
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:14px; margin-bottom:8px; font-weight:600;">主题色</label>
                    <div id="color-palette" style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${['#49B1F5', '#FF6B6B', '#4ECDC4', '#FF9F43', '#A29BFE', '#FD79A8', '#00B894', '#E17055', '#0984E3', '#6C5CE7'].map(c => `
                            <div class="color-swatch" data-color="${c}" style="width:32px; height:32px; border-radius:50%; background:${c}; cursor:pointer; border:2px solid transparent; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'"></div>
                        `).join('')}
                    </div>
                    <div style="margin-top:8px; display:flex; align-items:center; gap:10px;">
                        <span style="font-size:13px; color:#888;">当前:</span>
                        <span id="current-color-display" style="display:inline-block; width:24px; height:24px; border-radius:4px; background:#49B1F5; border:1px solid #ddd;"></span>
                        <span id="current-color-hex" style="font-size:13px; font-family:monospace; color:#555;">#49B1F5</span>
                    </div>
                </div>

                <!-- 滤镜 -->
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:14px; margin-bottom:8px; font-weight:600;">背景滤镜</label>
                    <div id="filter-options" style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${[
                            {id: 'none', label: '关闭'},
                            {id: 'dark', label: '暗化'},
                            {id: 'sunset', label: '日落'},
                            {id: 'grayscale', label: '灰度'}
                        ].map(f => `
                            <button class="filter-btn" data-filter="${f.id}" style="padding:6px 14px; border:2px solid #e0e0e0; background:transparent; border-radius:20px; cursor:pointer; font-size:13px; transition: all 0.2s; ${f.id === 'none' ? 'border-color:#49B1F5; background:#f0f8ff;' : ''}">${f.label}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- 全局圆角 -->
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:14px; margin-bottom:5px; font-weight:600;">全局圆角 (px)</label>
                    <input type="range" id="radius-slider" min="0" max="30" value="10" style="width:100%;">
                    <span id="radius-value" style="display:inline-block; margin-top:3px; font-size:13px; color:#666;">10px</span>
                </div>

                <!-- 字体 -->
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:14px; margin-bottom:5px; font-weight:600;">字体</label>
                    <select id="font-select" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;">
                        <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
                        <option value="'PingFang SC', 'Microsoft YaHei', sans-serif">苹方</option>
                        <option value="'Noto Sans SC', sans-serif">思源黑体</option>
                        <option value="'Georgia', serif">Georgia (衬线)</option>
                        <option value="'Courier New', monospace">Courier New (等宽)</option>
                    </select>
                </div>

                <button id="reset-default-btn" style="width:100%; padding:10px; background:#f0f0f0; border:none; border-radius:8px; cursor:pointer; font-weight:600; transition: background 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">恢复默认设置</button>
            </div>
        `;

        const panelContainer = document.createElement('div');
        panelContainer.innerHTML = panelHTML;
        document.body.appendChild(panelContainer.firstElementChild);

        // --- 事件绑定 ---
        const panel = document.getElementById('custom-control-panel');
        const radiusSlider = document.getElementById('radius-slider');
        const radiusValue = document.getElementById('radius-value');
        const fontSelect = document.getElementById('font-select');
        const resetBtn = document.getElementById('reset-default-btn');
        const currentColorDisplay = document.getElementById('current-color-display');
        const currentColorHex = document.getElementById('current-color-hex');

        // 加载保存的设置
        const settings = getSettings();
        radiusSlider.value = settings.radius;
        radiusValue.textContent = settings.radius + 'px';
        currentColorDisplay.style.background = settings.color;
        currentColorHex.textContent = settings.color.toUpperCase();
        // 高亮当前颜色
        document.querySelectorAll('.color-swatch').forEach(el => {
            if (el.dataset.color === settings.color) {
                el.style.borderColor = '#333';
                el.style.transform = 'scale(1.1)';
            }
        });
        // 高亮当前滤镜
        document.querySelectorAll('.filter-btn').forEach(el => {
            if (el.dataset.filter === settings.filter) {
                el.style.borderColor = '#49B1F5';
                el.style.background = '#f0f8ff';
            }
        });
        // 匹配字体
        if (fontSelect.querySelector(`option[value="${settings.font}"]`)) {
            fontSelect.value = settings.font;
        }

        // 颜色点击事件
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

        // 滤镜点击事件
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
            document.documentElement.style.setProperty('--main-radius', val + 'px');
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

        resetBtn.addEventListener('click', function() {
            const defaultSettings = { radius: 10, color: '#49B1F5', font: "'Microsoft YaHei', sans-serif", filter: 'none' };
            radiusSlider.value = defaultSettings.radius;
            radiusValue.textContent = defaultSettings.radius + 'px';
            fontSelect.value = "'Microsoft YaHei', sans-serif";
            document.documentElement.style.setProperty('--main-radius', defaultSettings.radius + 'px');
            document.documentElement.style.setProperty('--main-color', defaultSettings.color);
            document.documentElement.style.setProperty('--main-font', defaultSettings.font);
            applyFilter('none');
            // 重置颜色高亮
            document.querySelectorAll('.color-swatch').forEach(s => {
                s.style.borderColor = 'transparent';
                s.style.transform = 'scale(1)';
                if (s.dataset.color === defaultSettings.color) {
                    s.style.borderColor = '#333';
                    s.style.transform = 'scale(1.1)';
                }
            });
            // 重置滤镜高亮
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

        // 点击齿轮按钮切换面板（已经在 initCustomPanelButton 中处理）
    }

    function initCustomPanelButton() {
        const panelBtn = document.getElementById('custom-panel-btn');
        if (panelBtn) {
            panelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const panel = document.getElementById('custom-control-panel');
                if (panel) {
                    const isHidden = panel.style.display === 'none';
                    panel.style.display = isHidden ? 'block' : 'none';
                }
            });
        }
    }

    // 确保 rightside.pug 中的按钮能触发
    // 这个函数会在 DOM 加载完成后被调用
    window.initCustomPanel = function() {
        const panelBtn = document.getElementById('custom-panel-btn');
        if (panelBtn) {
            panelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const panel = document.getElementById('custom-control-panel');
                if (panel) {
                    const isHidden = panel.style.display === 'none';
                    panel.style.display = isHidden ? 'block' : 'none';
                }
            });
        }
    };
})();