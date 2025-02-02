// Firebase modulių importavimas
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-analytics.js";

// 🔹 Firebase konfigūracija (PAKEISKITE SAVO DUOMENIMIS)
const firebaseConfig = {
  apiKey: "AIzaSyCF2sgbRi8IzdhwOjB2VbOZdJjS4rXetjQ",
  authDomain: "mp-3-29d9e.firebaseapp.com",
  projectId: "mp-3-29d9e",
  storageBucket: "mp-3-29d9e.appspot.com", // Pataisyta klaida
  messagingSenderId: "540410744247",
  appId: "1:540410744247:web:70cea825c04c1c5917ac32",
  measurementId: "G-7GRT0SCQXP"
};

// 🔹 Inicializuojame Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");

    // REGISTRACIJA SU FIREBASE
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const repeatPassword = document.getElementById("repeat-password").value;

        if (password !== repeatPassword) {
          alert("Slaptažodžiai nesutampa!");
          return;
        }

        // 🔹 Firebase registracija
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log("Vartotojas sėkmingai užregistruotas:", userCredential.user);
            alert("Registracija sėkminga! Dabar galite prisijungti.");
            window.location.href = "./login.html";
          })
          .catch((error) => {
            console.error("Klaida registruojant vartotoją:", error);
            alert("Klaida: " + error.message);
          });
      });
    }

    // PRISIJUNGIMAS SU FIREBASE
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        // 🔹 Firebase prisijungimas
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log("Prisijungimas sėkmingas:", userCredential.user);
            localStorage.setItem("user", JSON.stringify(userCredential.user)); // Įrašome vartotojo duomenis
            window.location.href = "./main.html";
          })
          .catch((error) => {
            console.error("Prisijungimo klaida:", error);
            alert("Prisijungimo klaida: " + error.message);
          });
      });
    }
});
