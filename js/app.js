document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ JavaScript įkeltas");

    const API_KEY = "AIzaSyAxf50b4-8EwvJZAHMl9ni2wFlxfzJkzWg";
    let isSpeaking = false;
    let stopRequested = false;
    let repeatMode = false;
    let currentSource = null;
    let audioContext = null;
    let activeLink = null;
    let currentSession = 0;
    const currentWordDisplay = document.getElementById("current-word");

    function isIOSSafari() {
        const ua = navigator.userAgent;
        const isIOS = /iP(ad|hone|od)/.test(ua);
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
        return isIOS && isSafari;
    }

    if (isIOSSafari()) {
        document.body.addEventListener('click', () => {
            if (!audioContext || audioContext.state === "closed") {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioContext.resume().then(() => {
                    console.log("🔊 iOS Safari: AudioContext aktyvuotas po paspaudimo");
                });
            }
        }, { once: true });
    }

    function unlockAudioOnUserGesture() {
        if (!audioContext || audioContext.state !== "running") {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const buffer = audioContext.createBuffer(1, 1, 22050);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            if (source.start) source.start(0);
            audioContext.resume().then(() => {
                console.log("🔓 Audio unlocked");
            });
        }
    }
    document.body.addEventListener("touchend", unlockAudioOnUserGesture, { once: true });
    document.body.addEventListener("click", unlockAudioOnUserGesture, { once: true });

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

        if (currentWordDisplay) currentWordDisplay.textContent = `🔊 ${text}`;

        isSpeaking = true;
        stopRequested = false;
        setActiveButton(button);

        let voiceName = lang === "en-GB" ? "en-GB-Standard-A" : lang === "lt-LT" ? "lt-LT-Standard-A" : null;

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
            try {
                if (!audioContext || audioContext.state === "closed") {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (audioContext.state === "suspended") {
                    try {
                        await audioContext.resume();
                        console.log("🔊 AudioContext atnaujintas (resume)");
                    } catch (e) {
                        alert("⚠️ Nepavyko aktyvuoti garso. iPhone Safari galimai blokuoja audio be sąveikos.");
                        console.warn("AudioContext resume klaida:", e);
                        resolve(false);
                        return;
                    }
                }

                const response = await fetch(src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                currentSource = audioContext.createBufferSource();
                currentSource.buffer = audioBuffer;
                currentSource.connect(audioContext.destination);

                currentSource.onended = () => {
                    resolve(!stopRequested);
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
        currentSession++;

        try {
            if (currentSource) {
                currentSource.stop();
                currentSource.disconnect();
                currentSource = null;
            }
        } catch (e) {
            console.warn("⚠️ Nepavyko sustabdyti grojimo šaltinio:", e);
        }

        try {
            if (audioContext && audioContext.state !== "closed") {
                await audioContext.close();
            }
        } catch (e) {
            console.warn("⚠️ Nepavyko uždaryti audioContext:", e);
        } finally {
            audioContext = null;
        }

        isSpeaking = false;
        resetButtonStyles();
        if (currentWordDisplay) currentWordDisplay.textContent = "";
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

        if (isSpeaking) {
            await stopPlayback();
            return;
        }

        const words = inputField?.value.trim().split("\n").map(word => word.trim()).filter(word => word);
        if (!words.length) {
            alert("⚠️ Nėra įrašytų žodžių!");
            return;
        }

        const session = ++currentSession;
        isSpeaking = true;
        stopRequested = false;
        repeatMode = true;

        while (repeatMode && session === currentSession) {
            for (const word of words) {
                if (!repeatMode || session !== currentSession) break;
                let played = await playTTS(word, lang, button);
                if (!played || stopRequested || session !== currentSession) break;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        isSpeaking = false;
        resetButtonStyles();
        if (currentWordDisplay) currentWordDisplay.textContent = "";
    }

    const listenEnglish = document.getElementById("listen-english");
    if (listenEnglish) {
        listenEnglish.addEventListener("click", (event) => 
            handleClick(event, document.getElementById("english-input"), "en-GB", listenEnglish)
        );
    }

    const listenLithuanian = document.getElementById("listen-lithuanian");
    if (listenLithuanian) {
        listenLithuanian.addEventListener("click", (event) => 
            handleClick(event, document.getElementById("lithuanian-input"), "lt-LT", listenLithuanian)
        );
    }

    const listenBothEn = document.getElementById("listen-both-en");
    if (listenBothEn) {
        listenBothEn.addEventListener("click", async (event) => {
            event.preventDefault();

            if (isSpeaking) {
                await stopPlayback();
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

            const session = ++currentSession;
            isSpeaking = true;
            stopRequested = false;
            repeatMode = true;
            setActiveButton(listenBothEn);

            while (repeatMode && session === currentSession) {
                for (let i = 0; i < Math.min(englishWords.length, lithuanianWords.length); i++) {
                    if (!repeatMode || session !== currentSession) break;

                    let played1 = await playTTS(lithuanianWords[i], "lt-LT", listenBothEn);
                    if (!played1 || stopRequested || session !== currentSession) break;
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    let played2 = await playTTS(englishWords[i], "en-GB", listenBothEn);
                    if (!played2 || stopRequested || session !== currentSession) break;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            isSpeaking = false;
            resetButtonStyles();
            if (currentWordDisplay) currentWordDisplay.textContent = "";
        });
    }

    const listenBothLt = document.getElementById("listen-both-lt");
    if (listenBothLt) {
        listenBothLt.addEventListener("click", async (event) => {
            event.preventDefault();

            if (isSpeaking) {
                await stopPlayback();
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

            const session = ++currentSession;
            isSpeaking = true;
            stopRequested = false;
            repeatMode = true;
            setActiveButton(listenBothLt);

            while (repeatMode && session === currentSession) {
                for (let i = 0; i < Math.min(englishWords.length, lithuanianWords.length); i++) {
                    if (!repeatMode || session !== currentSession) break;

                    let played1 = await playTTS(englishWords[i], "en-GB", listenBothLt);
                    if (!played1 || stopRequested || session !== currentSession) break;
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    let played2 = await playTTS(lithuanianWords[i], "lt-LT", listenBothLt);
                    if (!played2 || stopRequested || session !== currentSession) break;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            isSpeaking = false;
            resetButtonStyles();
            if (currentWordDisplay) currentWordDisplay.textContent = "";
        });
    }

    loadStoredWords();
});
