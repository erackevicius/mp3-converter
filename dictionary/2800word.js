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
            const lastHash = localStorage.getItem("2800wordJsonHash"); // Paskutinė JSON versija
            const response = await fetch("./2800word.json");
            const jsonText = await response.text(); // Nuskaitome kaip tekstą
            const newHash = await getSHA256Hash(jsonText); // Apskaičiuojame naują hash

            let words;
            
            if (lastHash !== newHash) {
                console.log("🔄 JSON atnaujintas – nauji duomenys įkeliami...");
                words = JSON.parse(jsonText);
                // words = shuffleArray(words);

                // Išsaugo naujus duomenis į `localStorage`
                localStorage.setItem("shuffled2800wordWords", JSON.stringify(words));
                localStorage.setItem("2800wordJsonHash", newHash);
                localStorage.removeItem("selectedWords"); // ⚠️ Pašalina pasirinktus žodžius

                setTimeout(() => {
                    location.reload(); // Perkrauna puslapį, kad parodytų naujus duomenis
                }, 1000);
            } else {
                console.log("✅ JSON nepasikeitė – naudojami `localStorage` duomenys");
                words = JSON.parse(localStorage.getItem("shuffled2800wordWords"));
            }

            renderDictionary(words);
        } catch (error) {
            console.error("❌ Nepavyko įkelti žodyno duomenų:", error);
        }
    }

    // 🔹 Funkcija sugeneruoti JSON SHA-256 hash (unikaliam turiniui identifikuoti)
    async function getSHA256Hash(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
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

    // 🔹 Funkcija sumaišyti masyvą (Fisher-Yates algoritmas)
    function shuffleArray(array) {
        let shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    // 🔹 Funkcija pažymėti/panaikinti pažymėjimą žodžiams
    function toggleSelection(item) {
        item.classList.toggle("selected");
    }

    // 🔹 Klausymo sąrašo generavimas su išblukimo efektu iki "Ačiū!" paspaudimo
    generateBtn.addEventListener("click", () => {
        const selectedWords = [...document.querySelectorAll(".dictionary-word.selected")]
            .map((item) => item.textContent);

        if (selectedWords.length === 0) {
            alert("⚠️ Pasirinkite bent vieną žodį!");
            return;
        }

        // Rodo loading efektą (nepašalinamas iš karto)
        overlay.classList.add("show");
        loadingSpinner.classList.add("show");

        setTimeout(() => {
            // Tik rodo pranešimą "Gero klausymo!"
            messageBox.classList.add("show");

            // Išsaugo pasirinktus žodžius į `localStorage`
            localStorage.setItem(
                "selectedWords",
                JSON.stringify(selectedWords.map(word => {
                    const [english, lithuanian] = word.split(" - ");
                    return { english, lithuanian };
                }))
            );
        }, 1500);
    });

    // 🔹 Paspaudus "Ačiū!" pašalina overlay ir nukreipia į pagrindinį puslapį
    messageCloseBtn.addEventListener("click", () => {
        messageBox.classList.remove("show");
        overlay.classList.remove("show");
        loadingSpinner.classList.remove("show");
        window.location.href = "../main.html"; // Nukreipia į pagrindinį puslapį
    });

    // 🔹 Įkelti žodyną kai puslapis užkrautas
    loadDictionary();
});
