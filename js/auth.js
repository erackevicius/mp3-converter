document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
  
    // Funkcija užkrauti vartotojus iš localStorage
    function loadUsers() {
      const users = localStorage.getItem("users");
      return users ? JSON.parse(users) : [];
    }
  
    // Funkcija išsaugoti vartotojus į localStorage
    function saveUsers(users) {
      localStorage.setItem("users", JSON.stringify(users));
    }
  
    // REGISTRACIJA
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const name = document.getElementById("name").value.trim();
        const password = document.getElementById("password").value;
        const repeatPassword = document.getElementById("repeat-password").value;
  
        if (password !== repeatPassword) {
          alert("Slaptažodžiai nesutampa!");
          return;
        }
  
        const users = loadUsers();
  
        if (users.some((user) => user.name === name)) {
          alert("Šis vartotojo vardas jau užimtas!");
          return;
        }
  
        users.push({ name, password });
        saveUsers(users);
  
        const container = document.querySelector(".container");
        container.innerHTML = `
          <div class="success-message">
            <h1>Jūs sėkmingai prisiregistravote!</h1>
            <button id="success-btn" class="btn primary">Puiku!</button>
          </div>
        `;
  
        document.getElementById("success-btn").addEventListener("click", () => {
          window.location.href = "./login.html";
        });
      });
    }
  
    // PRISIJUNGIMAS
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
  
        const users = loadUsers();
  
        const user = users.find(
          (user) => user.name === username && user.password === password
        );
  
        if (user) {
          // Nukreipiame tiesiai į pagrindinį puslapį
          window.location.href = "./main.html";
        } else {
          alert("Neteisingas vartotojo vardas arba slaptažodis!");
        }
      });
    }
  });
  