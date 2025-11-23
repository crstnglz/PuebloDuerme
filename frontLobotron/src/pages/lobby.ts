// src/pages/lobby.ts

// Cargar datos básicos del usuario desde localStorage
const userRaw = localStorage.getItem('user');
const lobbyNickname = document.getElementById('lobbyNickname');
const lobbyProfileImg = document.getElementById('lobbyProfileImg') as HTMLImageElement | null;

if (userRaw && lobbyNickname) {
  try {
    const user = JSON.parse(userRaw);
    lobbyNickname.textContent = user.nickname ?? 'Jugador';
    if (user.profile_photo && lobbyProfileImg) {
      lobbyProfileImg.src = user.profile_photo;
    }
  } catch {
    lobbyNickname.textContent = 'Jugador';
  }
}

// Botones (sin funcionalidad aún)
const joinGameBtn = document.getElementById('joinGameBtn');
const createGameBtn = document.getElementById('createGameBtn');

joinGameBtn?.addEventListener('click', () => {
  // Más adelante: abrir modal o llamar a la API de partidas
  console.log('Unirse a partida (pendiente de implementar)');
});

createGameBtn?.addEventListener('click', () => {
  // Más adelante: abrir formulario de creación
  console.log('Crear partida (pendiente de implementar)');
});

// Tabla de partidas
const gamesTableBody = document.getElementById('gamesTableBody');


