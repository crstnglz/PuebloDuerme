import Pusher from "pusher-js";
import type { RoleInfo, RoleKey } from "../types/roleInfo";
import type { User } from "../types/user";
import type { Player } from "../types/player"; 
import { getGame, changeGamePhase } from "../providers/game.provider"; 
import type { GamePhaseInterface } from "../types/gamePhaseInterface";

interface PlayerJoinedEvent {
    user: User; 
    gameId: number;
}

export async function initGameUI() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");

    const token = localStorage.getItem("access_token"); 
    const raw = localStorage.getItem("user");

    if (!gameId) {
        console.error("No se encontró el ID de la partida en la URL.");
        return;
    }
    
    if (!raw || !token) {
        console.error("Usuario o token no encontrado.");
        return;
    }

    let nickname = "Jugador";
    let myUser: User | null = null;
    
    try {
        myUser = JSON.parse(raw) as User; 
        nickname = myUser.nickname ?? nickname;
    } catch(e) {
        console.error("CRÍTICO: Error al parsear el usuario del localStorage.", e);
        return; 
    }

    /* ========================================================================
        RENDERIZADO DE JUGADORES
       ======================================================================== */
    
    const playersGrid = document.getElementById("players-grid") as HTMLDivElement;
    if (!playersGrid) {
        console.error("CRÍTICO: No se encontró el elemento DOM con ID #players-grid.");
        return; 
    }

    const renderPlayer = (data: Player | User, index: number) => {
        const cells = playersGrid.children;
        if (index < cells.length) {
            const cell = cells[index] as HTMLElement;
            cell.innerHTML = ''; 

            const avatarContainer = document.createElement('div');
            avatarContainer.style.display = 'flex';
            avatarContainer.style.flexDirection = 'column';
            avatarContainer.style.alignItems = 'center';
            avatarContainer.style.pointerEvents = 'none';

            const img = document.createElement('img');
            img.src = data.profile_photo || '/images/usuario_predeterminado.png'; 
            img.style.width = '3vw';
            img.style.height = '3vw';
            img.style.borderRadius = '50%';
            img.style.marginBottom = '5px';
            img.style.border = "2px solid #3e2723";
            img.style.transition = "filter 0.3s"; 

            const nameSpan = document.createElement('span');
            nameSpan.textContent = data.nickname;
            nameSpan.style.fontSize = '0.9vw';
            nameSpan.style.fontWeight = 'bold';

            avatarContainer.appendChild(img);
            avatarContainer.appendChild(nameSpan);
            cell.appendChild(avatarContainer);

            cell.style.background = "#d4a24c"; 
            cell.style.color = "white";
            cell.style.border = "2px solid #5d4037";
            cell.dataset.userId = data.id.toString();
        }
    };

    /* ========================================================================
        CHAT Y PUSHER
       ======================================================================== */

    const chatMessages = document.getElementById("chat-messages") as HTMLDivElement;
    const chatInput = document.getElementById("chat-input") as HTMLInputElement;
    const sendButton = document.getElementById("send-button") as HTMLButtonElement;

    const wsHost = import.meta.env.VITE_REVERB_HOST ?? window.location.hostname;
    const wsPort = Number(import.meta.env.VITE_REVERB_PORT ?? 9090);
    const apiHost = "localhost";
    const apiPort = 8000;

    const pusherKey = import.meta.env.VITE_REVERB_APP_KEY as string;
    const pusher = new Pusher(pusherKey, {
        wsHost,
        wsPort,
        forceTLS: false,
        enabledTransports: ["ws"],
        cluster: "mt1",
        disableStats: true,
        authEndpoint: `http://${apiHost}:${apiPort}/broadcasting/auth`,
        auth: { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } },
    });

    const channel = pusher.subscribe(`game.${gameId}`);

    // ESCUCHAR JUGADORES UNIDOS
    channel.bind("player.joined", (event: PlayerJoinedEvent) => {
        const p = document.createElement("p");
        p.innerHTML = `<b>${event.user.nickname}</b> se ha unido a la partida`;
        p.classList.add("system-msg");
        chatMessages?.appendChild(p);
        if(chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

        const cells = Array.from(playersGrid.children) as HTMLElement[];
        const emptyIndex = cells.findIndex(cell => !cell.dataset.userId);
        if (emptyIndex !== -1) renderPlayer(event.user, emptyIndex);
    });

    // ESCUCHAR MENSAJES
    channel.bind("message.sent", (data: any) => {
        const p = document.createElement("p");
        if (data.from === nickname) {
            p.innerHTML = `<b>Tú:</b> ${data.message}`;
            p.classList.add("my-msg");
        } else {
            p.innerHTML = `<b>${data.from}:</b> ${data.message}`;
            p.classList.add("other-msg");
        }
        chatMessages?.appendChild(p);
        if(chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    if (sendButton) sendButton.addEventListener("click", sendMsg);
    if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMsg(); });

    async function sendMsg() {
        const content = chatInput?.value.trim();
        if (!content) return;

        const msgToken = localStorage.getItem("access_token");
        if (!msgToken) { alert("Debes iniciar sesión."); return; }

        try {
            await fetch(`http://${apiHost}:${apiPort}/api/chat/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${msgToken}`,
                },
                body: JSON.stringify({ message: content, game_id: Number(gameId), from: nickname }),
            });
            if (chatInput) chatInput.value = "";
        } catch (err) {
            console.error("Error al enviar mensaje:", err);
        }
    }

    /* ========================================================================
        BOTÓN INICIAR PARTIDA Y MODAL
       ======================================================================== */
    const gameStatusContainer = document.getElementById("game-status-container") as HTMLDivElement;

    const startGameButton = document.createElement("button");
    startGameButton.id = "start-game-button";
    startGameButton.textContent = "Iniciar Partida";
    startGameButton.style.display = "none"; // oculto por defecto

    const timerDisplay = document.createElement("p");
    timerDisplay.id = "timer-display";
    timerDisplay.style.display = "none";

    gameStatusContainer.appendChild(startGameButton);
    gameStatusContainer.appendChild(timerDisplay);

    // Modal de confirmación de inicio
    const startGameModal = document.createElement("div");
    startGameModal.id = "start-game-modal";
    startGameModal.style.display = "none";
    startGameModal.style.position = "fixed";
    startGameModal.style.top = "0";
    startGameModal.style.left = "0";
    startGameModal.style.width = "100%";
    startGameModal.style.height = "100%";
    startGameModal.style.backgroundColor = "rgba(0,0,0,0.5)";
    startGameModal.style.justifyContent = "center";
    startGameModal.style.alignItems = "center";
    startGameModal.style.zIndex = "1000";
    startGameModal.innerHTML = `
        <div style="background:white; padding:20px; border-radius:8px; text-align:center;">
            <p>¿Deseas iniciar la partida?</p>
            <button id="confirm-start">Sí</button>
            <button id="cancel-start">Cancelar</button>
        </div>
    `;
    document.body.appendChild(startGameModal);

    const confirmStartBtn = document.getElementById("confirm-start") as HTMLButtonElement;
    const cancelStartBtn = document.getElementById("cancel-start") as HTMLButtonElement;

    confirmStartBtn?.addEventListener("click", async () => {
        await startGame();
        startGameModal.style.display = "none";
    });

    cancelStartBtn?.addEventListener("click", () => {
        startGameModal.style.display = "none";
    });

    startGameButton.addEventListener("click", () => {
        startGameModal.style.display = "flex";
    });

    const showStartButtonIfOwner = function(isOwner: boolean) {
        if (!startGameButton) return;
        if (isOwner) {
            startGameButton.style.display = "inline-block";
            if (timerDisplay) timerDisplay.style.display = "none";
        } else {
            startGameButton.style.display = "none";
            if (timerDisplay) timerDisplay.style.display = "block";
        }
    }

