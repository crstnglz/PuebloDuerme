import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Echo: Echo<any>;
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

window.Echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
  wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 9090),
  wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 9090),
  forceTLS: false,
  encrypted: false,
  enabledTransports: ['ws']
});
