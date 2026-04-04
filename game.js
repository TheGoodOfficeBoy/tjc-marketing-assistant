// Game setup variables
let score = 0;
let gameInterval;
let isPaused = false;
let gameOver = false;
let board = [];

// Game parameters
const gameWidth = 10;
const gameHeight = 20;
const gameArea = document.getElementById('gameArea');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');

// Tetris shapes and colors
const shapes = [
    [[1, 1, 1, 1]], // I shape
    [[1, 1], [1, 1]], // O shape
    [[0, 1, 1], [1, 1, 0]], // S shape
    [[1, 1, 0], [0, 1, 1]], // Z shape
    [[1, 0, 0], [1, 1, 1]], // L shape
    [[0, 0, 1], [1, 1, 1]], // J shape
    [[1, 1, 1], [0, 1, 0]] // T shape
];
const colors = ['#ff5733', '#33ff57', '#3357ff', '#f7e14a', '#ff33a2', '#6a33ff', '#ff9733'];

// Create the game board
function createBoard() {
    for (let row = 0; row < gameHeight; row++) {
        board[row] = [];
        for (let col = 0; col < gameWidth; col++) {
            board[row][col] = 0;
        }
    }
}

// Draw the game board
function drawBoard() {
    gameArea.innerHTML = '';
    for (let row = 0; row < gameHeight; row++) {
        for (let col = 0; col < gameWidth; col++) {
            const block = document.createElement('div');
            block.style.width = '24px';
            block.style.height = '24px';
            block.style.backgroundColor = board[row][col] ? colors[board[row][col] - 1] : '#333';
            block.style.border = '1px solid #222';
            block.style.position = 'absolute';
            block.style.left = `${col * 24}px`;
            block.style.top = `${row * 24}px`;
            gameArea.appendChild(block);
        }
    }
}

// Start a new game
function startGame() {
    score = 0;
    isPaused = false;
    gameOver = false;
    createBoard();
    drawBoard();
    scoreDisplay.textContent = `Score: ${score}`;
    gameInterval = setInterval(gameLoop, 500);
    startButton.style.display = 'none'; // Hide start button
    pauseButton.style.display = 'block'; // Show pause button
    resumeButton.style.display = 'none'; // Hide resume button
}

// Game loop
function gameLoop() {
    if (gameOver) {
        clearInterval(gameInterval);
        alert('Game Over! Your score: ' + score);
        startButton.style.display = 'block'; // Show start button again
        pauseButton.style.display = 'none'; // Hide pause button
        return;
    }

    // Game logic (move pieces, check for collisions, etc.)
    // Placeholder for game logic, you can add Tetris-specific logic here.
    // For simplicity, this example just moves a block down every loop.

    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    drawBoard();
}

// Pause the game
function pauseGame() {
    clearInterval(gameInterval);
    isPaused = true;
    pauseButton.style.display = 'none'; // Hide pause button
    resumeButton.style.display = 'block'; // Show resume button
}

// Resume the game
function resumeGame() {
    isPaused = false;
    gameInterval = setInterval(gameLoop, 500);
    pauseButton.style.display = 'block'; // Show pause button
    resumeButton.style.display = 'none'; // Hide resume button
}

// Event listeners for buttons
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
