import type { RoleInfo, RoleKey } from "../types/roleInfo";

export function initGameRoom() {

    /* --- DESCRIPCIÓN DE ROLES --- */
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


    /* --- ELEMENTOS DEL MODAL --- */
    const modal = document.getElementById("role-info-modal") as HTMLDivElement | null;
    const titleEl = document.getElementById("role-info-title") as HTMLElement | null;
    const textEl = document.getElementById("role-info-text") as HTMLElement | null;
    const imgEl = document.getElementById("role-modal-img") as HTMLImageElement | null;
    const closeModalBtn = document.querySelector(".close-role-info") as HTMLElement | null;

    /* --- ABRIR MODAL --- */
    function openRoleModal(roleKey: RoleKey): void {
        const entry = roleDescriptions[roleKey];
        if (!entry || !modal || !titleEl || !textEl || !imgEl) return;

        titleEl.textContent = entry.title;
        textEl.textContent = entry.text;
        imgEl.src = `/imagesUI/roles/${roleKey}.png`;
        imgEl.alt = entry.title;
        modal.style.display = "flex";
    }

    /* --- CERRAR MODAL --- */
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

    /* --- HACER CADA ROLE CLICKEABLE --- */
    const roleCards = document.querySelectorAll(".role");
    roleCards.forEach(role => {
        const el = role as HTMLElement;
        el.addEventListener("click", () => {
            const key = el.dataset.role as RoleKey;
            if (key) openRoleModal(key);
        });
    });

    /* --- CHAT BÁSICO --- */
    const sendBtn = document.getElementById("send-button") as HTMLButtonElement | null;
    const chatInput = document.getElementById("chat-input") as HTMLInputElement | null;
    const chatMessages = document.getElementById("chat-messages") as HTMLDivElement | null;

    if (sendBtn && chatInput && chatMessages) {
        sendBtn.addEventListener("click", () => {
            const text = chatInput.value.trim();
            if (!text) return;

            const msg = document.createElement("div");
            msg.className = "message-own";
            msg.innerHTML = `<strong>Tú:</strong> ${text}`;
            chatMessages.appendChild(msg);

            chatInput.value = "";
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

}