const startGame = async function () {
    try {
        const response = await changeGamePhase(Number(gameId), "day");

        const phase: GamePhaseInterface = {
            name: response.data.turn_state.toLowerCase()
        };

        const endTime = response.data.end_time;

        startGameButton.style.display = "none";
        timerDisplay.style.display = "block";

        updatePhaseAndTimer(phase, endTime);

    } catch (err) {
        console.error("Error al iniciar la partida:", err);
    }
};


const updatePhaseAndTimer = function (phase: GamePhaseInterface, end_time: string) {
    updateGamePhase(phase);
    startCountdown(end_time);
}

const mainContainer = document.getElementById("main-container");
let countdownInterval: number | null = null;

const updateGamePhase = function (phase: GamePhaseInterface) {
    if (!mainContainer) return;

    const name = phase.name.toLowerCase();

    // Quitamos ambas clases antes de añadir la correcta
    mainContainer.classList.remove("is-day", "is-night");

    if (name === "day") {
        mainContainer.classList.add("is-day");
    } else if (name === "night") {
        mainContainer.classList.add("is-night");
    }

    const phaseDisplay = document.getElementById("phase-display");
    if (phaseDisplay) {
        phaseDisplay.textContent = `Fase: ${name}`;
    }
}


const startCountdown = function (endTime: string) {
    if (!timerDisplay) return;

    // Reset del temporizador si ya estaba funcionando
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    // Función que actualiza el contador cada segundo
    const update = function (){
        const now = Date.now();
        const end = new Date(endTime).getTime();
        const diff = end - now;

        // Si llega a 0 cambia de fase automáticamente
        if (diff <= 0) {
            clearInterval(countdownInterval!);
            countdownInterval = null;
            handleAutomaticPhaseChange();
            return;
        }

        const seconds = Math.floor(diff / 1000) % 60;
        const minutes = Math.floor(diff / 1000 / 60) % 60;

        timerDisplay.textContent =
            `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    update(); // Primera actualización inmediata
    countdownInterval = window.setInterval(update, 1000); // Actualizar cada segundo
}


async function handleAutomaticPhaseChange() {
    try {
        // Saber fase actual leyendo la clase del contenedor
        const currentPhase = mainContainer?.classList.contains("is-day") ? "day" : "night";
        const nextPhase = currentPhase === "day" ? "night" : "day";

        // Pedir al servidor el cambio de fase
        const response = await changeGamePhase(Number(gameId), nextPhase);

        // Obtener nombre y fin de la nueva fase
        const phaseName = response.data.turn_state.toLowerCase();
        const endTime = response.data.end_time;

        // Crear objeto de fase para actualizar UI
        const newPhase: GamePhaseInterface = {name: phaseName};

        // Actualizar interfaz y temporizador
        updatePhaseAndTimer(newPhase, endTime);

    } catch (error) {
        console.error("Error cambiando fase automáticamente:", error);
    }
}


// ESCUCHAR CAMBIO DE FASE DESDE BACKEND
channel.bind("phase-changed", (data: { phaseName: string, endTime: string }) => {
    const phaseName = data.phaseName.toLowerCase();
    const currentPhase = mainContainer?.classList.contains("is-day") ? "day" : "night";

    if (phaseName !== currentPhase) {
        console.log("Phase changed via Pusher →", phaseName);
        const phase: GamePhaseInterface = {name: phaseName};
        updatePhaseAndTimer(phase, data.endTime);
    }
});

/* ========================================================================
    CARGA INICIAL DE JUGADORES Y ESTADO DE PARTIDA
   ======================================================================== */
try {
    const response = await getGame(gameId); 
    if ('error' in response) { console.error("Error cargando partida:", response.data.message); return; }
    const game = response.data.game;

    const isOwner = myUser?.id === game.owner_id;
    showStartButtonIfOwner(isOwner);

    Array.from(playersGrid.children).forEach((cell, index) => {
        cell.innerHTML = (index + 1).toString();
        delete (cell as HTMLElement).dataset.userId;
    });
    game.players?.forEach((player: Player, index: number) => renderPlayer(player, index));

    if (game.current_phase) {
        startGameButton.style.display = "none";
        timerDisplay.style.display = "block";
        const phase: GamePhaseInterface = {name: game.current_phase.name.toLowerCase()};
        if (game.phase_ends_at) {
    updatePhaseAndTimer(phase, game.phase_ends_at);
} else {
    console.warn("phase_ends_at no está definido, se usará la hora actual");
    updatePhaseAndTimer(phase, new Date().toISOString());
}
       
}

} catch (error) {
    console.error("Error crítico al inicializar estado del juego:", error);
}

/* ========================================================================
    ROL MODALS Y DESCRIPCIONES
   ======================================================================== */
const roleDescriptions: Record<RoleKey, RoleInfo> = {
    aldeano: { title: "Aldeano", text: "No tiene ninguna habilidad especial..." },
    lobo: { title: "Hombre Lobo", text: "Durante cada noche devoran aldeanos..." },
    vidente: { title: "Vidente", text: "Puede mirar el rol real de un jugador..." },
    ladron: { title: "Ladrón", text: "Puede intercambiar su carta con otro jugador..." },
    cupido: { title: "Cupido", text: "Enamora a dos jugadores..." },
    ninia: { title: "La niña", text: "Puede espiar a los Hombres Lobo por la noche..." },
    bruja: { title: "Bruja", text: "Tiene dos pociones: curación y veneno..." },
    cazador: { title: "Cazador", text: "Puede llevarse a un jugador con él al morir..." },
    alguacil: { title: "Alguacil", text: "Elegido por votación durante el día..." }
};

const modal = document.getElementById("role-info-modal") as HTMLDivElement | null;
const titleEl = document.getElementById("role-info-title") as HTMLElement | null;
const textEl = document.getElementById("role-info-text") as HTMLElement | null;
const imgEl = document.getElementById("role-modal-img") as HTMLImageElement | null;
const closeModalBtn = document.querySelector(".close-role-info") as HTMLElement | null;

function openRoleModal(roleKey: RoleKey): void {
    const entry = roleDescriptions[roleKey];
    if (!entry || !modal || !titleEl || !textEl || !imgEl) return;
    titleEl.textContent = entry.title;
    textEl.textContent = entry.text;
    imgEl.src = `/imagesUI/roles/${roleKey}.png`;
    imgEl.alt = entry.title;
    modal.style.display = "flex";
}

function closeRoleModal(): void { if (modal) modal.style.display = "none"; }

if (closeModalBtn) closeModalBtn.addEventListener("click", closeRoleModal);
if (modal) modal.addEventListener("click", (e: MouseEvent) => {
    if ((e.target as HTMLElement).id === "role-info-modal") closeRoleModal();
});

document.querySelectorAll(".role").forEach(role => {
    const el = role as HTMLElement;
    el.addEventListener("click", () => {
        const key = el.dataset.role as RoleKey;
        if (key) openRoleModal(key);
    });
});

/* ========================================================================
    BOTÓN SALIR
   ======================================================================== */
const exitButton = document.getElementById("exit-button") as HTMLButtonElement
exitButton?.addEventListener("click", leaveGame);

async function leaveGame() {
    const token = localStorage.getItem("access_token")
    try {
        await fetch(`http://localhost:8000/api/games/${gameId}/leave`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json", "Content-Type": "application/json" }
        });

        if((window as any).Echo) (window as any).Echo.leave(`game.${gameId}`);
        window.location.href = "/lobby.html";
    } catch (err) { console.error("Error al salir:", err) }
}
}