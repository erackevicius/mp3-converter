document.addEventListener("DOMContentLoaded", function () {
  const dictionaryList = document.getElementById("dictionary-list");
  const generateBtn = document.getElementById("generate-btn");
  const overlay = document.getElementById("overlay");
  const loadingSpinner = document.getElementById("loading-spinner");
  const messageBox = document.getElementById("message-box");
  const messageCloseButton = document.getElementById("message-close-btn");

  let selectedWords = [];

  // Patikriname, ar jau yra išsaugotas sumaišytas žodynas
  let storedWords = localStorage.getItem("shuffledDictionary");

  if (storedWords) {
      // Jei jau buvo sumaišyta anksčiau, naudojame išsaugotą tvarką
      displayWords(JSON.parse(storedWords));
  } else {
      // Jei nėra, pasiimame originalų žodyną, sumaišome ir išsaugome
      fetch("./dictionary.json")
          .then(response => response.json())
          .then(data => {
              shuffleArray(data); // 🔀 Sumaišyti tik vieną kartą
              localStorage.setItem("shuffledDictionary", JSON.stringify(data)); // Saugo sumaišytą tvarką
              displayWords(data);
          });
  }

  function displayWords(words) {
      dictionaryList.innerHTML = ""; // Išvalyti sąrašą prieš rodant
      words.forEach(word => {
          const listItem = document.createElement("li");
          listItem.textContent = `${word.english} - ${word.lithuanian}`;
          listItem.classList.add("dictionary-word");
          listItem.addEventListener("click", () => toggleWordSelection(word, listItem));
          dictionaryList.appendChild(listItem);
      });
  }

  function toggleWordSelection(word, listItem) {
      const index = selectedWords.findIndex(w => w.english === word.english && w.lithuanian === word.lithuanian);
      if (index === -1) {
          selectedWords.push(word);
          listItem.classList.add("selected");
      } else {
          selectedWords.splice(index, 1);
          listItem.classList.remove("selected");
      }
  }

  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  generateBtn.addEventListener("click", () => {
      if (selectedWords.length === 0) {
          alert("Pasirinkite bent vieną žodį!");
          return;
      }

      localStorage.setItem("selectedWords", JSON.stringify(selectedWords));

      overlay.classList.add("show");
      loadingSpinner.classList.add("show");

      setTimeout(() => {
          loadingSpinner.classList.remove("show");
          messageBox.classList.add("show");
      }, 3000);
  });

  messageCloseButton.addEventListener("click", () => {
      overlay.classList.remove("show");
      messageBox.classList.remove("show");
      window.location.href = "../main.html";
  });
});
