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
        modal.classList.remove("show");
    });
}


//Preview Imagen Local
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

//Cargar Perfil
export async function loadProfile() {
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

    // Cambiar el texto del label
    const nicknameLabel = document.getElementById("profileNicknameLabel");
    if (nicknameLabel) {
        nicknameLabel.textContent = user.nickname;
    }

    // Imagen
    const avatarImg = document.getElementById("avatarPreview") as HTMLImageElement;
    if (avatarImg) {
        avatarImg.src = user.profile_photo || "/imagesUI/predprofile.png";
    }
}

//Habilitar botón de "Guardar cambios"
export function enableSaveOnChanges()
{
    const nicknameInput = document.getElementById("profileNickname") as HTMLInputElement;
    const descriptionInput = document.getElementById("profileDescription") as HTMLTextAreaElement;
    const avatarInput = document.getElementById("avatarInput") as HTMLInputElement;
    const saveBtn = document.getElementById("saveProfileBtn") as HTMLButtonElement;

    function enableButton()
    {
        saveBtn.disabled = false;
        saveBtn.classList.remove("disabled");
        saveBtn.classList.add("enabled");
    }

    nicknameInput.addEventListener("input", enableButton);
    descriptionInput.addEventListener("input", enableButton);
    avatarInput.addEventListener("change", enableButton);
}

//Subir Perfil (Nickname + Desc + Cloudinary -si hay imagen-)
export function saveProfile()
{
    const nickname = document.getElementById("profileNickname") as HTMLInputElement;
    const description = document.getElementById("profileDescription") as HTMLTextAreaElement;
    const avatar = document.getElementById("avatarInput") as HTMLInputElement;
    const saveBtn = document.getElementById("saveProfileBtn") as HTMLButtonElement;

    saveBtn.addEventListener("click", async() => {
        const token = localStorage.getItem("access_token")
        if(!token) return

        let profilePhotoUrl = null;

        //Si cambia la foto -> subir a cloudinary
        if(avatar.files && avatar.files[0])
        {
            const formImage = new FormData();
            formImage.append("image", avatar.files[0])

            const uploadRes = await fetch("http://127.0.0.1:8000/api/profile/uploadImage", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formImage
            });

            const uploadData = await uploadRes.json();

            if(!uploadRes.ok)
            {
                alert("Error subiendo imagen");
                return;
            }

            profilePhotoUrl = uploadData.url;
        }

        //Enviar datos 
        const formData = new FormData();
        formData.append("nickname", nickname.value)
        formData.append("description", description.value)

        if(profilePhotoUrl)
        {
            formData.append("profile_photo", profilePhotoUrl)
        }

        const res = await fetch("http://127.0.0.1:8000/api/profile/update", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        })

        if(res.ok)
        {
            alert("Perfil actualizado")
            saveBtn.disabled = true
            saveBtn.classList.add("disabled")
        }
        else
        {
            alert("Error al guardar cambios")
        }
    })
}