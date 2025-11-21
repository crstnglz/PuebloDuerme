import {
    getAllUsers,
    findUser,
    createUser
} from "../providers/users.provider";

import type { User } from "../types/user";
import type { PaginatedResponse } from "../types/paginatedResponse";
import type { NewUser } from "../types/newUser";

export function initAdmin() {
    /* --- Elementos del DOM --- */
    const searchType = document.getElementById("search-type") as HTMLSelectElement;
    const searchInput = document.getElementById("search-user") as HTMLInputElement;
    const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;

    const usersBody = document.getElementById("users-body") as HTMLTableSectionElement;
    const paginationContainer = document.getElementById("pagination") as HTMLDivElement;
    const addUserBtn = document.getElementById("add-user-btn") as HTMLButtonElement;

    const modal = document.getElementById("admin-modal") as HTMLDivElement;
    const closeModalBtn = document.querySelector(".close") as HTMLElement;

    const modalTitle = document.querySelector(".modal-title") as HTMLElement;
    const modalUsername = document.getElementById("modal-username") as HTMLInputElement;
    const modalEmail = document.getElementById("modal-email") as HTMLInputElement;
    const modalRole = document.getElementById("modal-role") as HTMLSelectElement;

    const modalPassword = document.getElementById("modal-password") as HTMLInputElement;
    const modalPasswordConfirm = document.getElementById("modal-password-confirm") as HTMLInputElement;

    const saveUserBtn = document.getElementById("save-user-btn") as HTMLButtonElement;
    const modalMessage = document.getElementById("modal-message") as HTMLParagraphElement;

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

    /* --- Modal de creación de usuario --- */
    const limpiarModal = function(): void {
        modalMessage.textContent = "";
        modalMessage.className = "";

        modalUsername.value = "";
        modalEmail.value = "";
        modalRole.value = "user";
        modalPassword.value = "";
        modalPasswordConfirm.value = "";
    }

    const openModal = function(): void {
        limpiarModal();
        modalTitle.textContent = "Crear Usuario";
        saveUserBtn.textContent = "Añadir";
        modal.style.display = "flex";
    }

    const closeModal = function(): void {
        modal.style.display = "none";
    }

    closeModalBtn.addEventListener("click", closeModal);
    window.addEventListener("click", (e: MouseEvent) => {
        if (e.target === modal) closeModal();
    });

    /* --- Guardar usuario --- */
    saveUserBtn.addEventListener("click", async () => {
        modalMessage.textContent = "";
        modalMessage.className = "";

        const nickname = modalUsername.value.trim();
        const email = modalEmail.value.trim();
        const role = modalRole.value as "admin" | "user";
        const password = modalPassword.value;
        const passwordConfirm = modalPasswordConfirm.value;

        // Validación del formato del nickname
        const nicknameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!nicknameRegex.test(nickname)) {
            modalUsername.classList.add("input-error");
            modalMessage.textContent = "Formato de nickname incorrecto.";
            modalMessage.classList.add("error-message");
            return;
        }

        // Verificación de contraseñas
        if (!password || !passwordConfirm) {
            modalPassword.classList.add("input-error");
            modalPasswordConfirm.classList.add("input-error");
            modalMessage.textContent = "Contraseña obligatoria.";
            modalMessage.classList.add("error-message");
            return;
        }

        const body: NewUser = {
            nickname,
            email,
            rol: role,
            password,
            password_confirmation: passwordConfirm
        };

        // Llamada para crear el usuario
        const res = await createUser(body);

        if ("error" in res && res.error) {
            const err = res.data.errors!;
            const firstKey = Object.keys(err)[0];
            modalMessage.textContent = err[firstKey][0];
            modalMessage.classList.add("error-message");
            return;
        }

        modalMessage.textContent = "Usuario creado con éxito.";
        modalMessage.classList.add("success-message");

        setTimeout(() => {
            loadUsers(); // Recargar la lista de usuarios
            limpiarModal();
        }, 3000);
    });

    /* --- Cargar usuarios --- */
    async function loadUsers(): Promise<void> {
        let raw: PaginatedResponse<User> | null;

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
    const  normalizeResponse = function(raw: PaginatedResponse<User> | null): PaginatedResponse<User> {
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
    const renderUsers = function(users: User[]): void {
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
    const renderPagination = function(page: number, lastPage: number): void {
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

    /* --- Botón crear usuario --- */
    addUserBtn.addEventListener("click", () => openModal());
}
