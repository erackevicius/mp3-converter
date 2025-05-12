document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ JavaScript įkeltas");

    const API_KEY = "AIzaSyAxf50b4-8EwvJZAHMl9ni2wFlxfzJkzWg";
    let isSpeaking = false;
    let stopRequested = false;
    let repeatMode = false; // 🔹 Nauja kintamoji, skirta kartojimui
    let currentSource = null;
    let audioContext = null;
    let activeLink = null;

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

        let voiceName = lang === "lt-LT" ? "lt-LT-Standard-A" :
                        lang === "en-GB" ? "en-GB-Standard-A" : null;

        let url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
        let requestBody = {
            input: { text: text },
            voice: { languageCode: lang, ssmlGender: "FEMALE", name: voiceName },
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
                return await playAudioWebAPI(`data:audio/mp3;base64,${data.audioContent}`, text);
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

    async function playAudioWebAPI(src, text) {
        return new Promise(async (resolve) => {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            try {
                const response = await fetch(src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                currentSource = audioContext.createBufferSource();
                currentSource.buffer = audioBuffer;
                currentSource.connect(audioContext.destination);

                currentSource.onended = () => {
                    console.log("✅ Baigtas klausymas:", text);
                    resolve(true);
                };

                currentSource.start(0);
            } catch (error) {
                console.error("❌ Klaida grojant:", error);
                resolve(false);
            }
        });
    }

    async function stopPlayback() {
        stopRequested = true;
        repeatMode = false;

        if (currentSource) {
            try {
                currentSource.stop();
            } catch (e) {
                console.warn("⚠️ Nepavyko sustabdyti garso:", e);
            }
            currentSource = null;
        }

        if (audioContext) {
            try {
                await audioContext.close();
            } catch (e) {
                console.warn("⚠️ Nepavyko uždaryti audioContext:", e);
            }
            audioContext = null;
        }

        isSpeaking = false;
        resetButtonStyles();
    }

    function setActiveButton(button) {
        if (activeLink) activeLink.textContent = activeLink.dataset.originalText;
        button.dataset.originalText = button.textContent;
        button.textContent = "SUSTABDYTI KLAUSYMĄ 🎧";
        activeLink = button;
    }

    function resetButtonStyles() {
        if (activeLink) {
            activeLink.textContent = activeLink.dataset.originalText;
            activeLink = null;
        }
    }

    document.getElementById("clear-btn").addEventListener("click", () => {
        document.getElementById("english-input").value = "";
        document.getElementById("lithuanian-input").value = "";
        localStorage.removeItem("selectedWords");
        console.log("🗑️ Laukai išvalyti");
    });

    async function handleClick(event, inputField, lang, button) {
        event.preventDefault();

        await stopPlayback();

        const words = inputField?.value.trim().split("\n").map(word => word.trim()).filter(word => word);
        if (!words.length) {
            alert("⚠️ Nėra įrašytų žodžių!");
            return;
        }

        isSpeaking = true;
        stopRequested = false;
        repeatMode = true;

        while (repeatMode) {
            for (const word of words) {
                if (!repeatMode) break;
                let played = await playTTS(word, lang, button);
                if (!played) {
                  alert("⚠️ Garsas negroja. iPhone galimai blokuoja audio be sąveikos arba AudioContext klaida.");
                  break;
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
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
            handleClick(event, document.getElementById("english-input"), "en-GB", listenEnglish) // 🔹 Britiškas balsas
        );
    }

    const listenBothlt = document.getElementById("listen-both-lt");
    if (listenBothlt) {
        listenBothlt.addEventListener("click", async (event) => {
            event.preventDefault();

            await stopPlayback();

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
            repeatMode = true;
            setActiveButton(listenBothlt); // 🔹 Aktyvina mygtuką

            while (repeatMode) {
                for (let i = 0; i < Math.min(englishWords.length, lithuanianWords.length); i++) {
                    if (!repeatMode) break;

                    console.log(`🔊 ${lithuanianWords[i]} → ${englishWords[i]}`);

                    let played1 = await playTTS(lithuanianWords[i], "lt-LT", listenBothlt);
                    if (!played1) break;
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    let played2 = await playTTS(englishWords[i], "en-GB", listenBothlt);
                    if (!played2) break;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            isSpeaking = false;
            resetButtonStyles();
        });
    }

    const listenBothEn = document.getElementById("listen-both-en");
    if (listenBothEn) {
        listenBothEn.addEventListener("click", async (event) => {
            event.preventDefault();

            await stopPlayback();

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
            repeatMode = true;
            setActiveButton(listenBothEn); // 🔹 Aktyvina mygtuką

            while (repeatMode) {
                for (let i = 0; i < Math.min(englishWords.length, lithuanianWords.length); i++) {
                    if (!repeatMode) break;
                    console.log(`🔊 ${englishWords[i]} → ${lithuanianWords[i]}`);

                    let played1 = await playTTS(englishWords[i], "en-GB", listenBothEn);
                    if (!played1) break;
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    let played2 = await playTTS(lithuanianWords[i], "lt-LT", listenBothEn);
                    if (!played2) break;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            isSpeaking = false;
            resetButtonStyles();
        });
    }

    loadStoredWords();
});
