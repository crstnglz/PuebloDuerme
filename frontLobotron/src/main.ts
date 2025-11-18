import { initRegisterForm } from './pages/index';
import { indexUI } from './pages/indexUI';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.endsWith("/") || path.endsWith("/index.html")) {
        initRegisterForm();
    }

    if (path.includes("indexUI.html")) {
        indexUI();
    }
});
