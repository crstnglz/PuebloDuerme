import { Game } from './Game'

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

  //Mostrar las partidas que hay nada más entrar al lobby
  loadGames()
}

export async function createGame(name: string) {
  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch("http://localhost:8000/api/games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization:
          `Bearer ${token}`,
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
async function loadGames() {
  const token = localStorage.getItem("access_token");
  const response = await fetch('http://localhost:8000/api/games', {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`   // <-- ARREGLADO
    }
  })

  const dataRaw = await response.json()

  const games: Game[] = dataRaw.map((g: any) => 
    new Game(g.id, g.name, g.players ?? 1, g.status ?? "waiting")
  );

  const tableBody = document.getElementById('gamesTableBody') as HTMLTableSectionElement;
  tableBody.innerHTML = '';

  if (games.length === 0) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Todavía no hay partidas creadas.</td>
      </tr>`;
    return;
  }

  games.forEach((game: Game) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${game.id}</td>
      <td>${game.name}</td>
      <td>${game.players}</td>
      <td>${game.status}</td>
      <td>
        <button class="join-btn" data-game-id="${game.id}">
          Unirse
        </button>
      </td>`;

    tableBody.appendChild(row);
  });
}