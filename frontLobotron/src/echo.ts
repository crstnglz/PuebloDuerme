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
  broadcaster: 'pusher',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: 9090, 
  wssPort: 9090,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  encrypted: false,
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  cluster: 'mt1',
  scheme: 'http',
});