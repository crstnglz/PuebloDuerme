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
