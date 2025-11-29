import { getGame } from "../providers/game.provider"; 
import type { RoleInfo, RoleKey } from "../types/roleInfo";
import type { User } from "../types/user";
import type { Player } from "../types/player"; 


interface PlayerJoinedEvent {
    user: User;
    gameId: number;
}

export async function initGameRoom(gameId: number) {

    /* ========================================================================
        LÓGICA DE JUEGO Y CONEXIÓN (BACKEND)
       ======================================================================== */
    
    const playersGrid = document.getElementById("players-grid") as HTMLDivElement;
    
        // Función para renderizar un jugador en la cuadrícula
    const renderPlayer = (data: Player | User, index: number) => {
        if (!playersGrid) return;
        const cells = playersGrid.children;
        
        if (index < cells.length) {
            const cell = cells[index] as HTMLElement;
        
            cell.innerHTML = ''; 
            
            // Cpntenido avatar
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

    // carga inicial de datos
    try {
        console.log(`Cargando partida ${gameId}...`);
        
        const response = await getGame(gameId);

        if ('error' in response) {
            console.error("Error cargando partida:", response.data.message);
            alert("No se pudo cargar la partida: " + (response.data.message || "Error desconocido"));
            return;
        }

        const game = response.data.game; 
        
        // pintamos a los jugadores
        if (game.players && Array.isArray(game.players)) {
            game.players.forEach((player: Player, index: number) => {
                renderPlayer(player, index);
            });
        }

    } catch (error) {
        console.error("Error crítico en initGameRoom:", error);
    }

    // websockets
    if (window.Echo) {
        console.log(`Suscribiéndose al canal games.${gameId}...`);
        
        window.Echo.private(`games.${gameId}`)
            .listen('.player.joined', (e: unknown) => {
                const eventData = e as PlayerJoinedEvent;
                console.log("⚡ Nuevo jugador:", eventData.user.nickname);
                
                const cells = Array.from(playersGrid.children) as HTMLElement[];
                const emptyIndex = cells.findIndex(cell => !cell.dataset.userId);

                if (emptyIndex !== -1) {
                    renderPlayer(eventData.user, emptyIndex);
                }
            });
    } else {
        console.warn("Laravel Echo no está disponible. El tiempo real no funcionará.");
    }


    /* ========================================================================
    Interfaz gráfica y descripción de los roles
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

    // elementos del modal
    const modal = document.getElementById("role-info-modal") as HTMLDivElement | null;
    const titleEl = document.getElementById("role-info-title") as HTMLElement | null;
    const textEl = document.getElementById("role-info-text") as HTMLElement | null;
    const imgEl = document.getElementById("role-modal-img") as HTMLImageElement | null;
    const closeModalBtn = document.querySelector(".close-role-info") as HTMLElement | null;

    // abrir modal
    function openRoleModal(roleKey: RoleKey): void {
        const entry = roleDescriptions[roleKey];
        if (!entry || !modal || !titleEl || !textEl || !imgEl) return;

        titleEl.textContent = entry.title;
        textEl.textContent = entry.text;
        imgEl.src = `/imagesUI/roles/${roleKey}.png`;
        imgEl.alt = entry.title;
        modal.style.display = "flex";
    }

    // cerrar modal
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

    // hacer cada role clickeable
    const roleCards = document.querySelectorAll(".role");
    roleCards.forEach(role => {
        const el = role as HTMLElement;
        el.addEventListener("click", () => {
            const key = el.dataset.role as RoleKey;
            if (key) openRoleModal(key);
        });
    });

}