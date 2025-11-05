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
function saveGameState() { /* ... */ }
function loadGameState() { /* ... */ }
function clearGameState() { /* ... */ }

// --- Логіка Звуку ---
// (Без змін)
function loadSounds() { /* ... */ }
function playSound(sound) { /* ... */ }
function stopSound(sound) { /* ... */ }
function updateSoundIcon() { /* ... */ }
function toggleSound() { /* ... */ }
function loadSoundPreference() { /* ... */ }

// --- Ініціаліація гри (Запуск) ---
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
  
  pauseBtn.style.display = 'none'; // Сховаємо кнопку паузи при старті
  
  showScreen(mainMenuScreen); 
  scoreboard.style.display = 'none';
}

// --- Функції гри ---
function showScreen(screenToShow) {
  screens.forEach(screen => screen.classList.remove('active'));
  screenToShow.classList.add('active');
}
function getWordsForCategory(category) {
  if (category === 'mixed') {
    return [].concat(allWordsByCategory.easy, allWordsByCategory.medium, allWordsByCategory.hard);
  }
  return allWordsByCategory[category] || []; 
}
function setupNewGame() {
  // (Без змін)
  clearGameState(); 
  gameState.team1Name = team1Input.value || "Команда 1";
  // ...
  gameState.isGameInProgress = true; 
  gameState.isRoundActive = false; 
  updateScoreboard();
  scoreboard.style.display = 'flex'; 
  startRound();
}
function continueGame() {
  // (Без змін)
  updateScoreboard();
  scoreboard.style.display = 'flex';
  // ...
  if (gameState.isRoundActive) {
    startRound(true); 
  } else {
    showRoundSummary(true); 
  }
}
function startRound(isContinuation = false) {
  // (Без змін)
  // ...
  availableWords = [...categoryWords].sort(() => Math.random() - 0.5);

  nextWord();
  showScreen(gameScreen);
  
  pauseBtn.style.display = 'block'; // ЗМІНА: Показуємо кнопку паузи
  
  startTimer();
  gameState.isRoundActive = true; 
  saveGameState(); 
}
function startTimer() {
  // (Без змін, логіка тікання вже тут)
  clearInterval(timerInterval); 
  if (timeLeft <= 5 && timeLeft > 0) {
    playSound(sounds.tick);
  }
  timerInterval = setInterval(() => {
    // ...
  }, 1000);
}

// ЗМІНА ТУТ: Логіка розміру шрифту
function nextWord() {
  // 1. Скидаємо стилі до стандартних
  wordDisplay.style.fontSize = '2rem';
  wordDisplay.innerHTML = ''; // Очищуємо <br> з минулого разу

  if (availableWords.length === 0) {
    const categoryWords = getWordsForCategory(gameState.selectedCategory);
    if (!categoryWords || categoryWords.length === 0) {
      wordDisplay.textContent = "Слова скінчились!";
      return;
    }
    availableWords = [...categoryWords].sort(() => Math.random() - 0.5);
  }
  const newWord = availableWords.pop(); 

  // 2. Встановлюємо текст, щоб "виміряти" його
  wordDisplay.textContent = newWord;
  
  // 3. Перевіряємо, чи "вилазить" текст за межі блоку
  // scrollWidth = реальна ширина тексту
  // clientWidth = видима ширина блоку
  const hasOverflow = wordDisplay.scrollWidth > wordDisplay.clientWidth;
  const wordCount = newWord.split(' ').length;

  if (hasOverflow && wordCount > 1) {
    // Якщо слів > 1 і вони не влазять:
    // Замінюємо пробіли на тег <br> (новий рядок)
    wordDisplay.innerHTML = newWord.replace(/ /g, '<br>');
  
  } else if (hasOverflow && wordCount === 1) {
    // Якщо слово 1 і воно не влазить:
    // Зменшуємо шрифт
    wordDisplay.style.fontSize = '1.6rem';
    
    // Перевіряємо ще раз, раптом воно ДУЖЕ довге
    if (wordDisplay.scrollWidth > wordDisplay.clientWidth) {
      wordDisplay.style.fontSize = '1.3rem';
    }
  }
  // Якщо `hasOverflow` false - нічого не робимо, слово і так влазить
}

function handleCorrect() { /* (Без змін) */ }
function handleSkip() { /* (Без змін) */ }

function endRound() {
  clearInterval(timerInterval); 
  gameState.isRoundActive = false; 
  
  pauseBtn.style.display = 'none'; // ЗМІНА: Ховаємо кнопку паузи
  
  stopSound(sounds.tick); 
  playSound(sounds.timesUp); 
  // (Решта коду - без змін)
  // ...
  saveGameState(); 
}

function showRoundSummary(isContinuation = false) { /* (Без змін) */ }
function updateScoreboard() { /* (Без змін) */ }
function showWinner() { /* (Без змін) */ }

function performReset() {
  stopSound(sounds.tick); 
  pauseBtn.style.display = 'none'; // ЗМІНА: Ховаємо кнопку паузи
  
  gameState.isGameInProgress = false; 
  // (Решта коду - без змін)
  // ...
  gameState.lastRoundScore = 0; 
}

// --- Функції Паузи ---
function pauseGame() {
  clearInterval(timerInterval); 
  stopSound(sounds.tick); 
  
  pauseBtn.style.display = 'none'; // ЗМІНА: Ховаємо кнопку паузи
  
  showScreen(pauseScreen); 
}
function resumeGame() {
  showScreen(gameScreen); 
  
  pauseBtn.style.display = 'block'; // ЗМІНА: Показуємо кнопку паузи
  
  startTimer(); 
}
function quitGame() {
  if (!confirm("Вийти в головне меню? Ваш прогрес буде збережено.")) {
      return; 
  }
  clearInterval(timerInterval); 
  stopSound(sounds.tick); 
  
  pauseBtn.style.display = 'none'; // ЗМІНА: Ховаємо кнопку паузи
  
  gameState.isRoundActive = false; 
  saveGameState(); 
  scoreboard.style.display = 'none'; 
  initializeApp(); 
}

// --- ЗАПУСК ДОДАТКУ ---
initializeApp();
