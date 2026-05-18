// ============================================
// 🎮 مملكة المغامرات - Kingdom Adventures
// ============================================

console.log('%c🏰 مرحباً بك في مملكة المغامرات! ', 'background: #667eea; color: white; font-size: 20px; padding: 10px;');

// ============================================
// 📺 إعداد Canvas
// ============================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ============================================
// 🌍 متغيرات اللعبة العامة
// ============================================
let gameState = 'loading';
let currentLevel = 1;
let score = 0;
let coins = 0;
let gameTime = 0;
let startTime = 0;
let animationFrameId = null;

// البيانات المحفوظة
let totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let completedLevels = parseInt(localStorage.getItem('completedLevels')) || 0;
let levelStars = JSON.parse(localStorage.getItem('levelStars')) || { 1: 0, 2: 0, 3: 0, 4: 0 };
let levelCoins = JSON.parse(localStorage.getItem('levelCoins')) || { 1: 0, 2: 0, 3: 0, 4: 0 };

// متغيرات التحكم
let keys = {};
let isPaused = false;
let touchControlsEnabled = true;

// كائنات اللعبة
let player = null;
let monsters = [];
let coins_objects = [];
let obstacles = [];
let castle = null;
let background = null;
let camera = { x: 0, y: 0 };
let particles = [];

// ============================================
// ⚙️ الإعدادات
// ============================================
let settings = {
    volume: 50,
    musicEnabled: true,
    touchControls: true
};

// ============================================
// 🎬 شاشة التحميل
// ============================================
window.addEventListener('load', () => {
    simulateLoading();
});

function simulateLoading() {
    const loadingFill = document.getElementById('loadingFill');
    let progress = 0;
    
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            setTimeout(() => {
                showMainMenu();
            }, 500);
        }
        if (loadingFill) {
            loadingFill.style.width = progress + '%';
        }
    }, 200);
}

// ============================================
// 📱 التحكم في الشاشات
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function showMainMenu() {
    showScreen('mainMenu');
    gameState = 'menu';
    updateMainMenuStats();
    createParticleBackground();
}

function showInstructions() {
    showScreen('instructions');
}

function showSettings() {
    showScreen('settings');
    loadSettings();
}

function showMap() {
    showScreen('mapScreen');
    updateMapProgress();
}

// ============================================
// 📊 تحديث الإحصائيات
// ============================================
function updateMainMenuStats() {
    const elements = {
        'highScore': highScore,
        'totalCoins': totalCoins,
        'completedLevels': completedLevels
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function updateMapProgress() {
    // تحديث حالة المراحل
    for (let i = 1; i <= 4; i++) {
        const levelElement = document.querySelector(`.map-level[data-level="${i}"]`);
        if (levelElement) {
            if (i <= completedLevels + 1) {
                levelElement.classList.remove('locked');
            }
            if (i <= completedLevels) {
                levelElement.classList.add('completed');
            }
            
            // تحديث النجوم
            const starsElement = document.getElementById(`stars-${i}`);
            if (starsElement && levelStars[i]) {
                const stars = '⭐'.repeat(levelStars[i]) + '☆'.repeat(3 - levelStars[i]);
                starsElement.querySelector('span').textContent = stars;
            }
            
            // تحديث العملات
            const coinsElement = document.getElementById(`coins-${i}`);
            if (coinsElement) {
                coinsElement.textContent = levelCoins[i] || 0;
            }
        }
    }
}

// ============================================
// ⚙️ وظائف الإعدادات
// ============================================
function loadSettings() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const musicToggle = document.getElementById('musicToggle');
    const touchControls = document.getElementById('touchControls');
    
    if (volumeSlider) {
        volumeSlider.value = settings.volume;
        volumeSlider.addEventListener('input', (e) => {
            settings.volume = e.target.value;
            if (volumeValue) volumeValue.textContent = e.target.value + '%';
        });
    }
    
    if (musicToggle) {
        musicToggle.checked = settings.musicEnabled;
        musicToggle.addEventListener('change', (e) => {
            settings.musicEnabled = e.target.checked;
        });
    }
    
    if (touchControls) {
        touchControls.checked = settings.touchControls;
        touchControls.addEventListener('change', (e) => {
            settings.touchControls = e.target.checked;
            touchControlsEnabled = e.target.checked;
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.style.display = e.target.checked ? 'flex' : 'none';
            }
        });
    }
}

function resetProgress() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟ سيتم حذف كل تقدمك!')) {
        localStorage.clear();
        totalCoins = 0;
        highScore = 0;
        completedLevels = 0;
        levelStars = { 1: 0, 2: 0, 3: 0, 4: 0 };
        levelCoins = { 1: 0, 2: 0, 3: 0, 4: 0 };
        alert('تم إعادة تعيين التقدم بنجاح!');
        showMainMenu();
    }
}

// ============================================
// 🎨 خلفية الجزيئات
// ============================================
function createParticleBackground() {
    const particlesCanvas = document.getElementById('particlesCanvas');
    if (!particlesCanvas) return;
    
    const pCtx = particlesCanvas.getContext('2d');
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
    
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * particlesCanvas.width,
            y: Math.random() * particlesCanvas.height,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 0.5 - 0.25,
            speedY: Math.random() * 0.5 - 0.25
        });
    }
    
    function animateParticles() {
        pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
        
        particles.forEach(p => {
            pCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            pCtx.fill();
            
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0 || p.x > particlesCanvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > particlesCanvas.height) p.speedY *= -1;
        });
        
        if (gameState === 'menu' || gameState === 'loading') {
            requestAnimationFrame(animateParticles);
        }
    }
    
    animateParticles();
}

