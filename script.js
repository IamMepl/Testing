const boardContainer = document.getElementById('board');
const startBtn = document.getElementById('startBtn');
const rematchBtn = document.getElementById('rematchBtn');
const homeBtn = document.getElementById('homeBtn');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const boardSizeSelect = document.getElementById('boardSize');
const firstMoveSelect = document.getElementById('firstMove');
const difficultySelect = document.getElementById('difficulty');
const playerScoreEl = document.getElementById('playerScore');
const botScoreEl = document.getElementById('botScore');
const timerEl = document.getElementById('timer');
const confettiCanvas = document.getElementById('confetti-canvas');

let board = [];
let currentPlayer = 'X';
let playerScore = 0;
let botScore = 0;
let boardSize = 3;
let difficulty = 'easy';
let firstMove = 'player';
let requiredInRow = 3;
let timer;
let timeLeft = 20;
let isGameActive = true;
let isPlayerTurn = true;

function startGame() {
  boardSize = parseInt(boardSizeSelect.value);
  difficulty = difficultySelect.value;
  firstMove = firstMoveSelect.value;
  requiredInRow = (boardSize === 6) ? 4 : (boardSize === 8) ? 5 : 3;

  menu.style.display = 'none';
  game.style.display = 'block';
  confettiCanvas.style.display = 'none';

  playerScore = 0;
  botScore = 0;
  updateScores();

  createBoard();
  isPlayerTurn = (firstMove === 'player');
  currentPlayer = 'X';

  if (!isPlayerTurn) {
    setTimeout(botMove, 500);
  }

  startTimer();
}

function createBoard() {
  board = [];
  boardContainer.innerHTML = '';
  boardContainer.style.gridTemplateColumns = `repeat(${boardSize}, 60px)`;

  for (let i = 0; i < boardSize * boardSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', onCellClick);
    boardContainer.appendChild(cell);
    board.push('');
  }
}

function onCellClick(e) {
  if (!isGameActive || !isPlayerTurn) return;
  const idx = e.target.dataset.index;
  if (board[idx] !== '') return;

  makeMove(idx, 'X');
}

function makeMove(index, symbol) {
  board[index] = symbol;
  const cell = boardContainer.querySelector(`[data-index='${index}']`);
  cell.textContent = symbol;
  isGameActive = true;

  if (checkWin(symbol)) {
    if (symbol === 'X') playerScore++;
    else botScore++;
    updateScores();
    triggerConfetti();
    shakeBoard();
  }

  switchTurn();
}

function switchTurn() {
  isPlayerTurn = !isPlayerTurn;
  resetTimer();

  if (!isPlayerTurn && isGameActive) {
    setTimeout(botMove, 500);
  }
}

function updateScores() {
  playerScoreEl.textContent = `Player: ${playerScore}`;
  botScoreEl.textContent = `Computer: ${botScore}`;
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 20;
  timerEl.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (isPlayerTurn) autoPlayerMove();
      else botMove();
    }
  }, 1000);
}

function resetTimer() {
  startTimer();
}

function autoPlayerMove() {
  let emptyCells = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
  if (emptyCells.length > 0) {
    const randomIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    makeMove(randomIdx, 'X');
  }
}

function botMove() {
  if (!isGameActive) return;

  let move = null;
  const empty = getEmptyCells();

  // Smart move for medium & hard
  if (difficulty === 'hard' || (difficulty === 'medium' && Math.random() < 0.6)) {
    move = findSmartMove('O') || findSmartMove('X'); // try win or block
  }

  if (!move) {
    const rand = empty[Math.floor(Math.random() * empty.length)];
    move = rand;
  }

  makeMove(move, 'O');
}

function findSmartMove(symbol) {
  const empty = getEmptyCells();
  for (let idx of empty) {
    board[idx] = symbol;
    if (checkWin(symbol)) {
      board[idx] = '';
      return idx;
    }
    board[idx] = '';
  }
  return null;
}

function getEmptyCells() {
  return board.map((val, i) => val === '' ? i : null).filter(v => v !== null);
}

function checkWin(symbol) {
  const lines = getLines();
  let winFound = false;

  lines.forEach(line => {
    if (line.every(idx => board[idx] === symbol)) {
      line.forEach(idx => {
        const cell = boardContainer.querySelector(`[data-index='${idx}']`);
        if (cell) {
          cell.classList.add('win');
        }
      });
      winFound = true;
    }
  });

  return winFound;
}

function getLines() {
  const lines = [];

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const base = row * boardSize + col;

      // Horizontal
      if (col <= boardSize - requiredInRow) {
        let line = [];
        for (let i = 0; i < requiredInRow; i++) {
          line.push(base + i);
        }
        lines.push(line);
      }

      // Vertical
      if (row <= boardSize - requiredInRow) {
        let line = [];
        for (let i = 0; i < requiredInRow; i++) {
          line.push(base + i * boardSize);
        }
        lines.push(line);
      }

      // Diagonal Right
      if (col <= boardSize - requiredInRow && row <= boardSize - requiredInRow) {
        let line = [];
        for (let i = 0; i < requiredInRow; i++) {
          line.push(base + i * (boardSize + 1));
        }
        lines.push(line);
      }

      // Diagonal Left
      if (col >= requiredInRow - 1 && row <= boardSize - requiredInRow) {
        let line = [];
        for (let i = 0; i < requiredInRow; i++) {
          line.push(base + i * (boardSize - 1));
        }
        lines.push(line);
      }
    }
  }

  return lines;
}

function triggerConfetti() {
  confettiCanvas.style.display = 'block';
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
  setTimeout(() => {
    confettiCanvas.style.display = 'none';
  }, 3000);
}

function shakeBoard() {
  boardContainer.classList.add('shake');
  setTimeout(() => boardContainer.classList.remove('shake'), 500);
}

// Button Actions
startBtn.addEventListener('click', startGame);
rematchBtn.addEventListener('click', startGame);
homeBtn.addEventListener('click', () => {
  game.style.display = 'none';
  menu.style.display = 'block';
});
