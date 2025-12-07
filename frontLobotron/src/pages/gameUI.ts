import Pusher from "pusher-js";
import type { RoleInfo, RoleKey } from "../types/roleInfo";
import type { User } from "../types/user";
import type { Player } from "../types/player"; 
import { getGame } from "../providers/game.provider"; 

interface PlayerJoinedEvent {
    user: User; 
    gameId: number;
}

export async function initGameUI() {
    
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");

    const token = localStorage.getItem("access_token"); 
    const raw = localStorage.getItem("user");

    // Verificamos la autenticación y la ID
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
         LÓGICA DE INTERFAZ Y RENDERIZADO DE JUGADORES
        ======================================================================== */
    
    const playersGrid = document.getElementById("players-grid") as HTMLDivElement;
    
    // Mantenemos la verificación crítica del DOM
    if (!playersGrid) {
        console.error("CRÍTICO: No se encontró el elemento DOM con ID #players-grid.");
        return; 
    }

    // Renderizamos un jugador en la cuadrícula
    const renderPlayer = (data: Player | User, index: number) => {
        const cells = playersGrid.children;
        
        if (index < cells.length) {
            const cell = cells[index] as HTMLElement;
            
            cell.innerHTML = ''; 
            
            // Contenido avatar
            const avatarContainer = document.createElement('div');
            avatarContainer.style.display = 'flex';
            avatarContainer.style.flexDirection = 'column';
            avatarContainer.style.alignItems = 'center';
            avatarContainer.style.pointerEvents = 'none';

            // imagen
            const img = document.createElement('img');
            img.src = data.profile_photo || '/images/usuario_predeterminado.png'; 
            img.style.width = '3vw';
            img.style.height = '3vw';
            img.style.borderRadius = '50%';
            img.style.marginBottom = '5px';
            img.style.border = "2px solid #3e2723";
            img.style.transition = "filter 0.3s"; 

            // nombre
            const nameSpan = document.createElement('span');
            nameSpan.textContent = data.nickname;
            nameSpan.style.fontSize = '0.9vw';
            nameSpan.style.fontWeight = 'bold';

            avatarContainer.appendChild(img);
            avatarContainer.appendChild(nameSpan);
            cell.appendChild(avatarContainer);

            // Estilos de celda ocupada
            cell.style.background = "#d4a24c"; 
            cell.style.color = "white";
            cell.style.border = "2px solid #5d4037";
            
            // Marcamos la celda como ocupada
            cell.dataset.userId = data.id.toString();
        }
    };


    /* ========================================================================
        LÓGICA DE CHAT Y PUSHER/REVERB
        ======================================================================== */

    const chatMessages = document.getElementById("chat-messages") as HTMLDivElement;
    const chatInput = document.getElementById("chat-input") as HTMLInputElement;
    const sendButton = document.getElementById("send-button") as HTMLButtonElement;

    // === Parámetros conexión ===
    const wsHost = import.meta.env.VITE_REVERB_HOST ?? window.location.hostname;
    const wsPort = Number(import.meta.env.VITE_REVERB_PORT ?? 9090);
    const apiHost = "localhost";
    const apiPort = 8000;

    // === Pusher / Reverb ===
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
                Authorization: `Bearer ${token}`, // Token de autenticación para Reverb
            },
        },
    });

    // === Canal del game ===
    const channel = pusher.subscribe(`game.${gameId}`);

    // === Escuchar jugadores unidos ===
    channel.bind("player.joined", (event: PlayerJoinedEvent) => {
      

        //  Mostramos el mensaje en el chat
        const p = document.createElement("p");
        p.innerHTML = `<b>${event.user.nickname}</b> se ha unido a la partida`;
        p.classList.add("system-msg");
        if (chatMessages) {
             chatMessages.appendChild(p);
             chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Renderizamos el nuevo jugador en la casilla correspondiente
        const cells = Array.from(playersGrid.children) as HTMLElement[];
        const emptyIndex = cells.findIndex(cell => !cell.dataset.userId);

        if (emptyIndex !== -1) {
            renderPlayer(event.user, emptyIndex);
        } else {
            console.warn("No hay celdas vacías disponibles para el nuevo jugador.");
        }
    });

    channel.bind("game.started", () => {
        console.log("EVENTO RECIBIDO: la partida ha comenzado.")

        const overlay = document.getElementById("start-overlay") as HTMLDivElement;
        const countdownEl = document.getElementById("start-countdown") as HTMLDivElement;

        if(!overlay || !countdownEl) return

        overlay.classList.remove("hidden-overlay")
        overlay.classList.add("show-overlay")

        let counter = 5;

        countdownEl.textContent = counter.toString();

        const interval = setInterval(() => {
            counter--;

            countdownEl.style.animation = "none";
            countdownEl.offsetHeight
            countdownEl.style.animation = ""

            if(counter >= 0)
            {
                countdownEl.textContent = counter.toString()
            }

            if(counter < 0 )
            {
                clearInterval(interval)

                overlay.style.opacity = "0"
                setTimeout(() => {
                    overlay.style.display = "none"
                    console.log("Cuenta atrás finalizada, iniciando fase de asignación...")

                    //TODO: asignación de roles


                }, 500)
            }
        }, 1000)
    })

    // === Escuchar mensajes recibidos ===
    channel.bind("message.sent", (data: any) => {
      

        const p = document.createElement("p");

        if (data.from === nickname) {
            p.innerHTML = `<b>Tú:</b> ${data.message}`;
            p.classList.add("my-msg");
        } else {
            p.innerHTML = `<b>${data.from}:</b> ${data.message}`;
            p.classList.add("other-msg");
        }

        if (chatMessages) {
            chatMessages.appendChild(p);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
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
                body: JSON.stringify({
                    message: content,
                    game_id: Number(gameId),
                    from: nickname,
                }),
            });
            if (chatInput) chatInput.value = "";
        } catch (err) {
            console.error("Error al enviar mensaje:", err);
        }
    }


    /* ========================================================================
        CARGA INICIAL DE JUGADORES
        ======================================================================== */
    
    // carga inicial de datos
    try {
        
        const response = await getGame(gameId); 
        
        // Estado para rastrear si el usuario actual fue pintado
        let isCurrentUserRendered = false;

        // Limpiamos y restauramos las casillas
        Array.from(playersGrid.children).forEach((cell, index) => {
             cell.innerHTML = (index + 1).toString(); // Restauramos el número
             delete (cell as HTMLElement).dataset.userId; // Eliminamos el estado de ocupado
        });
        
        if ('error' in response) {
            console.error("Error cargando partida:", response.data.message);
            alert("No se pudo cargar la partida: " + (response.data.message || "Error desconocido"));
            return;
        }

        const game = response.data.game; 

        const ownerId = game.owner_id;

        const startBtn = document.getElementById("start-btn") as HTMLButtonElement

        if(myUser && myUser.id === ownerId)
        {
            startBtn.disabled = false

            startBtn.addEventListener("click", () => {
                if(startBtn.disabled) return

                startBtn.disabled = true

                fetch(`http://${apiHost}:${apiPort}/api/games/${gameId}/start`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    }
                })
                .then(()=> {
                    console.log("Partida iniciada. Enviando evento...")
                })
                .catch(err => {
                    console.error("Error al iniciar partida:", err)
                })
            })
        }
        else 
        {
            startBtn.disabled = true
        }
        
        // Pintamos a los jugadores
        if (game.players && Array.isArray(game.players)) {
            game.players.forEach((player: Player, index: number) => {
                
                renderPlayer(player, index); // Pintamos al jugador en la casilla correspondiente
                
                if (myUser && player.id === myUser.id) {
                    isCurrentUserRendered = true;
                }
            });
        }

    } catch (error) {
        console.error("Error crítico en initGameRoom:", error);
    }


    /* --- DESCRIPCIÓN DE ROLES (Resto del código de roles y modals) --- */
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
    
    // --- ELEMENTOS DEL MODAL ---
    const modal = document.getElementById("role-info-modal") as HTMLDivElement | null;
    const titleEl = document.getElementById("role-info-title") as HTMLElement | null;
    const textEl = document.getElementById("role-info-text") as HTMLElement | null;
    const imgEl = document.getElementById("role-modal-img") as HTMLImageElement | null;
    const closeModalBtn = document.querySelector(".close-role-info") as HTMLElement | null;

    // --- ABRIR MODAL ---
    function openRoleModal(roleKey: RoleKey): void {
        const entry = roleDescriptions[roleKey];
        if (!entry || !modal || !titleEl || !textEl || !imgEl) return;
        titleEl.textContent = entry.title;
        textEl.textContent = entry.text;
        imgEl.src = `/imagesUI/roles/${roleKey}.png`;
        imgEl.alt = entry.title;
        modal.style.display = "flex";
    }

    // --- CERRAR MODAL ---
    function closeRoleModal(): void {
        if (modal) modal.style.display = "none";
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeRoleModal);
    }

    if (modal) {
        modal.addEventListener("click", (e: MouseEvent) => {
            if ((e.target as HTMLElement).id === "role-info-modal") {
                closeRoleModal();
            }
        });
    }

    // --- HACER CADA ROLE CLICKEABLE ---
    const roleCards = document.querySelectorAll(".role");
    roleCards.forEach(role => {
        const el = role as HTMLElement;
        el.addEventListener("click", () => {
            const key = el.dataset.role as RoleKey;
            if (key) openRoleModal(key);
        });
    }
    );

    
  const exitButton = document.getElementById("exit-button") as HTMLButtonElement

  exitButton?.addEventListener("click", leaveGame);

  async function leaveGame() 
  {
    const token = localStorage.getItem("access_token")

    try 
    {
      const res = await fetch(`http://localhost:8000/api/games/${gameId}/leave`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      if((window as any).Echo)
      {
        (window as any).Echo.leave(`game.${gameId}`)
        console.log("Abandonado canal", `game.${gameId}`);
      }

      window.location.href = "/lobby.html"

    } catch (err)
    {
      console.error("Error al salir:", err)
    }
  }
}