// ============================================
// 🎮 بدء اللعبة
// ============================================
function startLevel(levelNum) {
    if (levelNum > completedLevels + 1) {
        alert('❌ أكمل المرحلة السابقة أولاً!');
        return;
    }
    
    currentLevel = levelNum;
    const levelData = levels[levelNum];
    
    if (!levelData) {
        alert('المرحلة غير متوفرة!');
        return;
    }
    
    initLevel(levelData);
    showScreen('gameScreen');
    gameState = 'playing';
    isPaused = false;
    startTime = Date.now();
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();
}

// ============================================
// 🎯 تهيئة المرحلة
// ============================================
function initLevel(levelData) {
    // إعادة تعيين المتغيرات
    score = 0;
    coins = 0;
    gameTime = 0;
    camera = { x: 0, y: 0 };
    particles = [];
    
    // إنشاء اللاعب
    player = new Player();
    
    // إنشاء الخلفية
    background = new Background(levelData.type);
    
    // إنشاء الوحوش
    monsters = levelData.monsters.map(m => 
        new Monster(m.x, m.y, m.type)
    );
    
    // إنشاء العملات
    coins_objects = levelData.coins.map(c => 
        new Coin(c.x, c.y)
    );
    
    // إنشاء العقبات
    obstacles = levelData.obstacles.map(o => 
        new Obstacle(o.x, o.y, o.type)
    );
    
    // إنشاء القلعة
    castle = new Castle(levelData.length - 200, canvas.height - 300);
    
    // تحديث HUD
    updateHUD();
    updateLevelName(levelData.name);
}

// ============================================
// 🔄 حلقة اللعبة الرئيسية
// ============================================
function gameLoop() {
    if (gameState !== 'playing' || isPaused) {
        return;
    }
    
    // مسح الشاشة
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم الخلفية
    if (background) {
        background.draw();
        background.update();
    }
    
    // تحديث الكاميرا
    updateCamera();
    
    // حفظ السياق
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // رسم القلعة
    if (castle) {
        castle.draw();
        castle.checkReached(player);
    }
    
    // رسم وتحديث العملات
    coins_objects.forEach(coin => {
        if (!coin.collected) {
            coin.draw();
            coin.update();
        }
    });
    
    // رسم العقبات
    obstacles.forEach(obstacle => {
        obstacle.draw();
        const collision = obstacle.checkCollision(player);
        if (collision === 'deadly') {
            gameOver();
        } else if (collision === 'damage') {
            player.takeDamage(0.5);
        }
    });
    
    // رسم وتحديث الوحوش
    monsters.forEach(monster => {
        if (monster.active) {
            monster.draw();
            monster.update();
        }
    });
    
    // رسم وتحديث اللاعب
    if (player) {
        player.draw();
        player.update();
    }
    
    // رسم الجزيئات
    updateParticles();
    
    // استعادة السياق
    ctx.restore();
    
    // تحديث الوقت
    updateGameTime();
    
    // تحديث شريط التقدم
    updateProgress();
    
    // التحقق من موت اللاعب
    if (player && player.health <= 0) {
        gameOver();
        return;
    }
    
    // استمرار الحلقة
    animationFrameId = requestAnimationFrame(gameLoop);
}

// ============================================
// 📷 نظام الكاميرا
// ============================================
function updateCamera() {
    if (!player) return;
    
    // الكاميرا تتبع اللاعب
    camera.x = player.x - canvas.width / 3;
    
    // حدود الكاميرا
    if (camera.x < 0) camera.x = 0;
    
    const levelLength = levels[currentLevel].length;
    const maxCameraX = levelLength - canvas.width;
    if (camera.x > maxCameraX) {
        camera.x = maxCameraX;
    }
}

// ============================================
// ⌨️ التحكم بلوحة المفاتيح
// ============================================
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (gameState === 'playing' && !isPaused) {
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (player) player.jump();
        }
        if (e.key === 'Escape') {
            pauseGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// تحديث مستمر لحركة اللاعب
setInterval(() => {
    if (gameState === 'playing' && !isPaused && player) {
        let speedMultiplier = 1;
        if (keys['Shift']) speedMultiplier = 1.5;
        
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            player.moveRight();
            if (keys['Shift']) player.velocityX *= 1.5;
        }
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            player.moveLeft();
            if (keys['Shift']) player.velocityX *= 1.5;
        }
    }
}, 1000 / 60);

// ============================================
// 📱 التحكم باللمس (الموبايل)
// ============================================
function setupTouchControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    
    if (leftBtn) {
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['ArrowLeft'] = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['ArrowLeft'] = false;
        });
    }
    
    if (rightBtn) {
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['ArrowRight'] = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['ArrowRight'] = false;
        });
    }
    
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (player) player.jump();
        });
    }
}
setupTouchControls();

// عرض/إخفاء أزرار اللمس حسب حجم الشاشة
function checkMobileControls() {
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls && touchControlsEnabled) {
        if (window.innerWidth <= 768) {
            mobileControls.style.display = 'flex';
        } else {
            mobileControls.style.display = 'none';
        }
    }
}
window.addEventListener('resize', checkMobileControls);
checkMobileControls();

// ============================================
// 📊 تحديث واجهة المستخدم
// ============================================
function updateHUD() {
    updateScore();
    updateCoins();
    updateHealth();
}

