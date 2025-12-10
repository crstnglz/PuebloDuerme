import Pusher from "pusher-js";
import type { RoleInfo, RoleKey } from "../types/roleInfo";
import type { User } from "../types/user";
import type { Player } from "../types/player";
import { getGame, changeGamePhase } from "../providers/game.provider";
import { fillBots, botSpeak } from "../providers/bots.provider";
import type { GamePhaseInterface } from "../types/gamePhaseInterface";
import { showToast } from "../toast";

interface PlayerJoinedEvent {
  user: User;
  gameId: number;
}

type MaybeBot = { id?: number; nickname?: string; profile_photo?: string | null; is_bot?: boolean; };

export async function initGameUI() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");
  if (!gameId) {
    console.error("No se encontró el ID de la partida en la URL.");
    return;
  }
  const numericGameId = Number(gameId);

  const token = localStorage.getItem("access_token");
  const raw = localStorage.getItem("user");

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

  const renderPlayer = (data: Player | User | MaybeBot, index: number) => {
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
      img.src = (data as any).profile_photo || "/images/usuario_predeterminado.png";
      img.style.width = "3vw";
      img.style.height = "3vw";
      img.style.borderRadius = "50%";
      img.style.marginBottom = "5px";
      img.style.border = "2px solid #3e2723";
      img.style.transition = "filter 0.3s";
      img.onerror = () => { img.src = "/images/usuario_predeterminado.png"; };

      const nameSpan = document.createElement("span");
      const d = data as MaybeBot;
      const nick = d.nickname ?? "Jugador";
      // Marca visual para bots
      nameSpan.textContent = d.is_bot ? `${nick} 🤖` : nick;
      nameSpan.style.fontSize = "0.9vw";
      nameSpan.style.fontWeight = "bold";

      avatarContainer.appendChild(img);
      avatarContainer.appendChild(nameSpan);
      cell.appendChild(avatarContainer);

      cell.style.background = "#d4a24c";
      cell.style.color = "white";
      cell.style.border = "2px solid #5d4037";

      if ((data as any).id) cell.dataset.userId = String((data as any).id);
      else delete cell.dataset.userId;
    }
  };

  // Pinta los bots en las celdas vacías (en orden). Lo más simple posible.
