document.addEventListener("DOMContentLoaded", () => {
  // --- DADOS DO PUZZLE ---
  const puzzles = [
    {
      groups: [
        {
          category: "MARCARAM GOLS EM FINAIS DE COPA DO MUNDO",
          items: ["Vavá", "Gérson", "Ronaldo"],
          difficulty: 0,
        },
        {
          category: "JOGADORES QUE VESTIRAM A 10 DO BRASIL",
          items: ["Pelé", "Raí", "Rivaldo"],
          difficulty: 1,
        },
        {
          category: "JOGADORES QUE MAIS ATUARAM PELO BRASIL",
          items: ["Cafú", "Roberto Carlos", "Neymar"],
          difficulty: 2,
        },
        {
          category: "JOGADORES QUE JÁ USARAM A BRAÇADEIRA DE CAPITÃO",
          items: ["Carlos Alberto Torres", "Dunga", "Lúcio"],
          difficulty: 3,
        },
      ],
      decoys: ["Alex Cabeção", "Branco", "Nelinho", "Juninho Pernambucano"],
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
  const faqButton = document.getElementById("faq-button");
  const faqModal = document.getElementById("faq-modal");

  // --- ESTADO DO JOGO ---
  let selectedItems = [];
  let mistakes = 0;
  const MAX_MISTAKES = 10; // Ajustado para o número de bolinhas
  let currentPuzzle;
  let allPuzzleItems = [];

  // --- FUNÇÃO PARA PEGAR UM PUZZLE ALEATÓRIO ---
  function getRandomPuzzle() {
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    return puzzles[randomIndex];
  }

  // --- INICIALIZAÇÃO DO JOGO ---
  function initGame() {
    // Reseta o estado do jogo
    selectedItems = [];
    mistakes = 0;
    solvedGroupsContainer.innerHTML = "";

    // Garante que os containers certos estão visíveis/escondidos
    document.getElementById("game-container").style.display = "flex";
    resultsModal.style.display = "none";

    currentPuzzle = getRandomPuzzle();
    if (!currentPuzzle) {
      console.error("Nenhum puzzle foi encontrado.");
      return;
    }

    const groupItems = currentPuzzle.groups.flatMap((group) => group.items);
    allPuzzleItems = [...groupItems, ...currentPuzzle.decoys];

    renderGrid(allPuzzleItems);
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

  // --- LÓGICA DO JOGO ---
  function handleItemClick(event) {
    const clickedItem = event.target;
    const itemText = clickedItem.textContent;

    if (clickedItem.classList.contains("selected")) {
      selectedItems = selectedItems.filter((item) => item !== itemText);
      clickedItem.classList.remove("selected");
    } else {
      if (selectedItems.length < 3) {
        selectedItems.push(itemText);
        clickedItem.classList.add("selected");
      }
    }
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

    const foundGroup = currentPuzzle.groups.find((group) =>
      arraysEqual(group.items.sort(), selectedItems.sort()),
    );

    if (foundGroup) {
      handleCorrectGuess(foundGroup);
    } else {
      handleIncorrectGuess();
    }

    selectedItems = [];
    document
      .querySelectorAll(".grid-item.selected")
      .forEach((el) => el.classList.remove("selected"));
    submitButton.disabled = true;
  }

  function handleCorrectGuess(group) {
    displaySolvedGroup(group);

    const remainingItems = Array.from(grid.children)
      .map((child) => child.textContent)
      .filter((item) => !group.items.includes(item));

    renderGrid(remainingItems);

    if (solvedGroupsContainer.children.length === 4) {
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
            <div class="solved-items">${groupData.items.join(", ")}</div>`;
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
      dot.classList.toggle("used", index < mistakes);
    });
  }

  function endGame(isWin) {
    displayResults(isWin, currentPuzzle.groups);
  }

  function displayResults(isWin, groupsData) {
    document.getElementById("game-container").style.display = "none";

    resultsTitle.textContent = isWin ? "Parabéns!" : "Não foi desta vez!";
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
                <div class="solved-items">${group.items.join(", ")}</div>`;
      resultsGrid.appendChild(groupElement);
    });

    // Adiciona um botão de "Jogar Novamente" se ele não existir
    if (!document.getElementById("play-again-button")) {
      const playAgainButton = document.createElement("button");
      playAgainButton.textContent = "Jogar Novamente";
      playAgainButton.id = "play-again-button";
      playAgainButton.onclick = initGame; // Reinicia o jogo ao clicar
      resultsModal.querySelector(".modal-content").appendChild(playAgainButton);
    }

    resultsModal.style.display = "flex";
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
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  // --- LÓGICA DO MODAL DE FAQ ---
  const closeFaqButton = faqModal.querySelector(".close-button");
  faqButton.addEventListener("click", () => (faqModal.style.display = "flex"));
  closeFaqButton.addEventListener(
    "click",
    () => (faqModal.style.display = "none"),
  );
  faqModal.addEventListener("click", (event) => {
    if (event.target === faqModal) {
      faqModal.style.display = "none";
    }
  });

  // --- ADICIONA EVENT LISTENERS GERAIS ---
  shuffleButton.addEventListener("click", handleShuffle);
  submitButton.addEventListener("click", handleSubmit);

  // --- INICIA O JOGO ---
  initGame();
});