function updateScore() {
    const scoreElement = document.getElementById('gameScore');
    if (scoreElement) scoreElement.textContent = score;
}

function updateCoins() {
    const coinsElement = document.getElementById('gameCoins');
    if (coinsElement) coinsElement.textContent = coins;
}

function updateHealth() {
    if (!player) return;
    
    const healthBar = document.getElementById('healthBar');
    const healthText = document.getElementById('healthText');
    
    if (healthBar) {
        const healthPercent = (player.health / player.maxHealth) * 100;
        healthBar.style.width = healthPercent + '%';
        
        // تغيير اللون حسب الصحة
        if (healthPercent > 60) {
            healthBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
        } else if (healthPercent > 30) {
            healthBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else {
            healthBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        }
    }
    
    if (healthText) {
        healthText.textContent = Math.ceil(player.health);
    }
}

function updateGameTime() {
    if (startTime) {
        gameTime = Math.floor((Date.now() - startTime) / 1000);
        const timeElement = document.getElementById('gameTime');
        if (timeElement) {
            const minutes = Math.floor(gameTime / 60);
            const seconds = gameTime % 60;
            timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
}

function updateProgress() {
    if (!player) return;
    
    const levelLength = levels[currentLevel].length;
    const progress = Math.min((player.x / levelLength) * 100, 100);
    
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) progressBar.style.width = progress + '%';
    if (progressText) progressText.textContent = Math.floor(progress) + '%';
}

function updateLevelName(name) {
    const levelNameElement = document.getElementById('levelName');
    if (levelNameElement) levelNameElement.textContent = name;
}

// ============================================
// ⏸️ إيقاف/استئناف اللعبة
// ============================================
function pauseGame() {
    if (gameState === 'playing' && !isPaused) {
        isPaused = true;
        
        // تحديث إحصائيات الإيقاف المؤقت
        const pauseScore = document.getElementById('pauseScore');
        const pauseCoins = document.getElementById('pauseCoins');
        const pauseHealth = document.getElementById('pauseHealth');
        
        if (pauseScore) pauseScore.textContent = score;
        if (pauseCoins) pauseCoins.textContent = coins;
        if (pauseHealth && player) pauseHealth.textContent = Math.ceil(player.health);
        
        showScreen('pauseScreen');
    }
}

function resumeGame() {
    if (isPaused) {
        isPaused = false;
        showScreen('gameScreen');
        gameLoop();
    }
}

// ============================================
// 🏆 إكمال المرحلة
// ============================================
function levelComplete() {
    gameState = 'complete';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // حساب النجوم (1-3)
    let stars = 1;
    const totalLevelCoins = levels[currentLevel].coins.length;
    const coinsPercent = (coins / totalLevelCoins) * 100;
    
    if (player.health > 50 && gameTime < 120) stars = 2;
    if (player.health > 80 && gameTime < 90 && coinsPercent >= 80) stars = 3;
    
    // تحديث أعلى نقاط
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    // تحديث العملات الإجمالية
    totalCoins += coins;
    localStorage.setItem('totalCoins', totalCoins);
    
    // حفظ تقدم المرحلة
    if (currentLevel > completedLevels) {
        completedLevels = currentLevel;
        localStorage.setItem('completedLevels', completedLevels);
    }
    
    // حفظ النجوم إذا كانت أفضل
    if (stars > (levelStars[currentLevel] || 0)) {
        levelStars[currentLevel] = stars;
        localStorage.setItem('levelStars', JSON.stringify(levelStars));
    }
    
    // حفظ العملات المجمعة
    if (coins > (levelCoins[currentLevel] || 0)) {
        levelCoins[currentLevel] = coins;
        localStorage.setItem('levelCoins', JSON.stringify(levelCoins));
    }
    
    // عرض شاشة النتائج
    showResultScreen(true, stars);
}

// ============================================
// ☠️ نهاية اللعبة (الخسارة)
// ============================================
function gameOver() {
    gameState = 'gameover';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    showResultScreen(false, 0);
}

// ============================================
// 📊 شاشة النتائج
// ============================================
function showResultScreen(win, stars) {
    const resultTitle = document.getElementById('resultTitle');
    const finalScore = document.getElementById('finalScore');
    const finalCoins = document.getElementById('finalCoins');
    const finalTime = document.getElementById('finalTime');
    const starsDisplay = document.getElementById('starsDisplay');
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    
    if (resultTitle) {
        resultTitle.textContent = win ? '🎉 مرحلة مكتملة!' : '💀 للأسف!';
        resultTitle.style.color = win ? '#2ecc71' : '#e74c3c';
    }
    
    if (finalScore) finalScore.textContent = score;
    if (finalCoins) finalCoins.textContent = coins;
    
    if (finalTime) {
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // عرض النجوم بأنيميشن
    if (starsDisplay) {
        const starElements = starsDisplay.querySelectorAll('.star-item');
        starElements.forEach((star, index) => {
            if (index < stars) {
                star.textContent = '⭐';
                star.style.animation = `starPop 0.5s ease forwards ${(index + 1) * 0.2}s`;
            } else {
                star.textContent = '☆';
                star.style.opacity = '0.3';
            }
        });
    }
    
    // إخفاء/عرض زر المرحلة التالية
    if (nextLevelBtn) {
        if (win && currentLevel < 4) {
            nextLevelBtn.style.display = 'flex';
        } else {
            nextLevelBtn.style.display = 'none';
        }
    }
    
    showScreen('resultScreen');
}

// ============================================
// 🔄 إعادة وخروج
// ============================================
function restartLevel() {
    startLevel(currentLevel);
}

function nextLevel() {
    if (currentLevel < 4) {
        startLevel(currentLevel + 1);
    } else {
        alert('🎉 تهانينا! لقد أكملت جميع المراحل!');
        showMap();
    }
}

function exitToMap() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameState = 'menu';
    showMap();
}

// ============================================
// ✨ نظام الجزيئات
// ============================================
function createParticle(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            color: color || '#f39c12',
            size: Math.random() * 5 + 2
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // الجاذبية
        p.life -= 0.02;
        
        if (p.life > 0) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return true;
        }
        return false;
    });
}

