// snow.js - 透明背景无拖尾光晕雪花（自适应屏幕）
(function() {
    // 创建画布（透明背景）
    const canvas = document.createElement('canvas');
    canvas.id = 'snowCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let mouseX = -9999, mouseY = -9999;

    // ----- 自适应配置 -----
    // 基准：1920x1080 桌面下雪花数量为 150
    const BASE_COUNT = 170;
    const BASE_WIDTH = 1920;
    const BASE_HEIGHT = 1080;
    const BASE_AREA = BASE_WIDTH * BASE_HEIGHT;

    // 雪花配置（部分参数也可以根据屏幕微调）
    const CONFIG = {
        minSize: 3,
        maxSize: 7,
        speed: 0.9,
        wind: 0.3,
        color: 'rgba(255, 255, 255, 0.9)',
        glowColor: 'rgba(180, 210, 255, 0.3)',
        glowBlur: 15,
        mouseRadius: 150,
    };

    // ----- 根据屏幕面积计算雪花数量 -----
    function getSnowflakeCount() {
        const area = width * height;
        // 按面积比例计算，但设置上限和下限，避免极端情况
        let count = Math.round((area / BASE_AREA) * BASE_COUNT);
        // 限制范围：最少 30 个，最多 200 个
        return Math.min(200, Math.max(30, count));
    }

    let snowflakes = [];

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // 屏幕尺寸变化时，重新生成雪花
        const newCount = getSnowflakeCount();
        // 保留现有雪花数量，只增不减（避免闪烁）
        while (snowflakes.length < newCount) {
            snowflakes.push(createSnowflake());
        }
        // 如果数量过多，随机移除一些
        while (snowflakes.length > newCount) {
            const idx = Math.floor(Math.random() * snowflakes.length);
            snowflakes.splice(idx, 1);
        }
    }
    window.addEventListener('resize', resizeCanvas);

    // 鼠标跟踪
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
    });

    function createSnowflake() {
        return {
            x: Math.random() * width,
            y: Math.random() * height - height,
            radius: CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize),
            speed: CONFIG.speed + Math.random() * 0.6,
            opacity: 0.5 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
        };
    }

    // 初始化画布和雪花
    resizeCanvas();

    // ----- 绘制核心（与之前相同） -----
    function drawSnowflake(s) {
        // 鼠标排斥
        let dx = 0, dy = 0;
        const distX = s.x - mouseX;
        const distY = s.y - mouseY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        if (dist < CONFIG.mouseRadius && dist > 0) {
            const angle = Math.atan2(distY, distX);
            const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius * 8;
            dx = Math.cos(angle) * force;
            dy = Math.sin(angle) * force;
        }

        // 更新位置
        s.x += Math.sin(s.phase + Date.now() * 0.001) * CONFIG.wind + dx * 0.1;
        s.y += s.speed * 0.8 + dy * 0.1;
        s.phase += 0.01;

        if (s.y > height + 50) {
            Object.assign(s, createSnowflake());
            s.y = -20;
            s.x = Math.random() * width;
        }
        if (s.x < -50) s.x = width + 50;
        if (s.x > width + 50) s.x = -50;

        // 绘制
        ctx.save();
        ctx.shadowColor = CONFIG.glowColor;
        ctx.shadowBlur = CONFIG.glowBlur * (s.radius / 8);
        ctx.globalAlpha = s.opacity * 0.85;
        ctx.fillStyle = CONFIG.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = s.opacity * 0.4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (const s of snowflakes) {
            drawSnowflake(s);
        }
        requestAnimationFrame(animate);
    }

    animate();
})();