import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

window.Pusher = Pusher;

console.log("ECHO.ts cargado correctamente");

const echo = new Echo({
    broadcaster: 'pusher',      
    key: import.meta.env.VITE_REVERB_APP_KEY,

    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    cluster: 'mt1',
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws'], 
});

window.Echo = echo;
export default echo;
