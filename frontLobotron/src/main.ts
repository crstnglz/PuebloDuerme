import { initLobby } from './pages/lobby'; 
import { initGameRoom } from './pages/gameRoom';
import { initRegisterForm, clearRegisterForm } from './pages/register';
import { initLoginForm, clearLoginForm } from './pages/login';
import { indexUI } from './pages/indexUI';
import { enableSaveOnChanges, modalProfile, saveProfile, showImage } from './pages/profile';
import { initAdmin } from './pages/admin'
// import './echo'
import { initGameUI } from './pages/gameUI'


document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    const searchParams = new URLSearchParams(window.location.search);

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

    if(path.includes("lobby"))
    {
        initLobby()
    }
    
    // ============ PANEL ADMIN ============
    if (path.includes("admin")) {
        initAdmin();    
    }

    // ============ PÁGINA DE SALA DE JUEGO/ESPERA ============

    if (path.includes("gameUI")) {
        initGameUI();
    }
});
