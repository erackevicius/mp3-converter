document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ JavaScript įkeltas");

    const API_KEY = "AIzaSyAxf50b4-8EwvJZAHMl9ni2wFlxfzJkzWg";
    let isSpeaking = false;
    let stopRequested = false;
    let currentAudio = null;
    let activeLink = null;

    // ✅ Užpildo laukus tik jei jie tušti
    function loadStoredWords() {
        const selectedWords = localStorage.getItem("selectedWords");
        if (selectedWords) {
            const wordsArray = JSON.parse(selectedWords);
            const englishInput = document.getElementById("english-input");
            const lithuanianInput = document.getElementById("lithuanian-input");

            if (!englishInput.value.trim()) {
                englishInput.value = wordsArray.map(word => word.english).join("\n");
            }
            if (!lithuanianInput.value.trim()) {
                lithuanianInput.value = wordsArray.map(word => word.lithuanian).join("\n");
            }
        }
    }

    async function playTTS(text, lang, button) {
        if (!text || stopRequested) return false;

        isSpeaking = true;
        stopRequested = false;
        setActiveButton(button);

        let url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
        let requestBody = {
            input: { text: text },
            voice: { languageCode: lang, ssmlGender: "NEUTRAL" },
            audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0.0 }
        };

        try {
            let response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            let data = await response.json();
            if (data.audioContent) {
                return new Promise((resolve) => {
                    let audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
                    currentAudio = audio;

                    audio.play().then(() => {
                        console.log("▶️ Pradėtas atkūrimas:", text);
                    }).catch((error) => {
                        console.error("❌ Garso atkūrimo klaida:", error);
                        resolve(false);
                    });

                    audio.onended = () => {
                        console.log("✅ Baigtas klausymas:", text);
                        resolve(true);
                    };

                    audio.onerror = () => {
                        console.error("❌ Klaida grojant:", text);
                        resolve(false);
                    };
                });
            } else {
                console.error("⚠️ API atsakė be garso:", data);
                resetButtonStyles();
                return false;
            }
        } catch (error) {
            console.error("❌ Klaida užklausos metu:", error);
            resetButtonStyles();
            return false;
        }
    }

    function stopPlayback() {
        stopRequested = true;
        if (currentAudio) currentAudio.pause();
        isSpeaking = false;
        resetButtonStyles();
    }

    function setActiveButton(button) {
        if (activeLink) activeLink.classList.remove("active");
        button.classList.add("active");
        activeLink = button;
    }

    function resetButtonStyles() {
        if (activeLink) activeLink.classList.remove("active");
    }

    document.getElementById("clear-btn").addEventListener("click", () => {
        document.getElementById("english-input").value = "";
        document.getElementById("lithuanian-input").value = "";
        localStorage.removeItem("selectedWords");
        console.log("🗑️ Laukai išvalyti");
    });

    async function handleClick(event, inputField, lang, button) {
        event.preventDefault();

        if (isSpeaking) {
            stopPlayback();
            return;
        }

        const words = inputField?.value.trim().split("\n").map(word => word.trim()).filter(word => word);
        if (!words.length) {
            alert("⚠️ Nėra įrašytų žodžių!");
            return;
        }

        isSpeaking = true;
        stopRequested = false;

        for (const word of words) {
            if (stopRequested) break;
            let played = await playTTS(word, lang, button);
            if (!played) break;
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        isSpeaking = false;
        resetButtonStyles();
    }

    const listenLithuanian = document.getElementById("listen-lithuanian");
    if (listenLithuanian) {
        listenLithuanian.addEventListener("click", (event) => 
            handleClick(event, document.getElementById("lithuanian-input"), "lt-LT", listenLithuanian)
        );
    }

    const listenEnglish = document.getElementById("listen-english");
    if (listenEnglish) {
        listenEnglish.addEventListener("click", (event) => 
            handleClick(event, document.getElementById("english-input"), "en-US", listenEnglish)
        );
    }

    const listenBoth = document.getElementById("listen-both");
    if (listenBoth) {
        listenBoth.addEventListener("click", async (event) => {
            event.preventDefault();

            if (isSpeaking) {
                stopPlayback();
                return;
            }

            const englishInput = document.getElementById("english-input");
            const lithuanianInput = document.getElementById("lithuanian-input");

            const englishWords = englishInput?.value.trim().split("\n").map(word => word.trim()).filter(word => word);
            const lithuanianWords = lithuanianInput?.value.trim().split("\n").map(word => word.trim()).filter(word => word);

            if (!englishWords.length || !lithuanianWords.length) {
                alert("⚠️ Abu laukai turi turėti tekstą!");
                return;
            }

            isSpeaking = true;
            stopRequested = false;
            setActiveButton(listenBoth);

            for (let i = 0; i < Math.min(englishWords.length, lithuanianWords.length); i++) {
                if (stopRequested) break;
                console.log(`🔊 ${lithuanianWords[i]} → ${englishWords[i]}`);

                let played1 = await playTTS(lithuanianWords[i], "lt-LT", listenBoth);
                if (!played1) break;
                await new Promise(resolve => setTimeout(resolve, 3000));

                let played2 = await playTTS(englishWords[i], "en-US", listenBoth);
                if (!played2) break;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            isSpeaking = false;
            resetButtonStyles();
        });
    }

    loadStoredWords();
});
