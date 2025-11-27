export function initLobby() {
  const userRaw = localStorage.getItem("user");
  const lobbyNickname = document.getElementById("lobbyNickname");
  const lobbyProfileImg = document.getElementById(
    "lobbyProfileImg"
  ) as HTMLImageElement | null;

  // Elementos del Modal
  const createGameModal = document.getElementById(
    "createGameModal"
  ) as HTMLDivElement | null;
  const cancelCreateGameBtn = document.getElementById(
    "cancelCreateGameBtn"
  ) as HTMLButtonElement | null;
  const confirmCreateGameBtn = document.getElementById(
    "confirmCreateGameBtn"
  ) as HTMLButtonElement | null;
  const gameNameInput = document.getElementById(
    "gameNameInput"
  ) as HTMLInputElement | null;

  if (userRaw && lobbyNickname) {
    try {
      const user = JSON.parse(userRaw);
      lobbyNickname.textContent = user.nickname ?? "Jugador";

      if (user.profile_photo && lobbyProfileImg) {
        lobbyProfileImg.src = user.profile_photo;
      }
    } catch {
      lobbyNickname.textContent = "Jugador";
    }
  }

  const joinGameBtn = document.getElementById("joinGameBtn");
  const createGameBtn = document.getElementById("createGameBtn");

  // Unirse a partida #WIP
  joinGameBtn?.addEventListener("click", () => {
    console.log("Unirse a partida (pendiente de implementar)");
  });

  createGameBtn?.addEventListener("click", () => {
    if (!createGameModal || !gameNameInput) return;

    createGameModal.classList.remove("hidden");
    gameNameInput.value = "";
    gameNameInput.focus();
  });

  // Cerrar Modal
  cancelCreateGameBtn?.addEventListener("click", () => {
    createGameModal?.classList.add("hidden");
  });

  //Confirmar creación Partida
  confirmCreateGameBtn?.addEventListener("click", async () => {
    if (!gameNameInput || !createGameModal) return;

    const gameName = gameNameInput.value.trim();

    if (gameName.length === 0) {
      alert("Pon un nombre válido");
      return;
    }

    const newGame = await createGame(gameName);

    if (newGame) {
      console.log("Partida creada:", newGame);

      //TODO: añadirla a la tabla del lobby
      //addGameToTable(newGame)
    } else {
      alert("No se pudo crear la partida.");
    }

    createGameModal.classList.add("hidden");
  });
}

export async function createGame(name: string) {
  try {
    const response = await fetch("http://localhost:8000/api/games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization:
          "Bearer 19|LJSFBosTmhBVNSHcltq3AgCKyv4UvHpdJ7695HsM107d46f9",
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error al crear partida:", error);
      return null;
    }

    const game = await response.json();
    return game;
  } catch (error) {
    console.error("Error de red:", error);
    return null;
  }
}