// ============================================
// 🏃 كلاس اللاعب
// ============================================
class Player {
    constructor() {
        this.width = 50;
        this.height = 60;
        this.x = 100;
        this.y = canvas.height - this.height - 100;
        this.velocityY = 0;
        this.velocityX = 0;
        this.jumping = false;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 5;
        this.jumpPower = 15;
        this.gravity = 0.6;
        this.grounded = false;
        this.direction = 'right';
        this.animation = 0;
    }

    draw() {
        ctx.save();
        
        // رسم الظل
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height + 5, this.width/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // انعكاس الشخصية حسب الاتجاه
        if (this.direction === 'left') {
            ctx.scale(-1, 1);
            ctx.translate(-(this.x * 2 + this.width), 0);
        }

        // الجسم
        ctx.fillStyle = '#4a69bd';
        ctx.fillRect(this.x + 10, this.y + 20, 30, 35);
        
        // الرأس
        ctx.fillStyle = '#feca57';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // الخوذة
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 12, 16, Math.PI, 0);
        ctx.fill();
        
        // العيون
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 18, this.y + 14, 4, 4);
        ctx.fillRect(this.x + 28, this.y + 14, 4, 4);
        
        // السيف
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 45, this.y + 30);
        ctx.lineTo(this.x + 60, this.y + 20);
        ctx.stroke();
        
        // شفرة السيف
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 60, this.y + 20);
        ctx.lineTo(this.x + 70, this.y + 10);
        ctx.stroke();
        
        // الأرجل (حركة)
        ctx.fillStyle = '#34495e';
        const legAnimation = Math.sin(this.animation) * 5;
        ctx.fillRect(this.x + 15, this.y + 55, 8, 15 + legAnimation);
        ctx.fillRect(this.x + 27, this.y + 55, 8, 15 - legAnimation);
        
        ctx.restore();
        
        this.animation += 0.15;
    }

    update() {
        // الجاذبية
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        this.x += this.velocityX;

        // التحقق من الأرض
        const groundLevel = canvas.height - this.height - 100;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.jumping = false;
            this.grounded = true;
        } else {
            this.grounded = false;
        }

        // حدود الشاشة
        if (this.x < 0) this.x = 0;
        const maxX = levels[currentLevel].length - this.width;
        if (this.x > maxX) this.x = maxX;

        // تقليل السرعة الأفقية
        this.velocityX *= 0.85;
        
        // تحديث شريط الصحة
        if (Math.random() < 0.1) {
            updateHealth();
        }
    }

    jump() {
        if (this.grounded && !this.jumping) {
            this.velocityY = -this.jumpPower;
            this.jumping = true;
            createParticle(this.x + this.width/2, this.y + this.height, '#ecf0f1');
        }
    }

    moveLeft() {
        this.velocityX = -this.speed;
        this.direction = 'left';
    }

    moveRight() {
        this.velocityX = this.speed;
        this.direction = 'right';
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
        createParticle(this.x + this.width/2, this.y + this.height/2, '#e74c3c');
    }
}

// ============================================
// 👹 كلاس الوحوش
// ============================================
class Monster {
    constructor(x, y, type) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 60;
        this.health = 30;
        this.speed = type === 'bat' ? 3 : 2;
        this.direction = -1;
        this.animation = 0;
        this.patrolDistance = 200;
        this.startX = x;
        this.active = true;
        this.flying = type === 'bat';
        
