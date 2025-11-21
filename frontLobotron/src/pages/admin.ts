import {
    getAllUsers,
    findUser
} from "../providers/users.provider";

import type { User } from "../types/user";
import type { PaginatedResponse } from "../types/paginatedResponse";

export function initAdmin() {
    /* --- Elementos del DOM --- */
    const searchType = document.getElementById("search-type") as HTMLSelectElement;
    const searchInput = document.getElementById("search-user") as HTMLInputElement;
    const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;

    const usersBody = document.getElementById("users-body") as HTMLTableSectionElement;
    const paginationContainer = document.getElementById("pagination") as HTMLDivElement;

    let currentPage = 1;

    // Variables para el buscador
    let currentSearchType: "id" | "email" | "nickname" | null = null;
    let currentSearchValue: string | null = null;

    /* --- Buscar usuarios --- */
    searchBtn.addEventListener("click", () => {
        const txt = searchInput.value.trim();

        if (txt === "") {
            currentSearchType = null;
            currentSearchValue = null;
        } else {
            currentSearchType = searchType.value as "id" | "email" | "nickname";
            currentSearchValue = txt;
        }

        currentPage = 1; // Reseteamos la página a la primera al realizar una nueva búsqueda
        loadUsers();
    });

    /* --- Cargar usuarios --- */
    async function loadUsers(): Promise<void> {
        let raw: PaginatedResponse<User> | null;

        // Si hay valores en el buscador, usamos `findUser()`, si no, `getAllUsers()`
        if (currentSearchType && currentSearchValue) {
            raw = await findUser(currentSearchType, currentSearchValue, currentPage);
        } else {
            raw = await getAllUsers(currentPage);
        }

        const data = normalizeResponse(raw);

        if (data.data.length === 0) {
            usersBody.innerHTML = "<tr><td colspan='5'>Sin resultados</td></tr>";
            renderPagination(1, 1);
            return;
        }

        renderUsers(data.data);
        renderPagination(data.current_page, data.last_page);
    }

    /* --- Normalizar respuesta --- */
    function normalizeResponse(raw: PaginatedResponse<User> | null): PaginatedResponse<User> {
        if (!raw) {
            return {
                data: [],
                current_page: 1,
                last_page: 1,
                total: 0
            };
        }
        return raw;
    }

    /* --- Renderizar usuarios --- */
    function renderUsers(users: User[]): void {
        usersBody.innerHTML = "";

        users.forEach((user: User) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nickname}</td>
                <td>${user.email}</td>
                <td>${user.rol}</td>
                <td>
                    <button class="edit-btn" data-id="${user.id}">Editar</button>
                    <button class="delete-btn" data-id="${user.id}">Eliminar</button>
                </td>
            `;
            usersBody.appendChild(tr);
        });

        
    }

    /* --- Paginación --- */
    function renderPagination(page: number, lastPage: number): void {
        paginationContainer.innerHTML = "";

        const btnPrev = document.createElement("button");
        btnPrev.classList.add("page-btn");
        btnPrev.textContent = "Anterior";
        btnPrev.disabled = page === 1;

        btnPrev.addEventListener("click", () => {
            currentPage--;
            loadUsers();
        });

        const btnNext = document.createElement("button");
        btnNext.classList.add("page-btn");
        btnNext.textContent = "Siguiente";
        btnNext.disabled = page === lastPage;

        btnNext.addEventListener("click", () => {
            currentPage++;
            loadUsers();
        });

        const info = document.createElement("span");
        info.id = "page-info";
        info.textContent = `Página ${page} de ${lastPage}`;

        paginationContainer.append(btnPrev, info, btnNext);
    }

    
    /* --- Carga inicial --- */
    loadUsers();
}
