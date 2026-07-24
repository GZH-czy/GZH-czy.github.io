(function fairyDustCursor() {
  // 1. 定义平滑色域（彩虹渐变）
  // 可以调整起始色相 (startHue) 和范围 (hueRange) 来改变整体色调
  const startHue = 0;      // 起始色相 (0=红)
  const hueRange = 360;    // 色相范围 (360=全彩虹)
  
  var width = window.innerWidth;
  var height = window.innerHeight;
  var cursor = { x: width/2, y: height/2 };
  var particles = [];
  
  function init() {
    bindEvents();
    loop();
  }
  
  function bindEvents() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchstart', onTouchMove);
    window.addEventListener('resize', onWindowResize);
  }
  
  function onWindowResize() {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  
  function onTouchMove(e) {
    if( e.touches.length > 0 ) {
      for( var i = 0; i < e.touches.length; i++ ) {
        addParticle( e.touches[i].clientX, e.touches[i].clientY );
      }
    }
  }
  
  function onMouseMove(e) {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
    addParticle( cursor.x, cursor.y );
  }
  
  function addParticle(x, y) {
    // 2. 固定初始大小，并在生命周期中平滑缩小
    // 设置统一的初始大小 (例如 30)
    const INITIAL_SIZE = 30;
    // 粒子生命衰减速度 (越小消失越慢)
    const LIFE_SPEED = 0.008;
    
    // 3. 分配平滑色域 (基于当前时间或粒子数量)
    // 这里使用一个计数器来让颜色随移动变化
    const hue = (startHue + (particles.length % 180) * 2) % 360;
    const color = `hsl(${hue}, 80%, 60%)`;
    
    var particle = {
      x: x,
      y: y,
      color: color,
      size: INITIAL_SIZE,
      life: 1,
      speed: LIFE_SPEED
    };
    particles.push(particle);
  }
  
  function loop() {
    updateParticles();
    drawParticles();
    requestAnimationFrame(loop);
  }
  
  function updateParticles() {
    for( var i = 0; i < particles.length; i++ ) {
      var p = particles[i];
      // 4. 逐渐缩小: 每帧乘以 0.98，实现平滑缩小
      p.size *= 0.98;
      p.life -= p.speed;
      
      // 当粒子太小或生命结束，移除
      if( p.life <= 0 || p.size < 0.5 ) {
        particles.splice(i, 1);
        i--;
      }
    }
  }
  
  function drawParticles() {
    var canvas = document.getElementById('fairy-dust-canvas');
    if( !canvas ) {
      canvas = document.createElement('canvas');
      canvas.id = 'fairy-dust-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
    }
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    
    // 绘制粒子 (按生命顺序绘制，让新粒子覆盖旧粒子)
    for( var i = 0; i < particles.length; i++ ) {
      var p = particles[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      // 5. 绘制圆形
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  init();
})();
/*var CURSOR;

Math.lerp = (a, b, n) => (1 - n) * a + n * b;

const getStyle = (el, attr) => {
    try {
        return window.getComputedStyle
            ? window.getComputedStyle(el)[attr]
            : el.currentStyle[attr];
    } catch (e) {}
    return "";
};

class Cursor {
    constructor() {
        this.pos = {curr: null, prev: null};
        this.pt = [];
        this.create();
        this.init();
        this.render();
    }

    move(left, top) {
        this.cursor.style["left"] = `${left}px`;
        this.cursor.style["top"] = `${top}px`;
    }

    create() {
        if (!this.cursor) {
            this.cursor = document.createElement("div");
            this.cursor.id = "cursor";
            this.cursor.classList.add("hidden");
            document.body.append(this.cursor);
        }

        var el = document.getElementsByTagName('*');
        for (let i = 0; i < el.length; i++)
            if (getStyle(el[i], "cursor") == "pointer")
                this.pt.push(el[i].outerHTML);

        document.body.appendChild((this.scr = document.createElement("style")));
        // 这里改变鼠标指针的颜色 由svg生成
        this.scr.innerHTML = `* {cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='8px' height='8px'><circle cx='4' cy='4' r='4' opacity='.5' fill='rgb(6, 252, 254)'/></svg>") 4 4, auto}`;
    }

    refresh() {
        this.scr.remove();
        this.cursor.classList.remove("hover");
        this.cursor.classList.remove("active");
        this.pos = {curr: null, prev: null};
        this.pt = [];

        this.create();
        this.init();
        this.render();
    }

    init() {
        document.onmouseover  = e => this.pt.includes(e.target.outerHTML) && this.cursor.classList.add("hover");
        document.onmouseout   = e => this.pt.includes(e.target.outerHTML) && this.cursor.classList.remove("hover");
        document.onmousemove  = e => {(this.pos.curr == null) && this.move(e.clientX - 8, e.clientY - 8); this.pos.curr = {x: e.clientX - 8, y: e.clientY - 8}; this.cursor.classList.remove("hidden");};
        document.onmouseenter = e => this.cursor.classList.remove("hidden");
        document.onmouseleave = e => this.cursor.classList.add("hidden");
        document.onmousedown  = e => this.cursor.classList.add("active");
        document.onmouseup    = e => this.cursor.classList.remove("active");
    }

    render() {
        if (this.pos.prev) {
            this.pos.prev.x = Math.lerp(this.pos.prev.x, this.pos.curr.x, 0.15);
            this.pos.prev.y = Math.lerp(this.pos.prev.y, this.pos.curr.y, 0.15);
            this.move(this.pos.prev.x, this.pos.prev.y);
        } else {
            this.pos.prev = this.pos.curr;
        }
        requestAnimationFrame(() => this.render());
    }
}

(() => {
    CURSOR = new Cursor();
    // 需要重新获取列表时，使用 CURSOR.refresh()
})();
*/