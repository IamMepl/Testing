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
    setTimeout(() => {
      triggerConfetti();
      shakeBoard();
    }, 200);
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

  let move;
  if (difficulty === 'easy') {
    move = randomMove();
  } else if (difficulty === 'medium') {
    move = smartMove(2); // lookahead 2
  } else {
    move = smartMove(4); // lookahead 4
  }

  if (move == null) {
    move = randomMove();
  }
  makeMove(move, 'O');
}

function randomMove() {
  const emptyCells = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function smartMove(depth = 2) {
  // simple Minimax-inspired bot
  let bestScore = -Infinity;
  let move = null;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      board[i] = 'O';
      let score = minimax(board, depth, false);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function minimax(newBoard, depth, isMaximizing) {
  const winner = checkWinSimple();
  if (winner === 'O') return 10;
  if (winner === 'X') return -10;
  if (!newBoard.includes('')) return 0;
  if (depth === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < newBoard.length; i++) {
      if (newBoard[i] === '') {
        newBoard[i] = 'O';
        best = Math.max(best, minimax(newBoard, depth - 1, false));
        newBoard[i] = '';
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < newBoard.length; i++) {
      if (newBoard[i] === '') {
        newBoard[i] = 'X';
        best = Math.min(best, minimax(newBoard, depth - 1, true));
        newBoard[i] = '';
      }
    }
    return best;
  }
}

function checkWin(symbol) {
  const lines = getLines();
  let found = false;

  lines.forEach(line => {
    if (line.every(idx => board[idx] === symbol)) {
      highlightWinningCells(line);
      found = true;
    }
  });

  return found;
}

function checkWinSimple() {
  const lines = getLines();
  for (let line of lines) {
    if (line.every(idx => board[idx] === 'X')) return 'X';
    if (line.every(idx => board[idx] === 'O')) return 'O';
  }
  return null;
}

function getLines() {
  let lines = [];

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      let idx = r * boardSize + c;

      // Horizontal
      if (c <= boardSize - requiredInRow) {
        let row = [];
        for (let i = 0; i < requiredInRow; i++) {
          row.push(idx + i);
        }
        lines.push(row);
      }

      // Vertical
      if (r <= boardSize - requiredInRow) {
        let col = [];
        for (let i = 0; i < requiredInRow; i++) {
          col.push(idx + i * boardSize);
        }
        lines.push(col);
      }

      // Diagonal right
      if (r <= boardSize - requiredInRow && c <= boardSize - requiredInRow) {
        let diag1 = [];
        for (let i = 0; i < requiredInRow; i++) {
          diag1.push(idx + i * (boardSize + 1));
        }
        lines.push(diag1);
      }

      // Diagonal left
      if (r <= boardSize - requiredInRow && c >= requiredInRow - 1) {
        let diag2 = [];
        for (let i = 0; i < requiredInRow; i++) {
          diag2.push(idx + i * (boardSize - 1));
        }
        lines.push(diag2);
      }
    }
  }
  return lines;
}

function highlightWinningCells(cells) {
  cells.forEach(idx => {
    const cell = boardContainer.querySelector(`[data-index='${idx}']`);
    if (cell) {
      cell.style.backgroundColor = '#00f0ff';
      cell.style.color = '#fff';
      cell.style.fontWeight = 'bold';
    }
  });
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
  setTimeout(() => {
    boardContainer.classList.remove('shake');
  }, 500);
}

// Buttons
startBtn.addEventListener('click', startGame);
rematchBtn.addEventListener('click', startGame);
homeBtn.addEventListener('click', () => {
  menu.style.display = 'block';
  game.style.display = 'none';
});