import { initRegisterForm, clearRegisterForm } from './pages/register';
import { initLoginForm, clearLoginForm } from './pages/login';
import { indexUI } from './pages/indexUI';
import { enableSaveOnChanges, modalProfile, saveProfile, showImage } from './pages/profile';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // ============ PÁGINA PRINCIPAL (login + registro) ============
    if (path.endsWith("/") || path.endsWith("/index.html")) {

        initRegisterForm();
        initLoginForm();

        const flipToggle = document.getElementById('flip-toggle') as HTMLInputElement;

        if (flipToggle) {
            flipToggle.addEventListener('change', () => {

                if (flipToggle.checked) {
                    // Mostrar LOGIN
                    clearLoginForm();
                    initLoginForm();
                } else {
                    // Mostrar REGISTER
                    clearRegisterForm?.();
                    initRegisterForm();
                }
            });
        }
    }

    // ============ PÁGINA DE INICIO ============
    if (path.includes("indexUI")) {
        indexUI();
        modalProfile();
        showImage();
        enableSaveOnChanges();
        saveProfile();
    }
});
