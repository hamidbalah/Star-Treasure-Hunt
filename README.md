<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لعبة الفضاء</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div id="menu" class="screen active">
            <h1>🚀 لعبة الفضاء</h1>
            <p class="desc">اجمع النجوم وتجنب العقبات!</p>
            <button onclick="startGame()" class="btn">ابدأ اللعب</button>
            <div class="stats">
                <p>⭐ أعلى نقاط: <span id="highScore">0</span></p>
                <p>💎 العملات: <span id="coins">0</span></p>
            </div>
        </div>

        <div id="game" class="screen">
            <div class="hud">
                <span>النقاط: <span id="score">0</span></span>
                <span>❤️ <span id="lives">3</span></span>
            </div>
            <canvas id="canvas"></canvas>
            <div class="controls">
                <button id="leftBtn" class="control">⬅️</button>
                <button id="rightBtn" class="control">➡️</button>
            </div>
        </div>

        <div id="gameOver" class="screen">
            <h1>🎮 انتهت اللعبة!</h1>
            <p class="result">النقاط: <span id="finalScore">0</span></p>
            <button onclick="startGame()" class="btn">العب مرة أخرى</button>
            <button onclick="backToMenu()" class="btn secondary">القائمة الرئيسية</button>
        </div>
    </div>

    <script src="game.js"></script>
</body>
</html>
