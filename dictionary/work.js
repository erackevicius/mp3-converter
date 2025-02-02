document.addEventListener("DOMContentLoaded", () => {
    const dictionaryList = document.getElementById("dictionary-list");
    const generateBtn = document.getElementById("generate-btn");
    const overlay = document.getElementById("overlay");
    const loadingSpinner = document.getElementById("loading-spinner");
    const messageBox = document.getElementById("message-box");
    const messageCloseBtn = document.getElementById("message-close-btn");

    // 🔹 Funkcija gauti duomenis iš JSON arba `localStorage`
    async function loadDictionary() {
        try {
            const lastUpdate = localStorage.getItem("lastUpdate");
            const now = new Date().getTime();
            const oneDay = 24 * 60 * 60 * 1000;

            let words;

            if (!lastUpdate || now - lastUpdate > oneDay) {
                console.log("🔄 JSON atnaujinamas...");
                const response = await fetch("./work.json");
                words = await response.json();
                words = shuffleArray(words);

                localStorage.setItem("shuffledWorkWords", JSON.stringify(words));
                localStorage.setItem("lastUpdate", now);
                localStorage.removeItem("selectedWords"); // ⚠️ Išvalo senus pasirinkimus

                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                words = JSON.parse(localStorage.getItem("shuffledWorkWords"));
            }

            renderDictionary(words);
        } catch (error) {
            console.error("Nepavyko įkelti žodyno duomenų:", error);
        }
    }

    // 🔹 Funkcija atvaizduoti žodžius puslapyje
    function renderDictionary(words) {
        dictionaryList.innerHTML = "";
        words.forEach((word) => {
            const listItem = document.createElement("li");
            listItem.classList.add("dictionary-word");
            listItem.textContent = `${word.english} - ${word.lithuanian}`;
            listItem.addEventListener("click", () => toggleSelection(listItem));
            dictionaryList.appendChild(listItem);
        });
    }

    // 🔹 Funkcija sumaišyti masyvą
    function shuffleArray(array) {
        let shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    // 🔹 Pažymėti/panaikinti pažymėjimą žodžiams
    function toggleSelection(item) {
        item.classList.toggle("selected");
    }

    // 🔹 Generuoja klausymo sąrašą
    generateBtn.addEventListener("click", () => {
        const selectedWords = [...document.querySelectorAll(".dictionary-word.selected")]
            .map((item) => item.textContent);

        if (selectedWords.length === 0) {
            alert("Pasirinkite bent vieną žodį!");
            return;
        }

        overlay.classList.add("show");
        loadingSpinner.classList.add("show");

        setTimeout(() => {
            messageBox.classList.add("show");

            localStorage.setItem(
                "selectedWords",
                JSON.stringify(selectedWords.map(word => {
                    const [english, lithuanian] = word.split(" - ");
                    return { english, lithuanian };
                }))
            );
        }, 1500);
    });

    // 🔹 Paspaudus "Ačiū!" grįžta į pagrindinį puslapį
    messageCloseBtn.addEventListener("click", () => {
        messageBox.classList.remove("show");
        overlay.classList.remove("show");
        loadingSpinner.classList.remove("show");
        window.location.href = "../main.html";
    });

    // 🔹 Įkelti žodyną kai puslapis užkrautas
    loadDictionary();
});
