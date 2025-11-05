// --- Глобальні змінні ---
let allWordsByCategory = {}; 
let availableWords = []; 
let isSoundEnabled = true; 
const SOUND_STORAGE_KEY = 'itAliasSound'; 
let sounds = {}; 
let gameState = {
  team1Score: 0,
  team2Score: 0,
  team1Name: "Команда 1",
  team2Name: "Команда 2",
  currentTeam: 1, 
  roundTime: 60,
  totalRounds: 3,
  currentRound: 0,
  isGameInProgress: false,
  lastRoundScore: 0,
  selectedCategory: 'mixed',
  isRoundActive: false 
};
let roundScore = 0;
let timeLeft = 0;
let timerInterval;

// --- Знаходимо елементи на HTML-сторінці ---
// (Без змін)
const screens = document.querySelectorAll('.screen');
const mainMenuScreen = document.getElementById('main-menu-screen'); 
const settingsScreen = document.getElementById('settings-screen'); 
const rulesScreen = document.getElementById('rules-screen');     
const gameScreen = document.getElementById('game-screen');
const turnEndScreen = document.getElementById('turn-end-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen'); 
const scoreboard = document.getElementById('scoreboard');
const team1NameDisplay = document.getElementById('team1-name');
const team1ScoreDisplay = document.getElementById('team1-score');
const team2NameDisplay = document.getElementById('team2-name');
const team2ScoreDisplay = document.getElementById('team2-score');
const team1Input = document.getElementById('team1-input');
const team2Input = document.getElementById('team2-input');
const timeSlider = document.getElementById('time-slider');
const timeOutput = document.getElementById('time-output');
const roundsSlider = document.getElementById('rounds-slider');
const roundsOutput = document.getElementById('rounds-output');
const categorySelect = document.getElementById('category-select'); 
const continueBtn = document.getElementById('continue-btn'); 
const newGameMenuBtn = document.getElementById('new-game-menu-btn'); 
const rulesBtn = document.getElementById('rules-btn');             
const startBtn = document.getElementById('start-btn'); 
const skipBtn = document.getElementById('skip-btn');
const correctBtn = document.getElementById('correct-btn');
const nextTurnBtn = document.getElementById('next-turn-btn');
const resetGameBtn = document.getElementById('reset-game-btn'); 
const newGameBtn = document.getElementById('new-game-btn'); 
const backButtons = document.querySelectorAll('.btn-primary[data-target], .btn-tertiary[data-target]');
const pauseBtn = document.getElementById('pause-btn');       
const resumeBtn = document.getElementById('resume-btn');     
const quitToMenuBtn = document.getElementById('quit-to-menu-btn'); 
const soundToggleBtn = document.getElementById('sound-toggle-btn'); 
const timerDisplay = document.getElementById('timer');
const roundCounterDisplay = document.getElementById('round-counter'); 
const wordDisplay = document.getElementById('word-display');
const turnEndTitle = document.getElementById('turn-end-title'); 
const roundSummaryDisplay = document.getElementById('round-summary');
const nextTeamNameDisplay = document.getElementById('next-team-name');
const winnerMessageDisplay = document.getElementById('winner-message'); 
const finalScoreSummaryDisplay = document.getElementById('final-score-summary');

// --- Прив'язуємо функції до кнопок ---
// (Без змін)
newGameMenuBtn.addEventListener('click', () => {
  const savedData = localStorage.getItem(GAME_STORAGE_KEY);
  if (savedData) {
    if (confirm("Ви впевнені, що хочете почати нову гру? Весь збережений прогрес буде втрачено.")) {
      performReset(); 
      showScreen(settingsScreen); 
    }
  } else {
    performReset(); 
    showScreen(settingsScreen);
  }
});
rulesBtn.addEventListener('click', () => showScreen(rulesScreen));
startBtn.addEventListener('click', setupNewGame);
continueBtn.addEventListener('click', continueGame); 
correctBtn.addEventListener('click', handleCorrect);
skipBtn.addEventListener('click', handleSkip);
nextTurnBtn.addEventListener('click', startRound);
resetGameBtn.addEventListener('click', quitGame); 
newGameBtn.addEventListener('click', () => {
    performReset(); 
    showScreen(mainMenuScreen); 
}); 
backButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    const targetScreenId = e.target.getAttribute('data-target');
    const targetScreen = document.getElementById(targetScreenId);
    if (targetScreen) {
      showScreen(targetScreen);
    }
  });
});
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
quitToMenuBtn.addEventListener('click', quitGame); 
soundToggleBtn.addEventListener('click', toggleSound); 
timeSlider.oninput = function() { timeOutput.value = this.value; }
roundsSlider.oninput = function() { roundsOutput.value = this.value; }

// --- Робота зі сховищем (localStorage) ---
// (Без змін)
const GAME_STORAGE_KEY = 'itAliasSavedGame'; 
function saveGameState() { localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(gameState)); }
function loadGameState() {
  const savedData = localStorage.getItem(GAME_STORAGE_KEY);
  if (savedData) {
    gameState = JSON.parse(savedData);
    return true; 
  }
  return false; 
}
function clearGameState() { localStorage.removeItem(GAME_STORAGE_KEY); }

