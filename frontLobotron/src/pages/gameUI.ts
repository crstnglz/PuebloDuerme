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
    } catch (e) {
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
            cell.innerHTML = "";

            const avatarContainer = document.createElement("div");
            avatarContainer.style.display = "flex";
            avatarContainer.style.flexDirection = "column";
            avatarContainer.style.alignItems = "center";
            avatarContainer.style.pointerEvents = "none";

            const img = document.createElement("img");
            img.src = data.profile_photo || "/images/usuario_predeterminado.png";
            img.style.width = "3vw";
            img.style.height = "3vw";
            img.style.borderRadius = "50%";
            img.style.marginBottom = "5px";
            img.style.border = "2px solid #3e2723";
            img.style.transition = "filter 0.3s";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = data.nickname;
            nameSpan.style.fontSize = "0.9vw";
            nameSpan.style.fontWeight = "bold";

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

    channel.bind("game.force-exit", (data: { reason: string }) => {
        console.log("FORZADO A SALIR:", data)

        const p = document.createElement("p")
        p.classList.add("system-msg")
        p.innerHTML = data.reason === "owner_left"
            ? "El dueño ha cerrado la partida."
            : "La partida ha sido eliminada."

        chatMessages.appendChild(p)

        setTimeout(() => {
            window.location.href = "/lobby.html"
        }, 1500)
    })

    channel.bind("player.left", (data: {
        gameId: number;
        userId: number;
        username: string, 
        remainingPlayers: number;
    }) => {
        handlePlayerLeft(data)
    });

    channel.bind("player.joined", (event: PlayerJoinedEvent) => {
        const p = document.createElement("p");
        p.innerHTML = `<b>${event.user.nickname}</b> se ha unido a la partida`;
        p.classList.add("system-msg");
        chatMessages?.appendChild(p);
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

        const cells = Array.from(playersGrid.children) as HTMLElement[];
        const emptyIndex = cells.findIndex((cell) => !cell.dataset.userId);
        if (emptyIndex !== -1) renderPlayer(event.user, emptyIndex);
    });

    channel.bind("game.started", () => {

        const overlay = document.getElementById("start-overlay") as HTMLDivElement;
        const countdownEl = document.getElementById("start-countdown") as HTMLDivElement;

        if (!overlay || !countdownEl) return;

        overlay.classList.remove("hidden-overlay");
        overlay.classList.add("show-overlay");

        let counter = 5;
        countdownEl.textContent = counter.toString();

        const interval = setInterval(() => {
            counter--;

            countdownEl.style.animation = "none";
            countdownEl.offsetHeight;
            countdownEl.style.animation = "";

            if (counter > 0) {
                countdownEl.textContent = counter.toString();
                return;
            }

            if (counter === 0) {
                countdownEl.textContent = "¡Ya!";
            }

            if (counter < 0) {
                clearInterval(interval);

                overlay.style.opacity = "0";
                overlay.style.pointerEvents = "none";

                setTimeout(() => {
                    overlay.style.display = "none";
                    overlay.classList.remove("show-overlay");
                    overlay.classList.add("hidden-overlay");

                    console.log("Cuenta atrás finalizada, iniciando fase de asignación...");

                }, 500);
            }
        }, 1000);
    });

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
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    if (sendButton) sendButton.addEventListener("click", sendMsg);
    if (chatInput) chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMsg();
    });

    async function sendMsg() {
        const content = chatInput?.value.trim();
        if (!content) return;

        const msgToken = localStorage.getItem("access_token");
        if (!msgToken) {
            alert("Debes iniciar sesión.");
            return;
        }

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

    /* ===================================================================
        BOTÓN INICIAR PARTIDA 
    ====================================================================== */

    const timerBox = document.getElementById("timer-box") as HTMLDivElement | null;
    if (!timerBox) {
        return;
    }

    const showStartButtonIfOwner = function (isOwner: boolean) {
        if (isOwner) {
            timerBox.classList.remove("disabled");
            timerBox.textContent = "Iniciar Partida";
        } else {
            timerBox.classList.add("disabled");
            timerBox.textContent = "Esperando al dueño...";
        }
    };

   timerBox.addEventListener("click", async () => {
    if (!myUser) return;
    if (timerBox.classList.contains("disabled")) return;

    timerBox.classList.add("disabled");
    timerBox.textContent = "Iniciando...";

    try {
        // Llamamos al endpoint para iniciar la partida
        const res = await fetch(`http://${apiHost}:${apiPort}/api/games/${gameId}/start`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) throw new Error(`start failed: ${res.status}`);

        const startData = await res.json();
        let phaseName: string;
        let endTime: string;

        if (startData && startData.data && startData.data.turn_state) {
            phaseName = startData.data.turn_state.toLowerCase();
            endTime = startData.data.end_time ?? new Date().toISOString();
        } else {
            const resp = await changeGamePhase(Number(gameId), "day");
            phaseName = resp.data.turn_state.toLowerCase();
            endTime = resp.data.end_time;
        }

        updatePhaseAndTimer({ name: phaseName }, endTime);

        await changeGamePhase(Number(gameId), phaseName);

    } catch (err) {
        console.error("Error al iniciar partida:", err);
        timerBox.classList.remove("disabled");
        timerBox.textContent = "Iniciar Partida";
    }
});


    function handlePlayerLeft(data: {
        gameId: number;
        userId: number;
        username: string;
        remainingPlayers: number;
    }) {

        if(chatMessages)
        {
            const p = document.createElement("p")
            p.innerHTML = `<b>${data.username}</b> ha abandonado la partida`;
            p.classList.add("system-msg")
            chatMessages.appendChild(p)
            chatMessages.scrollTop = chatMessages.scrollHeight
        }

        const countEl = document.getElementById("players-count")
        if(countEl) 
        {
            countEl.textContent = `${data.remainingPlayers} / 16`
        }

        const cells = Array.from(playersGrid.children) as HTMLElement []
        const slot = cells.find(c => c.dataset.userId === String(data.userId))
        
        if(slot)
        {
            slot.innerHTML = slot.dataset.index ?? ""
            delete slot.dataset.userId

            slot.style.background = ""
            slot.style.color = ""
            slot.style.border = ""
        }
    }

    /* ========================================================================
        LÓGICA DE FASES (TEMPORIZADOR, CAMBIO AUTOMÁTICO)
       ======================================================================== */

    const mainContainer = document.getElementById("main-container") as HTMLElement | null;
    let countdownInterval: number | null = null;

    const updateGamePhase = function (phase: GamePhaseInterface) {
        const name = phase.name.toLowerCase();

        if (!mainContainer) return;

        mainContainer.classList.remove("is-day", "is-night");
        if (name === "day") mainContainer.classList.add("is-day");
        else if (name === "night") mainContainer.classList.add("is-night");

        const phaseDisplay = document.getElementById("phase-display");
        if (phaseDisplay) phaseDisplay.textContent = `Fase: ${name}`;
    };

    const startCountdown = function (endTime: string) {
        if (!timerBox) return;

        timerBox.classList.add("active-timer");

        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        const update = function () {
            const now = Date.now();
            const end = new Date(endTime).getTime();
            const diff = end - now;

            if (diff <= 0) {
                timerBox.classList.remove("active-timer");

                if (countdownInterval) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }
                handleAutomaticPhaseChange();
                return;
            }

            const seconds = Math.floor(diff / 1000) % 60;
            const minutes = Math.floor(diff / 1000 / 60) % 60;
            timerBox.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        };

        update();
        countdownInterval = window.setInterval(update, 1000);
    };

    async function handleAutomaticPhaseChange() {
        try {
            if (!mainContainer) return;

            const currentPhase = mainContainer.classList.contains("is-day") ? "day" : "night";
            const nextPhase = currentPhase === "day" ? "night" : "day";

            const response = await changeGamePhase(Number(gameId), nextPhase);

            const phaseName = response.data.turn_state.toLowerCase();
            const endTime = response.data.end_time;

            const newPhase: GamePhaseInterface = {name: phaseName};
            updatePhaseAndTimer(newPhase, endTime);
        } catch (error) {
            console.error("Error cambiando fase automáticamente:", error);
        }
    }

    const updatePhaseAndTimer = function (phase: GamePhaseInterface, end_time: string) {
        updateGamePhase(phase);
        startCountdown(end_time);
    };

    channel.bind("phase-changed", (data: { phaseName: string; endTime: string }) => {
        const phaseName = data.phaseName.toLowerCase();
        const currentPhase = mainContainer?.classList.contains("is-day") ? "day" : "night";

        if (phaseName !== currentPhase) {
            const phase: GamePhaseInterface = {name: phaseName};
            updatePhaseAndTimer(phase, data.endTime);
        }
    });

    /* ========================================================================
        CARGA INICIAL DE JUGADORES, RESTAURACIÓN DE CASILLAS Y ESTADO DE PARTIDA
       ======================================================================== */
    try {

    const response = await getGame(gameId);

    Array.from(playersGrid.children).forEach((cell, index) => {
        const el = cell as HTMLElement;

        el.innerHTML = (index + 1).toString(); 
        el.dataset.index = String(index + 1);
        delete el.dataset.userId; 
    });

    if ("error" in response) {
        console.error("Error cargando partida:", response.data.message);
        alert("No se pudo cargar la partida: " + (response.data.message || "Error desconocido"));
        return;
    }

    const game = response.data.game;

    const isOwner = myUser?.id === game.owner_id;
    showStartButtonIfOwner(isOwner);

    // Renderizamos jugadores reales en sus celdas
    game.players?.forEach((player: Player, index: number) => renderPlayer(player, index));

    // Fase inicial (día/noche)
    if (game.current_phase) {
        const phase: GamePhaseInterface = { name: game.current_phase.name.toLowerCase() };

        if (game.phase_ends_at) updatePhaseAndTimer(phase, game.phase_ends_at);
        else updatePhaseAndTimer(phase, new Date().toISOString());
    } else {
        // Si no hay fase todavía, asumimos día
        mainContainer?.classList.add("is-day");
    }

} catch (error) {
    console.error("Error crítico al inicializar estado del juego:", error);
}

    /* ========================================================================
        ROL MODALS Y DESCRIPCIONES
       ======================================================================== */
    const roleDescriptions: Record<RoleKey, RoleInfo> = {
        aldeano: {
            title: "Aldeano",
            text: `No tiene ninguna habilidad o poder especial. 
Sus únicas armas son la capacidad de análisis y la intuición para identificar 
a los Hombres Lobo, así como la fuerza de convicción para impedir la ejecución de inocentes.`
        },
        lobo: {
            title: "Hombre Lobo",
            text: `Durante cada noche se despiertan para devorar a un aldeano. 
Durante el día deben ocultar su identidad y mezclarse entre los aldeanos, 
evitando levantar sospechas o ser ejecutados.`
        },
        vidente: {
            title: "Vidente",
            text: `Es la líder de los defensores de la aldea. 
Cada noche puede mirar el rol real de un jugador.  
Deben ayudar a los aldeanos, pero con discreción: si los lobos descubren quién es, será su final.`
        },
        ladron: {
            title: "Ladrón",
            text: `Una vez durante la partida puede elegir intercambiar su carta con la de otro jugador.  
El jugador que reciba su carta será ladrón para siempre y no podrá volver a cambiar. 
El ladrón adopta obligatoriamente el rol del personaje que reciba —le guste o no.`
        },
        cupido: {
            title: "Cupido",
            text: `La primera noche enamora a dos jugadores, incluso puede elegirse a sí mismo. 
Los enamorados forman un bando propio: si uno muere, el otro muere de pena inmediatamente. 
Su objetivo es sobrevivir juntos hasta el final de la partida.`
        },
        ninia: {
            title: "La niña",
            text: `Puede espiar a los Hombres Lobo por la noche mientras cazan. 
Sin embargo, si es descubierta es asesinada inmediatamente. 
Tiene un rol muy arriesgado pero extremadamente útil si juega con cuidado.`
        },
        bruja: {
            title: "Bruja",
            text: `Tiene dos pociones: 
• Una poción de curación para salvar a la víctima de los lobos. 
• Una poción de veneno para matar a un jugador. 
Solo puede usar cada poción una vez en toda la partida.`
        },
        cazador: {
            title: "Cazador",
            text: `Cuando muere —ya sea de noche o de día— puede llevarse a un jugador con él. 
Su disparo final puede cambiar completamente el rumbo de una partida.`
        },
        alguacil: {
            title: "Alguacil",
            text: `Es elegido por votación durante el día. 
En las votaciones de linchamiento, en caso de empate, su voto vale doble. 
Si muere, puede elegir a su sucesor antes de revelar su carta.`
        }
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

    function closeRoleModal(): void {
        if (modal) modal.style.display = "none";
    }

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
    const exitButton = document.getElementById("exit-button") as HTMLButtonElement;
    exitButton?.addEventListener("click", leaveGame);

    async function leaveGame() {
        const token = localStorage.getItem("access_token");
        try {
            await fetch(`http://localhost:8000/api/games/${gameId}/leave`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json", "Content-Type": "application/json" },
            });

            if ((window as any).Echo) (window as any).Echo.leave(`game.${gameId}`);
            window.location.href = "/lobby.html";
        } catch (err) {
            console.error("Error al salir:", err);
        }
    }
}
