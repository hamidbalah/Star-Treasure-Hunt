console.log('🎮 تحميل اللعبة...');

// إعداد Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// متغيرات اللعبة
let gameState = 'menu';
let score = 0;
let coins = 0;
let health = 100;

// عرض الإحصائيات
const highScore = localStorage.getItem('highScore') || 0;
const totalCoins = localStorage.getItem('totalCoins') || 0;
const completedLevels = localStorage.getItem('completedLevels') || 0;

// تحديث القيم في القائمة
if (document.getElementById('highScore')) {
    document.getElementById('highScore').textContent = highScore;
}
if (document.getElementById('totalCoins')) {
    document.getElementById('totalCoins').textContent = totalCoins;
}
if (document.getElementById('completedLevels')) {
    document.getElementById('completedLevels').textContent = completedLevels;
}

// وظائف التحكم في الشاشات
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
}

function showInstructions() {
    showScreen('instructions');
}

function showSettings() {
    showScreen('settings');
}

function showMap() {
    showScreen('mapScreen');
}

// كلاس اللاعب
class Player {
    constructor() {
        this.x = 100;
        this.y = canvas.height - 160;
        this.width = 50;
        this.height = 60;
        this.velocityY = 0;
        this.jumping = false;
    }

    draw() {
        // الجسم
        ctx.fillStyle = '#4a69bd';
        ctx.fillRect(this.x + 10, this.y + 20, 30, 35);
        
        // الرأس
        ctx.fillStyle = '#feca57';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.velocityY += 0.6;
        this.y += this.velocityY;

        const groundLevel = canvas.height - 160;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.jumping = false;
        }
    }

    jump() {
        if (!this.jumping) {
            this.velocityY = -15;
            this.jumping = true;
        }
    }
}

let player = null;

// بدء اللعبة
function startLevel(level) {
    if (!canvas) return;
    
    showScreen('gameScreen');
    gameState = 'playing';
    
    player = new Player();
    gameLoop();
}

// حلقة اللعبة
function gameLoop() {
    if (gameState !== 'playing' || !canvas) return;

    // مسح الشاشة
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // الأرض
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // رسم اللاعب
    if (player) {
        player.update();
        player.draw();
    }

    requestAnimationFrame(gameLoop);
}

// التحكم
document.addEventListener('keydown', (e) => {
    if (gameState === 'playing') {
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (player) player.jump();
        }
    }
});

// التحكم باللمس
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
        if (player) player.jump();
    });
}

// إعادة تعيين التقدم
function resetProgress() {
    if (confirm('هل تريد حذف كل التقدم؟')) {
        localStorage.clear();
        alert('تم إعادة التعيين!');
        location.reload();
    }
}

// عند الخروج
function exitToMap() {
    showMap();
}

function pauseGame() {
    showScreen('pauseScreen');
}

function resumeGame() {
    showScreen('gameScreen');
    gameLoop();
}

function restartLevel() {
    startLevel(1);
}

function nextLevel() {
    alert('المرحلة التالية قريباً!');
}

// عرض القائمة الرئيسية عند التحميل
window.addEventListener('load', () => {
    showMainMenu();
});

console.log('✅ اللعبة جاهزة!');
