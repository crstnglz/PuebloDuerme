import { API_URL } from "../constantes";
import type { User } from "../types/user";
import type { PaginatedResponse } from "../types/paginatedResponse";
import type { BackendError } from "../types/backendError";
import type { BackendResponse } from "../types/backendResponse";
import type { UpdateUserBody } from "../types/updateUserBody";
import type { NewUser } from "../types/newUser";

/* ============================================================
   TOKEN
   ============================================================ */
const getToken = function(): string | null {
  return localStorage.getItem("access_token");
};

/* ============================================================
   ERROR DE CONEXIÓN
   ============================================================ */
const connectionError = function(): BackendResponse<any> {
  return {
    error: true,
    status: 0,
    data: {
      message: "Connection error",
      errors: { general: ["Connection error"] },
    },
  };
};

 /* ============================================================
   LISTAR USUARIOS (PAGINADOS)
   ============================================================ */
export async function getAllUsers(
  page: number = 1
): Promise<PaginatedResponse<User> | null> {
  try {
    const token = getToken();

    const res = await fetch(`${API_URL}/users?page=${page}&per_page=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    return (await res.json()) as PaginatedResponse<User>;
  } catch {
    return null;
  }
}

/* ============================================================
   BUSCAR USUARIO POR ID, NICKNAME O EMAIL
   ============================================================ */
export async function findUser(
  type: "id" | "email" | "nickname",
  query: string,
  page: number = 1
): Promise<PaginatedResponse<User> | null> {
  try {
    const token = getToken();

    const res = await fetch(
      `${API_URL}/users/find?type=${type}&query=${query}&page=${page}&per_page=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return null;

    return (await res.json()) as PaginatedResponse<User>;
  } catch {
    return null;
  }
}

/* ============================================================
   CREAR USUARIO
   ============================================================ */
export async function createUser(
  data: NewUser
): Promise<BackendResponse<User>> {
  try {
    const token = getToken();

    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        data: json as BackendError,
      };
    }

    return json as User;
  } catch {
    return connectionError();
  }
}
