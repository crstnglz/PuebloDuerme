import { initRegisterForm, clearRegisterForm } from './pages/register';
import { initLoginForm, clearLoginForm } from './pages/login';
import { indexUI } from './pages/indexUI';
import { modalProfile, showImage } from './pages/profile';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

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

    if (path.includes("indexUI")) {
        indexUI();
        showImage();
        modalProfile();
    }

    // if(path.includes("profile"))
    // {
    //     showImage();
    // }
});
