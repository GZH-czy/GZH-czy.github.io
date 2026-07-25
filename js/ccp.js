// source/js/custom-control-panel.js
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        loadSettings();
        createControlPanel();
        // 初始隐藏面板
        const panel = document.getElementById('custom-control-panel');
        if (panel) panel.style.display = 'none';
        // 绑定自定义按钮事件
        initCustomPanelButton();
    });

    function loadSettings() {
        const settings = getSettings();
        document.documentElement.style.setProperty('--main-radius', settings.radius + 'px');
        document.documentElement.style.setProperty('--main-color', settings.color);
        document.documentElement.style.setProperty('--main-font', settings.font);
    }

    function getSettings() {
        const defaultSettings = {
            radius: 10,
            color: '#49B1F5',
            font: "'Microsoft YaHei', sans-serif"
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

    function createControlPanel() {
        const panelHTML = `
            <div id="custom-control-panel" style="display:none; position:fixed; bottom:80px; right:20px; width:300px; background:#fff; border-radius:12px; box-shadow:0 5px 30px rgba(0,0,0,0.2); padding:20px; z-index:99999; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333;">
                <h3 style="margin-top:0; text-align:center; border-bottom:1px solid #eee; padding-bottom:10px;">🎨 实时自定义</h3>
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:14px; margin-bottom:5px; font-weight:600;">全局圆角 (px)</label>
                    <input type="range" id="radius-slider" min="0" max="30" value="10" style="width:100%;">
                    <span id="radius-value" style="display:inline-block; margin-top:3px; font-size:13px; color:#666;">10px</span>
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:14px; margin-bottom:5px; font-weight:600;">主题色</label>
                    <input type="color" id="color-picker" value="#49B1F5" style="width:100%; height:40px; border:1px solid #ddd; border-radius:6px; cursor:pointer;">
                </div>
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
                <button id="reset-default-btn" style="width:100%; padding:10px; background:#f0f0f0; border:none; border-radius:6px; cursor:pointer; font-weight:600;">恢复默认设置</button>
            </div>
        `;
        const panelContainer = document.createElement('div');
        panelContainer.innerHTML = panelHTML;
        document.body.appendChild(panelContainer.firstElementChild);

        const panel = document.getElementById('custom-control-panel');
        const radiusSlider = document.getElementById('radius-slider');
        const radiusValue = document.getElementById('radius-value');
        const colorPicker = document.getElementById('color-picker');
        const fontSelect = document.getElementById('font-select');
        const resetBtn = document.getElementById('reset-default-btn');

        const settings = getSettings();
        radiusSlider.value = settings.radius;
        radiusValue.textContent = settings.radius + 'px';
        colorPicker.value = settings.color;

        radiusSlider.addEventListener('input', function() {
            const val = this.value;
            radiusValue.textContent = val + 'px';
            document.documentElement.style.setProperty('--main-radius', val + 'px');
            const newSettings = getSettings();
            newSettings.radius = parseInt(val);
            saveSettings(newSettings);
        });

        colorPicker.addEventListener('input', function() {
            const val = this.value;
            document.documentElement.style.setProperty('--main-color', val);
            const newSettings = getSettings();
            newSettings.color = val;
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
            const defaultSettings = { radius: 10, color: '#49B1F5', font: "'Microsoft YaHei', sans-serif" };
            radiusSlider.value = defaultSettings.radius;
            radiusValue.textContent = defaultSettings.radius + 'px';
            colorPicker.value = defaultSettings.color;
            document.documentElement.style.setProperty('--main-radius', defaultSettings.radius + 'px');
            document.documentElement.style.setProperty('--main-color', defaultSettings.color);
            document.documentElement.style.setProperty('--main-font', defaultSettings.font);
            saveSettings(defaultSettings);
        });
    }

    function initCustomPanelButton() {
        const panelBtn = document.getElementById('custom-panel-btn');
        if (panelBtn) {
            panelBtn.addEventListener('click', function() {
                const panel = document.getElementById('custom-control-panel');
                if (panel) {
                    const isHidden = panel.style.display === 'none';
                    panel.style.display = isHidden ? 'block' : 'none';
                }
            });
        }
    }
})();