const fillEmptySlotsWithBots = (bots: MaybeBot[]) => {
  if (!Array.isArray(bots) || bots.length === 0) return;

  const cells = Array.from(playersGrid.children) as HTMLElement[];

  // índice del bot que vamos a colocar
  let botIndex = 0;

  for (let i = 0; i < cells.length && botIndex < bots.length; i++) {
    const cell = cells[i] as HTMLElement;

    // si la celda está vacía (no tiene userId), colocamos un bot
    if (!cell.dataset.userId) {
      const b = bots[botIndex];
      const bot: MaybeBot = {
        id: b.id,
        nickname: b.nickname ?? "Bot",
        profile_photo: b.profile_photo ?? null,
        is_bot: true,
      };

      renderPlayer(bot, i);
      botIndex++;
    }
  }

  // actualizar contador si existe
  const countEl = document.getElementById("players-count");
  if (countEl) {
    const current = Array.from(playersGrid.children).filter(
      (c) => (c as HTMLElement).dataset.userId
    ).length;
    const max = Number(countEl.textContent?.split(" / ")[1] ?? 30);
    countEl.textContent = `${current} / ${max}`;
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
    const p = document.createElement("p");
    p.classList.add("system-msg");
    p.innerHTML =
      data.reason === "owner_left"
        ? "El dueño ha cerrado la partida."
        : "La partida ha sido eliminada.";

    chatMessages?.appendChild(p);

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
    chatMessages?.appendChild(p);
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

    const cells = Array.from(playersGrid.children) as HTMLElement[];
    const emptyIndex = cells.findIndex((cell) => !cell.dataset.userId);
    if (emptyIndex !== -1) renderPlayer(event.user, emptyIndex);
  });


  let botsSpokeThisDay = false;

  // Escucha el evento bots.joined
  channel.bind("bots.joined", (payload: { bots?: MaybeBot[]; bot?: MaybeBot; added?: MaybeBot[]; joined?: MaybeBot[] } ) => {
   
    const arr = payload?.bots ?? payload?.added ?? payload?.joined ?? (payload?.bot ? [payload.bot] : null);
    if (Array.isArray(arr) && arr.length > 0) {
      fillEmptySlotsWithBots(arr);

      if (chatMessages) {
        const msg = document.createElement("p");
        msg.classList.add("system-msg");
        msg.innerHTML = `<b>${arr.length}</b> bot(s) se han unido a la partida.`;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    } else {
    
      (async () => {
        try {
          const resp = await getGame(gameId);
          if (!("error" in resp)) {
            const game = resp.data.game;
            // limpia y repinta todo
            Array.from(playersGrid.children).forEach((cell, index) => {
              const el = cell as HTMLElement;
              el.innerHTML = (index + 1).toString();
              el.dataset.index = String(index + 1);
              delete el.dataset.userId;
            });
            game.players?.forEach((player: Player, index: number) => renderPlayer(player, index));
            const countEl = document.getElementById("players-count");
            if (countEl) countEl.textContent = `${game.players?.length ?? 0} / ${game.max_players ?? 30}`;
          }
        } catch (e) {
          console.warn("Error recargando partida tras bots.joined:", e);
        }
      })();
    }
  });

  channel.bind("game.started", (data: { phaseName?: string; endTime?: string }) => {
    if(chatMessages)
    {
      const p = document.createElement("p")
      p.innerHTML = `<b>Se ha iniciado la partida.</b>`
      p.classList.add("system-msg")
      chatMessages.appendChild(p)
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

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

        clearInterval(interval)

        setTimeout(() => {
          overlay.style.opacity = "0"
          overlay.style.pointerEvents = "none"

          setTimeout(() => {
            overlay.style.display = "none"
            overlay.classList.remove("show-overlay")
            overlay.classList.add("hidden-overlay")
          }, 500)
        }, 700)
        return
      }
    }, 1000);
  });

  // Mensajes normales de chat
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
  if (chatInput)
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMsg();
    });

  async function sendMsg() {
    const content = chatInput?.value.trim();
    if (!content) return;

    const msgToken = localStorage.getItem("access_token");
    if (!msgToken) {
      showToast("Debes iniciar sesión.", "info");
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
        body: JSON.stringify({ message: content, game_id: numericGameId, from: nickname }),
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

      try {
        const fillResp = await fillBots(numericGameId);
        console.log("fillBots response:", fillResp);
        if (fillResp && !fillResp.error) {

          const body = (fillResp as any).data ?? (fillResp as any);
          const added = body?.added ?? body?.joined ?? body?.bots ?? null;
          if (Array.isArray(added) && added.length > 0) {
            fillEmptySlotsWithBots(added as MaybeBot[]);
          }
        } else if (fillResp && fillResp.error) {
    
          console.warn("fillBots devolvió error:", fillResp);
        }
      } catch (err) {
        console.warn("Error llamando fillBots:", err);
      }

      try {
        const resp = await getGame(gameId);
        if (!("error" in resp)) {
          const game = resp.data.game;
          // limpia casillas y resetea dataset
          Array.from(playersGrid.children).forEach((cell, index) => {
            const el = cell as HTMLElement;
            el.innerHTML = (index + 1).toString();
            el.dataset.index = String(index + 1);
            delete el.dataset.userId;
            el.style.background = "";
            el.style.color = "";
            el.style.border = "";
          });

          // Pinta todos los players tal cual vienen (incluidos bots)
          game.players?.forEach((player: Player, index: number) => {
            renderPlayer(player, index);
          });

          // Actualiza contador
          const countEl = document.getElementById("players-count");
          if (countEl) countEl.textContent = `${game.players?.length ?? 0} / ${game.max_players ?? 30}`;
        } else {
          console.warn("getGame devolvió error al recargar tras fillBots:", resp);
        }
      } catch (err) {
        console.warn("Error recargando partida tras fillBots:", err);
      }

      // Inicia la partida
      const res = await fetch(`http://${apiHost}:${apiPort}/api/games/${numericGameId}/start`, {
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

    const cells = Array.from(playersGrid.children) as HTMLElement[];
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
      LÓGICA DE FASES (TEMPORIZADOR, CAMBIO AUTOMÁTICO)
     ======================================================================== */

  const mainContainer = document.getElementById("main-container") as HTMLElement | null;
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

  const nightFilter = document.getElementById("night-filter") as HTMLDivElement | null;

  const PHASE_ANIM_MS = 3000;
  const CHANGE_DELAY_MS = 0;

  const playPhaseAnimation = function (phaseName: "day" | "night"): Promise<void> {
    return new Promise((resolve) => {
      if (!phaseIconEl || !phaseOverlay) return resolve();

      phaseIconEl.src = phaseName === "day" ? sunPath : moonPath;
      phaseIconEl.alt = phaseName === "day" ? "Sol" : "Luna";

      phaseOverlay.classList.remove("show");
      phaseIconEl.classList.remove("show");
      phaseIconEl.offsetHeight;
      phaseOverlay.classList.add("show");
      phaseIconEl.classList.add("show");

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

    if (nightFilter) {
      if (name === "night") nightFilter.classList.add("show");
      else nightFilter.classList.remove("show");
    }

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

        const currentPhaseLocal = mainContainer?.classList.contains("is-day") ? "day" : "night";
        const nextPhaseLocal: "day" | "night" = currentPhaseLocal === "day" ? "night" : "day";

        playPhaseAnimation(nextPhaseLocal).catch(() => {});

        if (!isOwner) return;

        if (autoChangeInProgress) return;
        autoChangeInProgress = true;

        setTimeout(async () => {
          try {
            await handleAutomaticPhaseChange();
          } finally {
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

  async function handleAutomaticPhaseChange() {
    try {
      if (!mainContainer) return;

      if (!isOwner) {
        return;
      }

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

  const updatePhaseAndTimer = function (phase: GamePhaseInterface, end_time: string) {
    updateGamePhase(phase);
    startCountdown(end_time);
  };

  channel.bind("phase-changed", async (data: { phaseName: string; endTime: string }) => {
    const phaseName = data.phaseName.toLowerCase();
    const currentPhase = mainContainer?.classList.contains("is-day") ? "day" : "night";

    if (chatMessages) {
      const p = document.createElement("p");
      const readable =
        phaseName === "day"
          ? "🌞 Comienza el día. ¡La aldea despierta!"
          : "🌚 Comienza la noche... los lobos salen a cazar.";

      p.innerHTML = `<b>${readable}</b>`;
      p.classList.add("system-msg");
      chatMessages.appendChild(p);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Si ha cambiado a day y pedimos al backend que hable.
    if (phaseName === "day" && !botsSpokeThisDay) {
      botsSpokeThisDay = true;
      try {
        // Llamada simple: el backend decide cuántos mensajes enviar
        await botSpeak(numericGameId);
        console.log("botSpeak: solicitado correctamente");
      } catch (err) {
        console.warn("botSpeak error:", err);
      }
    }

    // Si pasa a night permitimos que al próximo día vuelvan a hablar
    if (phaseName === "night") {
      botsSpokeThisDay = false;
    }

    if (phaseName !== currentPhase) {
      const phase: GamePhaseInterface = { name: phaseName };
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
      showToast("No se pudo cargar la partida: " + (response.data.message || "Error desconocido"), "error");
      return;
    }

    const game = response.data.game;

    isOwner = myUser?.id === game.owner_id;
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
  const exitButton = document.getElementById("exit-button") as HTMLButtonElement;
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

      if ((window as any).Echo) (window as any).Echo.leave(`game.${gameId}`);
      window.location.href = "/lobby.html";
    } catch (err) {
      console.error("Error al salir:", err);
    }
  }
}
