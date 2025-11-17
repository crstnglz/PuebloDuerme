import { indexUI } from './indexUI';
import { initRegisterForm } from './register';

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes("indexUI")) {
    indexUI();
  }

  if (path.includes("register")) {
    initRegisterForm();
  }
});
