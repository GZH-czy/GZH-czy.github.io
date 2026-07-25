// source/js/ccp.js
(function() {
    const PRESET_COLORS = [
        '#49B1F5', '#FF6B6B', '#4ECDC4', '#FF9F43', '#A29BFE',
        '#FD79A8', '#00B894', '#E17055', '#0984E3', '#6C5CE7',
        '#FDCB6E', '#E84393', '#00CEC9', '#D63031', '#6C5CE7',
        '#00B894', '#E17055', '#0984E3', '#A29BFE', '#FD79A8'
    ];

    function initCustomPanel() {
        if (document.getElementById('custom-control-panel')) {
            rebindEvents();
            applyRadiusToAll();
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
            const colorPicker = document.getElementById('color-picker-panel');
            if (panel && btn) {
                if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                    hidePanel();
                }
            }
            if (colorPicker) {
                if (!colorPicker.contains(e.target) && e.target.id !== 'current-color-display') {
                    hideColorPicker();
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
                }
            }, 200);
        }
    });

    function applyPanelRadius() {
        const radius = getSettings().radius;
        const panel = document.getElementById('custom-control-panel');
        const colorPicker = document.getElementById('color-picker-panel');
        if (panel) panel.style.borderRadius = radius + 'px';
        if (colorPicker) colorPicker.style.borderRadius = radius + 'px';
    }

    // 只应用圆角，不覆盖字体和文字颜色
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

    // 应用主题色到特定交互元素
    function applyThemeColorToElements(color) {
        // 只应用于链接、按钮、滑块等交互元素
        document.querySelectorAll('a, .btn, .button, .read-more, .more-link, .post-more-link, .page-link, .pagination a, .pagination .current, .pagination .extend, .pagination .space, .pagination .page-number, button, input[type="submit"], input[type="button"], .search-btn, .comment-btn, .submit-btn, .tag, .category, .post-tag, .post-category, .gallery, .swiper-button-next, .swiper-button-prev, .slider, .range-slider, .color-swatch, .picker-swatch, #custom-panel-btn, #close-panel-btn, #close-color-picker-btn, .filter-btn, #reset-default-btn, #current-color-display, #color-wheel, #color-hex-input, #font-select, #radius-slider').forEach(el => {
            if (el.tagName === 'A' || el.classList.contains('btn') || el.classList.contains('button')) {
                el.style.color = color;
            }
            if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.classList.contains('btn') || el.classList.contains('button')) {
                el.style.backgroundColor = color;
                el.style.borderColor = color;
            }
            if (el.id === 'current-color-display' || el.id === 'color-wheel') {
                el.style.backgroundColor = color;
            }
            if (el.classList.contains('color-swatch') || el.classList.contains('picker-swatch')) {
                if (el.dataset.color === color) {
                    el.style.borderColor = color;
                }
            }
            if (el.classList.contains('filter-btn') || el.id === 'reset-default-btn' || el.id === 'close-panel-btn' || el.id === 'close-color-picker-btn' || el.id === 'custom-panel-btn') {
                el.style.backgroundColor = 'transparent';
                el.style.color = '#333';
                if (el.id === 'custom-panel-btn') {
                    el.style.color = '#fff';
                    el.style.backgroundColor = color;
                }
            }
            if (el.id === 'radius-slider' || el.id === 'font-select' || el.id === 'color-hex-input') {
                el.style.borderColor = color;
                el.style.outlineColor = color;
            }
        });
        // 设置主色变量供CSS使用
        document.documentElement.style.setProperty('--main-color', color);
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
            newEl.addEventListener('click', function() {
                const color = this.dataset.color;
                applyColor(color);
                hideColorPicker();
            });
        });

        // 色环
        const colorWheel = document.getElementById('color-wheel');
        if (colorWheel) {
            const newWheel = colorWheel.cloneNode(true);
            colorWheel.parentNode.replaceChild(newWheel, colorWheel);
            newWheel.addEventListener('input', function() {
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
            newInput.addEventListener('input', function() {
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
            newEl.addEventListener('click', function() {
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

        // 圆角滑块
        const radiusSlider = document.getElementById('radius-slider');
        if (radiusSlider) {
            const newSlider = radiusSlider.cloneNode(true);
            radiusSlider.parentNode.replaceChild(newSlider, radiusSlider);
            newSlider.addEventListener('input', function() {
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
            newSelect.addEventListener('change', function() {
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
            newResetBtn.addEventListener('click', function() {
                const defaultSettings = { radius: 10, color: '#49B1F5', font: "'Microsoft YaHei', sans-serif", filter: 'none' };
                document.getElementById('radius-slider').value = defaultSettings.radius;
                document.getElementById('radius-value').textContent = defaultSettings.radius + 'px';
                document.getElementById('font-select').value = defaultSettings.font;
                applyRadiusToAllWithValue(defaultSettings.radius);
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
                applyColor(defaultSettings.color);
                saveSettings(defaultSettings);
            });
        }

        const settings = getSettings();
        applyRadiusToAllWithValue(settings.radius);
        applyFilter(settings.filter);
        applyColor(settings.color);
        applyPanelRadius();
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
        }
    }

    function hidePanel() {
        const panel = document.getElementById('custom-control-panel');
        if (panel) {
            panel.classList.remove('panel-visible');
            panel.classList.add('panel-hidden');
        }
        hideColorPicker();
    }

    function showColorPicker() {
        const picker = document.getElementById('color-picker-panel');
        if (picker) {
            picker.classList.remove('picker-hidden');
            picker.classList.add('picker-visible');
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
        // 应用到交互元素（链接、按钮等）
        applyThemeColorToElements(color);
        // 更新显示
        document.getElementById('current-color-display').style.background = color;
        document.getElementById('current-color-hex').textContent = color.toUpperCase();
        document.getElementById('color-wheel').value = color;
        document.getElementById('color-hex-input').value = color;
        // 高亮预设颜色
        document.querySelectorAll('.picker-swatch').forEach(s => {
            s.style.borderColor = 'transparent';
            if (s.dataset.color === color) {
                s.style.borderColor = '#333';
            }
        });
        // 保存设置
        const newSettings = getSettings();
        newSettings.color = color;
        saveSettings(newSettings);
    }

    function loadSettings() {
        const settings = getSettings();
        document.documentElement.style.setProperty('--main-radius', settings.radius + 'px');
        applyFilter(settings.filter);
        setTimeout(function() {
            applyRadiusToAllWithValue(settings.radius);
            applyPanelRadius();
            applyColor(settings.color);
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
        // ... (面板HTML和事件绑定，与之前完全相同，此处省略以节省空间) ...
        // 注意：需要保留之前的 createControlPanel 完整代码
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