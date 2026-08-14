!function(){'use strict';

/* 工具模块 */
const Utils = {
    debounce: (func, wait = 30) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        }
    },
    uuid: () => {
        let d = Date.now();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
};

/* 尺寸传感器 */
class SizeSensor {
    static sensors = new Map();
    
    static observe(element, callback) {
        const sensor = new ResizeObserver(Utils.debounce(() => {
            callback(element);
        }));
        sensor.observe(element);
        this.sensors.set(element, sensor);
    }

    static unobserve(element) {
        const sensor = this.sensors.get(element);
        if(sensor) {
            sensor.disconnect();
            this.sensors.delete(element);
        }
    }
}

/* 粒子系统核心 */
class ParticleBackground {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            colorType: 'rainbow',
            colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
            lineType: 'gradient',
            particleCount: 80,
            maxDistance: 6000,
            particleSize: 2,
            lineWidth: 1,
            opacity: 0.6,
            zIndex: -1,
            velocity: 0.8,          // 新增：基础速度系数
            speedVariation: 0.3,    // 新增：速度随机变化范围
            ...options
        };
        
        this.initCanvas();
        this.initParticles();
        this.bindEvents();
        this.startAnimation();
    }

    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        Object.assign(this.canvas.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            zIndex: this.options.zIndex,
            opacity: this.options.opacity
        });
        
        this.container.appendChild(this.canvas);
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    initParticles() {
        this.particles = Array.from({length: this.options.particleCount}, (_, i) => {
            // 速度计算逻辑优化
            const baseSpeed = this.options.velocity * 
                (1 + this.options.speedVariation * (Math.random() - 0.5));
            
            return {
                id: i,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * baseSpeed,
                vy: (Math.random() - 0.5) * baseSpeed,
                color: this.generateColor(),
                connections: new Set()
            };
        });
        
        this.mouse = { x: null, y: null };
    }

    generateColor() {
        if(this.options.colorType === 'custom') {
            return this.options.colors[
                Math.floor(Math.random() * this.options.colors.length)
            ];
        }
        return `hsl(${Math.random()*360}, 70%, 60%)`;
    }

    bindEvents() {
        SizeSensor.observe(this.container, () => this.resizeCanvas());
        
        this.mouseHandler = e => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        };
        
        this.container.addEventListener('mousemove', this.mouseHandler);
        this.container.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    updateParticles() {
        this.particles.forEach(p => {
            // 应用速度系数
            p.x += p.vx * this.options.velocity;
            p.y += p.vy * this.options.velocity;
            
            // 边界反弹
            if(p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if(p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            p.x = Math.max(0, Math.min(p.x, this.canvas.width));
            p.y = Math.max(0, Math.min(p.y, this.canvas.height));
        });
    }

    drawConnections() {
        const allPoints = [...this.particles];
        if(this.mouse.x !== null) allPoints.push(this.mouse);

        for(let i = 0; i < allPoints.length; i++) {
            const p1 = allPoints[i];
            
            for(let j = i+1; j < allPoints.length; j++) {
                const p2 = allPoints[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx*dx + dy*dy;
                
                if(distSq < this.options.maxDistance) {
                    const gradient = this.ctx.createLinearGradient(
                        p1.x, p1.y, p2.x, p2.y
                    );
                    gradient.addColorStop(0, p1.color);
                    gradient.addColorStop(1, p2.color || p1.color);
                    
                    this.ctx.strokeStyle = this.options.lineType === 'gradient' 
                        ? gradient 
                        : p1.color;
                    
                    this.ctx.lineWidth = this.options.lineWidth * 
                        (1 - distSq/this.options.maxDistance);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(
                p.x - this.options.particleSize/2,
                p.y - this.options.particleSize/2,
                this.options.particleSize,
                this.options.particleSize
            );
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateParticles();
        this.drawConnections();
        this.drawParticles();
        requestAnimationFrame(() => this.animate());
    }

    startAnimation() {
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        cancelAnimationFrame(this.animationFrame);
        SizeSensor.unobserve(this.container);
        this.container.removeEventListener('mousemove', this.mouseHandler);
        this.canvas.remove();
    }
}

/* 自定义修改配置项 */
new ParticleBackground(document.body, {
    colorType: 'rainbow',
    //colors: [],       //colorType为custom时开启
    lineType: 'gradient',
    particleCount: 80,
	lineWidth: 2, 
	particleSize: 3,
    maxDistance: 8000,
    velocity: 1.2,       
    speedVariation: 0.3, 
    zIndex: -1,   
    opacity: 0.7
});

}();

