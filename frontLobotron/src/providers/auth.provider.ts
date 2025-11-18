// URL de la api en Laravel
const API_URL = "http://127.0.0.1:8000/api";

/**
 * Envía los datos de registro a la API.
 * @param formData Los datos del formulario (nickname, email, etc.)
 */
export async function registerUser(formData: any) {

    // Realiza la petición POST con fetch
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json' // Le decimos a Laravel que queremos JSON
        },
        // Convertimos el objeto JS a un string JSON para el body
        body: JSON.stringify(formData)
    });

    // Obtenemos la respuesta de la API como JSON
    const data = await response.json();

    // Si la respuesta no es existosa, lanza un error
    if (!response.ok) {
        // Pasamos los 'data' (que contendrán los errores de validación)
        // al 'catch'
        throw data;
    }

    // Si todo fue bien, devuelve los datos
    return data;
}

/**
*  Envía los datos de login a la API.
* @param formData Los datos del formulario (identifier, password)
*/
export async function loginUser(formData: any) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data; 
}