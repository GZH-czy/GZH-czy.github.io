// 在 source/js/custom-control-panel.js 中
(function() {
    // 等待 DOM 加载完成
    document.addEventListener('DOMContentLoaded', function() {
        // 从 localStorage 加载已保存的设置
        loadSettings();

        // 创建控制面板的 HTML 结构
        createControlPanel();

        // 在右下角添加一个“调色板”图标按钮
        addToggleButton();
    });

    // 加载 localStorage 中的设置
    function loadSettings() {
        const settings = getSettings();
        document.documentElement.style.setProperty('--main-radius', settings.radius + 'px');
        document.documentElement.style.setProperty('--main-color', settings.color);
        document.documentElement.style.setProperty('--main-font', settings.font);
    }

    // 获取设置，如果 localStorage 中没有则使用默认值
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

    // 保存设置到 localStorage
    function saveSettings(settings) {
        localStorage.setItem('myBlogSettings', JSON.stringify(settings));
    }

    // 创建控制面板的模态框
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

        // 将面板添加到页面
        const panelContainer = document.createElement('div');
        panelContainer.innerHTML = panelHTML;
        document.body.appendChild(panelContainer.firstElementChild);

        // 绑定控件事件
        const panel = document.getElementById('custom-control-panel');
        const radiusSlider = document.getElementById('radius-slider');
        const radiusValue = document.getElementById('radius-value');
        const colorPicker = document.getElementById('color-picker');
        const fontSelect = document.getElementById('font-select');
        const resetBtn = document.getElementById('reset-default-btn');

        // 从 localStorage 加载设置到控件
        const settings = getSettings();
        radiusSlider.value = settings.radius;
        radiusValue.textContent = settings.radius + 'px';
        colorPicker.value = settings.color;
        // 注意：选择框的值可能不匹配，这里简化处理，只设置默认显示
        // 更严谨的做法是匹配 font 值

        // 滑块事件
        radiusSlider.addEventListener('input', function() {
            const val = this.value;
            radiusValue.textContent = val + 'px';
            document.documentElement.style.setProperty('--main-radius', val + 'px');
            const newSettings = getSettings();
            newSettings.radius = parseInt(val);
            saveSettings(newSettings);
        });

        // 颜色选择事件
        colorPicker.addEventListener('input', function() {
            const val = this.value;
            document.documentElement.style.setProperty('--main-color', val);
            const newSettings = getSettings();
            newSettings.color = val;
            saveSettings(newSettings);
        });

        // 字体选择事件
        fontSelect.addEventListener('change', function() {
            const val = this.value;
            document.documentElement.style.setProperty('--main-font', val);
            const newSettings = getSettings();
            newSettings.font = val;
            saveSettings(newSettings);
        });

        // 恢复默认设置
        resetBtn.addEventListener('click', function() {
            const defaultSettings = { radius: 10, color: '#49B1F5', font: "'Microsoft YaHei', sans-serif" };
            radiusSlider.value = defaultSettings.radius;
            radiusValue.textContent = defaultSettings.radius + 'px';
            colorPicker.value = defaultSettings.color;
            // 需要根据默认字体值匹配选择框选项，这里简化
            document.documentElement.style.setProperty('--main-radius', defaultSettings.radius + 'px');
            document.documentElement.style.setProperty('--main-color', defaultSettings.color);
            document.documentElement.style.setProperty('--main-font', defaultSettings.font);
            saveSettings(defaultSettings);
        });
    }

    // 在右下角添加一个切换按钮
    function addToggleButton() {
        const btn = document.createElement('button');
        btn.id = 'toggle-control-panel-btn';
        btn.innerHTML = '🎨';
        btn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: #49B1F5;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 100000;
            transition: all 0.3s;
        `;
        btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };

        let panelVisible = false;
        btn.addEventListener('click', function() {
            const panel = document.getElementById('custom-control-panel');
            if (panel) {
                panelVisible = !panelVisible;
                panel.style.display = panelVisible ? 'block' : 'none';
            }
        });

        document.body.appendChild(btn);
    }
})();