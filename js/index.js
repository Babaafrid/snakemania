/* =============================================
   SNAKEMANIA — GAME ENGINE
   ============================================= */

// ===== AUDIO =====
const foodSound     = new Audio('music/food.mp3');
const gameOverSound = new Audio('music/gameover.mp3');
const moveSound     = new Audio('music/move.mp3');
const musicSound    = new Audio('music/music.mp3');
musicSound.loop = true;

// ===== STATE =====
let inputDir      = { x: 0, y: 0 };
let lastInputDir  = { x: 0, y: 0 };
let speed         = 10;
let score         = 0;
let lastPaintTime = 0;
let isRunning     = false;
let isPaused      = false;
let isMuted       = false;
let newRecordThisGame = false;
let snakeArr      = [{ x: 13, y: 15 }];
let food          = { x: 6, y: 7 };

// ===== DOM REFS =====
const board          = document.getElementById('board');
const scoreBox       = document.getElementById('scoreBox');
const hiscoreBox     = document.getElementById('hiscoreBox');
const finalScore     = document.getElementById('finalScore');
const finalHiscore   = document.getElementById('finalHiscore');
const newRecordBadge = document.getElementById('newRecordBadge');
const startScreen    = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen    = document.getElementById('pauseScreen');
const startBtn       = document.getElementById('startBtn');
const restartBtn     = document.getElementById('restartBtn');
const menuBtn        = document.getElementById('menuBtn');
const resumeBtn      = document.getElementById('resumeBtn');
const pauseMenuBtn   = document.getElementById('pauseMenuBtn');
const pauseBtn       = document.getElementById('pauseBtn');
const soundToggle    = document.getElementById('soundToggle');
const soundOnIcon    = document.getElementById('soundOnIcon');
const soundOffIcon   = document.getElementById('soundOffIcon');
const diffBtns       = document.querySelectorAll('.diff-btn');
const diffBadge      = document.getElementById('diffBadge');

// ===== HIGH SCORE =====
let hiscoreval = parseInt(localStorage.getItem('hiscore') || '0', 10);
hiscoreBox.textContent = hiscoreval;

// ===== HELPERS =====
function playSound(audio) {
    if (isMuted) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function showOverlay(el) { el.classList.add('active'); }
function hideOverlay(el) { el.classList.remove('active'); }

function bumpScore(el) {
    el.classList.remove('bumping');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('bumping');
}

// Generate food position that never overlaps the snake
function getRandomFoodPos() {
    const a = 2, b = 16;
    let pos;
    let attempts = 0;
    do {
        pos = {
            x: Math.round(a + (b - a) * Math.random()),
            y: Math.round(a + (b - a) * Math.random()),
        };
        attempts++;
    } while (snakeArr.some(s => s.x === pos.x && s.y === pos.y) && attempts < 200);
    return pos;
}

function resetGame() {
    snakeArr             = [{ x: 13, y: 15 }];
    inputDir             = { x: 0, y: 0 };
    lastInputDir         = { x: 0, y: 0 };
    score                = 0;
    newRecordThisGame    = false;
    lastPaintTime        = 0;
    scoreBox.textContent = '0';
    food                 = getRandomFoodPos();
}

// ===== COLLISION =====
function isCollide(snake) {
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    // Wall collision (original boundaries preserved)
    if (snake[0].x >= 18 || snake[0].x <= 0 || snake[0].y >= 18 || snake[0].y <= 0) return true;
    return false;
}

// ===== GAME ENGINE =====
function gameEngine() {
    if (isCollide(snakeArr)) {
        playSound(gameOverSound);
        musicSound.pause();

        // Populate game over screen
        finalScore.textContent   = score;
        finalHiscore.textContent = hiscoreval;
        if (newRecordThisGame) {
            newRecordBadge.classList.remove('hidden');
        } else {
            newRecordBadge.classList.add('hidden');
        }

        isRunning = false;
        showOverlay(gameOverScreen);
        return;
    }

    // Eat food
    if (snakeArr[0].x === food.x && snakeArr[0].y === food.y) {
        playSound(foodSound);
        score += 1;

        if (score > hiscoreval) {
            hiscoreval = score;
            localStorage.setItem('hiscore', hiscoreval);
            hiscoreBox.textContent = hiscoreval;
            bumpScore(hiscoreBox);
            newRecordThisGame = true;
        }

        scoreBox.textContent = score;
        bumpScore(scoreBox);

        // Grow snake
        snakeArr.unshift({ x: snakeArr[0].x + inputDir.x, y: snakeArr[0].y + inputDir.y });
        food = getRandomFoodPos();
    }

    // Shift body
    for (let i = snakeArr.length - 2; i >= 0; i--) {
        snakeArr[i + 1] = { ...snakeArr[i] };
    }

    // Move head
    snakeArr[0].x += inputDir.x;
    snakeArr[0].y += inputDir.y;
    lastInputDir = { ...inputDir };

    // Render
    board.innerHTML = '';
    snakeArr.forEach((seg, index) => {
        const el = document.createElement('div');
        el.style.gridRowStart    = seg.y;
        el.style.gridColumnStart = seg.x;
        el.classList.add(index === 0 ? 'head' : 'snake');
        board.appendChild(el);
    });
    const foodEl = document.createElement('div');
    foodEl.style.gridRowStart    = food.y;
    foodEl.style.gridColumnStart = food.x;
    foodEl.classList.add('food');
    board.appendChild(foodEl);
}

// ===== ANIMATION LOOP =====
function main(ctime) {
    if (!isRunning || isPaused) return;
    window.requestAnimationFrame(main);
    if ((ctime - lastPaintTime) / 1000 < 1 / speed) return;
    lastPaintTime = ctime;
    gameEngine();
}

// ===== GAME FLOW =====
function startGame() {
    resetGame();
    isRunning = true;
    isPaused  = false;
    hideOverlay(startScreen);
    hideOverlay(gameOverScreen);
    hideOverlay(pauseScreen);
    if (!isMuted) musicSound.play().catch(() => {});
    window.requestAnimationFrame(main);
}

function pauseGame() {
    if (!isRunning || isPaused) return;
    isPaused = true;
    musicSound.pause();
    showOverlay(pauseScreen);
}

function resumeGame() {
    if (!isRunning || !isPaused) return;
    isPaused = false;
    hideOverlay(pauseScreen);
    if (!isMuted) musicSound.play().catch(() => {});
    window.requestAnimationFrame(main);
}

function goToMenu() {
    isRunning = false;
    isPaused  = false;
    musicSound.pause();
    hideOverlay(gameOverScreen);
    hideOverlay(pauseScreen);
    showOverlay(startScreen);
}

function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
        musicSound.pause();
        soundOnIcon.classList.add('hidden');
        soundOffIcon.classList.remove('hidden');
        soundToggle.classList.add('muted');
    } else {
        if (isRunning && !isPaused) musicSound.play().catch(() => {});
        soundOnIcon.classList.remove('hidden');
        soundOffIcon.classList.add('hidden');
        soundToggle.classList.remove('muted');
    }
}