        if (this.flying) {
            this.y = y - 100;
        }
    }

    draw() {
        if (!this.active) return;
        
        ctx.save();
        this.animation += 0.1;

        switch(this.type) {
            case 'goblin':
                this.drawGoblin();
                break;
            case 'skeleton':
                this.drawSkeleton();
                break;
            case 'bat':
                this.drawBat();
                break;
        }

        ctx.restore();
    }

    drawGoblin() {
        // جسم الغول
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(this.x + 10, this.y + 25, 30, 30);
        
        // الرأس
        ctx.fillStyle = '#229954';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 20, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // العيون الحمراء
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x + 18, this.y + 15, 5, 5);
        ctx.fillRect(this.x + 28, this.y + 15, 5, 5);
        
        // الأنياب
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y + 25);
        ctx.lineTo(this.x + 22, this.y + 30);
        ctx.lineTo(this.x + 24, this.y + 25);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 26, this.y + 25);
        ctx.lineTo(this.x + 28, this.y + 30);
        ctx.lineTo(this.x + 30, this.y + 25);
        ctx.fill();
    }

    drawSkeleton() {
        // عظام بيضاء
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 4;
        
        // العمود الفقري
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + 15);
        ctx.lineTo(this.x + 25, this.y + 55);
        ctx.stroke();
        
        // الجمجمة
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // العيون السوداء
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 18, this.y + 12, 5, 8);
        ctx.fillRect(this.x + 28, this.y + 12, 5, 8);
        
        // الفك
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 22, 8, 0, Math.PI);
        ctx.stroke();
    }

    drawBat() {
        const flap = Math.sin(this.animation * 3) * 10;
        
        // الجسم
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.ellipse(this.x + 25, this.y + 20, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // الأجنحة
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + 20);
        ctx.quadraticCurveTo(this.x + 10, this.y + 10 - flap, this.x, this.y + 25);
        ctx.quadraticCurveTo(this.x + 10, this.y + 30, this.x + 25, this.y + 20);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + 20);
        ctx.quadraticCurveTo(this.x + 40, this.y + 10 - flap, this.x + 50, this.y + 25);
        ctx.quadraticCurveTo(this.x + 40, this.y + 30, this.x + 25, this.y + 20);
        ctx.fill();
        
        // العيون
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x + 20, this.y + 18, 3, 3);
        ctx.fillRect(this.x + 28, this.y + 18, 3, 3);
        
        // الأذنين
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.moveTo(this.x + 18, this.y + 12);
        ctx.lineTo(this.x + 15, this.y + 5);
        ctx.lineTo(this.x + 20, this.y + 10);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 32, this.y + 12);
        ctx.lineTo(this.x + 35, this.y + 5);
        ctx.lineTo(this.x + 30, this.y + 10);
        ctx.fill();
    }

    update() {
        if (!this.active) return;

        // حركة الدورية
        this.x += this.speed * this.direction;

        if (this.flying) {
            this.y += Math.sin(this.animation) * 2;
        }

        // عكس الاتجاه
        if (Math.abs(this.x - this.startX) > this.patrolDistance) {
            this.direction *= -1;
        }

        // التصادم مع اللاعب
        if (this.checkCollision(player)) {
            player.takeDamage(0.3);
        }
    }

    checkCollision(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
}

// ============================================
// 💰 كلاس العملات
// ============================================
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.collected = false;
        this.animation = 0;
    }

    draw() {
        if (this.collected) return;
        
        this.animation += 0.1;
        const bounce = Math.sin(this.animation) * 5;
        const rotation = this.animation * 2;
        
        ctx.save();
        ctx.translate(this.x + 15, this.y + 15 + bounce);
        ctx.rotate(rotation);
        
        // العملة الذهبية
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // اللمعة
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // الحدود
        ctx.strokeStyle = '#d68910';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // الرمز
        ctx.fillStyle = '#d68910';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
    }

    update() {
        if (this.collected) return;

        if (this.checkCollision(player)) {
            this.collected = true;
            coins++;
            score += 10;
            updateCoins();
            updateScore();
            createParticle(this.x + 15, this.y + 15, '#f1c40f');
        }
    }

    checkCollision(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
}

// ============================================
// ⚠️ كلاس العقبات
// ============================================
class Obstacle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'pit' ? 100 : 40;
        this.height = type === 'spike' ? 30 : 60;
    }

    draw() {
        switch(this.type) {
            case 'spike':
                this.drawSpike();
                break;
            case 'rock':
                this.drawRock();
                break;
            case 'pit':
                this.drawPit();
                break;
        }
    }

    drawSpike() {
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(this.x + i * 15, this.y + this.height);
            ctx.lineTo(this.x + i * 15 + 7.5, this.y);
            ctx.lineTo(this.x + i * 15 + 15, this.y + this.height);
        }
        ctx.closePath();
        ctx.fill();
        
        // الظل
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(this.x + i * 15, this.y + this.height);
            ctx.lineTo(this.x + i * 15 + 7.5, this.y + 5);
            ctx.lineTo(this.x + i * 15 + 15, this.y + this.height);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawRock() {
        ctx.fillStyle = '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // التفاصيل
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(this.x + 10, this.y + 20, 10, 10);
        ctx.fillRect(this.x + 22, this.y + 35, 8, 8);
        
        // الظل
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height + 5, this.width/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPit() {
        // الحفرة
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // التدرج
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#34495e');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // الحواف
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // علامة الخطر
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', this.x + this.width/2, this.y + 30);
    }

    checkCollision(player) {
        if (this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y) {
            
            if (this.type === 'pit') {
                return 'deadly';
            }
            return 'damage';
        }
        return false;
    }
}

