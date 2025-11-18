import { initRegisterForm } from './pages/index';
import { indexUI } from './pages/indexUI';
import { initLoginForm , clearLoginForm} from './pages/login';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.endsWith("/") || path.endsWith("/index.html")) {
        initRegisterForm();
        initLoginForm();
    }

    if (path.includes("indexUI.html")) {
        indexUI();
    }

    // Lógica para el flip entre login y registro (si es necesaria)
    const flipToggle = document.getElementById('flip-toggle') as HTMLInputElement;
    if (flipToggle) {
        flipToggle.addEventListener('change', () => {
            clearLoginForm;
        });
      }
});
