export function initLobby() {

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

  const joinGameBtn = document.getElementById('joinGameBtn');
  const createGameBtn = document.getElementById('createGameBtn');

  joinGameBtn?.addEventListener('click', () => {
    console.log('Unirse a partida (pendiente de implementar)');
  });

  createGameBtn?.addEventListener('click', () => {
    console.log('Crear partida (pendiente de implementar)');
  });

}
