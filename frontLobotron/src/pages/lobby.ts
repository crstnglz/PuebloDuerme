import { Game } from '../models/Game';
import { showToast } from '../toast';
import {
    getGames,
    createGame,
    joinGame,
    editGame,
    deleteGame,
} from '../providers/game.provider';

import type { User as UserInterface } from '../types/user';
import type { GameInterface } from '../types/gameInterface';

// --- ELEMENTOS HTML ---
const lobbyNickname = document.getElementById("lobbyNickname");
const lobbyProfileImg = document.getElementById("lobbyProfileImg") as HTMLImageElement | null;
const createGameModal = document.getElementById("createGameModal") as HTMLDivElement | null;
const cancelCreateGameBtn = document.getElementById("cancelCreateGameBtn") as HTMLButtonElement | null;
const confirmCreateGameBtn = document.getElementById("confirmCreateGameBtn") as HTMLButtonElement | null;
const gameNameInput = document.getElementById("gameNameInput") as HTMLInputElement | null;
const tableBody = document.getElementById('gamesTableBody') as HTMLTableSectionElement;
const joinGameBtn = document.getElementById("joinGameBtn");
const createGameBtn = document.getElementById("createGameBtn");

export function initLobby() {
    // Cargar datos del usuario
    const userRaw = localStorage.getItem("user");
    if (userRaw && lobbyNickname) {
        try {
            const user: UserInterface = JSON.parse(userRaw);
            lobbyNickname.textContent = user.nickname ?? "Jugador";
            if (user.profile_photo && lobbyProfileImg) {
                lobbyProfileImg.src = user.profile_photo;
            }
        } catch {
            lobbyNickname.textContent = "Jugador";
        }
    }

    // Evento unirse a partida
    joinGameBtn?.addEventListener("click", async () => {
        const selected = document.querySelector("tr.selected") as HTMLTableRowElement
        if (!selected) {
            showToast("Selecciona una partida primero", "warning")
            return
        }

        const gameId = selected.dataset.id
        if (!gameId) return;

        const response = await joinGame(gameId);

        if ('error' in response) {
            showToast(`Error al unirse: ${response.data.message}`, "error");
            return;
        }

        const { game } = response.data;
        
        window.location.href = `/gameUI.html?game=${game.id}`
    });
    
    // Evento abrir modal crear partida
    createGameBtn?.addEventListener("click", () => {
        if (!createGameModal || !gameNameInput) return;
        createGameModal.dataset.mode = "create"
        gameNameInput.value = "";
        gameNameInput.focus();
        (document.getElementById("confirmCreateGameBtn") as HTMLButtonElement).textContent = "Crear"
        createGameModal.classList.remove("hidden");
    });

    // Evento cerrar modal
    cancelCreateGameBtn?.addEventListener("click", () => {
        createGameModal?.classList.add("hidden");
    });

    // Evento CONFIRMAR CREAR/EDITAR
    confirmCreateGameBtn?.addEventListener("click", async () => {
        if (!gameNameInput || !createGameModal) return;

        const gameName = gameNameInput.value.trim();
        if (!gameName) return showToast("Pon un nombre válido", "warning")

        const mode = createGameModal.dataset.mode

        if (mode === "create") {
            const response = await createGame(gameName);

            if (!('error' in response)) {
                const gameId = response.data.game.id;
                
                if (gameId) {
                    showToast("Partida creada", "success");

                    setTimeout(() => {
                    window.location.href = `/gameUI.html?game=${gameId}`;
                    }, 600)
                } else {
                    showToast("Error: El servidor no devolvió el ID de la partida.", "error");
                }
                return;
            } else {
                showToast(`Error al crear: ${response.data.message}`, "error")
                return;
            }
        }

        if (mode === "edit") {
            const gameId = createGameModal.dataset.gameId
            if (!gameId) return

            const response = await editGame(parseInt(gameId), gameName)
            
            if ('error' in response) {
                showToast(`Error al editar: ${response.data.message}`, "error")
                return;
            }
            
            const updatedGame = response.data.game;
            
            updateRow(new Game(
                updatedGame.id,
                updatedGame.name,
                updatedGame.current_players,
                updatedGame.status,
                updatedGame.owner
            ));
        }

        createGameModal.classList.add("hidden");
    });

    // Cargar Partidas
    loadGamesAndRender()
}

// Carga partidas del servidor y las pinta en la tabla
async function loadGamesAndRender() {
    const response = await getGames();
    
    if ('error' in response) {
        console.error("Error al cargar partidas:", response.data.message);
        tableBody.innerHTML = `
            <tr class="empty-row error-row">
                <td colspan="5">Error: No se pudieron cargar las partidas. (${response.status})</td>
            </tr>`;
        return;
    }
    
    const games = response.data.games;

    tableBody.innerHTML = '';

    if (!Array.isArray(games) || games.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">Todavía no hay partidas creadas.</td>
            </tr>`;
        return;
    }
    
    const gameInstances: Game[] = games.map((g: GameInterface) => new Game(
        g.id,
        g.name,
        g.current_players,
        g.status,
        g.owner
    ));

    gameInstances.forEach((game: Game) => addGame(game))
}

// Añade una fila de partida a la tabla
function addGame(game: Game) {
    const row = document.createElement("tr")
    row.dataset.id = game.id.toString()

    row.innerHTML = `
      <td>${game.owner.nickname}</td>
      <td>${game.name}</td>
      <td>${game.players}</td>
      <td>${game.status}</td>
      <td>
        <button class="edit-btn">Editar</button>
        <button class="delete-btn">Borrar</button>
      </td>
    `;
    
    // Evento Borrar
    row.querySelector(".delete-btn")?.addEventListener("click", async(e) => {
        e.stopPropagation();
        if(!confirm("¿Seguro que deseas eliminar esta partida?")) return

        const response = await deleteGame(game.id)
        if ('error' in response) {
             showToast(`Error al borrar: ${response.data.message}`, "error");
             return;
        }

        row.remove();
    });
    
    // Evento Editar (abre modal en modo edit)
    row.querySelector(".edit-btn")?.addEventListener("click", () => {
        const modal = document.getElementById("createGameModal")!
        const input = document.getElementById("gameNameInput") as HTMLInputElement
        const confirmBtn = document.getElementById("confirmCreateGameBtn") as HTMLButtonElement

        modal.dataset.mode = "edit"
        modal.dataset.gameId = game.id.toString()
        input.value = game.name

        confirmBtn.textContent = "Guardar"
        modal.classList.remove("hidden")
    })

    // Evento Seleccionar fila
    row.addEventListener("click", () => {
        document.querySelectorAll("tr.selected")?.forEach(r => r.classList.remove("selected"))
        row.classList.add("selected")
    })

    tableBody.appendChild(row)
}

// Actualiza una fila de la tabla con nuevos datos de la partida
function updateRow(game: Game) {
    const row = document.querySelector(`tr[data-id="${game.id}"]`)

    if (!row) return

    row.children[0].textContent = game.owner.nickname
    row.children[1].textContent = game.name
    row.children[2].textContent = game.players.toString()
    row.children[3].textContent = game.status
}