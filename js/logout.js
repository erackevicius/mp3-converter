document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-btn");
  
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        // Ištriname vartotojo duomenis iš localStorage (jei buvo naudojami prisijungimui)
        localStorage.removeItem("currentUser");
  
        // Nukreipiame vartotoją į pradinį puslapį
        window.location.href = "./index.html";
      });
    }
  });
  