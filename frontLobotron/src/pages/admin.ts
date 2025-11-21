import { getAllUsers } from "../providers/users.provider";
import type { User } from "../types/user";
import type { PaginatedResponse } from "../types/paginatedResponse";

export function initAdmin() {

    const usersBody = document.getElementById("users-body") as HTMLTableSectionElement;
    const paginationContainer = document.getElementById("pagination") as HTMLDivElement;

    let currentPage = 1;

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

    function renderPagination(page: number, lastPage: number): void {
        paginationContainer.innerHTML = "";

        const btnPrev = document.createElement("button");
        btnPrev.textContent = "Anterior";
        btnPrev.disabled = page === 1;
        btnPrev.addEventListener("click", () => {
            currentPage--;
            loadUsers();
        });

        const btnNext = document.createElement("button");
        btnNext.textContent = "Siguiente";
        btnNext.disabled = page === lastPage;
        btnNext.addEventListener("click", () => {
            currentPage++;
            loadUsers();
        });

        const info = document.createElement("span");
        info.textContent = `Página ${page} de ${lastPage}`;

        paginationContainer.append(btnPrev, info, btnNext);
    }

    async function loadUsers(): Promise<void> {

        const raw = await getAllUsers(currentPage);

        const data = normalizeResponse(raw);

        if (data.data.length === 0) {
            usersBody.innerHTML = "<tr><td colspan='5'>Sin resultados</td></tr>";
            renderPagination(1, 1);
            return;
        }

        renderUsers(data.data);
        renderPagination(data.current_page, data.last_page);
    }

    loadUsers();
}
