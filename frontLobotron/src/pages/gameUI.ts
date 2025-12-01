import "./echo"; 

console.log("Game.ts cargado");

const params = new URLSearchParams(window.location.search);
const gameId = params.get("game");

if (!gameId) {
  console.error("Falta el parámetro ?game= en la URL");
}

let nickname = "Jugador";
const userRaw = localStorage.getItem("user");

if (userRaw) {
  try {
    const user = JSON.parse(userRaw);
    nickname = user.nickname ?? nickname;
  } catch {}
}

const chatMessages = document.getElementById("chat-messages") as HTMLDivElement;
const chatInput = document.getElementById("chat-input") as HTMLInputElement;
const sendButton = document.getElementById("send-button") as HTMLButtonElement;

//Suscripción Canal Websocket
(window as any).Echo.channel(`game.${gameId}`)
  .listen(".message.sent", (data: any) => {
    console.log("Mensaje recibido:", data);

    const msg = document.createElement("p");

    if (data.from === nickname) {
      msg.classList.add("my-msg");
      msg.innerHTML = `<b>Tú:</b> ${data.message}`;
    } else {
      msg.classList.add("other-msg");
      msg.innerHTML = `<b>${data.from}:</b> ${data.message}`;
    }

    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

//Enviar mensaje por API
sendButton?.addEventListener("click", sendMsg);
chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMsg();
});

async function sendMsg() {
  const text = chatInput.value.trim();
  if (!text) return;

  const token = localStorage.getItem("access_token");

  if (!token) {
    alert("Debes iniciar sesión.");
    return;
  }

  try {
    await fetch("http://localhost:8000/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: text,
        game_id: Number(gameId),
        from: nickname
      }),
    });

    chatInput.value = "";
  } catch (err) {
    console.error("Error al enviar mensaje:", err);
  }
}