// --- Логіка Звуку ---
function loadSounds() {
  try {
    sounds.correct = new Audio('sounds/correct.mp3');
    sounds.skip = new Audio('sounds/skip.mp3');
    sounds.timesUp = new Audio('sounds/times-up.mp3');
    sounds.tick = new Audio('sounds/tick.mp3');
    console.log("Звуки завантажено.");
  } catch (e) {
    console.error("Помилка завантаження звуків. Перевірте папку 'sounds'.", e);
    isSoundEnabled = false; 
  }
}
function playSound(sound) {
  if (isSoundEnabled && sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.warn("Помилка програвання звуку:", e));
  }
}
function stopSound(sound) {
  if (sound) {
    sound.pause();
    sound.currentTime = 0;
  }
}
function updateSoundIcon() {
  if (isSoundEnabled) {
    soundToggleBtn.textContent = '🔊';
  } else {
    soundToggleBtn.textContent = '🔇';
  }
}

// ЗМІНА ТУТ
function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  localStorage.setItem(SOUND_STORAGE_KEY, isSoundEnabled);
  updateSoundIcon();
  
  // Перевіряємо, чи ми в активному раунді
  if (gameState.isRoundActive) {
    if (isSoundEnabled && timeLeft <= 5 && timeLeft > 0) {
      // Якщо звук УВІМКНУЛИ і час тікає - запускаємо тікання
      playSound(sounds.tick);
    } else {
      // Якщо звук ВИМКНУЛИ - зупиняємо тікання
      stopSound(sounds.tick);
    }
  }
}

function loadSoundPreference() {
  const savedSoundSetting = localStorage.getItem(SOUND_STORAGE_KEY);
  if (savedSoundSetting !== null) {
    isSoundEnabled = (savedSoundSetting === 'true');
  }
  updateSoundIcon();
}

// --- Ініціалізація гри (Запуск) ---
// (Без змін)
async function initializeApp() {
  loadSoundPreference();
  loadSounds();
  newGameMenuBtn.disabled = true;
  continueBtn.disabled = true;
  try {
    const response = await fetch('./words.json');
    if (!response.ok) throw new Error('Не вдалося завантажити слова.');
    allWordsByCategory = await response.json(); 
    newGameMenuBtn.disabled = false;
    console.log(`Завантажено ${Object.keys(allWordsByCategory).length} категорій слів.`);
  } catch (error) {
    console.error(error);
    const h1 = mainMenuScreen.querySelector('h1');
    if (h1) {
      h1.textContent = "Помилка завантаження слів. Спробуйте оновити.";
      h1.style.color = 'red';
    }
    return;
  }
  if (loadGameState() && gameState.isGameInProgress) {
    continueBtn.style.display = 'block';
    continueBtn.disabled = false;
  }
  showScreen(mainMenuScreen); 
  scoreboard.style.display = 'none';
}

// --- Функції гри ---
// (Без змін)
function showScreen(screenToShow) { /* ... */ }
function getWordsForCategory(category) { /* ... */ }
function setupNewGame() { /* ... */ }
function continueGame() { /* ... */ }
function startRound(isContinuation = false) { /* ... */ }

// ЗМІНА ТУТ
function startTimer() {
  clearInterval(timerInterval); 
  
  // ОДРАЗУ перевіряємо, чи не час тікати (для кнопки "Продовжити")
  if (timeLeft <= 5 && timeLeft > 0) {
    playSound(sounds.tick);
  }

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    
    // Звук "тікання"
    if (timeLeft === 5) { // Відтворюємо ОДИН раз, коли стає 5
      playSound(sounds.tick);
    }

    if (timeLeft <= 0) {
      endRound(); 
    }
  }, 1000);
}

// (nextWord, handleCorrect, handleSkip - без змін)

function endRound() {
  clearInterval(timerInterval); 
  gameState.isRoundActive = false; 
  
  stopSound(sounds.tick); // Зупиняємо тікання
  playSound(sounds.timesUp); 

  // (Решта коду - без змін)
  if (gameState.currentTeam === 1) gameState.team1Score += roundScore;
  else gameState.team2Score += roundScore;
  gameState.lastRoundScore = roundScore; 
  updateScoreboard();
  if (gameState.currentTeam === 2 && gameState.currentRound >= gameState.totalRounds) {
    gameState.isGameInProgress = false; 
    showWinner();
    clearGameState(); 
  } else {
    gameState.currentTeam = (gameState.currentTeam === 1) ? 2 : 1;
    showRoundSummary(false); 
    saveGameState(); 
  }
}

// (showRoundSummary, updateScoreboard, showWinner - без змін)

function performReset() {
  stopSound(sounds.tick); // Зупиняємо тікання
  
  gameState.isGameInProgress = false; 
  gameState.isRoundActive = false; 
  clearGameState(); 
  scoreboard.style.display = 'none'; 
  continueBtn.style.display = 'none'; 
  team1Input.value = "Команда 1";
  team2Input.value = "Команда 2";
  timeSlider.value = 60;
  timeOutput.value = 60;
  roundsSlider.value = 3;
  roundsOutput.value = 3;
  categorySelect.value = "mixed"; 
  gameState.lastRoundScore = 0; 
}

// --- Функції Паузи ---
function pauseGame() {
  clearInterval(timerInterval); 
  stopSound(sounds.tick); // Зупиняємо тікання
  showScreen(pauseScreen); 
}
function resumeGame() {
  showScreen(gameScreen); 
  startTimer(); // startTimer тепер сам перевірить, чи час тікати
}
function quitGame() {
  if (!confirm("Вийти в головне меню? Ваш прогрес буде збережено.")) {
      return; 
  }
  clearInterval(timerInterval); 
  stopSound(sounds.tick); // Зупиняємо тікання
  
  gameState.isRoundActive = false; 
  saveGameState(); 
  scoreboard.style.display = 'none'; 
  initializeApp(); 
}

// --- ЗАПУСК ДОДАТКУ ---
initializeApp();
