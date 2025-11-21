import {
    getAllUsers,
    findUser,
    updateUser,
    deleteUser,
    createUser
} from "../providers/users.provider";

import type { User } from "../types/user";
import type { PaginatedResponse } from "../types/paginatedResponse";
import type { NewUser } from "../types/newUser";
import type { UpdateUserBody } from "../types/updateUserBody";


export function initAdmin() {

    /* --- Elementos del DOM --- */

    const searchType = document.getElementById("search-type") as HTMLSelectElement;
    const searchInput = document.getElementById("search-user") as HTMLInputElement;
    const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;

    const usersBody = document.getElementById("users-body") as HTMLTableSectionElement;
    const addUserBtn = document.getElementById("add-user-btn") as HTMLButtonElement;

    const paginationContainer = document.getElementById("pagination") as HTMLDivElement;

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

    let editingId: number | null = null;
    let currentPage = 1;

    let currentSearchType: "id" | "email" | "nickname" | null = null;
    let currentSearchValue: string | null = null;

    /* --- Modal de eliminar usuario --- */

    let deleteModal: HTMLDivElement | null = null;
    let deleteConfirmBtn: HTMLButtonElement | null = null;
    let deleteCancelBtn: HTMLButtonElement | null = null;

    function createDeleteModal(): void {
        deleteModal = document.createElement("div");
        deleteModal.id = "delete-modal";
        deleteModal.className = "delete-modal-overlay";

        deleteModal.innerHTML = `
            <div class="delete-modal">
                <h2>¿Eliminar Usuario?</h2>
                <p>Esta acción no se puede deshacer.</p>

                <div class="delete-modal-buttons">
                    <button id="confirm-delete" class="btn-delete">Eliminar</button>
                    <button id="cancel-delete" class="btn-cancel">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(deleteModal);

        deleteConfirmBtn = document.getElementById("confirm-delete") as HTMLButtonElement;
        deleteCancelBtn = document.getElementById("cancel-delete") as HTMLButtonElement;

        deleteCancelBtn.addEventListener("click", () => closeDeleteModal());
    }

    function openDeleteModal(callback: () => void): void {
        if (!deleteModal) createDeleteModal();

        deleteModal!.style.display = "flex";

        const newConfirm = deleteConfirmBtn!.cloneNode(true) as HTMLButtonElement;
        deleteConfirmBtn!.replaceWith(newConfirm);
        deleteConfirmBtn = newConfirm;

        deleteConfirmBtn!.addEventListener("click", () => {
            callback();
            closeDeleteModal();
        });
    }

    function closeDeleteModal(): void {
        if (deleteModal) deleteModal.style.display = "none";
    }

    /* --- Normalizar paginación --- */

    function normalizeResponse(
        raw: PaginatedResponse<User> | null
    ): PaginatedResponse<User> {

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

    /* --- Render usuarios --- */

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

        attachRowEvents();
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

    /* --- Eventos editar y eliminar --- */

    function attachRowEvents(): void {

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", async () => {

                const id = Number((btn as HTMLElement).dataset.id);

                const result = await findUser("id", String(id), 1);
                const normalized = normalizeResponse(result);

                const user = normalized.data[0];
                if (!user) return alert("Usuario no encontrado.");

                openModal(user);
            });
        });

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = Number((btn as HTMLElement).dataset.id);

                openDeleteModal(async () => {
                    await deleteUser(id);
                    loadUsers();
                });
            });
        });
    }

    /* --- Modal --- */

    function limpiarModal(): void {
        modalMessage.textContent = "";
        modalMessage.className = "";

        modalUsername.value = "";
        modalEmail.value = "";
        modalRole.value = "user";
        modalPassword.value = "";
        modalPasswordConfirm.value = "";
    }

    function openModal(user: User | null = null): void {

        limpiarModal();

        if (user) {
            editingId = user.id;
            modalTitle.textContent = "Editar Usuario";
            saveUserBtn.textContent = "Guardar";

            modalUsername.value = user.nickname;
            modalEmail.value = user.email;
            modalRole.value = user.rol;

        } else {
            editingId = null;
            modalTitle.textContent = "Crear Usuario";
            saveUserBtn.textContent = "Añadir";
        }

        modal.style.display = "flex";
    }

    function closeModal(): void {
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

        modalUsername.classList.remove("input-error");
        modalEmail.classList.remove("input-error");
        modalPassword.classList.remove("input-error");
        modalPasswordConfirm.classList.remove("input-error");

        const nickname = modalUsername.value.trim();
        const email = modalEmail.value.trim();
        const role = modalRole.value as "admin" | "user";
        const password = modalPassword.value;
        const passwordConfirm = modalPasswordConfirm.value;

        const nicknameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!nicknameRegex.test(nickname)) {
            modalUsername.classList.add("input-error");
            modalMessage.textContent = "Formato de nickname incorrecto.";
            modalMessage.classList.add("error-message");
            return;
        }

        /* --- CREAR USUARIO --- */
        if (!editingId) {

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
        }

        /* --- EDITAR USUARIO --- */
        else {

            const body: UpdateUserBody = {
                nickname,
                email,
                rol: role
            };

            if (password && passwordConfirm) {
                body.password = password;
                body.password_confirmation = passwordConfirm;
            }

            const res = await updateUser(editingId, body);

            if ("error" in res && res.error) {
                const err = res.data.errors!;
                const firstKey = Object.keys(err)[0];
                modalMessage.textContent = err[firstKey][0];
                modalMessage.classList.add("error-message");
                return;
            }

            modalMessage.textContent = "Usuario editado con éxito.";
            modalMessage.classList.add("success-message");
        }

        setTimeout(() => {
            loadUsers();
            limpiarModal();
        }, 3000);
    });

    /* --- Botón crear --- */

    addUserBtn.addEventListener("click", () => openModal());

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

        currentPage = 1;
        loadUsers();
    });

    /* --- Carga inicial --- */

    loadUsers();
}