// ============================================
// 🏰 كلاس القلعة
// ============================================
class Castle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 150;
        this.height = 200;
        this.animation = 0;
        this.reached = false;
    }

    draw() {
        this.animation += 0.05;
        
        // الأساس
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(this.x, this.y + 100, this.width, 100);
        
        // الأبراج
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(this.x, this.y + 50, 40, 150);
        ctx.fillRect(this.x + 110, this.y + 50, 40, 150);
        ctx.fillRect(this.x + 45, this.y, 60, 100);
        
        // الأسقف المخروطية
        ctx.fillStyle = '#c0392b';
        
        // البرج الأيسر
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 50);
        ctx.lineTo(this.x + 20, this.y + 20);
        ctx.lineTo(this.x + 45, this.y + 50);
        ctx.closePath();
        ctx.fill();
        
        // البرج الأيمن
        ctx.beginPath();
        ctx.moveTo(this.x + 105, this.y + 50);
        ctx.lineTo(this.x + 130, this.y + 20);
        ctx.lineTo(this.x + 155, this.y + 50);
        ctx.closePath();
        ctx.fill();
        
        // البرج الأوسط
        ctx.beginPath();
        ctx.moveTo(this.x + 40, this.y);
        ctx.lineTo(this.x + 75, this.y - 30);
        ctx.lineTo(this.x + 110, this.y);
        ctx.closePath();
        ctx.fill();
        
        // النوافذ
        const windowGlow = Math.sin(this.animation * 2) * 0.3 + 0.7;
        ctx.globalAlpha = windowGlow;
        ctx.fillStyle = '#f39c12';
        
        // نوافذ البرج الأيسر
        ctx.fillRect(this.x + 12, this.y + 70, 15, 20);
        ctx.fillRect(this.x + 12, this.y + 110, 15, 20);
        
        // نوافذ البرج الأيمن
        ctx.fillRect(this.x + 123, this.y + 70, 15, 20);
        ctx.fillRect(this.x + 123, this.y + 110, 15, 20);
        
        // نافذة البرج الأوسط
        ctx.fillRect(this.x + 60, this.y + 30, 30, 35);
        
        ctx.globalAlpha = 1;
        
        // الباب
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x + 55, this.y + 140, 40, 60);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x + 55, this.y + 140, 40, 60);
        
        // المقبض
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.x + 85, this.y + 170, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // العلم
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 75, this.y - 30);
        ctx.lineTo(this.x + 75, this.y - 60);
        ctx.stroke();
        
        // راية العلم
        const flagWave = Math.sin(this.animation * 4) * 3;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(this.x + 75, this.y - 60);
        ctx.quadraticCurveTo(this.x + 90 + flagWave, this.y - 55, this.x + 105, this.y - 50);
        ctx.quadraticCurveTo(this.x + 90 + flagWave, this.y - 45, this.x + 75, this.y - 40);
        ctx.closePath();
        ctx.fill();
        
        // الشعار على العلم
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('👑', this.x + 85, this.y - 45);
    }

    checkReached(player) {
        if (!this.reached &&
            player.x + player.width > this.x + 55 &&
            player.x < this.x + 95 &&
            player.y + player.height > this.y + 140) {
            this.reached = true;
            levelComplete();
        }
    }
}

// ============================================
// 🌳 كلاس الخلفية
// ============================================
class Background {
    constructor(levelType) {
        this.levelType = levelType;
        this.clouds = [];
        this.trees = [];
        this.mountains = [];
        this.generateEnvironment();
    }

    generateEnvironment() {
        // السحب
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * canvas.width * 2,
                y: Math.random() * 150,
                speed: 0.3 + Math.random() * 0.5,
                size: 40 + Math.random() * 40
            });
        }

        // الجبال
        for (let i = 0; i < 10; i++) {
            this.mountains.push({
                x: i * 300,
                height: 150 + Math.random() * 100,
                width: 200 + Math.random() * 100
            });
        }

        // الأشجار
        if (this.levelType === 'forest') {
            for (let i = 0; i < 20; i++) {
                this.trees.push({
                    x: i * 400 + Math.random() * 100,
                    y: canvas.height - 180,
                    size: 60 + Math.random() * 40
                });
            }
        }
    }

    draw() {
        // السماء
        let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        
        switch(this.levelType) {
            case 'forest':
                skyGradient.addColorStop(0, '#87CEEB');
                skyGradient.addColorStop(1, '#E0F6FF');
                break;
            case 'mountain':
                skyGradient.addColorStop(0, '#4A5F7F');
                skyGradient.addColorStop(1, '#7A8BA3');
                break;
            case 'desert':
                skyGradient.addColorStop(0, '#FF6B35');
                skyGradient.addColorStop(1, '#F7931E');
                break;
            case 'castle':
                skyGradient.addColorStop(0, '#2c3e50');
                skyGradient.addColorStop(1, '#34495e');
                break;
            default:
                skyGradient.addColorStop(0, '#87CEEB');
                skyGradient.addColorStop(1, '#E0F6FF');
        }
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // الجبال في الخلفية
        this.mountains.forEach(mountain => {
            ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
            ctx.beginPath();
            ctx.moveTo(mountain.x, canvas.height - 100);
            ctx.lineTo(mountain.x + mountain.width / 2, canvas.height - 100 - mountain.height);
            ctx.lineTo(mountain.x + mountain.width, canvas.height - 100);
            ctx.closePath();
            ctx.fill();
        });

        // السحب
        this.clouds.forEach(cloud => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.7, cloud.y, cloud.size * 0.7, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 1.4, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });

        // الأشجار
        if (this.levelType === 'forest') {
            this.trees.forEach(tree => {
                // الجذع
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(tree.x, tree.y + tree.size * 0.6, tree.size * 0.3, tree.size * 0.8);
                
                // الأوراق
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(tree.x + tree.size * 0.15, tree.y + tree.size * 0.4, tree.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#2E8B57';
                ctx.beginPath();
                ctx.arc(tree.x + tree.size * 0.15, tree.y + tree.size * 0.2, tree.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // الأرض
        this.drawGround();
    }

    drawGround() {
        const groundY = canvas.height - 100;
        
        switch(this.levelType) {
            case 'forest':
                // أرض عشبية
                ctx.fillStyle = '#7CFC00';
                ctx.fillRect(0, groundY, canvas.width, 100);
                ctx.fillStyle = '#228B22';
                ctx.fillRect(0, groundY, canvas.width, 20);
                
                // العشب
                ctx.strokeStyle = '#32CD32';
                ctx.lineWidth = 2;
                for (let i = 0; i < canvas.width; i += 10) {
                    ctx.beginPath();
                    ctx.moveTo(i, groundY);
                    ctx.lineTo(i + 3, groundY - 10);
                    ctx.stroke();
                }
                break;
                
            case 'mountain':
                // أرض صخرية
                ctx.fillStyle = '#696969';
                ctx.fillRect(0, groundY, canvas.width, 100);
                ctx.fillStyle = '#808080';
                for (let i = 0; i < canvas.width; i += 30) {
                    ctx.fillRect(i, groundY, 25, 15);
                }
                break;
                
            case 'desert':
                // أرض رملية
                ctx.fillStyle = '#EDC9AF';
                ctx.fillRect(0, groundY, canvas.width, 100);
                ctx.fillStyle = '#DEB887';
                for (let i = 0; i < canvas.width; i += 60) {
                    ctx.beginPath();
                    ctx.arc(i, groundY, 30, Math.PI, 0);
                    ctx.fill();
                }
                break;
                
            case 'castle':
                // أرض حجرية
                ctx.fillStyle = '#5D6D7E';
                ctx.fillRect(0, groundY, canvas.width, 100);
                
                // بلاط
                ctx.strokeStyle = '#34495e';
                ctx.lineWidth = 2;
                for (let i = 0; i < canvas.width; i += 40) {
                    for (let j = 0; j < 100; j += 40) {
                        ctx.strokeRect(i, groundY + j, 40, 40);
                    }
                }
                break;
                
            default:
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(0, groundY, canvas.width, 100);
        }
        
        // حدود الأرض
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvas.width, groundY);
        ctx.stroke();
    }

    update() {
        // تحريك السحب
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size * 2 < -camera.x) {
                cloud.x = canvas.width + camera.x + cloud.size;
            }
        });
    }
}

