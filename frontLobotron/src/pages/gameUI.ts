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
      ELEMENTOS DEL DOM
     ======================================================================== */

  const playersGrid = document.getElementById("players-grid") as HTMLDivElement | null;
  const chatMessages = document.getElementById("chat-messages") as HTMLDivElement | null;
  const chatInput = document.getElementById("chat-input") as HTMLInputElement | null;
  const sendButton = document.getElementById("send-button") as HTMLButtonElement | null;
  const timerBox = document.getElementById("timer-box") as HTMLDivElement | null;
  const mainContainer = document.getElementById("main-container") as HTMLElement | null;
  const exitButton = document.getElementById("exit-button") as HTMLButtonElement | null;

  const overlay = document.getElementById("start-overlay") as HTMLDivElement | null;
  const countdownEl = document.getElementById("start-countdown") as HTMLDivElement | null;

  if (!playersGrid || !chatMessages || !chatInput || !sendButton || !timerBox) {
    console.error("CRÍTICO: Faltan elementos clave del DOM.");
    return;
  }

  /* ========================================================================
      MODAL "MI ROL"
     ======================================================================== */

  const myRoleModal = document.getElementById("my-role-modal") as HTMLDivElement | null;
  const myRoleTitle = document.getElementById("my-role-title") as HTMLElement | null;
  const myRoleText = document.getElementById("my-role-text") as HTMLElement | null;
  const closeMyRoleBtn = document.getElementById("close-my-role-modal") as HTMLButtonElement | null;

  function openMyRoleModal(roleName: string) {
    if (!myRoleModal || !myRoleText) return;

    if (myRoleTitle) {
      myRoleTitle.textContent = "Tu rol";
    }

    myRoleText.textContent = roleName;
    myRoleModal.style.display = "flex";
  }

  function closeMyRoleModal() {
    if (!myRoleModal) return;
    myRoleModal.style.display = "none";
  }

  if (closeMyRoleBtn) {
    closeMyRoleBtn.addEventListener("click", closeMyRoleModal);
  }

  if (myRoleModal) {
    myRoleModal.addEventListener("click", (e: MouseEvent) => {
      if (e.target === myRoleModal) {
        closeMyRoleModal();
      }
    });
  }

  async function fetchMyRole(): Promise<string | null> {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No hay token, no puedo pedir el rol.");
      return null;
    }

    const apiHost = "localhost";
    const apiPort = 8000;

    try {
      const res = await fetch(`http://${apiHost}:${apiPort}/api/games/${gameId}/me/role`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Error al obtener mi rol:", res.status);
        return null;
      }

      const data = await res.json();
      console.log("Respuesta /me/role:", data);

      return data?.role_name ?? null;
    } catch (error) {
      console.error("Error de red al obtener mi rol:", error);
      return null;
    }
  }

  /* ========================================================================
      RENDERIZADO DE JUGADORES
     ======================================================================== */

  const renderPlayer = (data: Player | User, index: number) => {
    const cells = playersGrid.children;
    if (index >= cells.length) return;

    const cell = cells[index] as HTMLElement;
    cell.innerHTML = "";

    const avatarContainer = document.createElement("div");
    avatarContainer.style.display = "flex";
    avatarContainer.style.flexDirection = "column";
    avatarContainer.style.alignItems = "center";
    avatarContainer.style.pointerEvents = "none";

    const img = document.createElement("img");
    img.src = (data as any).profile_photo || "/images/usuario_predeterminado.png";
    img.style.width = "3vw";
    img.style.height = "3vw";
    img.style.borderRadius = "50%";
    img.style.marginBottom = "5px";
    img.style.border = "2px solid #3e2723";
    img.style.transition = "filter 0.3s";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = (data as any).nickname;
    nameSpan.style.fontSize = "0.9vw";
    nameSpan.style.fontWeight = "bold";

    avatarContainer.appendChild(img);
    avatarContainer.appendChild(nameSpan);
    cell.appendChild(avatarContainer);

    cell.style.background = "#d4a24c";
    cell.style.color = "white";
    cell.style.border = "2px solid #5d4037";

    cell.dataset.userId = String((data as any).id);
  };

  /* ========================================================================
      CHAT Y PUSHER / REVERB
     ======================================================================== */

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
    auth: {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const channel = pusher.subscribe(`game.${gameId}`);

  channel.bind("game.force-exit", (data: { reason: string }) => {
    const p = document.createElement("p");
    p.classList.add("system-msg");
    p.innerHTML =
      data.reason === "owner_left"
        ? "El dueño ha cerrado la partida."
        : "La partida ha sido eliminada.";

    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      window.location.href = "/lobby.html";
    }, 1500);
  });

  channel.bind(
    "player.left",
    (data: {
      gameId: number;
      userId: number;
      username: string;
      remainingPlayers: number;
    }) => {
      handlePlayerLeft(data);
    }
  );

  channel.bind("player.joined", (event: PlayerJoinedEvent) => {
    const p = document.createElement("p");
    p.innerHTML = `<b>${event.user.nickname}</b> se ha unido a la partida`;
    p.classList.add("system-msg");
    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const cells = Array.from(playersGrid.children) as HTMLElement[];
    const emptyIndex = cells.findIndex((cell) => !cell.dataset.userId);
    if (emptyIndex !== -1) renderPlayer(event.user, emptyIndex);
  });

  channel.bind("game.started", (data: { phaseName?: string; endTime?: string }) => {
    if (data?.phaseName && data?.endTime) {
      try {
        const phaseName = String(data.phaseName).toLowerCase();
        updatePhaseAndTimer({ name: phaseName }, data.endTime);
      } catch (err) {
        console.error("Error aplicando datos de game.started:", err);
      }
    }

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

    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  if (sendButton) sendButton.addEventListener("click", sendMsg);
  if (chatInput)
    chatInput.addEventListener("keydown", (e) => {
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
      const res = await fetch(`http://${apiHost}:${apiPort}/api/games/${gameId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`start failed: ${res.status}`);

      const startData = await res.json();

      const phaseName = startData.data.turn_state.toLowerCase();
      const endTime = startData.data.end_time;

      updatePhaseAndTimer({ name: phaseName }, endTime);
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
    if (chatMessages) {
      const p = document.createElement("p");
      p.innerHTML = `<b>${data.username}</b> ha abandonado la partida`;
      p.classList.add("system-msg");
      chatMessages.appendChild(p);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const countEl = document.getElementById("players-count");
    if (countEl) {
      countEl.textContent = `${data.remainingPlayers} / 16`;
    }

    const cells = Array.from(playersGrid!.children) as HTMLElement[];
    const slot = cells.find((c) => c.dataset.userId === String(data.userId));

    if (slot) {
      slot.innerHTML = slot.dataset.index ?? "";
      delete slot.dataset.userId;

      slot.style.background = "";
      slot.style.color = "";
      slot.style.border = "";
    }
  }

  /* ========================================================================
      FASES, TEMPORIZADOR Y GAME.STARTED
     ======================================================================== */

  let countdownInterval: number | null = null;
  let autoChangeInProgress = false;
  let isOwner = false;

  /* -------------------------
     ANIMACIÓN SOL / LUNA
     ------------------------- */
  const sunPath = "/imagesGameRoom/Sol.png";
  const moonPath = "/imagesGameRoom/Luna.png";

  // Preload de imágenes
  const imgSun = new Image();
  imgSun.src = sunPath;

  const imgMoon = new Image();
  imgMoon.src = moonPath;

  // Creamos overlay y elemento de icono en body
  let phaseOverlay = document.getElementById("phase-overlay") as HTMLDivElement | null;
  if (!phaseOverlay) {
    phaseOverlay = document.createElement("div");
    phaseOverlay.id = "phase-overlay";
    phaseOverlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(phaseOverlay);
  }

  let phaseIconEl = document.getElementById("phase-icon") as HTMLImageElement | null;
  if (!phaseIconEl) {
    phaseIconEl = document.createElement("img");
    phaseIconEl.id = "phase-icon";
    phaseIconEl.alt = "Fase";
    phaseIconEl.style.pointerEvents = "none";
    phaseIconEl.style.opacity = "0";
    document.body.appendChild(phaseIconEl);
  }

  const PHASE_ANIM_MS = 3000;
  const CHANGE_DELAY_MS = 0;

  const playPhaseAnimation = function (phaseName: "day" | "night"): Promise<void> {
    return new Promise((resolve) => {
      if (!phaseIconEl || !phaseOverlay) return resolve();

      // escoge la imagen según la fase que hay
      phaseIconEl.src = phaseName === "day" ? sunPath : moonPath;
      phaseIconEl.alt = phaseName === "day" ? "Sol" : "Luna";

      // reset clases
      phaseOverlay.classList.remove("show");
      phaseIconEl.classList.remove("show");

      // gracias a esto la animación se puede reiniciar todas las veces
      phaseIconEl.offsetHeight;

      // añadimos la clase
      phaseOverlay.classList.add("show");
      phaseIconEl.classList.add("show");

      // la quitamos después de la duración
      setTimeout(() => {
        phaseIconEl?.classList.remove("show");
        phaseOverlay?.classList.remove("show");
        resolve();
      }, PHASE_ANIM_MS);
    });
  };

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
        timerBox.textContent = "00:00";
        timerBox.classList.remove("active-timer");

        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }

        // Calculamos siguiente fase local para la animación
        const currentPhaseLocal = mainContainer?.classList.contains("is-day") ? "day" : "night";
        const nextPhaseLocal: "day" | "night" = currentPhaseLocal === "day" ? "night" : "day";

        // Reproducimos animación en todos los clientes al llegar a 0
        playPhaseAnimation(nextPhaseLocal).catch(() => {});

        // Si no eres el owner no cambias fase
        if (!isOwner) return;

        // Evitamos que se lance dos veces
        if (autoChangeInProgress) return;
        autoChangeInProgress = true;

        // Cambiar la fase durante la animación
        setTimeout(async () => {
          try {
            await handleAutomaticPhaseChange();
          } finally {
            // Pequeño margen para evitar repetidos
            autoChangeInProgress = false;
          }
        }, CHANGE_DELAY_MS);

        return;
      }

      const seconds = Math.floor(diff / 1000) % 60;
      const minutes = Math.floor(diff / 1000 / 60) % 60;
      timerBox.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    };

    update();
    countdownInterval = window.setInterval(update, 1000);
  };

  const updatePhaseAndTimer = function (phase: GamePhaseInterface, end_time: string) {
    updateGamePhase(phase);
    startCountdown(end_time);
  };

  async function handleAutomaticPhaseChange() {
    try {
      if (!mainContainer || !isOwner) return;

      const currentPhase = mainContainer.classList.contains("is-day") ? "day" : "night";
      const nextPhase = currentPhase === "day" ? "night" : "day";

      const response = await changeGamePhase(Number(gameId), nextPhase);

      const phaseName = response.data.turn_state.toLowerCase();
      const endTime = response.data.end_time;

      const newPhase: GamePhaseInterface = { name: phaseName };
      updatePhaseAndTimer(newPhase, endTime);
    } catch (error) {
      console.error("Error cambiando fase automáticamente:", error);
    }
  }

  channel.bind("phase-changed", (data: { phaseName: string; endTime: string }) => {
    const phaseName = data.phaseName.toLowerCase();
    const currentPhase = mainContainer?.classList.contains("is-day") ? "day" : "night";

    if (phaseName !== currentPhase) {
      const phase: GamePhaseInterface = { name: phaseName };
      updatePhaseAndTimer(phase, data.endTime);
    }
  });

  channel.bind("game.started", async (data?: { phaseName?: string; endTime?: string }) => {
    // Si el backend manda también la fase y el endTime, lo aplicamos
    if (data?.phaseName && data?.endTime) {
      try {
        const phaseName = String(data.phaseName).toLowerCase();
        updatePhaseAndTimer({ name: phaseName }, data.endTime);
      } catch (err) {
        console.error("Error aplicando datos de game.started:", err);
      }
    }

    if (!overlay || !countdownEl) return;

    overlay.classList.remove("hidden-overlay");
    overlay.classList.add("show-overlay");

    let counter = 5;
    countdownEl.textContent = counter.toString();

    const interval = window.setInterval(async () => {
      counter--;

      countdownEl.style.animation = "none";
      // reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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

        setTimeout(async () => {
          overlay.style.display = "none";
          overlay.classList.remove("show-overlay");
          overlay.classList.add("hidden-overlay");

          console.log("Cuenta atrás finalizada, obteniendo rol del jugador...");

          const roleName = await fetchMyRole();
          if (roleName) {
            openMyRoleModal(roleName);
          } else {
            console.warn("No se pudo obtener el rol del jugador.");
          }
        }, 500);
      }
    }, 1000);
  });

  /* ========================================================================
      ENVÍO DE MENSAJES
     ======================================================================== */

  if (sendButton) sendButton.addEventListener("click", sendMsg);
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMsg();
    });
  }

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
        body: JSON.stringify({
          message: content,
          game_id: Number(gameId),
          from: nickname,
        }),
      });
      chatInput!.value = "";
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    }
  }

  /* ========================================================================
      GESTIÓN DE JUGADOR QUE SALE
     ======================================================================== */

  function handlePlayerLeft(data: {
    gameId: number;
    userId: number;
    username: string;
    remainingPlayers: number;
  }) {
    const p = document.createElement("p");
    p.innerHTML = `<b>${data.username}</b> ha abandonado la partida`;
    p.classList.add("system-msg");
    chatMessages!.appendChild(p);
    chatMessages!.scrollTop = chatMessages!.scrollHeight;

    const countEl = document.getElementById("players-count");
    if (countEl) {
      countEl.textContent = `${data.remainingPlayers} / 16`;
    }

    const cells = Array.from(playersGrid!.children) as HTMLElement[];
    const slot = cells.find((c) => c.dataset.userId === String(data.userId));

    if (slot) {
      slot.innerHTML = slot.dataset.index ?? "";
      delete slot.dataset.userId;

      slot.style.background = "";
      slot.style.color = "";
      slot.style.border = "";
    }
  }

  /* ========================================================================
      CARGA INICIAL DE PARTIDA (JUGADORES + FASE)
     ======================================================================== */

  function showStartButtonIfOwner(owner: boolean) {
    if (!timerBox) return;
    if (owner) {
      timerBox.classList.remove("disabled");
      timerBox.textContent = "Iniciar Partida";
    } else {
      timerBox.classList.add("disabled");
      timerBox.textContent = "Esperando al dueño...";
    }
  }

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

    isOwner = !!myUser && myUser.id === game.owner_id;
    showStartButtonIfOwner(isOwner);

    if (Array.isArray(game.players)) {
      game.players.forEach((player: Player, index: number) => renderPlayer(player, index));
    }

    if (game.current_phase) {
      const phase: GamePhaseInterface = { name: game.current_phase.name.toLowerCase() };

      if (game.phase_ends_at) {
        updatePhaseAndTimer(phase, game.phase_ends_at);
      } else {
        updatePhaseAndTimer(phase, new Date().toISOString());
      }
    } else if (mainContainer) {
      mainContainer.classList.add("is-day");
    }
  } catch (error) {
    console.error("Error crítico al inicializar estado del juego:", error);
  }

  /* ========================================================================
      BOTÓN INICIAR PARTIDA
     ======================================================================== */

  timerBox.addEventListener("click", async () => {
    if (!myUser) return;
    if (timerBox.classList.contains("disabled")) return;

    timerBox.classList.add("disabled");
    timerBox.textContent = "Iniciando...";

    try {
      const res = await fetch(`http://${apiHost}:${apiPort}/api/games/${gameId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`start failed: ${res.status}`);
      }

      const startData = await res.json();

      // Si tu backend devuelve datos de fase al iniciar:
      if (startData?.data?.turn_state && startData?.data?.end_time) {
        const phaseName = String(startData.data.turn_state).toLowerCase();
        const endTime = startData.data.end_time;
        updatePhaseAndTimer({ name: phaseName }, endTime);
      }

      console.log("Partida iniciada correctamente.");
    } catch (err) {
      console.error("Error al iniciar partida:", err);
      timerBox.classList.remove("disabled");
      timerBox.textContent = "Iniciar Partida";
    }
  });

  /* ========================================================================
      MODAL DE DESCRIPCIÓN DE ROLES
     ======================================================================== */

  const roleDescriptions: Record<RoleKey, RoleInfo> = {
    aldeano: {
      title: "Aldeano",
      text: `No tiene ninguna habilidad o poder especial. 
Sus únicas armas son la capacidad de análisis y la intuición para identificar 
a los Hombres Lobo, así como la fuerza de convicción para impedir la ejecución de inocentes.`,
    },
    lobo: {
      title: "Hombre Lobo",
      text: `Durante cada noche se despiertan para devorar a un aldeano. 
Durante el día deben ocultar su identidad y mezclarse entre los aldeanos, 
evitando levantar sospechas o ser ejecutados.`,
    },
    vidente: {
      title: "Vidente",
      text: `Es la líder de los defensores de la aldea. 
Cada noche puede mirar el rol real de un jugador.  
Deben ayudar a los aldeanos, pero con discreción: si los lobos descubren quién es, será su final.`,
    },
    ladron: {
      title: "Ladrón",
      text: `Una vez durante la partida puede elegir intercambiar su carta con la de otro jugador.  
El jugador que reciba su carta será ladrón para siempre y no podrá volver a cambiar. 
El ladrón adopta obligatoriamente el rol del personaje que reciba —le guste o no.`,
    },
    cupido: {
      title: "Cupido",
      text: `La primera noche enamora a dos jugadores, incluso puede elegirse a sí mismo.  
Los enamorados forman un bando propio: si uno muere, el otro muere de pena inmediatamente.  
Su objetivo es sobrevivir juntos hasta el final de la partida.`,
    },
    ninia: {
      title: "La niña",
      text: `Puede espiar a los Hombres Lobo por la noche mientras cazan.  
Sin embargo, si es descubierta es asesinada inmediatamente.  
Tiene un rol muy arriesgado pero extremadamente útil si juega con cuidado.`,
    },
    bruja: {
      title: "Bruja",
      text: `Tiene dos pociones:  
• Una poción de curación para salvar a la víctima de los lobos.  
• Una poción de veneno para matar a un jugador.  
Solo puede usar cada poción una vez en toda la partida.`,
    },
    cazador: {
      title: "Cazador",
      text: `Cuando muere —ya sea de noche o de día— puede llevarse a un jugador con él.  
Su disparo final puede cambiar completamente el rumbo de una partida.`,
    },
    alguacil: {
      title: "Alguacil",
      text: `Es elegido por votación durante el día.  
En las votaciones de linchamiento, en caso de empate, su voto vale doble.  
Si muere, puede elegir a su sucesor antes de revelar su carta.`,
    },
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
  if (modal)
    modal.addEventListener("click", (e: MouseEvent) => {
      if ((e.target as HTMLElement).id === "role-info-modal") closeRoleModal();
    });

  document.querySelectorAll(".role").forEach((role) => {
    const el = role as HTMLElement;
    el.addEventListener("click", () => {
      const key = el.dataset.role as RoleKey;
      if (key) openRoleModal(key);
    });
  });

  /* ========================================================================
      BOTÓN SALIR
     ======================================================================== */

  exitButton?.addEventListener("click", leaveGame);

  async function leaveGame() {
    const token = localStorage.getItem("access_token");

    try {
      await fetch(`http://localhost:8000/api/games/${gameId}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if ((window as any).Echo) {
        (window as any).Echo.leave(`game.${gameId}`);
      }

      window.location.href = "/lobby.html";
    } catch (err) {
      console.error("Error al salir:", err);
    }
  }

  
}