// ===== DIFFICULTY =====
diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        speed = parseInt(btn.dataset.speed, 10);
        diffBadge.textContent = btn.textContent;
    });
});

// ===== BUTTON EVENTS =====
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
menuBtn.addEventListener('click', goToMenu);
resumeBtn.addEventListener('click', resumeGame);
pauseMenuBtn.addEventListener('click', goToMenu);
pauseBtn.addEventListener('click', () => isPaused ? resumeGame() : pauseGame());
soundToggle.addEventListener('click', toggleMute);

// ===== KEYBOARD =====
const KEY_DIRS = {
    ArrowUp:    { x: 0,  y: -1 },
    ArrowDown:  { x: 0,  y:  1 },
    ArrowLeft:  { x: -1, y:  0 },
    ArrowRight: { x: 1,  y:  0 },
};

window.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P') {
        if (!isRunning) return;
        isPaused ? resumeGame() : pauseGame();
        return;
    }
    if (e.key === 'm' || e.key === 'M') {
        toggleMute();
        return;
    }
    if (!isRunning || isPaused) return;

    const newDir = KEY_DIRS[e.key];
    if (!newDir) return;

    // Prevent 180° reversal
    if (newDir.x === -lastInputDir.x && newDir.y === -lastInputDir.y) return;

    inputDir = newDir;
    playSound(moveSound);
    e.preventDefault(); // stop page scroll on arrow keys
});

// ===== MOBILE D-PAD =====
const DPAD_DIRS = {
    up:    { x: 0,  y: -1 },
    down:  { x: 0,  y:  1 },
    left:  { x: -1, y:  0 },
    right: { x: 1,  y:  0 },
};

document.querySelectorAll('.dpad-btn').forEach(btn => {
    function handleDpad() {
        if (!isRunning || isPaused) return;
        const newDir = DPAD_DIRS[btn.dataset.dir];
        if (!newDir) return;
        if (newDir.x === -lastInputDir.x && newDir.y === -lastInputDir.y) return;
        inputDir = newDir;
        playSound(moveSound);
    }
    btn.addEventListener('touchstart', e => { e.preventDefault(); handleDpad(); }, { passive: false });
    btn.addEventListener('click', handleDpad);
});

// ===== SWIPE ON BOARD =====
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_MIN = 22;

board.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

board.addEventListener('touchend', e => {
    if (!isRunning || isPaused) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;

    let newDir;
    if (Math.abs(dx) > Math.abs(dy)) {
        newDir = dx > 0 ? DPAD_DIRS.right : DPAD_DIRS.left;
    } else {
        newDir = dy > 0 ? DPAD_DIRS.down : DPAD_DIRS.up;
    }
    if (newDir.x === -lastInputDir.x && newDir.y === -lastInputDir.y) return;
    inputDir = newDir;
    playSound(moveSound);
}, { passive: true });