document.addEventListener("DOMContentLoaded", () => {
  /* Menú del Perfil */
  const profile = document.querySelector('.profile') as HTMLElement | null;
  const menu = document.querySelector('.profile-menu') as HTMLElement | null;

  if(!profile || !menu) return;

  profile.addEventListener('click', () => {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  })

  /* Modal de la Guía */
  const modal = document.getElementById("guide-modal") as HTMLElement | null;
  const openBtn = document.getElementById("open-guide") as HTMLElement | null;
  const closeBtn = document.querySelector(".close") as HTMLElement | null;

  const pages = Array.from(
    document.querySelectorAll(".page")
  ) as HTMLElement[];

  const next = document.getElementById("next") as HTMLElement | null;
  const prev = document.getElementById("prev") as HTMLElement | null;

  let pageIndex = 0;

  if(openBtn && modal)
  {
    openBtn.addEventListener("click", () => {
      modal.style.display="flex";
    });
  }

    if(closeBtn && modal)
    {
      closeBtn.addEventListener("click", () => {
        modal.style.display="none";
      });
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
});