// ============================================
// 🗺️ بيانات المراحل
// ============================================
const levels = {
    1: {
        name: 'الغابة المظلمة 🌳',
        type: 'forest',
        length: 3000,
        monsters: [
            { type: 'goblin', x: 500, y: canvas.height - 160 },
            { type: 'goblin', x: 900, y: canvas.height - 160 },
            { type: 'bat', x: 1200, y: canvas.height - 300 },
            { type: 'goblin', x: 1600, y: canvas.height - 160 },
            { type: 'bat', x: 2000, y: canvas.height - 300 },
            { type: 'goblin', x: 2400, y: canvas.height - 160 }
        ],
        obstacles: [
            { type: 'spike', x: 400, y: canvas.height - 130 },
            { type: 'rock', x: 700, y: canvas.height - 160 },
            { type: 'spike', x: 1000, y: canvas.height - 130 },
            { type: 'pit', x: 1400, y: canvas.height - 100 },
            { type: 'rock', x: 1800, y: canvas.height - 160 },
            { type: 'spike', x: 2200, y: canvas.height - 130 }
        ],
        coins: [
            { x: 300, y: canvas.height - 200 },
            { x: 350, y: canvas.height - 250 },
            { x: 600, y: canvas.height - 200 },
            { x: 800, y: canvas.height - 180 },
            { x: 1100, y: canvas.height - 220 },
            { x: 1300, y: canvas.height - 200 },
            { x: 1500, y: canvas.height - 250 },
            { x: 1700, y: canvas.height - 200 },
            { x: 1900, y: canvas.height - 220 },
            { x: 2100, y: canvas.height - 200 },
            { x: 2300, y: canvas.height - 250 },
            { x: 2500, y: canvas.height - 200 }
        ]
    },
    2: {
        name: 'جبل الأشباح ⛰️',
        type: 'mountain',
        length: 4000,
        monsters: [
            { type: 'skeleton', x: 600, y: canvas.height - 160 },
            { type: 'bat', x: 900, y: canvas.height - 300 },
            { type: 'skeleton', x: 1200, y: canvas.height - 160 },
            { type: 'bat', x: 1500, y: canvas.height - 300 },
            { type: 'skeleton', x: 1800, y: canvas.height - 160 },
            { type: 'bat', x: 2200, y: canvas.height - 300 },
            { type: 'skeleton', x: 2600, y: canvas.height - 160 },
            { type: 'bat', x: 3000, y: canvas.height - 300 },
            { type: 'skeleton', x: 3400, y: canvas.height - 160 }
        ],
        obstacles: [
            { type: 'rock', x: 500, y: canvas.height - 160 },
            { type: 'spike', x: 800, y: canvas.height - 130 },
            { type: 'pit', x: 1100, y: canvas.height - 100 },
            { type: 'rock', x: 1400, y: canvas.height - 160 },
            { type: 'spike', x: 1700, y: canvas.height - 130 },
            { type: 'pit', x: 2000, y: canvas.height - 100 },
            { type: 'rock', x: 2400, y: canvas.height - 160 },
            { type: 'spike', x: 2800, y: canvas.height - 130 },
            { type: 'pit', x: 3200, y: canvas.height - 100 }
        ],
        coins: [
            { x: 400, y: canvas.height - 200 },
            { x: 700, y: canvas.height - 250 },
            { x: 1000, y: canvas.height - 200 },
            { x: 1300, y: canvas.height - 250 },
            { x: 1600, y: canvas.height - 200 },
            { x: 1900, y: canvas.height - 250 },
            { x: 2200, y: canvas.height - 200 },
            { x: 2500, y: canvas.height - 250 },
            { x: 2800, y: canvas.height - 200 },
            { x: 3100, y: canvas.height - 250 },
            { x: 3400, y: canvas.height - 200 },
            { x: 3700, y: canvas.height - 250 }
        ]
    },
    3: {
        name: 'الصحراء المحرقة 🏜️',
        type: 'desert',
        length: 5000,
        monsters: [
            { type: 'goblin', x: 700, y: canvas.height - 160 },
            { type: 'skeleton', x: 1000, y: canvas.height - 160 },
            { type: 'bat', x: 1300, y: canvas.height - 300 },
            { type: 'goblin', x: 1600, y: canvas.height - 160 },
            { type: 'skeleton', x: 2000, y: canvas.height - 160 },
            { type: 'bat', x: 2400, y: canvas.height - 300 },
            { type: 'goblin', x: 2800, y: canvas.height - 160 },
            { type: 'skeleton', x: 3200, y: canvas.height - 160 },
            { type: 'bat', x: 3600, y: canvas.height - 300 },
            { type: 'goblin', x: 4000, y: canvas.height - 160 },
            { type: 'skeleton', x: 4400, y: canvas.height - 160 }
        ],
        obstacles: [
            { type: 'spike', x: 600, y: canvas.height - 130 },
            { type: 'rock', x: 900, y: canvas.height - 160 },
            { type: 'pit', x: 1200, y: canvas.height - 100 },
            { type: 'spike', x: 1500, y: canvas.height - 130 },
            { type: 'rock', x: 1900, y: canvas.height - 160 },
            { type: 'pit', x: 2300, y: canvas.height - 100 },
            { type: 'spike', x: 2700, y: canvas.height - 130 },
            { type: 'rock', x: 3100, y: canvas.height - 160 },
            { type: 'pit', x: 3500, y: canvas.height - 100 },
            { type: 'spike', x: 3900, y: canvas.height - 130 },
            { type: 'rock', x: 4300, y: canvas.height - 160 }
        ],
        coins: [
            { x: 500, y: canvas.height - 200 },
            { x: 800, y: canvas.height - 250 },
            { x: 1100, y: canvas.height - 200 },
            { x: 1400, y: canvas.height - 250 },
            { x: 1800, y: canvas.height - 200 },
            { x: 2200, y: canvas.height - 250 },
            { x: 2600, y: canvas.height - 200 },
            { x: 3000, y: canvas.height - 250 },
            { x: 3400, y: canvas.height - 200 },
            { x: 3800, y: canvas.height - 250 },
            { x: 4200, y: canvas.height - 200 },
            { x: 4600, y: canvas.height - 250 }
        ]
    },
    4: {
        name: 'القلعة المظلمة 🏰',
        type: 'castle',
        length: 6000,
        monsters: [
            { type: 'goblin', x: 800, y: canvas.height - 160 },
            { type: 'skeleton', x: 1100, y: canvas.height - 160 },
            { type: 'bat', x: 1400, y: canvas.height - 300 },
            { type: 'goblin', x: 1700, y: canvas.height - 160 },
            { type: 'skeleton', x: 2100, y: canvas.height - 160 },
            { type: 'bat', x: 2500, y: canvas.height - 300 },
            { type: 'goblin', x: 2900, y: canvas.height - 160 },
            { type: 'skeleton', x: 3300, y: canvas.height - 160 },
            { type: 'bat', x: 3700, y: canvas.height - 300 },
            { type: 'goblin', x: 4100, y: canvas.height - 160 },
            { type: 'skeleton', x: 4500, y: canvas.height - 160 },
            { type: 'bat', x: 4900, y: canvas.height - 300 },
            { type: 'goblin', x: 5300, y: canvas.height - 160 }
        ],
        obstacles: [
            { type: 'spike', x: 700, y: canvas.height - 130 },
            { type: 'rock', x: 1000, y: canvas.height - 160 },
            { type: 'pit', x: 1300, y: canvas.height - 100 },
            { type: 'spike', x: 1600, y: canvas.height - 130 },
            { type: 'rock', x: 2000, y: canvas.height - 160 },
            { type: 'pit', x: 2400, y: canvas.height - 100 },
            { type: 'spike', x: 2800, y: canvas.height - 130 },
            { type: 'rock', x: 3200, y: canvas.height - 160 },
            { type: 'pit', x: 3600, y: canvas.height - 100 },
            { type: 'spike', x: 4000, y: canvas.height - 130 },
            { type: 'rock', x: 4400, y: canvas.height - 160 },
            { type: 'pit', x: 4800, y: canvas.height - 100 },
            { type: 'spike', x: 5200, y: canvas.height - 130 }
        ],
        coins: [
            { x: 600, y: canvas.height - 200 },
            { x: 900, y: canvas.height - 250 },
            { x: 1200, y: canvas.height - 200 },
            { x: 1500, y: canvas.height - 250 },
            { x: 1900, y: canvas.height - 200 },
            { x: 2300, y: canvas.height - 250 },
            { x: 2700, y: canvas.height - 200 },
            { x: 3100, y: canvas.height - 250 },
            { x: 3500, y: canvas.height - 200 },
            { x: 3900, y: canvas.height - 250 },
            { x: 4300, y: canvas.height - 200 },
            { x: 4700, y: canvas.height - 250 },
            { x: 5100, y: canvas.height - 200 },
            { x: 5500, y: canvas.height - 250 }
        ]
    }
};

// ============================================
// 🎉 رسالة النجاح
// ============================================
console.log('%c✅ تم تحميل اللعبة بنجاح!', 'background: #2ecc71; color: white; font-size: 16px; padding: 5px;');
console.log('%c🎮 استمتع باللعب!', 'background: #667eea; color: white; font-size: 14px; padding: 5px;');
