// URL de la API en Laravel
const API_URL = "http://127.0.0.1:8000/api";

// LOGIN INDEPENDIENTE
export async function loginUser(formData: any) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            identifier: formData.identifier,
            password: formData.password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}

// REGISTER + LOGIN AUTOMÁTICO
export async function registerUser(formData: any) {

    // REGISTER
    const registerResponse = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json' // Le decimos a Laravel que queremos JSON
        },
        // Convertimos el objeto JS a un string JSON para el body
        body: JSON.stringify(formData)
    });

    // Obtenemos la respuesta de la API como JSON
    const registerData = await registerResponse.json();

    // Si la respuesta no es existosa, lanza un error
    if (!registerResponse.ok) {
        throw registerData;
    }

    // LOGIN AUTOMÁTICO
    const loginData = await loginUser({
        identifier: formData.email,
        password: formData.password
    });

    // Si todo fue bien, devuelve los datos
    return {
        message: "Registro y login exitosos",
        data: {
            token: loginData.data.token,
            id: loginData.data.id,
            nickname: loginData.data.nickname,
            rol: loginData.data.rol,
            abilities: loginData.data.abilities,
            profile_photo: loginData.data.profile_photo
        }
    };
}