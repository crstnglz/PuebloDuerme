import { API_URL } from "../constantes";
import type { BackendError } from "../types/backendError";
import type { BackendResponse } from "../types/backendResponse";
import type { GameInterface } from "../types/gameInterface";
import type { JoinResponse } from "../types/joinResponse"; 


/* ============================================================
   HELPERS
   ============================================================ */
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

/* ============================================================
   OBTENER LISTA DE PARTIDAS (Lobby)
   ============================================================ */
export async function getGames(): Promise<BackendResponse<{ success: boolean, data: { games: GameInterface[] } }>> {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/games`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (!res.ok) {
        return {
            error: true,
            status: res.status,
            data: json as BackendError
        };
    }
    
    return json; 
  } catch {
    return connectionError();
  }
}

/* ============================================================
   OBTENER UNA PARTIDA POR ID (Sala)
   ============================================================ */

export async function getGame(id: number | string): Promise<BackendResponse<{ success: boolean, data: { game: GameInterface } }>> {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/games/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();

    if (!res.ok) {
        return {
            error: true,
            status: res.status,
            data: json as BackendError
        };
    }

    return json;
  } catch {
    return connectionError();
  }
}

/* ============================================================
    CREAR UNA PARTIDA NUEVA
   ============================================================ */

export async function createGame(name: string): Promise<BackendResponse<{ success: boolean, data: { game: GameInterface } }>> {
  try {
    const token = getToken();
    
    if (!token) {
      return {
        error: true,
        status: 401,
        data: { message: "Debe iniciar sesión.", errors: { general: ["No hay token"] } },
      };
    }
    
    const res = await fetch(`${API_URL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        data: json as BackendError,
      };
    }

    return json;
  } catch {
    return connectionError();
  }
}

/* ============================================================
   UNIRSE A UNA PARTIDA (JOIN)
   ============================================================ */
export async function joinGame(id: number | string): Promise<BackendResponse<{ success: boolean, data: JoinResponse }>> {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/games/${id}/join`, {
      method: "POST", 
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        data: json as BackendError,
      };
    }

    return json;
  } catch {
    return connectionError();
  }

}

  /* ============================================================
   EDITAR PARTIDA (PUT)
   ============================================================ */
export async function editGame(id: number | string, name: string): Promise<BackendResponse<{ success: boolean, data: { game: GameInterface } }>> {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/games/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        data: json as BackendError,
      };
    }

    return json;
  } catch {
    return connectionError();
  }
}


/* ============================================================
   ELIMINAR PARTIDA (DELETE)
   ============================================================ */
export async function deleteGame(id: number | string): Promise<BackendResponse<{ message: string }>> {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/games/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 204 || res.ok) {
      const json = res.status === 204 ? { message: "Partida eliminada con éxito" } : await res.json();
      return json as { message: string };
    }

    const json = await res.json();
    return {
      error: true,
      status: res.status,
      data: json as BackendError,
    };

  } catch {
    return connectionError();
  }
}