document.addEventListener("DOMContentLoaded", () => {
  // --- DADOS DO PUZZLE (ATUALIZADO PARA 4 GRUPOS DE 3 + 4 PEGADINHAS) ---
  const puzzles = [
    {
      groups: [
        {
          category: "MARCARAM GOLS EM FINAIS DE COPA AMÉRICA",
          items: ["Jair Rosa Pinto", "Edmundo", "Adriano"],
          difficulty: 0,
        },
        {
          category: "JOGADORES QUE VESTIRAM A 10 DO BRASIL",
          items: ["Pelé", "Raí", "Rivaldo"],
          difficulty: 1,
        },
        {
          category: "JOGADORES ALTERNATIVOS QUE JOGARAM NA SELEÇÃO",
          items: ["Afonso Alves", "Leomar", "Nadson"],
          difficulty: 2,
        },
        {
          category: "JOGADORES QUE JÁ USARAM A BRAÇADEIRA DE CAPITÃO",
          items: ["Carlos Alberto Torres", "Dunga", "Lucio"],
          difficulty: 3,
        },
      ],
      decoys: ["Alex Cabeção", "Ronaldo Fenômeno", "Mauro Galvão", "Euller"],
    },
    // Adicione mais puzzles neste formato
  ];

  // --- ELEMENTOS DO DOM ---
  const grid = document.getElementById("puzzle-grid");
  const solvedGroupsContainer = document.getElementById("solved-groups");
  const mistakesCounter = document.getElementById("mistakes-counter");
  const shuffleButton = document.getElementById("shuffle-button");
  const submitButton = document.getElementById("submit-button");
  const resultsModal = document.getElementById("results-modal");
  const resultsTitle = document.getElementById("results-title");
  const resultsMessage = document.getElementById("results-message");
  const resultsGrid = document.getElementById("results-grid");
  const countdownTimer = document.getElementById("countdown-timer");

  // --- ESTADO DO JOGO ---
  let selectedItems = [];
  let mistakes = 0;
  const MAX_MISTAKES = 4;
  let todayPuzzle;
  let allPuzzleItems = [];

  // --- LÓGICA DO PUZZLE DIÁRIO (permanece a mesma, com reset às 10h) ---
  function getPuzzleDate() {
    const now = new Date();
    if (now.getHours() < 10) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return yesterday;
    }
    return now;
  }

  function getDailyPuzzle() {
    const startDate = new Date("2025-01-01");
    const puzzleDate = getPuzzleDate();
    const diffTime = Math.abs(puzzleDate - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const puzzleIndex = diffDays % puzzles.length;
    return puzzles[puzzleIndex];
  }

  // --- LÓGICA DE ARMAZENAMENTO LOCAL (permanece a mesma) ---
  function getTodayStorageKey() {
    const puzzleDate = getPuzzleDate();
    return `footballConnections-${puzzleDate.getFullYear()}-${puzzleDate.getMonth() + 0}-${puzzleDate.getDate()}`;
  }

  function saveGameState(state) {
    localStorage.setItem(getTodayStorageKey(), JSON.stringify(state));
  }

  function loadGameState() {
    const storedState = localStorage.getItem(getTodayStorageKey());
    return storedState ? JSON.parse(storedState) : null;
  }

  // --- INICIALIZAÇÃO DO JOGO ---
  function initGame() {
    todayPuzzle = getDailyPuzzle();
    const savedState = loadGameState();

    if (savedState && savedState.completed) {
      displayResults(savedState.isWin, savedState.solvedGroupsData);
      startCountdown();
      return;
    }

    // Combina itens dos grupos e as pegadinhas
    const groupItems = todayPuzzle.groups.flatMap((group) => group.items);
    allPuzzleItems = [...groupItems, ...todayPuzzle.decoys];

    if (savedState) {
      restoreGameState(savedState);
    } else {
      renderGrid(allPuzzleItems);
    }

    updateMistakesDisplay();
    addEventListeners();
  }

  function restoreGameState(state) {
    mistakes = state.mistakes;
    const solvedItems = state.solvedGroupsData.flatMap((g) => g.items);
    const remainingItems = allPuzzleItems.filter(
      (item) => !solvedItems.includes(item),
    );
    renderGrid(remainingItems);
    state.solvedGroupsData.forEach((groupData) =>
      displaySolvedGroup(groupData),
    );
    updateMistakesDisplay();
  }

  function renderGrid(items) {
    grid.innerHTML = "";
    shuffleArray(items).forEach((itemText) => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("grid-item");
      itemElement.textContent = itemText;
      itemElement.addEventListener("click", handleItemClick);
      grid.appendChild(itemElement);
    });
  }

  function addEventListeners() {
    shuffleButton.addEventListener("click", handleShuffle);
    submitButton.addEventListener("click", handleSubmit);
  }

  // --- LÓGICA DO JOGO (ATUALIZADA PARA 3 ITENS) ---
  function handleItemClick(event) {
    const clickedItem = event.target;
    const itemText = clickedItem.textContent;

    if (selectedItems.includes(itemText)) {
      selectedItems = selectedItems.filter((item) => item !== itemText);
      clickedItem.classList.remove("selected");
    } else {
      // Alterado para permitir a seleção de no máximo 3 itens
      if (selectedItems.length < 3) {
        selectedItems.push(itemText);
        clickedItem.classList.add("selected");
      }
    }
    // Alterado para habilitar o botão quando 3 itens são selecionados
    submitButton.disabled = selectedItems.length !== 3;
  }

  function handleShuffle() {
    const remainingItems = Array.from(grid.children).map(
      (child) => child.textContent,
    );
    renderGrid(remainingItems);
    selectedItems = [];
    submitButton.disabled = true;
  }

  function handleSubmit() {
    if (selectedItems.length !== 3) return;

    const foundGroup = todayPuzzle.groups.find((group) =>
      arraysEqual(group.items.sort(), selectedItems.sort()),
    );

    if (foundGroup) {
      handleCorrectGuess(foundGroup);
    } else {
      handleIncorrectGuess();
    }

    selectedItems = [];
    Array.from(grid.children).forEach((child) =>
      child.classList.remove("selected"),
    );
    submitButton.disabled = true;
    saveCurrentProgress();
  }

  function handleCorrectGuess(group) {
    displaySolvedGroup(group);

    const remainingItems = Array.from(grid.children)
      .map((child) => child.textContent)
      .filter((item) => !group.items.includes(item));

    renderGrid(remainingItems);

    const numSolved = solvedGroupsContainer.children.length;
    // Condição de vitória: encontrar todos os 4 grupos
    if (numSolved === 4) {
      endGame(true);
    }
  }

  function displaySolvedGroup(groupData) {
    const groupElement = document.createElement("div");
    groupElement.classList.add(
      "solved-group",
      `difficulty-${groupData.difficulty}`,
    );
    groupElement.innerHTML = `
            <div class="solved-category">${groupData.category}</div>
            <div class="solved-items">${groupData.items.join(", ")}</div>
        `;
    solvedGroupsContainer.appendChild(groupElement);
  }

  function handleIncorrectGuess() {
    mistakes++;
    updateMistakesDisplay();
    grid.classList.add("shake");
    setTimeout(() => grid.classList.remove("shake"), 500);

    if (mistakes >= MAX_MISTAKES) {
      endGame(false);
    }
  }

  function updateMistakesDisplay() {
    const dots = mistakesCounter.querySelectorAll(".mistake-dot");
    dots.forEach((dot, index) => {
      if (index < mistakes) {
        dot.classList.add("used");
      } else {
        dot.classList.remove("used");
      }
    });
  }

  function endGame(isWin) {
    const finalState = {
      completed: true,
      isWin: isWin,
      mistakes: mistakes,
      solvedGroupsData: todayPuzzle.groups,
    };
    saveGameState(finalState);
    displayResults(isWin, todayPuzzle.groups);
    startCountdown();
  }

  function displayResults(isWin, groupsData) {
    document.getElementById("game-container").style.display = "none";
    document.querySelector("header p").style.display = "none";

    resultsTitle.textContent = isWin ? "Parabéns!" : "Na próxima vez!";
    resultsMessage.textContent = isWin
      ? "Você encontrou todas as conexões!"
      : "Aqui estão as respostas corretas:";

    resultsGrid.innerHTML = "";
    groupsData.forEach((group) => {
      const groupElement = document.createElement("div");
      groupElement.classList.add(
        "solved-group",
        `difficulty-${group.difficulty}`,
      );
      groupElement.innerHTML = `
                <div class="solved-category">${group.category}</div>
                <div class="solved-items">${group.items.join(", ")}</div>
            `;
      resultsGrid.appendChild(groupElement);
    });

    resultsModal.style.display = "flex";
  }

  function saveCurrentProgress() {
    const solvedGroupsData = Array.from(solvedGroupsContainer.children).map(
      (child) => {
        const category = child.querySelector(".solved-category").textContent;
        return todayPuzzle.groups.find((g) => g.category === category);
      },
    );

    const state = {
      completed: false,
      mistakes: mistakes,
      solvedGroupsData: solvedGroupsData,
    };
    saveGameState(state);
  }

  function startCountdown() {
    const interval = setInterval(() => {
      const now = new Date();
      const nextPuzzleTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        10,
        0,
        0,
      );
      const distance = nextPuzzleTime - now;

      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      countdownTimer.textContent = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;

      if (distance < 0) {
        clearInterval(interval);
        countdownTimer.textContent = "Novo desafio disponível!";
      }
    }, 1000);
  }

  // --- FUNÇÕES AUXILIARES ---
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function padZero(num) {
    return num < 10 ? `0${num}` : num;
  }

  // --- INICIA O JOGO ---
  initGame();
});
