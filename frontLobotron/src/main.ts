document.addEventListener("DOMContentLoaded", () => {
  const profile = document.querySelector('.profile') as HTMLElement | null;
  const menu = document.querySelector('.profile-menu') as HTMLElement | null;

  if(!profile || !menu) return;

  profile.addEventListener('click', () => {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  })
})