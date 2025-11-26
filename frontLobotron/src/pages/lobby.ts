export function initLobby() {

  const userRaw = localStorage.getItem('user');
  const lobbyNickname = document.getElementById('lobbyNickname');
  const lobbyProfileImg = document.getElementById('lobbyProfileImg') as HTMLImageElement | null;

  // Elementos del Modal
  const createGameModal = document.getElementById('createGameModal') as HTMLDivElement | null;
  const cancelCreateGameBtn = document.getElementById('cancelCreateGameBtn') as HTMLButtonElement | null;
  const confirmCreateGameBtn = document.getElementById('confirmCreateGameBtn') as HTMLButtonElement | null;
  const gameNameInput = document.getElementById('gameNameInput') as HTMLInputElement | null;
 
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

  // Unirse a partida #WIP
  joinGameBtn?.addEventListener('click', () => {
    console.log('Unirse a partida (pendiente de implementar)');
  });

  createGameBtn?.addEventListener('click', () => {

    if(!createGameModal || !gameNameInput) return

    createGameModal.classList.remove("hidden");
    gameNameInput.value = ""
    gameNameInput.focus()
  });

  // Cerrar Modal
  cancelCreateGameBtn?.addEventListener('click', () => {
    createGameModal?.classList.add('hidden');
  })

  //Confirmar creación Partida
  confirmCreateGameBtn?.addEventListener('click', () => {
    if(!gameNameInput || !createGameModal) return

    const gameName = gameNameInput.value.trim()

    if(gameName.length === 0)
    {
      alert("Pon un nombre válido") 
      return
    }

    console.log("Crear partida con nombre:", gameName)

  //TODO: post backend
  // createGameBtn(gameName)
    createGameModal.classList.add('hidden')
  })
}
