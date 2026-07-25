// snow.js - 纯色光晕雪花特效
// 使用 Canvas 实现，包含鼠标交互，适合 Hexo Butterfly 主题
// 可直接在浏览器中运行，无需外部依赖

(function() {
    // 确保 canvas 存在并适配屏幕
    const canvas = document.createElement('canvas');
    canvas.id = 'snowCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    // 鼠标位置（默认在画布外，避免初始干扰）
    let mouseX = -9999;
    let mouseY = -9999;

    // 雪花配置（可在此处调整）
    const CONFIG = {
        count: 150,              // 雪花数量（增加更密，减少更流畅）
        minSize: 4,              // 最小半径
        maxSize: 14,             // 最大半径
        speed: 0.6,              // 下降速度系数
        wind: 0.3,               // 水平飘动幅度
        color: 'rgba(255, 255, 255, 0.9)', // 雪花颜色（可改为 'lightblue' 等）
        glowColor: 'rgba(180, 210, 255, 0.4)', // 光晕颜色
        glowBlur: 20,            // 光晕模糊程度
        mouseRadius: 100,        // 鼠标影响半径（雪花会避开此区域）
    };

    // 调整画布大小
    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 鼠标跟踪
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
    });

    // 创建雪花对象
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

    // 初始化雪花
    let snowflakes = [];
    for (let i = 0; i < CONFIG.count; i++) {
        snowflakes.push(createSnowflake());
    }

    // 绘制（核心）
    function drawSnowflake(s) {
        // 计算鼠标排斥偏移
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

        // 边界重置
        if (s.y > height + 50) {
            Object.assign(s, createSnowflake());
            s.y = -20;
            s.x = Math.random() * width;
        }
        if (s.x < -50) s.x = width + 50;
        if (s.x > width + 50) s.x = -50;

        // ---- 绘制带光晕的纯色圆形雪花 ----
        const baseColor = CONFIG.color;
        const glowColor = CONFIG.glowColor;

        // 1. 外部光晕（发光层）
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = CONFIG.glowBlur * (s.radius / 8);
        ctx.globalAlpha = s.opacity * 0.8;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. 内层高亮（更亮的核心）
        ctx.shadowBlur = 0;
        ctx.globalAlpha = s.opacity * 0.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 动画循环
    function animate() {
        // 使用半透明背景产生运动拖尾效果
        ctx.fillStyle = 'rgba(10, 10, 30, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // 绘制所有雪花
        for (const s of snowflakes) {
            drawSnowflake(s);
        }

        requestAnimationFrame(animate);
    }

    animate();

    // 暴露配置以便调试（可选）
    window.__snowConfig = CONFIG;
})();