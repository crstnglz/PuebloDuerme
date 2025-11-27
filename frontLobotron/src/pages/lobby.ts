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
  //#WIP


  createGameBtn?.addEventListener("click", () => {
    if (!createGameModal || !gameNameInput) return;

    createGameModal.dataset.mode = "create"
    createGameModal.classList.remove("hidden");
    gameNameInput.value = "";
    gameNameInput.focus();
  });

  // Cerrar Modal
  cancelCreateGameBtn?.addEventListener("click", () => {
    createGameModal?.classList.add("hidden");
  });

  //Crear Partida y Mostrar en la Tabla
  confirmCreateGameBtn?.addEventListener("click", async () => {
    if (!gameNameInput || !createGameModal) return;

    const gameName = gameNameInput.value.trim();
    if(!gameName) return alert("Pon un nombre válido")

      const mode = createGameModal.dataset.mode

      if(mode === "create")
      {
    const newGame = await createGame(gameName);
    if(newGame) addGame(newGame)
      }

      if(mode === "edit")
      {
        const gameId = createGameModal.dataset.gameId
        if(!gameId) return

        const updated = await editGame(parseInt(gameId), gameName)
        if(updated) updateRow(updated)
      }

    createGameModal.classList.add("hidden");
  });

  //Cargar Partidas
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
    return new Game (
      game.id,
      game.name,
      game.current_players ?? 1,
      game.status,
      game.owner
    );

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
    new Game(
      g.id,
      g.name,
      g.current_players,
      g.status,
      g.owner
    )
  )

  const tableBody = document.getElementById('gamesTableBody') as HTMLTableSectionElement;
  tableBody.innerHTML = '';

  if (games.length === 0) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Todavía no hay partidas creadas.</td>
      </tr>`;
    return;
  }

  games.forEach((game: Game) => addGame(game))
}

// Editar el nombre de la partida
async function editGame(id: number, name: string)
{
  const token = localStorage.getItem("access_token")

  const response = await fetch(`http://localhost:8000/api/games/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    } ,
    body: JSON.stringify({ name })
  })

  if(!response.ok) return null

  const g = await response.json()
  return new Game(
    g.id,
    g.name,
    g.current_players ?? 1,
    g.status,
    g.owner
  )
}

//Borrar la partida
async function deleteGame(id: number)
{
  const token = localStorage.getItem("access_token")

  await fetch(`http://localhost:8000/api/games/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
})
}

function addGame(game: Game)
{
  const tableBody = document.getElementById('gamesTableBody') as HTMLTableSectionElement

  const emptyRow = tableBody.querySelector(".empty-row")
  if(emptyRow) emptyRow.remove()

  const row = document.createElement("tr")

  row.innerHTML = `
    <td>${game.owner.nickname}</td>
    <td>${game.name}</td>
    <td>${game.players}</td>
    <td>${game.status}</td>
    <td>
      <button class="edit-btn">Editar</button>
      <button class="delete-btn">Borrar</button>
    </td>
  `

  row.querySelector(".edit-btn")?.addEventListener("click", () => {
    const modal = document.getElementById("createGameModal")!
    const input = document.getElementById("gameNameInput") as HTMLInputElement

    modal.dataset.mode = "edit"
    modal.dataset.gameId = game.id.toString()
    input.value = game.name

    modal.classList.remove("hidden")
  })

  row.querySelector(".delete-btn")?.addEventListener("click", async() => {
    if(!confirm("¿Seguro que deseas eliminar esta partida?")) return

    await deleteGame(game.id)
    row.remove();
  })

  tableBody.appendChild(row)
}

//Actualizar filas tras Editar
function updateRow(game: Game)
{
  const row = document.querySelector(`tr[data-id="${game.id}"]`)

  if(!row) return

  row.children[0].textContent = game.owner.nickname
  row.children[1].textContent = game.name
  row.children[2].textContent = game.players.toString()
  row.children[3].textContent = game.status
}