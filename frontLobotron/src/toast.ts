export function showToast(message: string, type: "warning" | "info" | "success" | "error" = "info")
{
    const container = document.getElementById("toastContainer")
    if(!container) return

    const toast = document.createElement("div");
    toast.className = `toast ${type}`

    toast.innerHTML = `
        <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast)

    setTimeout(() => {
        toast.classList.add("fadeOut")
        toast.addEventListener("animationend", () => toast.remove())
    })
}