//import "../styles/indexUI.css";

import { logoutUser } from "../providers/auth.provider"; 


export function indexUI()
{
  /* Menú del Perfil */
  const profile = document.querySelector('.profile') as HTMLElement | null;
  const menu = document.querySelector('.profile-menu') as HTMLElement | null;

  if(!profile || !menu) return;

  profile.addEventListener("click", (e) => {
    e.stopPropagation()
    const isVisible = menu.style.display === "block";
    menu.style.display = isVisible ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if(!profile.contains(target) && !menu.contains(target))
    {
      menu.style.display = "none";
    }
  })

  // Botón para mostrar la opción de administrar en el desplegable, solamente si eres admin
const adminBtn = document.getElementById("admin-panel-btn");
const userRaw = localStorage.getItem("user");

if (adminBtn) {
  adminBtn.style.display = "none"; // Oculto por defecto

  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);

      if (user.rol === "admin") {
        adminBtn.style.display = "block"; // Mostrar si eres admin
      }
    } catch (err) {
      console.error("Error leyendo user:", err);
    }
  }
}

  // === NUEVO: CERRAR SESIÓN ===
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      window.location.href = "/index.html";
    });
  }
  /* Logout desde el menú */
const logoutLink = document.getElementById("logout-btn") as HTMLElement | null;

if (logoutLink) {
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await logoutUser();
  });
}

  /* Modal de los Roles */
  const openRol = document.getElementById("open-rol") as HTMLElement
  const roleIcons = document.querySelectorAll(".role-icon") as NodeListOf<HTMLElement>
  const rolePages = document.querySelectorAll(".roles-book .page") as NodeListOf<HTMLElement>
  const rolesModal = document.getElementById("roles-modal") as HTMLElement
  const closeRoles = document.querySelector(".close-roles") as HTMLElement


  openRol.addEventListener("click", () => {
    rolesModal.style.display = "flex"
  })

  roleIcons.forEach(icon => {
    icon.addEventListener("click", () => {
      const role = icon.dataset.role

      roleIcons.forEach(i => i.classList.remove("selected"))
      icon.classList.add("selected")

      rolePages.forEach(p => {
        if(p.dataset.page === role)
        {
          p.classList.add("active")
        }
        else
        {
          p.classList.remove("active")
        }
      })
    })
  })

  document.addEventListener("click", (e) => {
    if (rolesModal.style.display === "flex" && e.target === rolesModal)
    {
      rolesModal.style.display = "none"
    }
  })

  closeRoles.addEventListener("click", () => {
    rolesModal.style.display = "none"
  })

  /* Modal de la Guía */
  const modal = document.getElementById("guide-modal") as HTMLElement | null;
  const openBtn = document.getElementById("open-guide") as HTMLElement | null;
  const closeGuide = document.querySelector(".close-guide") as HTMLElement | null;

  const pages = modal
  ? Array.from(modal.querySelectorAll(".page")) as HTMLElement[]
  : []

  const next = document.getElementById("next") as HTMLElement | null;
  const prev = document.getElementById("prev") as HTMLElement | null;

  let pageIndex = 0;

  if(openBtn && modal)
  {
    openBtn.addEventListener("click", () => {
      modal.style.display="flex";
    });
  }

  if(closeGuide && modal)
  {
    closeGuide.addEventListener("click", () => {
      modal.style.display = "none"
    });
  }

  if(modal)
  {
    modal.addEventListener("click", (e) => {
      if(e.target === modal)
      {
        modal.style.display = "none"
      }
    })
  }

  if(next)
  {
    next.addEventListener("click", () => {
      if(pageIndex < pages.length - 1)
      {
        pages[pageIndex].classList.remove("active");
        pages[pageIndex].classList.add("exit");

        pageIndex++
        pages[pageIndex].classList.add("active");
      }
    });
  }

  if(prev)
  {
    prev.addEventListener("click", () => {
      if(pageIndex > 0)
      {
        pages[pageIndex].classList.remove("active");
        pageIndex--

        pages[pageIndex].classList.remove("exit");
        pages[pageIndex].classList.add("active");
      } 
    });
  }
}