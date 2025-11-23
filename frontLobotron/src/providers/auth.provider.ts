// URL de la API en Laravel
import { API_URL } from "../constantes";

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

    // Normalizamos la salida para que siempre tenga el mismo formato
    return data; 
    };


// REGISTER + LOGIN AUTOMÁTICO
export async function registerUser(formData: any) {

    // REGISTER (Incluye login automático)
    const registerResponse = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    const registerData = await registerResponse.json();

    if (!registerResponse.ok) {
        throw registerData;
    }

    return registerData;
}

// LOGOUT
export async function logoutUser(): Promise<void> {
    const token = localStorage.getItem('access_token');

    if (!token) {
        return; // Ya está desconectado
    }

    await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    // Limpieza local
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
}
