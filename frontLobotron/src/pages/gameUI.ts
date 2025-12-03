import Pusher from "pusher-js";
Pusher.logToConsole=true;

export function initGameUI() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");

  let nickname = "Jugador";
  const raw = localStorage.getItem("user");

  if (raw) {
    try {
      nickname = JSON.parse(raw).nickname ?? nickname;
    } catch {}

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
        },
      },
    });

    // === Canal del game ===
    const channel = pusher.subscribe(`game.${gameId}`);

    // === Escuchar mensajes recibidos ===
    channel.bind("message.sent", (data: any) => {
      console.log("Mensaje recibido:", data);

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

    // === Botones para enviar ===
    sendButton.addEventListener("click", sendMsg);
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMsg();
    });

    // === Enviar mensaje ===
    async function sendMsg() {
      const content = chatInput.value.trim();
      if (!content) return;

      const token = localStorage.getItem("access_token");

      if (!token) {
        alert("Debes iniciar sesión.");
        return;
      }

      try {
        const res = await fetch(`http://${apiHost}:${apiPort}/api/chat/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: content,
            game_id: Number(gameId),
            from: nickname,
          }),
        });

        const json = await res.json();
        console.log("Respuesta del servidor:", json);

        chatInput.value = "";
      } catch (err) {
        console.error("Error al enviar mensaje:", err);
      }
    }
  }

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
