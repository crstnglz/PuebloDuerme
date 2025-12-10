import { API_URL } from "../constantes";
import type { BackendResponse } from "../types/backendResponse";
import type { BackendError } from "../types/backendError";

const getToken = function(): string | null {
  return localStorage.getItem("access_token");
};

const connectionError = function(): BackendResponse<never> {
  return {
    error: true,
    status: 0,
    data: {
      message: "Error de conexión",
      errors: { general: ["No se pudo conectar con el servidor"] },
    },
  };
};

export async function fillBots(
  gameId: number | string,
  count?: number
): Promise<BackendResponse<any>> {
  try {
    const token = getToken();

    if (!token) {
      return {
        error: true,
        status: 401,
        data: { message: "Debe iniciar sesión.", errors: { general: ["No hay token"] } },
      };
    }

    const body = typeof count === "number" ? JSON.stringify({ count }) : undefined;

    const res = await fetch(`${API_URL}/games/${gameId}/bots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body,
    });

    let json: any;
    try {
      json = await res.json();
    } catch {
     
      if (!res.ok) return connectionError();
      return { error: false, status: res.status, data: { message: "OK" } } as any;
    }

    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        data: json as BackendError,
      };
    }

    return json as BackendResponse<any>;
  } catch {
    return connectionError();
  }
}

export async function botSpeak(
  gameId: number | string
): Promise<BackendResponse<any>> {
  try {
    const token = getToken();
    if (!token) {
      return {
        error: true,
        status: 401,
        data: { message: "Debe iniciar sesión.", errors: { general: ["No hay token"] } },
      };
    }

    const res = await fetch(`${API_URL}/games/${gameId}/bots/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    let json: any;
    try {
      json = await res.json();
    } catch {
      if (!res.ok) return connectionError();
      return { error: false, status: res.status, data: { message: "OK" } } as any;
    }

    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        data: json as BackendError,
      };
    }

    return json as BackendResponse<any>;
  } catch {
    return connectionError();
  }
}

export async function botSpeakWolves(
  gameId: number | string
): Promise<BackendResponse<any>> {
  try {
    const token = getToken();
    if (!token) {
      return {
        error: true,
        status: 401,
        data: { message: "Debe iniciar sesión.", errors: { general: ["No hay token"] } },
      };
    }

    const res = await fetch(`${API_URL}/games/${gameId}/bots/speak-wolves`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    let json: any;
    try {
      json = await res.json();
    } catch {
      if (!res.ok) return connectionError();
      return { error: false, status: res.status, data: { message: "OK" } } as any;
    }

    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        data: json as BackendError,
      };
    }

    return json as BackendResponse<any>;
  } catch {
    return connectionError();
  }
}
