// snow.js - 透明背景无拖尾光晕雪花
(function() {
    // 创建画布（透明背景）
    const canvas = document.createElement('canvas');
    canvas.id = 'snowCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let mouseX = -9999, mouseY = -9999;

    // 雪花配置
    const CONFIG = {
        count: 120,
        minSize: 3,
        maxSize: 6,
        speed: 0.8,
        wind: 0.3,
        color: 'rgba(255, 255, 255, 0.9)',
        glowColor: 'rgba(180, 210, 255, 0.3)',
        glowBlur: 15,
        mouseRadius: 150,
    };

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

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

    let snowflakes = [];
    for (let i = 0; i < CONFIG.count; i++) {
        snowflakes.push(createSnowflake());
    }

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

        // 绘制雪花（带光晕）
        ctx.save();
        // 光晕层
        ctx.shadowColor = CONFIG.glowColor;
        ctx.shadowBlur = CONFIG.glowBlur * (s.radius / 8);
        ctx.globalAlpha = s.opacity * 0.85;
        ctx.fillStyle = CONFIG.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // 高亮核心（可选）
        ctx.shadowBlur = 0;
        ctx.globalAlpha = s.opacity * 0.4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function animate() {
        // 关键修正：清除画布为完全透明，没有背景色，没有拖尾
        ctx.clearRect(0, 0, width, height);

        for (const s of snowflakes) {
            drawSnowflake(s);
        }
        requestAnimationFrame(animate);
    }

    animate();
})();