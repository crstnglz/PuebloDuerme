export function modalProfile()
{
    const modal = document.getElementById("profileModal")!;
    const openBtn = document.getElementById("openProfileModal")!;
    const closeBtn = document.getElementById("closeProfileModal")!;

    openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.add("show");

        loadProfile();
        showImage();
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });
}

export function showImage() {
    const input = document.getElementById("avatarInput") as HTMLInputElement | null;
    const preview = document.getElementById("avatarPreview") as HTMLImageElement | null;

    if (!input || !preview) {
        console.warn("avatarInput o avatarPreview no encontrados");
        return;
    }

    input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Debe ser una imagen");
            return;
        }

        const imageURL = URL.createObjectURL(file);
        preview.src = imageURL;

        preview.onload = () => URL.revokeObjectURL(imageURL);
    });
}

export async function loadProfile(){
    const token = localStorage.getItem("access_token");

    const res = await fetch("http://127.0.0.1:8000/api/me", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if(!res.ok){
        console.error("No se pudo cargar el perfil");
        return;
    }

    const user = await res.json();

    const nicknameLabel = document.getElementById("profileNicknameLabel");
    if(nicknameLabel){
        nicknameLabel.textContent = user.nickname;
    }

    const avatarImg = document.getElementById("avatarPreview") as HTMLImageElement;
    if(avatarImg){
        avatarImg.src = user.profile_photo ?? "/imagesUI/predprofile.png";
    }
}